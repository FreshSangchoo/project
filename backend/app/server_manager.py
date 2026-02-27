from __future__ import annotations

import base64
import json
import logging
import os
import threading
from typing import Any

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from .ssh_client import SSHClient

logger = logging.getLogger(__name__)

_LOCK = threading.Lock()

# 환경변수에서 암호화 키 가져오기 (없으면 기본값, 배포 시 반드시 변경)
_ENCRYPTION_KEY_ENV = "AUTOISMS_ENCRYPTION_KEY"
_DEFAULT_KEY = Fernet.generate_key().decode("ascii")  # 개발용, 배포 시 제거


def _get_encryption_key() -> bytes:
    """암호화 키 가져오기"""
    key_str = os.getenv(_ENCRYPTION_KEY_ENV, _DEFAULT_KEY)
    if len(key_str) < 32:
        # Fernet은 32바이트 필요, PBKDF2로 생성
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"autoisms_salt_2024",
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(key_str.encode("utf-8")))
    else:
        key = key_str.encode("utf-8")[:32]
        key = base64.urlsafe_b64encode(key)
    return key


_cipher = Fernet(_get_encryption_key())


def _encrypt_password(password: str) -> str:
    """패스워드 암호화 (로그에 남지 않도록)"""
    return _cipher.encrypt(password.encode("utf-8")).decode("ascii")


def _decrypt_password(encrypted: str) -> str:
    """패스워드 복호화"""
    return _cipher.decrypt(encrypted.encode("ascii")).decode("utf-8")


def _data_dir() -> str:
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(base, "data")


def _servers_db_path() -> str:
    return os.path.join(_data_dir(), "servers.json")


def _ensure_dirs() -> None:
    os.makedirs(_data_dir(), exist_ok=True)


def _load_servers() -> dict[str, Any]:
    """서버 목록 로드"""
    _ensure_dirs()
    path = _servers_db_path()
    if not os.path.exists(path):
        return {"servers": {}}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_servers(db: dict[str, Any]) -> None:
    """서버 목록 저장"""
    _ensure_dirs()
    path = _servers_db_path()
    tmp = f"{path}.tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def detect_server_type(host: str, port: int, username: str, password: str | None = None, key_file: str | None = None) -> str:
    """
    서버 타입 자동 판별
    Returns: ubuntu, rocky9, rocky10, windows, postgresql
    """
    try:
        with SSHClient(host, port, username, password, key_file) as ssh:
            # Linux 계열 확인
            exit_code, stdout, _ = ssh.execute("uname -s")
            if exit_code == 0 and "Linux" in stdout:
                # /etc/os-release 확인
                exit_code, stdout, _ = ssh.execute("cat /etc/os-release 2>/dev/null || echo ''")
                if "Ubuntu" in stdout:
                    if "22.04" in stdout or "22" in stdout:
                        return "ubuntu"
                elif "Rocky" in stdout or "rocky" in stdout:
                    if "9" in stdout:
                        return "rocky9"
                    elif "10" in stdout:
                        return "rocky10"
                # 기본 Linux
                return "ubuntu"
            elif exit_code == 0 and "Windows" in stdout or "NT" in stdout:
                return "windows"
            else:
                # PostgreSQL은 별도 확인 필요 (일단 ubuntu로)
                return "ubuntu"
    except Exception as e:
        logger.warning(f"Server type detection failed: {e}, defaulting to ubuntu")
        return "ubuntu"


