from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from .server_manager import get_server
from .ssh_client import SSHClient
from .vuln_catalog import requires_manual_remediation

logger = logging.getLogger(__name__)

_REMEDIATION_SCRIPT_DIR = "remediation_script"


def _remediation_script_dir() -> Path:
    """로컬 script/remediation_script/ 디렉터리 경로."""
    base_dir = Path(__file__).resolve().parent.parent.parent  # Autoisms/
    script_dir = base_dir / "script" / _REMEDIATION_SCRIPT_DIR
    if not script_dir.is_dir():
        raise FileNotFoundError(f"remediation_script 디렉터리를 찾을 수 없습니다: {script_dir}")
    return script_dir


def _code_to_script_name(code: str) -> str | None:
    """
    취약점 코드(U-01, U01, u01 등)를 스크립트 파일명(u01.sh)으로 변환.
    매칭되지 않으면 None.
    """
    code = (code or "").strip()
    m = re.match(r"(?i)u-?(\d+)", code)
    if not m:
        return None
    num = m.group(1)
    # u01 ~ u99 형식 (두 자리 패딩)
    return f"u{num.zfill(2)}.sh"


def _ensure_workdir(ssh: SSHClient) -> str:
    """
    원격에서 사용자 소유의 쓰기 가능한 작업 디렉터리 확보.
    $HOME/autoisms_remediation 사용 (같은 경로 재사용, 디렉터리 누적 없음, 항상 쓰기 가능).
    """
    exit_code, stdout, _ = ssh.execute("echo $HOME")
    home = (stdout or "").strip().split("\n")[0].strip()
    if home and home.startswith("/"):
        workdir = f"{home}/autoisms_remediation"
    else:
        workdir = "/tmp/autoisms_remediation"
    ssh.execute(f"mkdir -p {workdir}")
    logger.debug(f"[REMEDIATION] 작업 디렉터리: {workdir}")
    return workdir


def _deploy_remediation_scripts(
    ssh: SSHClient, script_names: list[str], sudo_prefix: str, workdir: str
) -> None:
    """
    로컬 script/remediation_script/ 내 지정된 .sh 파일들을 원격으로 전송.
    script_names: 업로드할 파일명 목록 (예: ["u01.sh", "u66.sh"])
    remediation_common.sh가 있으면 항상 먼저 배포 (u01, u02, u66, u67 등에서 source 사용).
    workdir: 원격 작업 디렉터리 (사용자 소유, 쓰기 가능).
    """
    script_dir = _remediation_script_dir()

    # remediation_common.sh를 사용하는 스크립트(u01, u02, u66, u67)를 위해 공통 파일 선행 배포
    common_sh = script_dir / "remediation_common.sh"
    if common_sh.exists():
        remote_path = f"{workdir}/remediation_common.sh"
        text = common_sh.read_text(encoding="utf-8")
        ssh.put_text(remote_path, text, chmod=0o755)
        logger.debug("[REMEDIATION] 업로드: remediation_common.sh")

    for name in script_names:
        local_path = script_dir / name
        if not local_path.exists():
            logger.warning(f"[REMEDIATION] 로컬 스크립트 없음, 건너뜀: {name}")
            continue
        remote_path = f"{workdir}/{name}"
        text = local_path.read_text(encoding="utf-8")
        ssh.put_text(remote_path, text, chmod=0o755)
        logger.debug(f"[REMEDIATION] 업로드: {name}")


def _run_remote_remediation_script(
    ssh: SSHClient,
    sudo_prefix: str,
    script_name: str,
    workdir: str,
) -> tuple[int, str, str]:
    """
    원격에 배포된 개별 조치 스크립트 실행 (예: u01.sh, u66.sh).
    sudo로 한 번에 실행해 작업 디렉터리와 root 권한을 보장.
    Returns: (exit_code, stdout, stderr)
    """
    remote_script = f"{workdir}/{script_name}"
    # 이전 결과 파일 삭제 (각 스크립트마다 새로 생성)
    ssh.execute(f"{sudo_prefix}rm -f {workdir}/remediation_result.json")
    # 한 번의 sudo 셸에서 cd 후 스크립트 실행 → cwd 및 root 권한 확실히 적용
    run_cmd = f'{sudo_prefix}sh -c \'cd "{workdir}" && bash "{remote_script}"\''
    exit_code, stdout, stderr = ssh.execute(run_cmd)
    return exit_code, stdout, stderr


