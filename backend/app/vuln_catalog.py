from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CatalogVuln:
    code: str
    name: str
    severity: str  # high, medium, low
    category: str  # 카테고리명
    compliance: list[str]


CATALOG: list[CatalogVuln] = [

    # =========================
    # 1. 계정 관리
    # =========================
    CatalogVuln("U-01", "root 계정 원격 접속 제한", "high", "계정 관리", ["ISMS-P 2.8.2"]),
    CatalogVuln("U-02", "비밀번호 관리정책 설정", "high", "계정 관리", ["ISMS-P 2.8.1"]),
    CatalogVuln("U-03", "계정 잠금 임계값 설정", "high", "계정 관리", ["ISMS-P 2.8.3"]),
    CatalogVuln("U-04", "비밀번호 파일 보호", "high", "계정 관리", ["ISMS-P 2.8.2"]),
    CatalogVuln("U-05", "root 이외 UID 0 금지", "high", "계정 관리", ["ISMS-P 2.8.2"]),
    CatalogVuln("U-06", "사용자 계정 su 기능 제한", "high", "계정 관리", ["ISMS-P 2.8.4"]),
    CatalogVuln("U-07", "불필요한 계정 제거", "low", "계정 관리", ["ISMS-P 2.8.1"]),
    CatalogVuln("U-08", "관리자 그룹 최소 계정 포함", "medium", "계정 관리", ["ISMS-P 2.8.2"]),
    CatalogVuln("U-09", "계정이 존재하지 않는 GID 금지", "low", "계정 관리", ["ISMS-P 2.8.2"]),
    CatalogVuln("U-10", "동일한 UID 금지", "medium", "계정 관리", ["ISMS-P 2.8.2"]),
    CatalogVuln("U-11", "사용자 Shell 점검", "low", "계정 관리", ["ISMS-P 2.8.2"]),
    CatalogVuln("U-12", "세션 종료 시간 설정", "low", "계정 관리", ["ISMS-P 2.8.4"]),
    CatalogVuln("U-13", "안전한 비밀번호 암호화 알고리즘 사용", "medium", "계정 관리", ["ISMS-P 2.8.1"]),

    # =========================
    # 2. 파일 및 디렉터리 관리
    # =========================
    CatalogVuln("U-14", "root 홈 디렉터리 권한 및 PATH 설정", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-15", "파일 및 디렉터리 소유자 설정", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-16", "/etc/passwd 파일 소유자 및 권한 설정", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-17", "시스템 시작 스크립트 권한 설정", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-18", "/etc/shadow 파일 소유자 및 권한 설정", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-19", "/etc/hosts 파일 소유자 및 권한 설정", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-20", "/etc/(x)inetd.conf 권한 설정", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-21", "/etc/(r)syslog.conf 권한 설정", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-22", "/etc/services 권한 설정", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-23", "SUID/SGID/Sticky bit 설정 점검", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-24", "환경변수 파일 권한 설정", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-25", "world writable 파일 점검", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-26", "/dev 불필요 device 파일 점검", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-27", ".rhosts, hosts.equiv 사용 금지", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-28", "접속 IP 및 포트 제한", "high", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-29", "hosts.lpd 권한 설정", "low", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-30", "UMASK 설정 관리", "medium", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-31", "홈 디렉터리 권한 설정", "medium", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-32", "홈 디렉터리 존재 여부 점검", "medium", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),
    CatalogVuln("U-33", "숨겨진 파일 및 디렉터리 점검", "low", "파일 및 디렉터리 관리", ["ISMS-P 2.9.2"]),

    # =========================
    # 3. 서비스 관리
    # =========================
    CatalogVuln("U-34", "Finger 서비스 비활성화", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-35", "공유 서비스 익명 접근 제한", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-36", "r 계열 서비스 비활성화", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-37", "crontab 권한 설정", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-38", "DoS 취약 서비스 비활성화", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-39", "불필요한 NFS 서비스 비활성화", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-40", "NFS 접근 통제", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-41", "automountd 제거", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-42", "불필요한 RPC 서비스 비활성화", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-43", "NIS/NIS+ 점검", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-44", "tftp, talk 서비스 비활성화", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-45", "메일 서비스 버전 점검", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-46", "일반 사용자 메일 서비스 실행 방지", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-47", "스팸 메일 릴레이 제한", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-48", "expn, vrfy 명령어 제한", "medium", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-49", "DNS 보안 패치", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-50", "DNS Zone Transfer 설정", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-51", "DNS 동적 업데이트 설정 금지", "medium", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-52", "Telnet 서비스 비활성화", "medium", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-53", "FTP 정보 노출 제한", "low", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-54", "비암호화 FTP 비활성화", "medium", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-55", "FTP 계정 Shell 제한", "medium", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-56", "FTP 접근 제어 설정", "low", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-57", "ftpusers 파일 설정", "medium", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-58", "SNMP 서비스 구동 점검", "medium", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-59", "안전한 SNMP 버전 사용", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-60", "SNMP Community String 복잡성", "medium", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-61", "SNMP Access Control 설정", "high", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-62", "로그인 경고 메시지 설정", "low", "서비스 관리", ["ISMS-P 2.9.3"]),
    CatalogVuln("U-63", "sudo 명령어 접근 관리", "medium", "서비스 관리", ["ISMS-P 2.9.3"]),

    # =========================
    # 4. 패치 관리
    # =========================
    CatalogVuln("U-64", "주기적 보안 패치 적용", "high", "패치 관리", ["ISMS-P 2.10.2"]),

    # =========================
    # 5. 로그 관리
    # =========================
    CatalogVuln("U-65", "NTP 시각 동기화 설정", "medium", "로그 관리", ["ISMS-P 2.10.1"]),
    CatalogVuln("U-66", "정책 기반 시스템 로깅 설정", "medium", "로그 관리", ["ISMS-P 2.10.1"]),
    CatalogVuln("U-67", "로그 디렉터리 권한 설정", "medium", "로그 관리", ["ISMS-P 2.10.1"]),
]


# 조치 스크립트가 비어 있거나 수동 조치 전용인 항목 (양호로 간주하지 않고 "수동 조치 필요"로 표시)
# U-16, U-17, U-18은 점검 대상 파일 없을 때만 수동 → 스크립트 실행 허용
MANUAL_REMEDIATION_CODES: frozenset[str] = frozenset({
    "U-03", "U-04", "U-05", "U-06", "U-07", "U-08", "U-09",
    "U-13", "U-19", "U-23", "U-25", "U-28", "U-33", "U-37",
    "U-42", "U-49", "U-56", "U-63", "U-64", "U-65",
})


def get_catalog() -> list[CatalogVuln]:
    return list(CATALOG)


def find_by_code(code: str) -> CatalogVuln | None:
    code_upper = code.strip().upper()
    for v in CATALOG:
        if v.code == code_upper:
            return v
    return None


def requires_manual_remediation(code: str) -> bool:
    """해당 취약점 코드가 자동 조치 스크립트 없이 수동 조치만 가능한지 여부."""
    return (code or "").strip().upper() in MANUAL_REMEDIATION_CODES

