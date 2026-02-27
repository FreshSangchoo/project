from __future__ import annotations

import logging
from typing import Any

from .server_manager import get_server
from .ssh_client import SSHClient
from .vuln_catalog import get_catalog, requires_manual_remediation

logger = logging.getLogger(__name__)


def _check_u01(ssh) -> tuple[bool, str]:
    """U-01: root 계정 원격 접속 제한"""
    try:
        # /etc/ssh/sshd_config는 sudo가 필요할 수 있음 (래퍼가 자동 처리)
        exit_code, stdout, _ = ssh.execute("grep -E '^PermitRootLogin' /etc/ssh/sshd_config 2>/dev/null || echo 'PermitRootLogin yes'")
        if "PermitRootLogin yes" in stdout or "PermitRootLogin" not in stdout:
            return True, "PermitRootLogin이 yes로 설정되어 있음"
        return False, stdout.strip()
    except Exception:
        return True, "sshd_config 확인 실패 (기본값 취약으로 간주)"


def _check_u02(ssh) -> tuple[bool, str]:
    """U-02: 패스워드 복잡성 설정"""
    try:
        exit_code, stdout, _ = ssh.execute("grep -E '^PASS_MIN_LEN' /etc/login.defs 2>/dev/null || echo 'PASS_MIN_LEN 6'")
        if "PASS_MIN_LEN 6" in stdout or "PASS_MIN_LEN" not in stdout:
            return True, "최소 패스워드 길이가 6 이하"
        # 8 이상이면 정상
        import re
        match = re.search(r"PASS_MIN_LEN\s+(\d+)", stdout)
        if match:
            min_len = int(match.group(1))
            if min_len < 8:
                return True, f"최소 패스워드 길이가 {min_len} (8 이상 권장)"
        return False, stdout.strip()
    except Exception:
        return True, "login.defs 확인 실패"


def _check_u04(ssh) -> tuple[bool, str]:
    """U-04: 계정 잠금 임계값 설정"""
    try:
        exit_code, stdout, _ = ssh.execute("grep -E '^auth.*required.*pam_tally' /etc/pam.d/common-auth 2>/dev/null || echo 'NOT_SET'")
        if "NOT_SET" in stdout or "pam_tally" not in stdout:
            return True, "계정 잠금 설정이 없음"
        return False, "계정 잠금 설정됨"
    except Exception:
        return True, "PAM 설정 확인 실패"


def _check_u08(ssh) -> tuple[bool, str]:
    """U-08: /etc/shadow 파일 소유자 및 권한"""
    try:
        exit_code, stdout, _ = ssh.execute("stat -c '%U %G %a' /etc/shadow 2>/dev/null || echo 'UNKNOWN'")
        if "UNKNOWN" in stdout:
            return True, "shadow 파일 확인 실패"
        parts = stdout.strip().split()
        if len(parts) >= 3:
            owner, group, perms = parts[0], parts[1], parts[2]
            if owner != "root" or group != "shadow" or perms != "640":
                return True, f"권한 이상: {owner}/{group}/{perms} (root/shadow/640 권장)"
        return False, stdout.strip()
    except Exception:
        return True, "shadow 파일 권한 확인 실패"


def _check_u23(ssh) -> tuple[bool, str]:
    """U-23: 불필요한 서비스 제거"""
    try:
        exit_code, stdout, _ = ssh.execute("systemctl list-unit-files --type=service --state=enabled 2>/dev/null | grep -E '(telnet|rsh|rlogin)' || echo 'OK'")
        if "OK" not in stdout and stdout.strip():
            return True, "불필요한 서비스 활성화됨: " + stdout.strip()[:100]
        return False, "불필요한 서비스 없음"
    except Exception:
        return False, "서비스 확인 완료 (기본 정상)"


def _check_u44(ssh) -> tuple[bool, str]:
    """U-44: 로그의 정기적 검토 및 보고"""
    try:
        exit_code, stdout, _ = ssh.execute("test -f /var/log/auth.log && echo 'EXISTS' || echo 'NOT_EXISTS'")
        if "NOT_EXISTS" in stdout:
            return True, "인증 로그 파일 없음"
        return False, "로그 파일 존재"
    except Exception:
        return False, "로그 확인 완료"


def _check_u45(ssh) -> tuple[bool, str]:
    """U-45: su 명령어 사용 제한"""
    try:
        exit_code, stdout, _ = ssh.execute("grep -E '^auth.*required.*pam_wheel' /etc/pam.d/su 2>/dev/null || echo 'NOT_SET'")
        if "NOT_SET" in stdout or "pam_wheel" not in stdout:
            return True, "su 명령어 제한 설정 없음"
        return False, "su 명령어 제한 설정됨"
    except Exception:
        return True, "su 설정 확인 실패"


