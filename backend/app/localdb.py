"""
로컬 DB (Local DB)
- 별도 DB 서버 없이 프로세스 내 SQLite 사용 (단일 파일: data/db.sqlite)
- 분석/알림/스냅샷 저장
- 기본 7일 초과 데이터 자동 삭제 (앱 기동 시 1회)
"""
from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone, timedelta
from typing import Any


def _data_dir() -> str:
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(base, "data")


def _db_path() -> str:
    return os.path.join(_data_dir(), "db.sqlite")


def _ensure_dirs() -> None:
    os.makedirs(_data_dir(), exist_ok=True)


def get_connection() -> sqlite3.Connection:
    _ensure_dirs()
    conn = sqlite3.connect(_db_path(), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    cur = conn.execute("PRAGMA table_info(%s)" % table)
    return any(row[1] == column for row in cur.fetchall())


def init_db() -> None:
    """로컬 DB 테이블 생성 (없을 때만)."""
    _ensure_dirs()
    conn = get_connection()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS analyses (
                analysis_id TEXT PRIMARY KEY,
                server TEXT NOT NULL,
                server_id TEXT,
                started_at TEXT NOT NULL,
                completed_at TEXT NOT NULL,
                vulnerabilities TEXT NOT NULL,
                snapshot TEXT NOT NULL,
                regression_detected INTEGER DEFAULT 0,
                regression_codes TEXT,
                last_backup_created INTEGER DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_analyses_server_id ON analyses(server_id);
            CREATE INDEX IF NOT EXISTS idx_analyses_completed_at ON analyses(completed_at);
        """)
        if not _column_exists(conn, "analyses", "vulnerabilities_at_scan"):
            conn.execute("ALTER TABLE analyses ADD COLUMN vulnerabilities_at_scan TEXT")

        conn.executescript("""
            CREATE TABLE IF NOT EXISTS alerts (
                alert_id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                message TEXT NOT NULL,
                severity TEXT NOT NULL,
                analysis_id TEXT,
                server_id TEXT,
                created_at TEXT NOT NULL,
                read INTEGER DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

            CREATE TABLE IF NOT EXISTS snapshots (
                snapshot_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL,
                server_analysis_map TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON snapshots(created_at);
        """)
        conn.commit()
    finally:
        conn.close()


def _json_loads(s: str | None) -> Any:
    if s is None:
        return None
    return json.loads(s)


# --- analyses ---

def analysis_insert(analysis: dict[str, Any]) -> None:
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO analyses (
                analysis_id, server, server_id, started_at, completed_at,
                vulnerabilities, snapshot, regression_detected, regression_codes, last_backup_created
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                analysis["analysis_id"],
                analysis["server"],
                analysis.get("server_id"),
                analysis["started_at"],
                analysis["completed_at"],
                json.dumps(analysis.get("vulnerabilities") or [], ensure_ascii=False),
                json.dumps(analysis.get("snapshot") or [], ensure_ascii=False),
                1 if analysis.get("regression_detected") else 0,
                json.dumps(analysis["regression_codes"], ensure_ascii=False) if analysis.get("regression_codes") else None,
                1 if analysis.get("last_backup_created") else 0,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def analysis_update(analysis: dict[str, Any]) -> None:
    conn = get_connection()
    try:
        conn.execute(
            """UPDATE analyses SET
                server = ?, server_id = ?, started_at = ?, completed_at = ?,
                vulnerabilities = ?, snapshot = ?, regression_detected = ?, regression_codes = ?, last_backup_created = ?
            WHERE analysis_id = ?""",
            (
                analysis["server"],
                analysis.get("server_id"),
                analysis["started_at"],
                analysis["completed_at"],
                json.dumps(analysis.get("vulnerabilities") or [], ensure_ascii=False),
                json.dumps(analysis.get("snapshot") or [], ensure_ascii=False),
                1 if analysis.get("regression_detected") else 0,
                json.dumps(analysis["regression_codes"], ensure_ascii=False) if analysis.get("regression_codes") else None,
                1 if analysis.get("last_backup_created") else 0,
                analysis["analysis_id"],
            ),
        )
        conn.commit()
    finally:
        conn.close()


def _row_to_analysis(row: sqlite3.Row) -> dict[str, Any]:
    d = {
        "analysis_id": row["analysis_id"],
        "server": row["server"],
        "server_id": row["server_id"],
        "started_at": row["started_at"],
        "completed_at": row["completed_at"],
        "vulnerabilities": _json_loads(row["vulnerabilities"]) or [],
        "snapshot": _json_loads(row["snapshot"]) or [],
        "regression_detected": bool(row["regression_detected"]),
        "regression_codes": _json_loads(row["regression_codes"]) or [],
    }
    if "last_backup_created" in row.keys():
        d["last_backup_created"] = bool(row["last_backup_created"])
    return d


def analysis_get(analysis_id: str) -> dict[str, Any] | None:
    conn = get_connection()
    try:
        cur = conn.execute("SELECT * FROM analyses WHERE analysis_id = ?", (analysis_id,))
        row = cur.fetchone()
        return dict(_row_to_analysis(row)) if row else None
    finally:
        conn.close()


def analysis_list_by_server(server_id: str) -> list[dict[str, Any]]:
    conn = get_connection()
    try:
        cur = conn.execute(
            "SELECT * FROM analyses WHERE server_id = ? ORDER BY completed_at DESC",
            (server_id,),
        )
        return [_row_to_analysis(r) for r in cur.fetchall()]
    finally:
        conn.close()


# --- alerts ---

def alert_insert(alert: dict[str, Any]) -> None:
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO alerts (alert_id, type, message, severity, analysis_id, server_id, created_at, read)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                alert["alert_id"],
                alert["type"],
                alert["message"],
                alert["severity"],
                alert.get("analysis_id"),
                alert.get("server_id"),
                alert["created_at"],
                1 if alert.get("read") else 0,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def alerts_get(since_ts: str | None, unread_only: bool) -> list[dict[str, Any]]:
    conn = get_connection()
    try:
        sql = "SELECT * FROM alerts WHERE 1=1"
        params: list[Any] = []
        if since_ts:
            sql += " AND created_at >= ?"
            params.append(since_ts)
        if unread_only:
            sql += " AND read = 0"
        sql += " ORDER BY created_at DESC"
        cur = conn.execute(sql, params)
        return [
            {
                "alert_id": r["alert_id"],
                "type": r["type"],
                "message": r["message"],
                "severity": r["severity"],
                "analysis_id": r["analysis_id"],
                "server_id": r["server_id"],
                "created_at": r["created_at"],
                "read": bool(r["read"]),
            }
            for r in cur.fetchall()
        ]
    finally:
        conn.close()


def alert_mark_read(alert_id: str) -> bool:
    conn = get_connection()
    try:
        cur = conn.execute("UPDATE alerts SET read = 1 WHERE alert_id = ?", (alert_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


# --- snapshots ---

def snapshot_insert(snapshot: dict[str, Any]) -> None:
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO snapshots (snapshot_id, name, description, created_at, server_analysis_map)
               VALUES (?, ?, ?, ?, ?)""",
            (
                snapshot["snapshot_id"],
                snapshot["name"],
                snapshot.get("description"),
                snapshot["created_at"],
                json.dumps(snapshot.get("server_analysis_map") or {}, ensure_ascii=False),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def snapshot_get(snapshot_id: str) -> dict[str, Any] | None:
    conn = get_connection()
    try:
        cur = conn.execute("SELECT * FROM snapshots WHERE snapshot_id = ?", (snapshot_id,))
        row = cur.fetchone()
        if not row:
            return None
        return {
            "snapshot_id": row["snapshot_id"],
            "name": row["name"],
            "description": row["description"],
            "created_at": row["created_at"],
            "server_analysis_map": _json_loads(row["server_analysis_map"]) or {},
        }
    finally:
        conn.close()


def snapshot_list() -> list[dict[str, Any]]:
    conn = get_connection()
    try:
        cur = conn.execute("SELECT * FROM snapshots ORDER BY created_at DESC")
        return [
            {
                "snapshot_id": r["snapshot_id"],
                "name": r["name"],
                "description": r["description"],
                "created_at": r["created_at"],
                "server_analysis_map": _json_loads(r["server_analysis_map"]) or {},
            }
            for r in cur.fetchall()
        ]
    finally:
        conn.close()


# --- 보관 기간 정리 (7일 초과 자동 삭제) ---

def cleanup_older_than_days(days: int = 7) -> dict[str, int]:
    """
    7일(또는 지정 일수) 초과 데이터 삭제.
    - analyses: completed_at 기준
    - alerts: created_at 기준
    - snapshots: created_at 기준
    Returns: 테이블별 삭제된 행 수
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    conn = get_connection()
    try:
        cur_a = conn.execute("DELETE FROM analyses WHERE completed_at < ?", (cutoff,))
        deleted_analyses = cur_a.rowcount
        cur_b = conn.execute("DELETE FROM alerts WHERE created_at < ?", (cutoff,))
        deleted_alerts = cur_b.rowcount
        cur_c = conn.execute("DELETE FROM snapshots WHERE created_at < ?", (cutoff,))
        deleted_snapshots = cur_c.rowcount
        conn.commit()
        return {"analyses": deleted_analyses, "alerts": deleted_alerts, "snapshots": deleted_snapshots}
    finally:
        conn.close()
