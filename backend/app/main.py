from __future__ import annotations

import base64
import logging
import socket
from datetime import datetime, timedelta

from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import diagnostic_engine, remediation_engine, server_manager, storage
from .vuln_catalog import requires_manual_remediation
from .inventory_parser import InventoryParser
from .reports.report_generator import (
    generate_analysis_global_pdf,
    generate_analysis_server_pdf,
    generate_remediation_global_pdf,
    generate_remediation_server_pdf,
)
from .vuln_catalog import CATALOG
from app.reports.report_router import router as report_router

logger = logging.getLogger(__name__)

# Ansible 연동 (선택적)
try:
    from . import ansible_diagnostic
    ANSIBLE_AVAILABLE = True
except ImportError:
    ANSIBLE_AVAILABLE = False
    logger.warning("Ansible integration not available. Install ansible to use it.")
from .schemas import (
    AlertInfo,
    AnalysisRunRequest,
    AnalysisRunResponse,
    AnalysisRunWithServerRequest,
    BulkAnalysisRequest,
    BulkAnalysisResponse,
    BulkConnectionCheckRequest,
    BulkConnectionCheckResponse,
    BulkRemediationRequest,
    BulkRemediationResponse,
    ConnectionCheckResult,
    DiffResponse,
    FailedRemediationItem,
    InventoryAddServerRequest,
    InventoryAddServerResponse,
    InventoryCheckConnectionsRequest,
    InventoryCheckConnectionsResponse,
    InventoryHostCheckItem,
    InventoryHostCheckResult,
    InventoryLoadResponse,
    InventoryRemoveServersRequest,
    InventoryRemoveServersResponse,
    InventoryRegisterRequest,
    InventoryServerInfo,
    RegressionSimulateRequest,
    RemediationApplyRequest,
    RemediationBulkRequest,
    RemediationResponse,
    ReportGenerateRequest,
    ReportGenerateGlobalRequest,
    ReportGenerateResponse,
    ServerAnalysisResult,
    ServerInfo,
    ServerRemediationResult,
    ServerConnectionInfo,
    ServerRegisterRequest,
    ServerRegisterResponse,
    ServerTestConnectionRequest,
    ServerTestConnectionResponse,
    SnapshotCompareRequest,
    SnapshotCompareResponse,
    SnapshotCreateRequest,
    SnapshotInfo,
    ServerRegressionInfo,
    TargetServer,
    Vulnerability,
)

app = FastAPI(title="AUTOISMS Backend", version="0.1.0")

def _normalize_vuln(v: dict) -> dict:
    """저장된/result 필드 정규화:
    - current_value, expected_value, details 필드 보장
    - status / requires_manual_remediation / OS 정보는 원본을 그대로 유지
    """
    out = dict(v)
    if out.get("current_value") in (None, "") and out.get("detail"):
        out["current_value"] = out.get("detail") or ""
    out.setdefault("current_value", "")
    out.setdefault("expected_value", "")
    out.setdefault("details", [])
    # status / requires_manual_remediation / os_type / os_version 등은
    # ansible_diagnostic / diagnostic_engine 에서 채워준 값을 그대로 둔다.
    return out


def _count_issues(vulns: list[dict]) -> int:
    """
    취약점 개수 집계 (대시보드/목록용)
    - result.json 의 status 기준으로 집계
    - 양호/조치완료(safe/fixed)는 제외
    - 취약(vulnerable) + 기타(manual)만 합산
    """
    count = 0
    for v in vulns or []:
        status = str(v.get("status", "")).lower()
        if status in ("vulnerable", "manual"):
            count += 1
    return count


# 개발 편의상 전체 허용(배포 시에는 origin 제한 권장)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router 등록
app.include_router(report_router)


@app.exception_handler(Exception)
def add_cors_on_exception(request, exc: Exception):
    """500 등 예외 시에도 CORS 헤더를 붙여 브라우저에서 오류 메시지를 볼 수 있게 함."""
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail} if isinstance(exc.detail, str) else {"detail": exc.detail},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            },
        )
    import traceback
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"서버 오류: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analysis/run", response_model=AnalysisRunResponse)
def run_analysis(req: AnalysisRunRequest) -> AnalysisRunResponse:
    """서버 타입만 지정한 진단 (데모용)"""
    analysis = storage.create_analysis(req.server)
    return AnalysisRunResponse(
        analysis_id=analysis["analysis_id"],
        server=analysis["server"],
        started_at=datetime.fromisoformat(analysis["started_at"]),
        completed_at=datetime.fromisoformat(analysis["completed_at"]),
        vulnerabilities=[Vulnerability(**_normalize_vuln(v)) for v in analysis["vulnerabilities"]],
    )


