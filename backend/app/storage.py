from __future__ import annotations

import os
import threading
import uuid
from datetime import datetime, timezone
from typing import Any

from . import localdb
from .vuln_catalog import find_by_code, get_catalog

# 로컬 DB 사용 (SQLite, 별도 서버 없음)
localdb.init_db()

_LOCK = threading.Lock()


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _data_dir() -> str:
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(base, "data")


def _default_snapshot_for_server(server: str) -> list[str]:
    # 데모용 구성 스냅샷(간단 텍스트 라인 목록)
    if server == "ubuntu":
        return [
            "Port 22",
            "Protocol 2",
            "PermitRootLogin yes",
            "PasswordAuthentication yes",
            "PASS_MIN_LEN 6",
        ]
    return [
        "DEFAULT_CONFIG=1",
        "PermitRootLogin yes",
        "PASS_MIN_LEN 6",
    ]


def _apply_snapshot_fix(code: str, snapshot: list[str]) -> list[str]:
    # 프론트 DIFF 예시와 유사하게 변경
    s = list(snapshot)

    def upsert(prefix: str, new_line: str) -> None:
        for i, line in enumerate(s):
            if line.strip().startswith(prefix):
                s[i] = new_line
                return
        s.append(new_line)

    code = code.strip().upper()
    if code == "U-01":
        upsert("PermitRootLogin", "PermitRootLogin no")
        upsert("PasswordAuthentication", "PasswordAuthentication no")
    elif code == "U-02":
        upsert("PASS_MIN_LEN", "PASS_MIN_LEN 8")
    elif code == "U-47":
        upsert("PASS_MIN_DAYS", "PASS_MIN_DAYS 1")
    else:
        upsert(f"FIXED_{code}", f"FIXED_{code}=1")

    return s


def _apply_snapshot_regression(code: str, snapshot: list[str]) -> list[str]:
    s = list(snapshot)
    code = code.strip().upper()
    if code == "U-18":
        # SSH 기본설정으로 돌아간 것처럼
        s = [line for line in s if not line.startswith("PermitRootLogin") and not line.startswith("PasswordAuthentication")]
        s.append("PermitRootLogin yes")
        s.append("PasswordAuthentication yes")
    elif code == "U-12":
        # 파일 권한 예시
        s.append("SHADOW_PERM 644")
    else:
        s.append(f"REGRESSION_{code}=1")
    return s


def create_analysis(
    server: str,
    server_id: str | None = None,
    vulnerabilities: list[dict[str, Any]] | None = None,
    snapshot: list[str] | None = None,
    detect_regression: bool = False,
) -> dict[str, Any]:
    """
    분석 생성
    - server: 서버 타입 문자열 (ubuntu, rocky9 등)
    - server_id: 등록된 서버 ID (선택)
    - vulnerabilities: 진단 결과 (없으면 데모 데이터)
    - snapshot: 설정 스냅샷 (없으면 기본값)
    - detect_regression: True일 때만 회귀 감지 (재진단 시에만 True, 일반 진단은 False)
    """
    server = (server or "ubuntu").strip()
    started_at = _utc_now()
    completed_at = _utc_now()

    if vulnerabilities is None:
        # 데모용 데이터
        catalog = get_catalog()
        vulnerabilities = []
        for idx, v in enumerate(catalog):
            status = "vulnerable" if idx < 5 else "safe"
            vulnerabilities.append(
                {
                    "code": v.code,
                    "name": v.name,
                    "status": status,
                    "severity": v.severity,
                    "category": v.category,
                    "compliance": v.compliance,
                }
            )

    if snapshot is None:
        snapshot = _default_snapshot_for_server(server)

    analysis_id = uuid.uuid4().hex
    analysis = {
        "analysis_id": analysis_id,
        "server": server,
        "server_id": server_id,
        "started_at": started_at.isoformat(),
        "completed_at": completed_at.isoformat(),
        "vulnerabilities": vulnerabilities,
        "snapshot": snapshot,
    }

    with _LOCK:
        if server_id and detect_regression:
            regression_codes = _detect_regression(server_id, analysis)
            if regression_codes:
                analysis["regression_detected"] = True
                analysis["regression_codes"] = regression_codes
                _create_alert(
                    alert_type="regression",
                    message=f"회귀 감지: {', '.join(regression_codes)} 항목이 정상에서 취약으로 변경됨",
                    severity="error",
                    analysis_id=analysis_id,
                    server_id=server_id,
                )
        localdb.analysis_insert(analysis)
    return analysis


def get_analysis(analysis_id: str) -> dict[str, Any] | None:
    return localdb.analysis_get(analysis_id)


def update_analysis(analysis: dict[str, Any]) -> None:
    localdb.analysis_update(analysis)