def check_root_privilege(host: str, port: int, username: str, password: str | None = None, key_file: str | None = None) -> dict[str, Any]:
    """
    root 권한 체크
    Returns: {has_root: bool, can_sudo: bool, message: str}
    """
    try:
        with SSHClient(host, port, username, password, key_file) as ssh:
            # 방법 1: 사용자 ID 확인
            exit_code, stdout, stderr = ssh.execute("id -u 2>/dev/null")
            user_id = stdout.strip()
            is_root_by_id = user_id == "0"
            
            # 방법 2: 사용자명 확인
            exit_code, stdout, stderr = ssh.execute("whoami 2>/dev/null || id -un 2>/dev/null")
            current_user = stdout.strip().lower()
            is_root_by_name = current_user == "root"
            
            # 방법 3: 실제 root 권한으로 명령 실행 가능한지 확인
            exit_code, stdout, stderr = ssh.execute("test -w /root 2>/dev/null && echo 'YES' || echo 'NO'")
            can_write_root = "YES" in stdout
            
            # root 권한 확인 (하나라도 true면 root)
            is_root = is_root_by_id or is_root_by_name or can_write_root
            
            # sudo 가능한지 확인 (패스워드 없이)
            exit_code, stdout, stderr = ssh.execute("sudo -n true 2>&1 || echo 'NO_SUDO'")
            can_sudo_nopass = "NO_SUDO" not in stdout
            
            # sudo 가능한지 확인 (패스워드 있으면 가능)
            # sudoers에 등록되어 있는지 확인
            exit_code, stdout, stderr = ssh.execute("sudo -l 2>/dev/null | head -1 || echo 'NO_SUDO'")
            can_sudo = "NO_SUDO" not in stdout and "not allowed" not in stdout.lower()
            
            logger.info(f"권한 체크 결과 - user_id: {user_id}, user: {current_user}, is_root: {is_root}, can_sudo: {can_sudo or can_sudo_nopass}")
            
            if is_root:
                return {"has_root": True, "can_sudo": False, "message": "root 계정으로 접속 가능"}
            elif can_sudo_nopass or can_sudo:
                return {"has_root": False, "can_sudo": True, "message": "sudo 권한 있음"}
            else:
                # 사용자명이 root인데도 체크 실패한 경우
                if username.lower() == "root" or current_user == "root":
                    return {"has_root": True, "can_sudo": False, "message": "root 계정으로 접속 (권한 확인 완료)"}
                return {"has_root": False, "can_sudo": False, "message": "root 권한 없음 (진단은 가능, 조치는 root 권한 필요)"}
    except Exception as e:
        logger.error(f"Root privilege check failed: {e}")
        # 사용자명이 root면 root로 간주
        if username.lower() == "root":
            return {"has_root": True, "can_sudo": False, "message": "root 계정으로 접속 (권한 체크 중 오류 발생)"}
        return {"has_root": False, "can_sudo": False, "message": f"권한 체크 실패: {str(e)}"}


def register_server(
    host: str,
    port: int,
    username: str,
    password: str | None = None,
    key_file: str | None = None,
    name: str | None = None,
) -> dict[str, Any]:
    """
    서버 등록
    - 타입 자동 판별
    - root 권한 체크
    - 암호화하여 저장
    """
    # 연결 테스트
    try:
        with SSHClient(host, port, username, password, key_file) as ssh:
            pass  # 연결 성공
    except Exception as e:
        raise ValueError(f"서버 연결 실패: {str(e)}")

    # 타입 판별
    server_type = detect_server_type(host, port, username, password, key_file)

    # 권한 체크 (경고만 표시, 등록은 허용)
    priv_check = check_root_privilege(host, port, username, password, key_file)
    # root 권한이 없어도 등록은 허용 (진단은 가능하지만 조치는 실패할 수 있음)

    # 서버 정보 저장
    import uuid

    server_id = uuid.uuid4().hex
    server_data = {
        "server_id": server_id,
        "name": name or f"{host}:{port}",
        "host": host,
        "port": port,
        "username": username,
        "password_encrypted": _encrypt_password(password) if password else None,
        "key_file": key_file,  # 키 파일 경로는 평문 저장 (파일 자체는 별도 보관 필요)
        "server_type": server_type,
        "has_root": priv_check["has_root"],
        "can_sudo": priv_check["can_sudo"],
        "privilege_message": priv_check["message"],
    }

    with _LOCK:
        db = _load_servers()
        db["servers"][server_id] = server_data
        _save_servers(db)

    return {
        "server_id": server_id,
        "name": server_data["name"],
        "host": host,
        "port": port,
        "username": username,
        "server_type": server_type,
        "has_root": priv_check["has_root"],
        "can_sudo": priv_check["can_sudo"],
        "privilege_message": priv_check["message"],
    }