@app.post("/api/analysis/run-with-server", response_model=AnalysisRunResponse)
def run_analysis_with_server(req: AnalysisRunWithServerRequest, use_ansible: bool = Query(default=False)) -> AnalysisRunResponse:
    """등록된 서버에 실제 SSH로 진단 실행
    
    Args:
        use_ansible: True면 Ansible 사용, False면 직접 SSH 사용
    """
    server = server_manager.get_server(req.server_id)
    if not server:
        raise HTTPException(status_code=404, detail="server_not_found")
    
    # 실제 진단 실행
    try:
        if use_ansible and ANSIBLE_AVAILABLE:
            # Ansible 사용
            result = ansible_diagnostic.run_diagnostic_with_ansible(req.server_id, use_script=False)
        else:
            # 직접 SSH 사용 (기본)
            result = diagnostic_engine.run_diagnostic(req.server_id)
        
        analysis = storage.create_analysis(
            server=server["server_type"],
            server_id=req.server_id,
            vulnerabilities=result["vulnerabilities"],
            snapshot=result["snapshot"],
        )
    except ValueError as e:
        # ValueError는 그대로 전달
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        error_detail = str(e)
        logger.error(f"Diagnostic failed: {error_detail}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"진단 실행 실패: {error_detail}")
    
    return AnalysisRunResponse(
        analysis_id=analysis["analysis_id"],
        server=analysis["server"],
        started_at=datetime.fromisoformat(analysis["started_at"]),
        completed_at=datetime.fromisoformat(analysis["completed_at"]),
        vulnerabilities=[Vulnerability(**_normalize_vuln(v)) for v in analysis["vulnerabilities"]],
    )


@app.post("/api/remediation/apply", response_model=RemediationResponse)
def remediation_apply(req: RemediationApplyRequest) -> RemediationResponse:
    analysis = storage.get_analysis(req.analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="analysis_not_found")

    server_id = analysis.get("server_id")
    print(f"[REMEDIATION] apply 요청: analysis_id={req.analysis_id}, code={req.code}, server_id={server_id!r}")
    if server_id:
        # 실제 서버에 SSH로 조치 적용
        try:
            logger.info(f"[REMEDIATION] apply: analysis_id={req.analysis_id}, code={req.code}, server_id={server_id}")
            remediation_result = remediation_engine.apply_remediation_ssh(
                server_id=server_id,
                codes=[req.code],
                auto_backup=req.auto_backup,
            )
            applied_codes = remediation_result["applied"]
            applied_details = remediation_result.get("applied_details") or {}
            snapshot_after = remediation_result["snapshot_after"]
            manual_required = remediation_result.get("manual_required", [])
            failed_codes = [FailedRemediationItem(**x) for x in remediation_result.get("failed", [])]
            res = storage.apply_remediation(req.analysis_id, applied_codes, req.auto_backup, applied_details)
            res["analysis"]["snapshot"] = snapshot_after
            storage.update_analysis(res["analysis"])
            print(f"[REMEDIATION] apply 완료: applied={applied_codes}, failed={len(failed_codes)}")
            logger.info(f"[REMEDIATION] apply 완료: applied={applied_codes}, failed={failed_codes}")
        except Exception as e:
            print(f"[REMEDIATION] apply 실패: {e}")
            logger.exception(f"[REMEDIATION] apply 실패: {e}")
            raise HTTPException(status_code=500, detail=f"조치 실행 실패: {str(e)}")
    else:
        print(f"[REMEDIATION] apply: server_id 없음 → 스토리지만 갱신 (실제 서버 조치 없음)")
        try:
            res = storage.apply_remediation(req.analysis_id, [req.code], req.auto_backup)
        except KeyError:
            raise HTTPException(status_code=404, detail="analysis_not_found")
        manual_required = []
        failed_codes = []

    analysis = res["analysis"]
    return RemediationResponse(
        analysis_id=analysis["analysis_id"],
        applied_codes=res["applied"],
        auto_backup=req.auto_backup,
        message="remediation_applied",
        vulnerabilities=[Vulnerability(**_normalize_vuln(v)) for v in analysis["vulnerabilities"]],
        manual_required=manual_required,
        failed_codes=failed_codes,
    )


@app.post("/api/remediation/bulk", response_model=RemediationResponse)
def remediation_bulk(req: RemediationBulkRequest) -> RemediationResponse:
    """일괄 조치 (전체 조치만 지원)"""
    if not req.codes:
        raise HTTPException(status_code=400, detail="codes_required")
    
    analysis = storage.get_analysis(req.analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="analysis_not_found")
    
    server_id = analysis.get("server_id")
    
    # 실제 서버에 조치 적용
    if server_id:
        server = server_manager.get_server(server_id)
        if not server:
            raise HTTPException(
                status_code=404,
                detail="이 분석에 연결된 서버가 더 이상 등록되어 있지 않습니다. 서버를 다시 등록하셨다면, 해당 서버로 진단을 다시 실행한 뒤 조치해 주세요.",
            )
        try:
            logger.info(f"[REMEDIATION] bulk: analysis_id={req.analysis_id}, codes={req.codes}, server_id={server_id}")
            remediation_result = remediation_engine.apply_remediation_ssh(
                server_id=server_id,
                codes=req.codes,
                auto_backup=req.auto_backup,
            )
            applied_codes = remediation_result["applied"]
            applied_details = remediation_result.get("applied_details") or {}
            snapshot_after = remediation_result["snapshot_after"]
            manual_required = remediation_result.get("manual_required", [])
            failed_codes = [FailedRemediationItem(**x) for x in remediation_result.get("failed", [])]
            res = storage.apply_remediation(req.analysis_id, applied_codes, req.auto_backup, applied_details)
            res["analysis"]["snapshot"] = snapshot_after
            storage.update_analysis(res["analysis"])
            logger.info(f"[REMEDIATION] bulk 완료: applied={applied_codes}, failed={len(failed_codes)}")
        except Exception as e:
            logger.exception(f"[REMEDIATION] bulk 실패: {e}")
            raise HTTPException(status_code=500, detail=f"조치 실행 실패: {str(e)}")
    else:
        # 데모 모드 (서버 ID 없음)
        try:
            res = storage.apply_remediation(req.analysis_id, req.codes, req.auto_backup)
        except KeyError:
            raise HTTPException(status_code=404, detail="analysis_not_found")
        manual_required = []
        failed_codes = []

    analysis = res["analysis"]
    return RemediationResponse(
        analysis_id=analysis["analysis_id"],
        applied_codes=res["applied"],
        auto_backup=req.auto_backup,
        message="bulk_remediation_applied",
        vulnerabilities=[Vulnerability(**_normalize_vuln(v)) for v in analysis["vulnerabilities"]],
        manual_required=manual_required,
        failed_codes=failed_codes,
    )


@app.get("/api/diff", response_model=DiffResponse)
def diff(
    before_analysis_id: str = Query(...),
    after_analysis_id: str = Query(...),
) -> DiffResponse:
    before = storage.get_analysis(before_analysis_id)
    after = storage.get_analysis(after_analysis_id)
    if not before or not after:
        raise HTTPException(status_code=404, detail="analysis_not_found")

    d = storage.diff_snapshots(before, after)
    return DiffResponse(
        before_analysis_id=before_analysis_id,
        after_analysis_id=after_analysis_id,
        removed=d["removed"],
        added=d["added"],
        unchanged=d["unchanged"],
        summary=d["summary"],
    )


@app.post("/api/regression/simulate", response_model=AnalysisRunResponse)
def regression_simulate(req: RegressionSimulateRequest) -> AnalysisRunResponse:
    try:
        analysis = storage.simulate_regression(req.analysis_id, req.newly_vulnerable_codes)
    except KeyError:
        raise HTTPException(status_code=404, detail="analysis_not_found")

    return AnalysisRunResponse(
        analysis_id=analysis["analysis_id"],
        server=analysis["server"],
        started_at=datetime.fromisoformat(analysis["started_at"]),
        completed_at=datetime.fromisoformat(analysis["completed_at"]),
        vulnerabilities=[Vulnerability(**_normalize_vuln(v)) for v in analysis["vulnerabilities"]],
    )


@app.post("/api/report/generate", response_model=ReportGenerateResponse)
def report_generate(req: ReportGenerateRequest) -> ReportGenerateResponse:
    analysis = storage.get_analysis(req.analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="analysis_not_found")

    # 서버 정보 가져오기
    server_id = analysis.get("server_id")
    server = server_manager.get_server(server_id) if server_id else None
    hostname = server.get("name", server.get("host", "unknown")) if server else "unknown"

    ts = int(datetime.utcnow().timestamp())
    if req.type == "pdf":
        filename = f"security_report_{hostname}_{ts}.pdf"
        content_type = "application/pdf"

        vulns_raw = analysis.get("vulnerabilities", [])
        regression_codes = set(
            (c or "").strip().upper() for c in (analysis.get("regression_codes") or []) if c
        )
        vulns = []
        for v in vulns_raw:
            out = _normalize_vuln(v)
            code = (out.get("check_id") or out.get("code") or "").strip().upper()
            out["regression"] = code in regression_codes
            vulns.append(out)
        vulnerable_count = sum(1 for v in vulns if v.get("status") == "vulnerable")
        safe_count = sum(1 for v in vulns if v.get("status") == "safe")
        # PDF 템플릿(analysis_server.html)이 기대하는 summary 형식
        data = {
            "hostname": hostname,
            "vulnerabilities": vulns,
            "summary": {
                "total_items": len(vulns),
                "safe": safe_count,
                "vulnerable": vulnerable_count,
                "action_required": vulnerable_count,
            }
        }

        try:
            # PDF 파일 생성
            pdf_path = generate_analysis_server_pdf(data)

            # PDF 파일 읽기
            with open(pdf_path, "rb") as f:
                content = f.read()

            # 임시 파일 삭제
            import os
            try:
                os.remove(pdf_path)
            except OSError:
                pass
        except Exception as e:
            import traceback
            logger.error(f"PDF 생성 실패: {e}\n{traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"PDF 생성 실패: {str(e)}")

    elif req.type == "excel":
        filename = f"security_report_{ts}.xlsx"
        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        content = f"EXCEL REPORT (demo)\nanalysis_id={req.analysis_id}\n".encode("utf-8")
    else:
        filename = f"compliance_report_{ts}.json"
        content_type = "application/json"
        content = (
            "{\n"
            f'  "analysis_id": "{req.analysis_id}",\n'
            f'  "server": "{analysis["server"]}",\n'
            '  "note": "demo compliance report"\n'
            "}\n"
        ).encode("utf-8")

    b64 = base64.b64encode(content).decode("ascii")
    return ReportGenerateResponse(
        analysis_id=req.analysis_id,
        type=req.type,
        filename=filename,
        content_type=content_type,
        bytes_base64=b64,
    )


# 서버 관리 API
@app.post("/api/servers/test-connection", response_model=ServerTestConnectionResponse)
def test_server_connection(req: ServerTestConnectionRequest) -> ServerTestConnectionResponse:
    """서버 연결 테스트 (등록 전 확인용)"""
    try:
        # 연결 테스트
        from .ssh_client import SSHClient
        ssh = SSHClient(req.host, req.port, req.username, req.password, req.key_file)
        ssh.connect()
        
        # 서버 타입 판별
        try:
            exit_code, stdout, _ = ssh.execute("uname -s")
            if exit_code == 0 and "Linux" in stdout:
                exit_code, stdout, _ = ssh.execute("cat /etc/os-release 2>/dev/null || echo ''")
                if "Ubuntu" in stdout:
                    server_type = "ubuntu"
                elif "Rocky" in stdout or "rocky" in stdout:
                    if "9" in stdout:
                        server_type = "rocky9"
                    elif "10" in stdout:
                        server_type = "rocky10"
                    else:
                        server_type = "rocky9"
                else:
                    server_type = "ubuntu"
            else:
                server_type = "ubuntu"
        except:
            server_type = "ubuntu"
        
        # 권한 체크 (정보 제공용, 필수 아님)
        try:
            # 방법 1: 사용자 ID 확인
            exit_code, stdout, _ = ssh.execute("id -u 2>/dev/null")
            user_id = stdout.strip()
            is_root_by_id = user_id == "0"
            
            # 방법 2: 사용자명 확인
            exit_code, stdout, _ = ssh.execute("whoami 2>/dev/null || id -un 2>/dev/null")
            current_user = stdout.strip().lower()
            is_root_by_name = current_user == "root"
            
            # 방법 3: 실제 root 권한으로 명령 실행 가능한지 확인
            exit_code, stdout, _ = ssh.execute("test -w /root 2>/dev/null && echo 'YES' || echo 'NO'")
            can_write_root = "YES" in stdout
            
            # root 권한 확인
            is_root = is_root_by_id or is_root_by_name or can_write_root
            
            # sudo 가능한지 확인
            exit_code, stdout, _ = ssh.execute("sudo -n true 2>&1 || echo 'NO_SUDO'")
            can_sudo_nopass = "NO_SUDO" not in stdout
            
            exit_code, stdout, _ = ssh.execute("sudo -l 2>/dev/null | head -1 || echo 'NO_SUDO'")
            can_sudo = "NO_SUDO" not in stdout and "not allowed" not in stdout.lower()
            
            if is_root:
                privilege_message = "root 계정으로 접속 가능"
            elif can_sudo_nopass or can_sudo:
                privilege_message = "sudo 권한 있음"
            else:
                # 사용자명이 root인데도 체크 실패한 경우
                if req.username.lower() == "root" or current_user == "root":
                    is_root = True
                    privilege_message = "root 계정으로 접속 (권한 확인 완료)"
                else:
                    privilege_message = "root 권한 없음 (진단은 가능, 조치는 root 권한 필요)"
        except Exception as e:
            is_root = False
            can_sudo = False
            # 사용자명이 root면 root로 간주
            if req.username.lower() == "root":
                is_root = True
                privilege_message = f"root 계정으로 접속 (권한 체크 중 오류: {str(e)})"
            else:
                privilege_message = f"권한 체크 실패: {str(e)} (진단은 시도 가능)"
        
        ssh.close()
        
        return ServerTestConnectionResponse(
            success=True,
            message="연결 성공",
            server_type=server_type,
            has_root=is_root,
            can_sudo=can_sudo,
            privilege_message=privilege_message,
        )
    except ValueError as e:
        return ServerTestConnectionResponse(
            success=False,
            message=str(e),
        )
    except Exception as e:
        error_msg = str(e)
        if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
            return ServerTestConnectionResponse(
                success=False,
                message=f"연결 타임아웃: {req.host}:{req.port}에 연결할 수 없습니다. 방화벽이나 네트워크 설정을 확인하세요.",
            )
        elif "authentication" in error_msg.lower() or "인증" in error_msg:
            return ServerTestConnectionResponse(
                success=False,
                message="인증 실패: 사용자명 또는 패스워드가 올바르지 않습니다.",
            )
        else:
            return ServerTestConnectionResponse(
                success=False,
                message=f"연결 실패: {error_msg}",
            )


@app.post("/api/servers/register", response_model=ServerRegisterResponse)
def register_server(req: ServerRegisterRequest) -> ServerRegisterResponse:
    """서버 등록 (IP/PORT/USER/패스워드)"""
    try:
        result = server_manager.register_server(
            host=req.host,
            port=req.port,
            username=req.username,
            password=req.password,
            key_file=req.key_file,
            name=req.name,
        )
        return ServerRegisterResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 등록 실패: {str(e)}")


@app.get("/api/servers", response_model=list[ServerInfo])
def list_servers() -> list[ServerInfo]:
    """서버 목록 조회"""
    servers = server_manager.list_servers()
    return [ServerInfo(**s) for s in servers]


@app.get("/api/servers/{server_id}/connection-info", response_model=ServerConnectionInfo)
def get_server_connection_info(server_id: str) -> ServerConnectionInfo:
    """
    조치/진단 시 사용되는 연결 정보 확인용 (비밀번호 값은 반환하지 않음).
    - 인증 실패 시: 여기서 host/username/has_password/key_file 이 실제 접속 정보와 일치하는지 확인.
    """
    server = server_manager.get_server(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="server_not_found")
    return ServerConnectionInfo(
        server_id=server_id,
        host=server["host"],
        port=server["port"],
        username=server["username"],
        has_password=bool(server.get("password")),
        key_file=server.get("key_file"),
    )


@app.post("/api/servers/{server_id}/test-connection", response_model=ServerTestConnectionResponse)
def test_registered_server_connection(server_id: str) -> ServerTestConnectionResponse:
    """
    등록된 서버의 저장된 계정으로 SSH 연결 테스트.
    성공 시 해당 계정으로 조치/진단이 가능한 상태임.
    """
    server = server_manager.get_server(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="server_not_found")
    try:
        from .ssh_client import SSHClient
        ssh = SSHClient(
            server["host"],
            server["port"],
            server["username"],
            server.get("password"),
            server.get("key_file"),
        )
        ssh.connect()
        ssh.close()
        return ServerTestConnectionResponse(
            success=True,
            message=f"연결 성공: {server['host']}:{server['port']} ({server['username']})",
        )
    except Exception as e:
        return ServerTestConnectionResponse(
            success=False,
            message=f"연결 실패: {str(e)}",
        )


@app.get("/api/servers/{server_id}", response_model=ServerInfo)
def get_server(server_id: str) -> ServerInfo:
    """서버 정보 조회 (패스워드 제외)"""
    server = server_manager.get_server(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="server_not_found")
    # 패스워드 제외
    s = {
        "server_id": server["server_id"],
        "name": server["name"],
        "host": server["host"],
        "port": server["port"],
        "username": server["username"],
        "server_type": server["server_type"],
        "has_root": server["has_root"],
        "can_sudo": server["can_sudo"],
        "privilege_message": server["privilege_message"],
    }
    return ServerInfo(**s)


@app.delete("/api/servers/{server_id}")
def delete_server(server_id: str) -> dict[str, str]:
    """서버 삭제"""
    if server_manager.delete_server(server_id):
        return {"message": "server_deleted"}
    raise HTTPException(status_code=404, detail="server_not_found")


# 알림 API
@app.get("/api/alerts", response_model=list[AlertInfo])
def get_alerts(since_minutes: int = Query(default=60, ge=1, le=1440), unread_only: bool = Query(default=False)) -> list[AlertInfo]:
    """알림 목록 조회 (폴링용)"""
    alerts = storage.get_alerts(since_minutes=since_minutes, unread_only=unread_only)
    return [
        AlertInfo(
            alert_id=a["alert_id"],
            type=a["type"],
            message=a["message"],
            severity=a["severity"],
            analysis_id=a.get("analysis_id"),
            server_id=a.get("server_id"),
            created_at=datetime.fromisoformat(a["created_at"]),
        )
        for a in alerts
    ]


@app.post("/api/alerts/{alert_id}/read")
def mark_alert_read(alert_id: str) -> dict[str, str]:
    """알림 읽음 처리"""
    if storage.mark_alert_read(alert_id):
        return {"message": "alert_marked_read"}
    raise HTTPException(status_code=404, detail="alert_not_found")


@app.get("/api/servers/{server_id}/analyses", response_model=list[AnalysisRunResponse])
def list_server_analyses(server_id: str) -> list[AnalysisRunResponse]:
    """서버별 분석 목록"""
    analyses = storage.list_analyses_by_server(server_id)
    return [
        AnalysisRunResponse(
            analysis_id=a["analysis_id"],
            server=a["server"],
            started_at=datetime.fromisoformat(a["started_at"]),
            completed_at=datetime.fromisoformat(a["completed_at"]),
            vulnerabilities=[Vulnerability(**_normalize_vuln(v)) for v in a["vulnerabilities"]],
        )
        for a in analyses
    ]


# 전체 진단 시 서버별 완료 시간 차이(분) - 이 내에 완료된 분석은 한 '실행'으로 묶음
# (전체 진단이 2분 내 완료, 테스트 주기가 짧을 수 있으므로 3분 사용)
_TREND_BATCH_MINUTES = 3


@app.get("/api/dashboard/vulnerability-trend")
def get_vulnerability_trend(server_ids: str | None = Query(default=None, description="쉼표 구분 server_id. 없으면 전체 서버 사용")) -> dict:
    """대시보드 타겟 서버들의 취약점 추이 (합산)
    - 진단 실행이 끝난 시점마다 한 점: 그 시점까지 각 서버의 '가장 최근' 진단 결과를 합산
    - server_ids 미지정 시: 전체 등록 서버 (대시보드 총 취약점과 불일치 가능)
    - server_ids 지정 시: 해당 서버만 집계 (총 취약점 카드와 일치)
    """
    all_servers = server_manager.list_servers()
    if server_ids:
        filter_set = {s.strip() for s in server_ids.split(",") if s.strip()}
        server_ids_list = [s["server_id"] for s in all_servers if s.get("server_id") and s["server_id"] in filter_set]
    else:
        server_ids_list = [s["server_id"] for s in all_servers if s.get("server_id")]
    events = []
    for s in all_servers:
        server_id = s.get("server_id")
        if not server_id:
            continue
        analyses = storage.list_analyses_by_server(server_id)
        for a in analyses:
            completed = a.get("completed_at") or a.get("started_at")
            if not completed:
                continue
            count = _count_issues(a.get("vulnerabilities") or [])
            events.append({"t": completed, "server_id": server_id, "y": count})
    events.sort(key=lambda e: e["t"])
    if not events:
        return {"points": []}
    # 시간 구간으로 배치 분리 (같은 '전체 진단' 실행으로 추정)
    batch_minutes = timedelta(minutes=_TREND_BATCH_MINUTES)
    batches = []
    batch = [events[0]]
    for ev in events[1:]:
        prev_t = batch[-1]["t"]
        try:
            prev_dt = datetime.fromisoformat(prev_t.replace("Z", "+00:00"))
            cur_dt = datetime.fromisoformat(ev["t"].replace("Z", "+00:00"))
        except (ValueError, TypeError):
            prev_dt = datetime.min
            cur_dt = datetime.min
        if (cur_dt - prev_dt) > batch_minutes:
            batches.append(batch)
            batch = [ev]
        else:
            batch.append(ev)
    batches.append(batch)
    # 배치별: 배치 종료 시점 기준으로 '모든 서버'의 가장 최근 분석 결과 합산
    # (이번 실행에서 진단 안 한 서버도 과거 최신 결과 사용)
    def _parse_dt(s):
        try:
            return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return datetime.min

    points = []
    for batch in batches:
        batch_end = max(e["t"] for e in batch)
        batch_end_dt = _parse_dt(batch_end)
        total = 0
        for sid in server_ids_list:
            items = [e for e in events if e["server_id"] == sid]
            latest = None
            for it in sorted(items, key=lambda x: x["t"]):
                if _parse_dt(it["t"]) <= batch_end_dt:
                    latest = it
            if latest:
                total += latest["y"]
        points.append({"completed_at": batch_end, "total": total})
    return {"points": points}


# ========== 프론트엔드용 새로운 API ==========

@app.get("/api/inventory/load", response_model=InventoryLoadResponse)
def load_inventory() -> InventoryLoadResponse:
    """Ansible Inventory에서 타겟 서버 목록 로드
    
    Ansible inventory 파일(inventory.yaml 또는 inventory.ini)을 읽어서
    서버 목록을 반환합니다.
    
    환경변수 ANSIBLE_INVENTORY_PATH로 inventory 파일 경로를 지정할 수 있습니다.
    지정하지 않으면 ansible/inventory.yaml 또는 ansible/inventory.ini를 자동으로 찾습니다.
    """
    try:
        logger.info("Inventory 로드 시작")
        parser = InventoryParser()
        inventory_servers = parser.get_servers()
        
        if not inventory_servers:
            logger.warning("Inventory 파일에서 서버를 찾을 수 없습니다.")
            return InventoryLoadResponse(servers=[])
        
        # 등록된 서버 목록도 가져와서 매칭
        registered_servers = server_manager.list_servers()
        registered_by_host = {
            f"{s['host']}:{s['port']}": s for s in registered_servers
        }
        
        # 인벤토리에 없는 server_manager 서버 정리 (삭제된 서버 동기화)
        inv_host_keys = {f"{s['ip']}:{s.get('port', 22)}" for s in inventory_servers}
        for s in list(registered_servers):
            key = f"{s['host']}:{s.get('port', 22)}"
            if key not in inv_host_keys:
                try:
                    server_manager.delete_server(s["server_id"])
                    logger.info(f"인벤토리에서 제거된 서버 삭제: {s.get('name', s['host'])} ({key})")
                except Exception as e:
                    logger.warning(f"서버 삭제 실패 {s['server_id']}: {e}")
        registered_servers = server_manager.list_servers()
        registered_by_host = {f"{s['host']}:{s['port']}": s for s in registered_servers}

        target_servers = []
        from .ssh_client import SSHClient

        logger.info(f"Inventory에서 {len(inventory_servers)}개 서버 발견, 연결 확인 시작")
        
        for idx, inv_server in enumerate(inventory_servers, 1):
            logger.info(f"서버 {idx}/{len(inventory_servers)} 처리 중: {inv_server.get('ip', 'unknown')}")
            ip = inv_server["ip"]
            port = inv_server["port"]
            username = inv_server["username"]
            password = inv_server.get("password")
            key_file = inv_server.get("key_file")
            hostname = inv_server.get("hostname", ip)
            
            connected = False
            server_id = None

            def _try_connect():
                # 1단계: 포트 연결 확인
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(10)
                result = sock.connect_ex((ip, port))
                sock.close()
                if result != 0:
                    import errno
                    err_msg = errno.errorcode.get(result, str(result))
                    logger.warning(f"포트 연결 실패 {ip}:{port} (errno={result} {err_msg})")
                    return False
                
                # 2단계: SSH 연결 확인
                try:
                    with SSHClient(ip, port, username, password, key_file) as ssh:
                        # 3단계: 간단한 명령 실행으로 실제 연결 상태 확인
                        try:
                            exit_code, stdout, stderr = ssh.execute("echo 'connection_test'")
                            if exit_code != 0:
                                logger.warning(f"SSH 명령 실행 실패 (exit_code={exit_code}): {ip}:{port}")
                                # 명령 실행 실패해도 연결은 성공한 것으로 간주
                        except Exception as cmd_error:
                            logger.warning(f"SSH 명령 실행 중 오류 (연결은 성공): {ip}:{port}: {cmd_error}")
                            # 명령 실행 실패해도 연결은 성공한 것으로 간주
                    return True
                except ValueError as e:
                    # 인증 실패 등 명확한 오류
                    logger.warning(f"SSH 연결 실패 (ValueError): {ip}:{port} (user={username}): {e}")
                    return False
                except Exception as e:
                    # 기타 예외
                    logger.warning(f"SSH 연결 실패: {ip}:{port} (user={username}): {e}")
                    return False

            try:
                connected = _try_connect()
            except (Exception, socket.timeout) as e:
                logger.warning(f"연결 테스트 실패 {ip}:{port} (user={username}): {e}")
                connected = False
            
            # 등록된 서버와 매칭
            host_key = f"{ip}:{port}"
            if host_key in registered_by_host:
                server_id = registered_by_host[host_key]["server_id"]
                # inventory가 source of truth → server_manager를 inventory와 동기화
                # (잘못된 username/name 저장 시 check-connections, ansible limit 오동작 방지)
                try:
                    existing_server = server_manager.get_server(server_id)
                    if existing_server:
                        if existing_server.get("username") != username or \
                           existing_server.get("name") != hostname or \
                           (key_file and existing_server.get("key_file") != key_file):
                            logger.info(f"서버 자격증명 동기화: {ip}:{port} (inventory 기준)")
                            server_manager.update_server_from_inventory(
                                server_id, username=username, name=hostname, key_file=key_file,
                            )
                        if (not existing_server.get("password") and password) or \
                           (existing_server.get("password") is None and password):
                            logger.info(f"기존 서버 패스워드 업데이트: {ip}:{port}")
                            server_manager.update_server_password(server_id, password=password, key_file=key_file)
                except Exception as e:
                    logger.warning(f"기존 서버 확인 실패 {ip}:{port}: {e}")
                    if password:
                        try:
                            server_manager.update_server_password(server_id, password=password, key_file=key_file)
                        except Exception as update_error:
                            logger.error(f"패스워드 업데이트 실패 {ip}:{port}: {update_error}")
            elif connected:
                # 연결된 서버가 있지만 등록되지 않은 경우 자동 등록
                try:
                    logger.info(f"연결된 서버 자동 등록: {ip}:{port}")
                    registered = server_manager.register_server(
                        host=ip,
                        port=port,
                        username=username,
                        password=password,
                        key_file=key_file,
                        name=hostname,
                    )
                    server_id = registered["server_id"]
                    # 등록된 서버 목록 업데이트
                    registered_by_host[host_key] = {
                        "server_id": server_id,
                        "host": ip,
                        "port": port,
                    }
                    logger.info(f"서버 자동 등록 완료: {ip}:{port} (server_id: {server_id})")
                except Exception as e:
                    logger.warning(f"서버 자동 등록 실패 {ip}:{port}: {e}")
                    # 등록 실패해도 연결 상태는 유지
            
            # 인벤토리 로드 시에는 진단 결과를 붙이지 않음. 진단(전체/선택) 실행 후에만 조치·조치보고서 버튼이 보이도록 함.
            target_servers.append(
                TargetServer(
                    ip=ip,
                    hostname=hostname,
                    port=port,
                    username=username,
                    connected=connected,
                    server_id=server_id,
                    vulnerabilities=[],
                    vuln_count=0,
                    diagnosed=False,
                    has_regression=False,
                    regression_codes=[],
                    analysis_id=None,
                )
            )
        
        logger.info(f"Inventory 로드 완료: {len(target_servers)}개 서버")
        return InventoryLoadResponse(servers=target_servers)
    
    except Exception as e:
        import traceback
        error_detail = str(e) if str(e) else repr(e)
        error_traceback = traceback.format_exc()
        logger.error(f"Inventory 로드 실패: {error_detail}")
        logger.error(error_traceback)
        # 에러 메시지가 비어있으면 traceback의 마지막 줄 사용
        if not error_detail or error_detail.strip() == "":
            error_lines = error_traceback.strip().split('\n')
            if error_lines:
                error_detail = error_lines[-1] if error_lines[-1] else "알 수 없는 오류"
        raise HTTPException(status_code=500, detail=f"Inventory 로드 실패: {error_detail}")


@app.post("/api/inventory/register-servers", response_model=list[ServerRegisterResponse])
def register_servers_from_inventory(req: InventoryRegisterRequest) -> list[ServerRegisterResponse]:
    """Inventory에서 발견된 서버들을 자동 등록"""
    results = []
    for server_info in req.servers:
        try:
            result = server_manager.register_server(
                host=server_info.ip,
                port=server_info.port,
                username=server_info.username,
                password=server_info.password,
                name=server_info.hostname,
            )
            results.append(ServerRegisterResponse(**result))
        except Exception as e:
            logger.error(f"서버 등록 실패 {server_info.ip}: {e}")
            # 실패한 서버는 건너뛰고 계속 진행
            continue
    
    return results


# SSH 키 경로: 대시보드에서 서버 추가 시 약관으로 안내하는 값과 동일하게 고정
DEFAULT_SSH_KEY_PATH = "/home/main/.ssh/id_rsa"


@app.post("/api/inventory/add-server", response_model=InventoryAddServerResponse)
def add_server_to_inventory(req: InventoryAddServerRequest) -> InventoryAddServerResponse:
    """대시보드에서 입력한 IP/포트/호스트명을 inventory와 server_manager에 추가합니다.
    server_manager 등록으로 전체 진단/조치/보고서에 즉시 포함됩니다.
    SSH 키는 /home/main/.ssh/id_rsa 로 고정됩니다 (약관 동의 전제).
    """
    try:
        parser = InventoryParser()
        parser.add_host(
            hostname=req.hostname.strip(),
            ansible_host=req.ip.strip(),
            ansible_port=req.port,
            ansible_user=req.username.strip() or "root",
            ansible_ssh_private_key_file=DEFAULT_SSH_KEY_PATH,
        )
        # server_manager에 등록 (연결 없이) → 전체 진단/조치/보고서에 반영
        server_manager.register_server_from_inventory(
            host=req.ip.strip(),
            port=req.port,
            username=req.username.strip() or "root",
            key_file=DEFAULT_SSH_KEY_PATH,
            name=req.hostname.strip(),
        )
        return InventoryAddServerResponse(
            success=True,
            message="서버가 inventory에 추가되었습니다. 목록을 새로고침했습니다.",
            hostname=req.hostname.strip(),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Inventory 서버 추가 실패")
        raise HTTPException(status_code=500, detail=f"서버 추가 실패: {e}")


@app.post("/api/inventory/remove-servers", response_model=InventoryRemoveServersResponse)
def remove_servers_from_inventory(req: InventoryRemoveServersRequest) -> InventoryRemoveServersResponse:
    """대시보드에서 선택한 서버 또는 전체 서버를 inventory(yaml/ini)에서 제거합니다."""
    if not req.hostnames:
        return InventoryRemoveServersResponse(
            success=True,
            message="제거할 호스트가 지정되지 않았습니다.",
            removed=[],
            not_found=[],
        )
    try:
        parser = InventoryParser()
        removed: list[str] = []
        not_found: list[str] = []
        deleted_from_server_manager: list[str] = []
        
        # inventory에서 제거하기 전에 현재 inventory 정보를 파싱하여 hostname과 IP/포트 매핑 확인
        inventory_hosts = parser.parse()
        
        for hostname in req.hostnames:
            h = (hostname or "").strip()
            if not h:
                continue
            
            # inventory에서 제거
            if parser.remove_host(h):
                removed.append(h)
                
                # server_manager에서도 해당 서버 찾아서 삭제
                # hostname으로 직접 매칭하거나, inventory의 ansible_host/ansible_port로 매칭
                host_info = inventory_hosts.get(h, {})
                host_ip = host_info.get("ansible_host") or host_info.get("ansible_hostname") or h
                host_port = int(host_info.get("ansible_port", 22))
                
                # server_manager의 모든 서버를 확인하여 hostname(name) 또는 IP:포트로 매칭
                all_servers = server_manager.list_servers()
                for server in all_servers:
                    server_name = server.get("name", "")
                    server_host = server.get("host", "")
                    server_port = server.get("port", 22)
                    
                    # hostname(name)이 일치하거나, IP와 포트가 일치하면 삭제
                    if (server_name == h or 
                        (server_host == host_ip and server_port == host_port)):
                        if server_manager.delete_server(server["server_id"]):
                            deleted_from_server_manager.append(server["server_id"])
                            logger.info(f"server_manager에서 서버 삭제됨: {server['server_id']} ({server_name})")
            else:
                not_found.append(h)
        
        message = f"{len(removed)}개 서버가 inventory에서 제거되었습니다." if removed else "제거된 서버가 없습니다."
        if deleted_from_server_manager:
            message += f" (server_manager에서 {len(deleted_from_server_manager)}개 서버 삭제됨)"
        if not_found:
            message += f" (inventory에 없음: {', '.join(not_found)})"
        return InventoryRemoveServersResponse(
            success=True,
            message=message,
            removed=removed,
            not_found=not_found,
        )
    except Exception as e:
        logger.exception("Inventory 서버 제거 실패")
        raise HTTPException(status_code=500, detail=f"서버 제거 실패: {e}")


def _server_ids_from_inventory() -> list[str]:
    """현재 인벤토리에 있는 서버 중 server_manager에 등록된 server_id 목록 반환"""
    parser = InventoryParser()
    inv_servers = parser.get_servers()
    registered = server_manager.list_servers()
    registered_by_host = {f"{s['host']}:{s['port']}": s["server_id"] for s in registered}
    ids = []
    for inv in inv_servers:
        key = f"{inv['ip']}:{inv.get('port', 22)}"
        if key in registered_by_host:
            ids.append(registered_by_host[key])
    return ids


@app.post("/api/analysis/run-bulk", response_model=BulkAnalysisResponse)
def run_bulk_analysis(req: BulkAnalysisRequest) -> BulkAnalysisResponse:
    """다중 서버에 대해 병렬로 진단 실행. server_ids 미지정 시 현재 인벤토리 기준 서버만 사용"""
    server_ids = req.server_ids if req.server_ids else _server_ids_from_inventory()
    if not server_ids:
        raise HTTPException(status_code=400, detail="진단할 서버가 없습니다. 인벤토리를 확인해 주세요.")
    try:
        logger.info(f"Bulk analysis 시작: {len(server_ids)}개 서버 (인벤토리 기준: {req.server_ids is None})")
        print(f"[MAIN] run-bulk 요청: use_ansible={req.use_ansible}, 서버 수={len(server_ids)}")
        results = []
        completed = 0
        failed = 0
        
        for server_id in server_ids:
            try:
                server = server_manager.get_server(server_id)
                if not server:
                    logger.warning(f"서버를 찾을 수 없음: {server_id}")
                    results.append(
                        ServerAnalysisResult(
                            server_id=server_id,
                            ip="unknown",
                            hostname="unknown",
                            status="failed",
                            error="서버를 찾을 수 없습니다",
                        )
                    )
                    failed += 1
                    continue
                
                logger.info(f"진단 시작: {server_id} ({server.get('host', 'unknown')})")
                # 터미널에서 Ansible 사용 여부 확인용
                if req.use_ansible and ANSIBLE_AVAILABLE:
                    print(f"[MAIN] Ansible 진단 실행: {server_id} ({server.get('host', 'unknown')})")
                    result = ansible_diagnostic.run_diagnostic_with_ansible(server_id, use_script=True)
                else:
                    print(f"[MAIN] 직접 SSH 진단 실행: {server_id} (use_ansible={req.use_ansible}, ANSIBLE_AVAILABLE={ANSIBLE_AVAILABLE})")
                    result = diagnostic_engine.run_diagnostic(server_id)

                print(f"[MAIN DEBUG] 진단 완료: {server_id}, 취약점 {len(result.get('vulnerabilities', []))}개 발견")
                logger.info(f"진단 완료: {server_id}, 취약점 {len(result.get('vulnerabilities', []))}개 발견")

                # 분석 결과 저장 (이전 진단 내역이 있으면 회귀 감지 수행)
                print(f"[MAIN DEBUG] Creating analysis for {server_id}...")
                analysis = storage.create_analysis(
                    server=server["server_type"],
                    server_id=server_id,
                    vulnerabilities=result["vulnerabilities"],
                    snapshot=result["snapshot"],
                    detect_regression=True,
                )
                print(f"[MAIN DEBUG] Analysis created: {analysis.get('analysis_id') if analysis else 'None'}")

                vuln_count = _count_issues(result["vulnerabilities"])

                # 회귀 감지 결과
                has_regression = bool(analysis.get("regression_detected"))
                regression_codes = analysis.get("regression_codes") or []
                if has_regression:
                    logger.info(f"회귀 감지됨 {server_id}: {regression_codes}")

                # Vulnerability 객체 생성 시 에러 처리
                try:
                    vuln_objects = [Vulnerability(**_normalize_vuln(v)) for v in result["vulnerabilities"]]
                except Exception as vuln_error:
                    logger.error(f"Vulnerability 객체 생성 실패 {server_id}: {vuln_error}")
                    logger.error(f"Vulnerability 데이터: {result['vulnerabilities']}")
                    # 빈 리스트로 대체
                    vuln_objects = []

                results.append(
                    ServerAnalysisResult(
                        server_id=server_id,
                        ip=server["host"],
                        hostname=server.get("name", server["host"]),
                        analysis_id=analysis["analysis_id"],
                        vulnerabilities=vuln_objects,
                        vuln_count=vuln_count,
                        status="completed",
                        has_regression=has_regression,
                        regression_codes=regression_codes,
                    )
                )
                completed += 1
                
            except Exception as e:
                import traceback
                logger.error(f"진단 실행 실패 {server_id}: {e}")
                logger.error(traceback.format_exc())
                server = server_manager.get_server(server_id)
                results.append(
                    ServerAnalysisResult(
                        server_id=server_id,
                        ip=server["host"] if server else "unknown",
                        hostname=server.get("name", "unknown") if server else "unknown",
                        status="failed",
                        error=str(e),
                    )
                )
                failed += 1
        
        # 스냅샷 생성 (선택적)
        snapshot_id = None
        if completed > 0:
            try:
                server_analysis_map = {
                    r.server_id: r.analysis_id
                    for r in results
                    if r.analysis_id is not None
                }
                if server_analysis_map:
                    snapshot = storage.create_snapshot(
                        name=f"진단 스냅샷",
                        description=f"{completed}개 서버 진단 완료",
                        server_analysis_map=server_analysis_map,
                    )
                    snapshot_id = snapshot["snapshot_id"]
            except Exception as snapshot_error:
                logger.error(f"스냅샷 생성 실패: {snapshot_error}")
                import traceback
                logger.error(traceback.format_exc())
                # 스냅샷 생성 실패해도 계속 진행
        
        logger.info(f"Bulk analysis 완료: {completed}개 성공, {failed}개 실패")
        
        return BulkAnalysisResponse(
            results=results,
            snapshot_id=snapshot_id,
            total_servers=len(server_ids),
            completed=completed,
            failed=failed,
        )
    except Exception as e:
        import traceback
        error_detail = str(e) if str(e) else repr(e)
        error_traceback = traceback.format_exc()
        logger.error(f"Bulk analysis 전체 실패: {error_detail}")
        logger.error(error_traceback)
        # 에러 메시지가 비어있으면 traceback의 마지막 줄 사용
        if not error_detail or error_detail.strip() == "":
            error_lines = error_traceback.strip().split('\n')
            if error_lines:
                error_detail = error_lines[-1] if error_lines[-1] else "알 수 없는 오류"
        raise HTTPException(status_code=500, detail=f"진단 실행 중 오류 발생: {error_detail}")


@app.post("/api/servers/check-connections", response_model=BulkConnectionCheckResponse)
def check_connections_bulk(req: BulkConnectionCheckRequest) -> BulkConnectionCheckResponse:
    """다중 서버의 연결 상태 확인"""
    results = []
    
    for server_id in req.server_ids:
        server = server_manager.get_server(server_id)
        if not server:
            results.append(
                ConnectionCheckResult(
                    server_id=server_id,
                    ip="unknown",
                    connected=False,
                    message="서버를 찾을 수 없습니다",
                )
            )
            continue
        
        # 연결 테스트
        try:
            from .ssh_client import SSHClient
            logger.info(f"연결 확인 시작: {server_id} ({server['host']}:{server['port']}, user={server['username']})")
            
            ssh = SSHClient(
                server["host"],
                server["port"],
                server["username"],
                server.get("password"),
                server.get("key_file"),
            )
            
            # 연결 시도
            ssh.connect()
            logger.info(f"SSH 연결 성공: {server_id} ({server['host']})")
            
            # 간단한 명령 실행으로 실제 연결 상태 확인 (권한 문제 등 감지)
            try:
                exit_code, stdout, stderr = ssh.execute("echo 'test'")
                if exit_code != 0:
                    logger.warning(f"명령 실행 실패 (exit_code={exit_code}): {server_id} ({server['host']})")
            except Exception as cmd_error:
                logger.warning(f"명령 실행 중 오류 (연결은 성공): {server_id} ({server['host']}): {cmd_error}")
            
            # root/sudo 권한 재검사 후 DB 갱신 (NOPASSWD 설정 후 연결 확인으로 동기화)
            try:
                priv = server_manager.check_root_privilege(
                    server["host"], server["port"], server["username"],
                    server.get("password"), server.get("key_file"),
                )
                server_manager.update_server_privilege(
                    server_id,
                    has_root=priv["has_root"],
                    can_sudo=priv["can_sudo"],
                    privilege_message=priv["message"],
                )
            except Exception as priv_err:
                logger.warning(f"권한 검사 실패 (연결은 성공): {server_id}: {priv_err}")
            
            ssh.close()
            
            results.append(
                ConnectionCheckResult(
                    server_id=server_id,
                    ip=server["host"],
                    connected=True,
                    message="연결 성공",
                )
            )
        except ValueError as e:
            # ValueError는 인증 실패 등 명확한 오류
            error_msg = str(e)
            logger.error(f"연결 실패 (ValueError): {server_id} ({server['host']}): {error_msg}")
            results.append(
                ConnectionCheckResult(
                    server_id=server_id,
                    ip=server["host"],
                    connected=False,
                    message=f"연결 실패: {error_msg}",
                )
            )
        except Exception as e:
            # 기타 예외 (타임아웃, 네트워크 오류 등)
            error_msg = str(e)
            error_type = type(e).__name__
            logger.error(f"연결 실패 ({error_type}): {server_id} ({server['host']}): {error_msg}")
            import traceback
            logger.debug(f"연결 실패 상세:\n{traceback.format_exc()}")
            results.append(
                ConnectionCheckResult(
                    server_id=server_id,
                    ip=server["host"],
                    connected=False,
                    message=f"연결 실패 ({error_type}): {error_msg}",
                )
            )
    
    return BulkConnectionCheckResponse(results=results)


@app.post("/api/inventory/check-connections", response_model=InventoryCheckConnectionsResponse)
def check_inventory_hosts_connections(req: InventoryCheckConnectionsRequest) -> InventoryCheckConnectionsResponse:
    """server_id 없는 inventory 호스트(새로 추가된 서버 등)의 연결 상태 확인. 연결되면 연결됨으로 갱신 가능."""
    from .ssh_client import SSHClient

    results = []
    key_file = DEFAULT_SSH_KEY_PATH
    for h in req.hosts:
        connected = False
        try:
            with SSHClient(h.ip, h.port, h.username, None, key_file) as ssh:
                pass
            connected = True
        except Exception:
            try:
                with SSHClient(h.ip, h.port, h.username, None, key_file) as ssh:
                    pass
                connected = True
            except Exception:
                pass
        results.append(
            InventoryHostCheckResult(
                ip=h.ip,
                hostname=h.hostname,
                connected=connected,
            )
        )
    return InventoryCheckConnectionsResponse(results=results)


@app.post("/api/remediation/bulk-servers", response_model=BulkRemediationResponse)
def bulk_remediation_servers(req: BulkRemediationRequest) -> BulkRemediationResponse:
    """다중 서버의 취약점을 일괄 조치"""
    results = []
    
    for server_id, analysis_id in req.server_analysis_map.items():
        try:
            server = server_manager.get_server(server_id)
            if not server:
                results.append(
                    ServerRemediationResult(
                        server_id=server_id,
                        ip="unknown",
                        applied_codes=[],
                        vulnerabilities=[],
                        status="failed",
                        error="서버를 찾을 수 없습니다",
                    )
                )
                continue
            
            # 조치 실행
            remediation_result = remediation_engine.apply_remediation_ssh(
                server_id=server_id,
                codes=req.codes,
                auto_backup=req.auto_backup,
            )
            
            applied_codes = remediation_result["applied"]
            applied_details = remediation_result.get("applied_details") or {}
            snapshot_after = remediation_result["snapshot_after"]
            manual_required = remediation_result.get("manual_required", [])
            failed_codes = [FailedRemediationItem(**x) for x in remediation_result.get("failed", [])]
            res = storage.apply_remediation(analysis_id, applied_codes, req.auto_backup, applied_details)
            res["analysis"]["snapshot"] = snapshot_after
            storage.update_analysis(res["analysis"])
            
            status = "completed" if not failed_codes else "completed_with_failures"
            results.append(
                ServerRemediationResult(
                    server_id=server_id,
                    ip=server["host"],
                    applied_codes=applied_codes,
                    vulnerabilities=[Vulnerability(**_normalize_vuln(v)) for v in res["analysis"]["vulnerabilities"]],
                    status=status,
                    manual_required=manual_required,
                    failed_codes=failed_codes,
                )
            )
            
        except Exception as e:
            logger.error(f"조치 실행 실패 {server_id}: {e}")
            server = server_manager.get_server(server_id)
            results.append(
                ServerRemediationResult(
                    server_id=server_id,
                    ip=server["host"] if server else "unknown",
                    applied_codes=[],
                    vulnerabilities=[],
                    status="failed",
                    error=str(e),
                )
            )
    
    # 스냅샷 생성
    snapshot_id = None
    if any(r.status == "completed" for r in results):
        server_analysis_map = {
            r.server_id: analysis_id
            for r, analysis_id in zip(results, req.server_analysis_map.values())
            if r.status == "completed"
        }
        if server_analysis_map:
            snapshot = storage.create_snapshot(
                name="조치 스냅샷",
                description=f"{len(server_analysis_map)}개 서버 조치 완료",
                server_analysis_map=server_analysis_map,
            )
            snapshot_id = snapshot["snapshot_id"]
    
    return BulkRemediationResponse(
        results=results,
        snapshot_id=snapshot_id,
    )


@app.post("/api/snapshots/create", response_model=SnapshotInfo)
def create_snapshot(req: SnapshotCreateRequest) -> SnapshotInfo:
    """스냅샷 생성"""
    snapshot = storage.create_snapshot(
        name=req.name,
        description=req.description,
        server_analysis_map=req.server_analysis_map,
    )
    
    return SnapshotInfo(
        snapshot_id=snapshot["snapshot_id"],
        name=snapshot["name"],
        description=snapshot.get("description"),
        created_at=datetime.fromisoformat(snapshot["created_at"]),
        server_analysis_map=snapshot["server_analysis_map"],
        server_count=len(snapshot["server_analysis_map"]),
    )


@app.get("/api/snapshots", response_model=list[SnapshotInfo])
def list_snapshots() -> list[SnapshotInfo]:
    """스냅샷 목록 조회"""
    snapshots = storage.list_snapshots()
    return [
        SnapshotInfo(
            snapshot_id=s["snapshot_id"],
            name=s["name"],
            description=s.get("description"),
            created_at=datetime.fromisoformat(s["created_at"]),
            server_analysis_map=s["server_analysis_map"],
            server_count=len(s["server_analysis_map"]),
        )
        for s in snapshots
    ]


@app.post("/api/snapshots/compare", response_model=SnapshotCompareResponse)
def compare_snapshots(req: SnapshotCompareRequest) -> SnapshotCompareResponse:
    """두 스냅샷을 비교하여 회귀 감지"""
    before_snapshot = storage.get_snapshot(req.before_snapshot_id)
    after_snapshot = storage.get_snapshot(req.after_snapshot_id)
    
    if not before_snapshot or not after_snapshot:
        raise HTTPException(status_code=404, detail="snapshot_not_found")
    
    regressions = []
    total_regressions = 0
    
    # 각 서버별로 비교
    for server_id in before_snapshot["server_analysis_map"].keys():
        before_analysis_id = before_snapshot["server_analysis_map"].get(server_id)
        after_analysis_id = after_snapshot["server_analysis_map"].get(server_id)
        
        if not before_analysis_id or not after_analysis_id:
            continue
        
        before_analysis = storage.get_analysis(before_analysis_id)
        after_analysis = storage.get_analysis(after_analysis_id)
        
        if not before_analysis or not after_analysis:
            continue
        
        # 회귀 감지
        before_vulns = {v["code"]: v.get("status") for v in before_analysis.get("vulnerabilities", [])}
        after_vulns = {v["code"]: v.get("status") for v in after_analysis.get("vulnerabilities", [])}
        
        regression_codes = []
        for code, after_status in after_vulns.items():
            before_status = before_vulns.get(code)
            if before_status == "safe" and after_status == "vulnerable":
                regression_codes.append(code)
        
        if regression_codes:
            server = server_manager.get_server(server_id)
            regressions.append(
                ServerRegressionInfo(
                    server_id=server_id,
                    ip=server["host"] if server else "unknown",
                    regression_codes=regression_codes,
                    regression_count=len(regression_codes),
                )
            )
            total_regressions += len(regression_codes)
    
    return SnapshotCompareResponse(
        regressions=regressions,
        total_regressions=total_regressions,
    )


@app.get("/api/servers/{server_id}/latest-analysis", response_model=AnalysisRunResponse)
def get_latest_analysis(server_id: str) -> AnalysisRunResponse:
    """서버의 최신 분석 결과 조회"""
    analyses = storage.list_analyses_by_server(server_id)
    if not analyses:
        raise HTTPException(status_code=404, detail="analysis_not_found")
    
    latest = max(analyses, key=lambda x: x.get("completed_at", ""))
    
    return AnalysisRunResponse(
        analysis_id=latest["analysis_id"],
        server=latest["server"],
        started_at=datetime.fromisoformat(latest["started_at"]),
        completed_at=datetime.fromisoformat(latest["completed_at"]),
        vulnerabilities=[Vulnerability(**_normalize_vuln(v)) for v in latest["vulnerabilities"]],
    )


@app.post("/api/analysis/rediagnose", response_model=BulkAnalysisResponse)
def rediagnose_servers(req: BulkAnalysisRequest) -> BulkAnalysisResponse:
    """재진단 실행 (회귀 감지용)
    
    이전 스냅샷과 비교하여 회귀를 감지합니다.
    """
    results = []
    completed = 0
    failed = 0
    
    for server_id in req.server_ids:
        try:
            server = server_manager.get_server(server_id)
            if not server:
                results.append(
                    ServerAnalysisResult(
                        server_id=server_id,
                        ip="unknown",
                        hostname="unknown",
                        status="failed",
                        error="서버를 찾을 수 없습니다",
                    )
                )
                failed += 1
                continue
            
            # 이전 분석 결과 가져오기
            previous_analyses = storage.list_analyses_by_server(server_id)
            previous_analysis = previous_analyses[-1] if previous_analyses else None
            
            # 재진단 실행
            if req.use_ansible and ANSIBLE_AVAILABLE:
                result = ansible_diagnostic.run_diagnostic_with_ansible(server_id, use_script=False)
            else:
                result = diagnostic_engine.run_diagnostic(server_id)
            
            # 분석 결과 저장 (재진단 시에만 회귀 감지 수행)
            analysis = storage.create_analysis(
                server=server["server_type"],
                server_id=server_id,
                vulnerabilities=result["vulnerabilities"],
                snapshot=result["snapshot"],
                detect_regression=True,
            )
            
            # 회귀 감지는 storage.create_analysis(detect_regression=True)에서 수행됨 (fixed→vulnerable 시 회귀)
            vuln_count = _count_issues(result["vulnerabilities"])
            
            results.append(
                ServerAnalysisResult(
                    server_id=server_id,
                    ip=server["host"],
                    hostname=server.get("name", server["host"]),
                    analysis_id=analysis["analysis_id"],
                    vulnerabilities=[Vulnerability(**_normalize_vuln(v)) for v in result["vulnerabilities"]],
                    vuln_count=vuln_count,
                    status="completed",
                )
            )
            completed += 1
            
        except Exception as e:
            logger.error(f"재진단 실행 실패 {server_id}: {e}")
            server = server_manager.get_server(server_id)
            results.append(
                ServerAnalysisResult(
                    server_id=server_id,
                    ip=server["host"] if server else "unknown",
                    hostname=server.get("name", "unknown") if server else "unknown",
                    status="failed",
                    error=str(e),
                )
            )
            failed += 1
    
    return BulkAnalysisResponse(
        results=results,
        snapshot_id=None,
        total_servers=len(req.server_ids),
        completed=completed,
        failed=failed,
    )


@app.post("/api/report/generate-global", response_model=ReportGenerateResponse)
def generate_global_report(
    type: str = Query(default="excel", description="pdf, excel, compliance"),
    req: ReportGenerateGlobalRequest | None = Body(None),
) -> ReportGenerateResponse:
    """전체 서버의 종합 보고서 생성. req.server_ids 가 있으면 해당 서버만 포함(보고서의 점검 대상 서버 수와 일치)."""
    all_servers = server_manager.list_servers()
    if req is not None and req.server_ids:
        by_id = {s["server_id"]: s for s in all_servers}
        all_servers = [by_id[sid] for sid in req.server_ids if sid in by_id]
    all_analyses = []
    
    for server in all_servers:
        server_id = server["server_id"]
        analyses = storage.list_analyses_by_server(server_id)
        if not analyses:
            continue
        # storage.list_analyses_by_server 는 completed_at DESC 로 반환하므로
        # 인덱스 0 이 최신 분석
        all_analyses.append({
            "server": server,
            "analysis": analyses[0],
        })

    if not all_analyses:
        raise HTTPException(status_code=400, detail="진단 결과가 있는 서버가 없습니다.")
    
    ts = int(datetime.utcnow().timestamp())
    
    if type == "pdf":
        filename = f"global_security_report_{ts}.pdf"
        content_type = "application/pdf"
        # 전체 서버 취약점을 하나로 모아 실제 PDF 생성 (analysis_global.html 사용)
        all_vulns = []
        server_list = []
        for item in all_analyses:
            server = item["server"]
            analysis = item["analysis"]
            hostname = server.get("name", server.get("host", "unknown"))
            ip = server.get("host", "-")
            vulns_raw = analysis.get("vulnerabilities", []) or []
            sample_v = vulns_raw[0] if vulns_raw else {}
            os_type = sample_v.get("os_type") or server.get("server_type", "-")
            os_version = sample_v.get("os_version") or "-"

            server_list.append(
                {
                    "os": os_type,
                    "osver": os_version,
                    "ip": ip,
                    "hostname": hostname,
                }
            )

            for v in vulns_raw:
                n = _normalize_vuln(v)
                n["hostname"] = hostname
                # os 정보도 보고서에서 쓸 수 있도록 보존
                n.setdefault("os_type", os_type)
                n.setdefault("os_version", os_version)
                all_vulns.append(n)

        safe_count = sum(1 for v in all_vulns if str(v.get("status", "")).lower() == "safe")
        vulnerable_count = sum(1 for v in all_vulns if str(v.get("status", "")).lower() == "vulnerable")
        data = {
            "vulnerabilities": all_vulns,
            "summary": {
                "total_targets": len(server_list),
                "total_items": len(CATALOG) * len(server_list) if server_list else len(all_vulns),
                "safe": safe_count,
                "vulnerable": vulnerable_count,
                "action_required": vulnerable_count,
            },
            "server_list": server_list,
        }
        try:
            pdf_path = generate_analysis_global_pdf(data)
            with open(pdf_path, "rb") as f:
                content = f.read()
            import os
            try:
                os.remove(pdf_path)
            except OSError:
                pass
        except Exception as e:
            import traceback
            logger.error(f"전체진단 PDF 생성 실패: {e}\n{traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"전체진단 PDF 생성 실패: {str(e)}")
    elif type == "excel":
        filename = f"global_security_report_{ts}.xlsx"
        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        content = f"전체 보안 진단 보고서 (Excel)\n생성일: {datetime.utcnow().isoformat()}\n서버 수: {len(all_analyses)}\n".encode("utf-8")
    else:
        filename = f"global_compliance_report_{ts}.json"
        content_type = "application/json"
        import json
        report_data = {
            "generated_at": datetime.utcnow().isoformat(),
            "total_servers": len(all_analyses),
            "servers": [
                {
                    "server_id": item["server"]["server_id"],
                    "host": item["server"]["host"],
                    "hostname": item["server"].get("name", item["server"]["host"]),
                    "vulnerabilities": item["analysis"].get("vulnerabilities", []),
                }
                for item in all_analyses
            ]
        }
        content = json.dumps(report_data, ensure_ascii=False, indent=2).encode("utf-8")
    
    b64 = base64.b64encode(content).decode("ascii")
    return ReportGenerateResponse(
        analysis_id="global",
        type=type,
        filename=filename,
        content_type=content_type,
        bytes_base64=b64,
    )