def _verify_remediation_result(
    ssh: SSHClient,
    sudo_prefix: str,
    code: str,
    workdir: str,
) -> tuple[bool, str, dict | None]:
    """
    원격 서버의 remediation_result.json을 읽어 조치가 실제로 반영됐는지 확인.
    Returns: (success, detail_message, item_or_none)
    - success: 스크립트가 result.json에 "SAFE"를 기록하면 True
    - item_or_none: 성공 시 해당 JSON 항목(상세 로그용), 실패 시 None
    """
    result_path = f"{workdir}/remediation_result.json"
    try:
        exit_code, stdout, _ = ssh.execute(f"{sudo_prefix}cat {result_path} 2>/dev/null")
        if exit_code != 0 or not stdout.strip():
            return False, "remediation_result.json 파일을 읽을 수 없음", None

        raw = stdout.strip()
        raw = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', raw)
        raw = re.sub(r"[\x00-\x1f]", " ", raw)
        items = json.loads(raw)

        if not isinstance(items, list):
            return False, "remediation_result.json 형식 오류", None

        code_upper = code.strip().upper()
        for item in items:
            check_id = (item.get("check_id") or "").strip().upper()
            if check_id == code_upper:
                status = (item.get("status") or "").strip().upper()
                if status == "SAFE":
                    return True, f"조치 확인됨: {item.get('details', '')}", item
                else:
                    detail = item.get("details") or item.get("post_value") or status
                    return False, f"조치 미반영 (status={status}): {detail}", None

        return False, f"remediation_result.json에서 {code} 항목을 찾을 수 없음", None
    except json.JSONDecodeError as e:
        return False, f"remediation_result.json 파싱 실패: {e}", None
    except Exception as e:
        return False, f"결과 검증 실패: {e}", None


def _format_detail_dict(d: dict) -> list[str]:
    """조치 상세 dict(조치 전 상태, 세부 내역 등)를 줄 단위 리스트로 변환. \n을 실제 줄바꿈으로 처리."""
    out: list[str] = []
    pre = (d.get("조치 전 상태") or d.get("pre_value") or "").strip()
    post = (d.get("조치 후 상태") or d.get("post_value") or "").strip()
    cmd = (d.get("조치 명령어") or "").strip()
    sub = (d.get("세부 내역") or d.get("세부내용") or "").strip()
    if pre:
        out.append(f"조치 전: {pre}")
    if post:
        out.append(f"조치 후: {post}")
    if cmd:
        out.append(f"조치 명령: {cmd}")
    if sub:
        # JSON/문자열의 \n을 실제 줄바꿈으로 변환 후 라인별로 추가
        sub_normalized = str(sub).replace("\\n", "\n")
        for ln in sub_normalized.split("\n"):
            s = ln.strip()
            if s:
                out.append(s)
    return out


def _remediation_item_to_details(item: dict) -> list[str]:
    """remediation_result.json 항목을 상세 로그 라인 목록으로 변환."""
    lines: list[str] = []
    pre = item.get("pre_value") or ""
    post = item.get("post_value") or ""
    if pre:
        lines.append(f"조치 전: {pre}")
    if post:
        lines.append(f"조치 후: {post}")
    details_raw = item.get("details")
    if details_raw:
        if isinstance(details_raw, list):
            for x in details_raw:
                if not x:
                    continue
                if isinstance(x, dict) and ("조치 전 상태" in x or "세부 내역" in x or "조치 후 상태" in x):
                    lines.extend(_format_detail_dict(x))
                else:
                    txt = str(x).strip().replace("\\n", "\n")
                    for ln in txt.split("\n"):
                        s = ln.strip()
                        if s:
                            lines.append(s)
        else:
            for ln in str(details_raw).replace("\\n", "\n").split("\n"):
                s = ln.strip()
                if s:
                    lines.append(s)
    return lines