def register_server_from_inventory(
    host: str,
    port: int,
    username: str,
    key_file: str | None = None,
    name: str | None = None,
) -> dict[str, Any]:
    """
    inventory에서 추가된 서버를 연결 테스트 없이 등록.
    전체 진단/조치/보고서에 즉시 포함되도록 server_id를 부여.
    진단 실행 시 실제 연결을 시도하고, 실패 시 해당 서버만 failed로 처리.
    """
    import uuid

    with _LOCK:
        db = _load_servers()
        for sid, s in db["servers"].items():
            if s.get("host") == host and s.get("port") == port:
                # inventory의 name/username으로 동기화 (이전 잘못된 저장값 보정)
                s["name"] = name or f"{host}:{port}"
                s["username"] = username
                if key_file is not None:
                    s["key_file"] = key_file
                _save_servers(db)
                return {
                    "server_id": sid,
                    "name": s["name"],
                    "host": host,
                    "port": port,
                    "username": username,
                    "server_type": s.get("server_type", "ubuntu"),
                    "has_root": s.get("has_root", False),
                    "can_sudo": s.get("can_sudo", False),
                    "privilege_message": s.get("privilege_message", "등록 시 미확인"),
                }

        server_id = uuid.uuid4().hex
        server_data = {
            "server_id": server_id,
            "name": name or f"{host}:{port}",
            "host": host,
            "port": port,
            "username": username,
            "password_encrypted": None,
            "key_file": key_file,
            "server_type": "ubuntu",
            "has_root": False,
            "can_sudo": False,
            "privilege_message": "등록 시 미확인 (진단 실행 시 연결 검증)",
        }
        db["servers"][server_id] = server_data
        _save_servers(db)

    return {
        "server_id": server_id,
        "name": server_data["name"],
        "host": host,
        "port": port,
        "username": username,
        "server_type": "ubuntu",
        "has_root": False,
        "can_sudo": False,
        "privilege_message": "등록 시 미확인 (진단 실행 시 연결 검증)",
    }


def get_server(server_id: str) -> dict[str, Any] | None:
    """서버 정보 가져오기 (패스워드 복호화)"""
    with _LOCK:
        db = _load_servers()
        server = db["servers"].get(server_id)
        if not server:
            return None

        # 복호화된 정보 반환 (실제 사용 시에만)
        result = dict(server)
        if result.get("password_encrypted"):
            try:
                result["password"] = _decrypt_password(result["password_encrypted"])
            except Exception as e:
                logger.error(f"패스워드 복호화 실패 (server_id: {server_id}): {e}")
                # 복호화 실패 시 None으로 설정 (키 파일 사용 가능한 경우 계속 진행)
                result["password"] = None
                logger.warning(f"패스워드 복호화 실패로 인해 패스워드 없이 진행합니다. 키 파일이 설정되어 있는지 확인하세요.")
        return result


def update_server_password(server_id: str, password: str | None = None, key_file: str | None = None) -> bool:
    """서버 패스워드 업데이트 (암호화 키 변경 시 사용)"""
    with _LOCK:
        db = _load_servers()
        server = db["servers"].get(server_id)
        if not server:
            return False
        
        # 패스워드 업데이트
        if password:
            server["password_encrypted"] = _encrypt_password(password)
        elif password is None:
            # None이면 암호화된 패스워드 제거
            server.pop("password_encrypted", None)
        
        # 키 파일 업데이트
        if key_file is not None:
            server["key_file"] = key_file
        
        db["servers"][server_id] = server
        _save_servers(db)
        return True


def update_server_from_inventory(
    server_id: str,
    *,
    username: str | None = None,
    name: str | None = None,
    key_file: str | None = None,
) -> bool:
    """inventory 기준으로 server_manager 자격증명/이름 동기화 (check-connections, ansible limit 정합성)"""
    with _LOCK:
        db = _load_servers()
        server = db["servers"].get(server_id)
        if not server:
            return False
        if username is not None:
            server["username"] = username
        if name is not None:
            server["name"] = name
        if key_file is not None:
            server["key_file"] = key_file
        db["servers"][server_id] = server
        _save_servers(db)
        return True


def update_server_privilege(
    server_id: str,
    *,
    has_root: bool,
    can_sudo: bool,
    privilege_message: str,
) -> bool:
    """서버의 root/sudo 권한 정보 갱신 (NOPASSWD 설정 후 연결 확인 시 동기화용)"""
    with _LOCK:
        db = _load_servers()
        server = db["servers"].get(server_id)
        if not server:
            return False
        server["has_root"] = has_root
        server["can_sudo"] = can_sudo
        server["privilege_message"] = privilege_message
        db["servers"][server_id] = server
        _save_servers(db)
        return True


def list_servers() -> list[dict[str, Any]]:
    """서버 목록 (패스워드 제외)"""
    with _LOCK:
        db = _load_servers()
        servers = []
        for server_id, server in db["servers"].items():
            s = {
                "server_id": server_id,
                "name": server["name"],
                "host": server["host"],
                "port": server["port"],
                "username": server["username"],
                "server_type": server["server_type"],
                "has_root": server["has_root"],
                "can_sudo": server["can_sudo"],
                "privilege_message": server["privilege_message"],
            }
            servers.append(s)
        return servers


def delete_server(server_id: str) -> bool:
    """서버 삭제"""
    with _LOCK:
        db = _load_servers()
        if server_id in db["servers"]:
            del db["servers"][server_id]
            _save_servers(db)
            return True
        return False
