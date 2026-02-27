from __future__ import annotations

import logging
from typing import Any

import paramiko

logger = logging.getLogger(__name__)


class SSHClient:
    """SSH 연결 및 명령 실행 클라이언트"""

    def __init__(self, host: str, port: int, username: str, password: str | None = None, key_file: str | None = None):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.key_file = key_file
        self.client: paramiko.SSHClient | None = None

    def connect(self) -> None:
        """SSH 연결"""
        self.client = paramiko.SSHClient()
        self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        try:
            if self.key_file:
                # 키 파일 사용
                key = paramiko.RSAKey.from_private_key_file(self.key_file)
                self.client.connect(
                    hostname=self.host,
                    port=self.port,
                    username=self.username,
                    pkey=key,
                    timeout=30,  # 30초로 증가
                    allow_agent=False,
                    look_for_keys=False,
                )
            elif self.password:
                # 패스워드 사용
                self.client.connect(
                    hostname=self.host,
                    port=self.port,
                    username=self.username,
                    password=self.password,
                    timeout=30,  # 30초로 증가
                    allow_agent=False,
                    look_for_keys=False,
                )
            else:
                raise ValueError("password or key_file required")
        except paramiko.AuthenticationException as e:
            error_detail = str(e)
            logger.error(f"SSH authentication failed {self.host}:{self.port} (user={self.username}): {error_detail}")
            # 취약점 삽입 스크립트 실행 후 /etc/passwd 권한 문제로 인한 인증 실패 가능성
            if "permission denied" in error_detail.lower() or "authentication failed" in error_detail.lower():
                raise ValueError(f"인증 실패: 사용자명 또는 인증 정보가 올바르지 않습니다. (취약점 삽입 스크립트 실행 후 /etc/passwd 권한 문제일 수 있음)")
            raise ValueError(f"인증 실패: 사용자명 또는 패스워드가 올바르지 않습니다")
        except paramiko.SSHException as e:
            error_detail = str(e)
            logger.error(f"SSH connection error {self.host}:{self.port}: {error_detail}")
            raise ValueError(f"SSH 연결 오류: {error_detail}")
        except Exception as e:
            error_msg = str(e)
            error_type = type(e).__name__
            logger.error(f"SSH connection failed {self.host}:{self.port} (type={error_type}): {error_msg}")
            if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                raise ValueError(f"연결 타임아웃: {self.host}:{self.port}에 연결할 수 없습니다. 방화벽이나 네트워크 설정을 확인하세요.")
            raise ValueError(f"서버 연결 실패 ({error_type}): {error_msg}")

    def execute(self, command: str) -> tuple[int, str, str]:
        """
        명령 실행
        Returns: (exit_code, stdout, stderr)
        """
        if not self.client:
            raise RuntimeError("Not connected. Call connect() first.")

        try:
            stdin, stdout, stderr = self.client.exec_command(command, timeout=30)
            exit_code = stdout.channel.recv_exit_status()
            stdout_text = stdout.read().decode("utf-8", errors="replace")
            stderr_text = stderr.read().decode("utf-8", errors="replace")
            return exit_code, stdout_text, stderr_text
        except Exception as e:
            error_msg = str(e)
            if "timeout" in error_msg.lower():
                raise RuntimeError(f"명령 실행 타임아웃: {command[:50]}...")
            logger.error(f"Command execution failed: {command[:50]}... Error: {e}")
            raise

    def put_text(self, remote_path: str, text: str, chmod: int | None = None) -> None:
        """원격 파일에 텍스트 업로드(SFTP)."""
        self.put_bytes(remote_path, text.encode("utf-8"), chmod=chmod)

    def put_bytes(self, remote_path: str, data: bytes, chmod: int | None = None) -> None:
        """원격 파일에 바이너리 업로드(SFTP)."""
        if not self.client:
            raise RuntimeError("Not connected. Call connect() first.")
        sftp = None
        try:
            sftp = self.client.open_sftp()
            with sftp.file(remote_path, "wb") as f:
                f.write(data)
            if chmod is not None:
                sftp.chmod(remote_path, chmod)
        finally:
            try:
                if sftp is not None:
                    sftp.close()
            except Exception:
                pass

    def close(self) -> None:
        """연결 종료"""
        if self.client:
            self.client.close()
            self.client = None

    def __enter__(self) -> SSHClient:
        self.connect()
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.close()