def apply_remediation(
    analysis_id: str,
    codes: list[str],
    auto_backup: bool,
    applied_details: dict[str, list[str]] | None = None,
) -> dict[str, Any]:
    analysis = get_analysis(analysis_id)
    if not analysis:
        raise KeyError("analysis_not_found")

    codes_norm = [c.strip().upper() for c in codes if c and c.strip()]
    applied: list[str] = []
    snapshot: list[str] = list(analysis.get("snapshot") or [])
    applied_details = applied_details or {}

    vuln_by_code: dict[str, dict[str, Any]] = {v["code"]: v for v in analysis.get("vulnerabilities", [])}

    for code in codes_norm:
        if code not in vuln_by_code:
            cat = find_by_code(code)
            if cat:
                vuln_by_code[code] = {"code": cat.code, "name": cat.name, "status": "vulnerable", "severity": cat.severity, "category": cat.category, "compliance": cat.compliance}
            else:
                continue

        vuln = vuln_by_code[code]
        if vuln.get("status") not in ("safe", "fixed"):
            vuln["status"] = "fixed"
            snapshot = _apply_snapshot_fix(code, snapshot)
            applied.append(code)
            # 조치 상세 로그 병합 (상세 로그 패널에 표시)
            if code in applied_details and applied_details[code]:
                existing = vuln.get("details") or []
                if not isinstance(existing, list):
                    existing = [existing] if existing else []
                vuln["details"] = existing + ["--- 조치 내역 ---"] + applied_details[code]

    analysis["snapshot"] = snapshot
    analysis["vulnerabilities"] = list(vuln_by_code.values())
    analysis["completed_at"] = _utc_now().isoformat()
    analysis["last_backup_created"] = bool(auto_backup)

    update_analysis(analysis)
    return {"analysis": analysis, "applied": applied}


def simulate_regression(analysis_id: str, newly_vulnerable_codes: list[str]) -> dict[str, Any]:
    analysis = get_analysis(analysis_id)
    if not analysis:
        raise KeyError("analysis_not_found")

    codes_norm = [c.strip().upper() for c in newly_vulnerable_codes if c and c.strip()]
    snapshot: list[str] = list(analysis.get("snapshot") or [])

    vulns: list[dict[str, Any]] = list(analysis.get("vulnerabilities") or [])
    by_code: dict[str, dict[str, Any]] = {v["code"]: v for v in vulns}

    for code in codes_norm:
        v = by_code.get(code)
        if not v:
            cat = find_by_code(code)
            if not cat:
                continue
            v = {"code": cat.code, "name": cat.name, "status": "safe", "severity": cat.severity, "category": cat.category, "compliance": cat.compliance}
            by_code[code] = v
        v["status"] = "vulnerable"
        snapshot = _apply_snapshot_regression(code, snapshot)

    analysis["snapshot"] = snapshot
    analysis["vulnerabilities"] = list(by_code.values())
    analysis["completed_at"] = _utc_now().isoformat()
    analysis["regression_detected"] = True

    update_analysis(analysis)
    return analysis


def diff_snapshots(before: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    b = list(before.get("snapshot") or [])
    a = list(after.get("snapshot") or [])

    b_set = set(b)
    a_set = set(a)

    removed = [line for line in b if line not in a_set]
    added = [line for line in a if line not in b_set]
    unchanged = [line for line in a if line in b_set]

    return {
        "removed": removed,
        "added": added,
        "unchanged": unchanged,
        "summary": {"removed": len(removed), "added": len(added), "unchanged": len(unchanged)},
    }


def _detect_regression(server_id: str, new_analysis: dict[str, Any]) -> list[str]:
    """회귀 감지: 로컬 DB에서 해당 서버 직전 분석을 조회해, 정상→취약된 항목 코드 반환."""
    prev_list = localdb.analysis_list_by_server(server_id)
    if not prev_list:
        return []
    prev_analysis = prev_list[0]
    prev_vulns = {v["code"]: v.get("status") for v in prev_analysis.get("vulnerabilities", [])}
    new_vulns = {v["code"]: v.get("status") for v in new_analysis.get("vulnerabilities", [])}
    return [
        code for code, new_status in new_vulns.items()
        if prev_vulns.get(code) in ("safe", "fixed") and new_status in ("vulnerable", "manual")
    ]


def _create_alert(
    alert_type: str,
    message: str,
    severity: str,
    analysis_id: str | None = None,
    server_id: str | None = None,
) -> str:
    """알림 생성"""
    alert_id = uuid.uuid4().hex
    alert = {
        "alert_id": alert_id,
        "type": alert_type,
        "message": message,
        "severity": severity,
        "analysis_id": analysis_id,
        "server_id": server_id,
        "created_at": _utc_now().isoformat(),
        "read": False,
    }
    
    localdb.alert_insert(alert)
    return alert_id


def get_alerts(since_minutes: int = 60, unread_only: bool = False) -> list[dict[str, Any]]:
    """알림 목록 (since_minutes 이내, unread_only면 미읽음만)."""
    from datetime import timedelta
    cutoff = _utc_now() - timedelta(minutes=since_minutes)
    return localdb.alerts_get(since_ts=cutoff.isoformat(), unread_only=unread_only)


def mark_alert_read(alert_id: str) -> bool:
    """알림 읽음 처리"""
    return localdb.alert_mark_read(alert_id)


def list_analyses_by_server(server_id: str) -> list[dict[str, Any]]:
    """서버별 분석 목록 (최신순)"""
    return localdb.analysis_list_by_server(server_id)


def create_snapshot(name: str, description: str | None, server_analysis_map: dict[str, str]) -> dict[str, Any]:
    """스냅샷 생성"""
    snapshot_id = uuid.uuid4().hex
    snapshot = {
        "snapshot_id": snapshot_id,
        "name": name,
        "description": description,
        "created_at": _utc_now().isoformat(),
        "server_analysis_map": server_analysis_map,
    }
    
    localdb.snapshot_insert(snapshot)
    return snapshot


def get_snapshot(snapshot_id: str) -> dict[str, Any] | None:
    """스냅샷 조회"""
    return localdb.snapshot_get(snapshot_id)


def list_snapshots() -> list[dict[str, Any]]:
    """스냅샷 목록 조회 (최신순)"""
    return localdb.snapshot_list()