def _save_remediation_result_to_local(
    ssh: SSHClient,
    sudo_prefix: str,
    workdir: str,
    server_id: str,
    host: str,
) -> None:
    """원격 서버의 remediation_result.json을 로컬 remediation_results 디렉토리에 저장."""
    try:
        BASE_DIR = Path(__file__).resolve().parent.parent.parent
        results_dir = (BASE_DIR / "remediation_results").resolve()
        
        # 호스트명 결정 (inventory에서 가져오거나 host 사용)
        from .inventory_parser import InventoryParser
        try:
            parser = InventoryParser()
            host_name = None
            for inv_hostname, vars_dict in parser.parse().items():
                inv_ip = vars_dict.get("ansible_host") or vars_dict.get("ansible_hostname") or inv_hostname
                if inv_ip == host:
                    host_name = inv_hostname
                    break
            if not host_name:
                host_name = host or "unknown"
        except Exception:
            host_name = host or "unknown"
        
        # 타임스탬프 기반 디렉토리 생성
        run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        local_dir = results_dir / host_name / run_id
        local_dir.mkdir(parents=True, exist_ok=True)
        
        # 원격 remediation_result.json 읽기
        result_path = f"{workdir}/remediation_result.json"
        exit_code, stdout, _ = ssh.execute(f"{sudo_prefix}cat {result_path} 2>/dev/null")
        
        if exit_code == 0 and stdout.strip():
            # 원격 조치 스크립트는 우리가 관리하므로, 별도 sanitize 없이 그대로 파싱 시도
            raw = stdout.strip()

            # 보기 좋게 pretty-print 해서 저장 (들여쓰기 포함)
            local_file = local_dir / "remediation_result.json"
            try:
                data = json.loads(raw)
                pretty = json.dumps(data, ensure_ascii=False, indent=2)
                local_file.write_text(pretty, encoding="utf-8")
            except Exception:
                # 파싱 실패 시 원본 그대로 저장
                local_file.write_text(raw, encoding="utf-8")
            logger.info(f"[REMEDIATION] 조치 결과 저장: {local_file}")
        else:
            logger.warning(f"[REMEDIATION] 원격 remediation_result.json을 읽을 수 없음: {result_path}")
    except Exception as e:
        logger.warning(f"[REMEDIATION] 조치 결과 로컬 저장 실패: {e}")