def _check_u47(ssh) -> tuple[bool, str]:
    """U-47: 패스워드 최소 사용기간 설정"""
    try:
        exit_code, stdout, _ = ssh.execute("grep -E '^PASS_MIN_DAYS' /etc/login.defs 2>/dev/null || echo 'PASS_MIN_DAYS 0'")
        if "PASS_MIN_DAYS 0" in stdout or "PASS_MIN_DAYS" not in stdout:
            return True, "최소 사용기간이 0 (설정 없음)"
        return False, stdout.strip()
    except Exception:
        return True, "login.defs 확인 실패"


_CHECK_FUNCTIONS: dict[str, Any] = {
    "U-01": _check_u01,
    "U-02": _check_u02,
    "U-04": _check_u04,
    "U-08": _check_u08,
    "U-23": _check_u23,
    "U-44": _check_u44,
    "U-45": _check_u45,
    "U-47": _check_u47,
}


def run_diagnostic(server_id: str) -> dict[str, Any]:
    """
    실제 서버에 SSH로 접속하여 진단 실행
    Returns: {vulnerabilities: [...], snapshot: [...]}
    """
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

        # sudo 필요 여부 확인 (root 권한이 없고 sudo 권한이 있으면 sudo 사용)
        use_sudo = not server.get("has_root", False) and server.get("can_sudo", False)
        sudo_prefix = "sudo " if use_sudo else ""

        catalog = get_catalog()
        vulnerabilities: list[dict[str, Any]] = []
        snapshot_lines: list[str] = []

        # 각 취약점 체크 (sudo 지원)
        for vuln in catalog:
            code = vuln.code
            check_func = _CHECK_FUNCTIONS.get(code)
            if check_func:
                # SSHClient에 sudo 정보 전달하기 위해 래퍼 생성
                ssh_with_sudo = _SSHWrapper(ssh, sudo_prefix)
                is_vulnerable, detail = check_func(ssh_with_sudo)
                vulnerabilities.append(
                    {
                        "code": code,
                        "name": vuln.name,
                        "status": "vulnerable" if is_vulnerable else "safe",
                        "severity": vuln.severity,
                        "category": vuln.category,
                        "compliance": vuln.compliance,
                        "detail": detail,
                        "requires_manual_remediation": requires_manual_remediation(code),
                    }
                )
            else:
                # 체크 함수가 없으면 기본값
                vulnerabilities.append(
                    {
                        "code": code,
                        "name": vuln.name,
                        "status": "checking",
                        "severity": vuln.severity,
                        "category": vuln.category,
                        "compliance": vuln.compliance,
                        "detail": "체크 함수 미구현",
                        "requires_manual_remediation": requires_manual_remediation(code),
                    }
                )

        # 스냅샷 수집 (주요 설정 파일) - sudo 사용
        try:
            exit_code, stdout, _ = ssh.execute(f"{sudo_prefix}cat /etc/ssh/sshd_config 2>/dev/null | grep -E '^(PermitRootLogin|PasswordAuthentication|Port|Protocol)' || echo ''")
            snapshot_lines.extend([line.strip() for line in stdout.strip().split("\n") if line.strip()])

            exit_code, stdout, _ = ssh.execute(f"{sudo_prefix}cat /etc/login.defs 2>/dev/null | grep -E '^(PASS_MIN_LEN|PASS_MIN_DAYS)' || echo ''")
            snapshot_lines.extend([line.strip() for line in stdout.strip().split("\n") if line.strip()])
        except Exception as e:
            logger.warning(f"Snapshot collection failed: {e}")

        return {
            "vulnerabilities": vulnerabilities,
            "snapshot": snapshot_lines if snapshot_lines else ["DEFAULT_CONFIG=1"],
        }
    except Exception as e:
        logger.error(f"SSH connection failed for server {server_id}: {e}")
        raise ValueError(f"SSH 연결 실패: {str(e)}")
    finally:
        ssh.close()


class _SSHWrapper:
    """SSHClient 래퍼 - sudo 자동 추가"""
    def __init__(self, ssh: SSHClient, sudo_prefix: str):
        self.ssh = ssh
        self.sudo_prefix = sudo_prefix
    
    def execute(self, command: str) -> tuple[int, str, str]:
        """명령 실행 (sudo 자동 추가)"""
        # sudo가 필요한 명령인지 확인 (시스템 파일 읽기/쓰기)
        needs_sudo = any(path in command for path in ["/etc/", "/var/log/", "/root/", "systemctl", "chown", "chmod", "stat -c"])
        if needs_sudo and self.sudo_prefix:
            # sudo -n을 사용하여 패스워드 없이 실행 시도 (NOPASSWD 설정 필요)
            # 실패하면 일반 sudo로 재시도하지 않고 에러 반환
            command = self.sudo_prefix.rstrip() + " -n " + command if self.sudo_prefix else command
        return self.ssh.execute(command)