def apply_remediation_ssh(server_id: str, codes: list[str], auto_backup: bool = True) -> dict[str, Any]:
    """
    실제 서버에 SSH로 조치 적용
    Returns: {applied: [...], snapshot_after: [...]}
    """
    print(f"[REMEDIATION] SSH 조치 시작: server_id={server_id}, codes={codes}")
    logger.info(f"[REMEDIATION] SSH 조치 시작: server_id={server_id}, codes={codes}")
    server = get_server(server_id)
    if not server:
        raise ValueError(f"서버를 찾을 수 없습니다: {server_id}")

    ssh = SSHClient(
        host=server["host"],
        port=server["port"],
        username=server["username"],
        password=server.get("password"),
        key_file=server.get("key_file"),
    )

    try:
        ssh.connect()

        # 백업 생성
        if auto_backup:
            try:
                backup_dir = f"/tmp/autoisms_backup_{server_id}"
                ssh.execute(f"mkdir -p {backup_dir}")
                # 주요 설정 파일 백업
                ssh.execute(f"cp /etc/ssh/sshd_config {backup_dir}/sshd_config.bak 2>/dev/null || true")
                ssh.execute(f"cp /etc/login.defs {backup_dir}/login.defs.bak 2>/dev/null || true")
                logger.info(f"Backup created at {backup_dir}")
            except Exception as e:
                logger.warning(f"Backup creation failed: {e}")

        applied: list[str] = []
        # sudo 사용 여부: root가 아니면 조치 시점에 sudo -n 실제로 시도 (DB can_sudo 무시)
        # → NOPASSWD 추가 후 "연결 확인" 안 해도 즉시 반영
        use_sudo = False
        if server.get("has_root", False):
            sudo_prefix = ""
        else:
            exit_code, _, _ = ssh.execute("sudo -n true 2>&1")
            use_sudo = exit_code == 0
            sudo_prefix = "sudo -n " if use_sudo else ""
            if use_sudo:
                logger.info(f"[REMEDIATION] sudo 사용 (server_id={server_id})")
            else:
                logger.info(f"[REMEDIATION] sudo 미사용 - root/can_sudo 아님 (server_id={server_id})")

        # 수동 조치 전용 코드는 자동 실행 대상에서 제외
        manual_required: list[str] = []
        script_dir = _remediation_script_dir()
        code_to_script: dict[str, str] = {}
        for code in codes:
            code_norm = code.strip()
            if not code_norm:
                continue
            if requires_manual_remediation(code_norm):
                manual_required.append(code_norm)
                logger.info(f"[REMEDIATION] 수동 조치 필요 항목, 자동 실행 제외: {code_norm}")
                continue
            name = _code_to_script_name(code_norm)
            if name and (script_dir / name).exists():
                # 빈 스크립트도 제외 (0바이트 또는 매우 작은 경우)
                if (script_dir / name).stat().st_size < 100:
                    manual_required.append(code_norm)
                    logger.info(f"[REMEDIATION] 조치 스크립트 비어 있음, 수동 조치 필요: {code_norm}")
                    continue
                code_to_script[code_norm] = name
            else:
                logger.warning(f"[REMEDIATION] 조치 스크립트 없음, 건너뜀: {code_norm} (파일: {name})")
                manual_required.append(code_norm)

        if not code_to_script and not manual_required:
            logger.warning("[REMEDIATION] 실행할 조치 스크립트가 없습니다.")
            return {"applied": [], "applied_details": {}, "snapshot_after": [], "manual_required": [], "failed": []}
        if not code_to_script:
            return {"applied": [], "applied_details": {}, "snapshot_after": [], "manual_required": manual_required, "failed": []}

        # 사용자 소유 쓰기 가능 작업 디렉터리 확보 (Permission denied 방지)
        workdir = _ensure_workdir(ssh)
        # 필요한 스크립트만 원격에 한 번 배포
        unique_scripts = list(dict.fromkeys(code_to_script.values()))
        _deploy_remediation_scripts(ssh, unique_scripts, sudo_prefix, workdir)

        # 개별 조치 스크립트 실행 (개별조치/전체조치 동일 경로)
        failed_codes: list[dict[str, str]] = []
        applied_details: dict[str, list[str]] = {}
        for code, script_name in code_to_script.items():
            try:
                print(f"[REMEDIATION] {code}: {script_name} 실행 중...")
                exit_code, stdout, stderr = _run_remote_remediation_script(
                    ssh, sudo_prefix, script_name, workdir
                )
                if exit_code != 0:
                    raise RuntimeError(stderr or stdout)

                verified, detail, item = _verify_remediation_result(
                    ssh, sudo_prefix, code, workdir
                )
                if verified:
                    applied.append(code)
                    if item:
                        applied_details[code] = _remediation_item_to_details(item)
                    print(f"[REMEDIATION] {code}: 조치 반영 확인됨")
                    logger.info(f"[REMEDIATION] {code}: 조치 반영 확인됨 - {detail}")
                else:
                    # 실패 원인 파악을 위해 스크립트 stderr/stdout 일부 포함 (최대 300자)
                    # "조치 완료: remediation_result.json" 등 스크립트 내부 메시지는 제거해 혼동 방지
                    script_out = (stderr or stdout or "").strip()
                    if script_out:
                        lines = [ln for ln in script_out.replace("\r", "").split("\n") if ln.strip()]
                        lines = [ln for ln in lines if "조치 완료:" not in ln and "remediation_result.json" not in ln.strip()]
                        snippet = "\n".join(lines)[:300].strip()
                        if snippet:
                            detail = f"{detail} (스크립트 출력: {snippet})"
                    print(f"[REMEDIATION] {code}: 스크립트 실행됐으나 조치 미반영 - {detail}")
                    logger.warning(f"[REMEDIATION] {code}: 스크립트 실행됐으나 조치 미반영 - {detail}")
                    failed_codes.append({"code": code, "reason": detail})
            except Exception as e:
                print(f"[REMEDIATION] {code}: 실행 실패 - {e}")
                logger.error(f"Failed to apply remediation for {code}: {e}")
                failed_codes.append({"code": code, "reason": str(e)})

        if failed_codes:
            logger.warning(f"[REMEDIATION] 조치 미반영 항목: {failed_codes}")

        # 조치 후 스냅샷 수집 (sudo 사용)
        snapshot_after: list[str] = []
        try:
            exit_code, stdout, _ = ssh.execute(f"{sudo_prefix}cat /etc/ssh/sshd_config 2>/dev/null | grep -E '^(PermitRootLogin|PasswordAuthentication|Port|Protocol)' || echo ''")
            snapshot_after.extend([line.strip() for line in stdout.strip().split("\n") if line.strip()])

            exit_code, stdout, _ = ssh.execute(f"{sudo_prefix}cat /etc/login.defs 2>/dev/null | grep -E '^(PASS_MIN_LEN|PASS_MIN_DAYS)' || echo ''")
            snapshot_after.extend([line.strip() for line in stdout.strip().split("\n") if line.strip()])
        except Exception as e:
            logger.warning(f"Snapshot collection after remediation failed: {e}")

        # 원격 서버의 remediation_result.json을 로컬 remediation_results 디렉토리에 저장
        _save_remediation_result_to_local(ssh, sudo_prefix, workdir, server_id, server.get("host", ""))

        return {
            "applied": applied,
            "applied_details": applied_details,
            "snapshot_after": snapshot_after if snapshot_after else ["DEFAULT_CONFIG=1"],
            "manual_required": manual_required,
            "failed": failed_codes,
        }

    finally:
        ssh.close()
