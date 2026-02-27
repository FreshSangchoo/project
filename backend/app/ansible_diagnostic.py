from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from .ansible_runner import AnsibleRunner
from .inventory_parser import InventoryParser
from .server_manager import get_server
from .vuln_catalog import find_by_code, requires_manual_remediation

logger = logging.getLogger(__name__)


def _hostname_from_inventory(host: str, port: int) -> str | None:
    """inventory에서 host:port에 해당하는 Ansible 호스트명 반환. limit/result 경로에 사용."""
    try:
        parser = InventoryParser()
        for inv_hostname, vars_dict in parser.parse().items():
            inv_ip = vars_dict.get("ansible_host") or vars_dict.get("ansible_hostname") or inv_hostname
            inv_port = int(vars_dict.get("ansible_port", 22))
            if inv_ip == host and inv_port == port:
                return inv_hostname
    except Exception:
        pass
    return None


def run_diagnostic_with_ansible(server_id: str, use_script: bool = False) -> dict[str, Any]:
    """Ansible으로 진단 실행. 매 실행마다 analysis_results/<host>/<YYYYMMDD_HHMMSS>/result.json 에 저장."""
    print(f"[ANSIBLE] run_diagnostic_with_ansible 시작: server_id={server_id}")
    server = get_server(server_id)
    if not server:
        raise ValueError(f"서버를 찾을 수 없습니다: {server_id}")

    runner = AnsibleRunner()
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    ansible_dir = BASE_DIR / "ansible"
    inventory_path = str(ansible_dir / "inventory.yaml" if (ansible_dir / "inventory.yaml").exists() else ansible_dir / "inventory.ini")
    results_dir = (BASE_DIR / "analysis_results").resolve()
    results_dest_base = str(results_dir)
    script_path = BASE_DIR / "script" / "analysis_script" / "all.sh"
    if not script_path.exists():
        raise ValueError(f"all.sh를 찾을 수 없습니다: {script_path}")

    # inventory 기준 호스트명 사용 (server_manager.name은 이전 등록 시 잘못될 수 있음)
    host = server.get("host", "")
    port = int(server.get("port", 22))
    host_name = _hostname_from_inventory(host, port) or server.get("name") or host or "unknown"
    # 진단 실행마다 다른 폴더에 저장 (덮어쓰지 않음)
    run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    (results_dir / host_name / run_id).mkdir(parents=True, exist_ok=True)

    # NOPASSWD 전제: become 비밀번호를 넘기지 않음. ansible_runner에서 빈 문자열로 설정해 프롬프트 없이 sudo만 사용.
    result = runner.run_script_via_ansible(
        script_path=str(script_path),
        inventory_path=inventory_path,
        limit=host_name,
        become=True,
        results_dest_base=results_dest_base,
        result_run_id=run_id,
        become_password=None,
    )

    fetched_path = Path(results_dest_base) / host_name / run_id / "result.json"
    if not fetched_path.exists():
        logger.warning("result.json이 메인 서버에 없음 (fetch 실패 가능): %s", fetched_path)
    vulnerabilities = _parse_result_json_file(fetched_path)
    if not vulnerabilities:
        vulnerabilities = _parse_ansible_result(result, use_script)

    if not result["success"] and not vulnerabilities:
        raise ValueError(f"Ansible 실행 실패: {result['output']}")

    snapshot = _extract_snapshot(result)
    return {"vulnerabilities": vulnerabilities, "snapshot": snapshot}


def _sanitize_json_string(s: str) -> str:
    """script.sh 출력 JSON 내부의 잘못된 이스케이프 및 제어문자 보정.

    script.sh가 셸 명령어를 JSON 문자열에 넣을 때 백슬래시를 이중 이스케이프하지
    않는 경우가 있다(예: ``grep '^lp:\\|^uucp:' …`` → ``\\|`` 가 아닌 ``\\|``).
    JSON 표준에서 유효한 이스케이프는 ``\\\\ \" \\/ \\b \\f \\n \\r \\t \\uXXXX``
    뿐이므로, 그 외의 ``\\X`` 시퀀스를 ``\\\\X`` 로 변환한 뒤 제어문자를 제거한다.
    """
    # 1) 유효하지 않은 \X 이스케이프를 \\X 로 보정 (문자열 값 내부)
    #    유효한 이스케이프 문자: " \ / b f n r t u
    s = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', s)
    
    # 2) JSON 문자열 값 내부의 실제 제어문자(이스케이프되지 않은) 처리
    #    JSON 파서는 문자열 값 내부의 제어문자(0x00-0x1f)를 허용하지 않음
    #    이를 적절한 이스케이프 시퀀스로 변환
    def process_string_content(match):
        """문자열 값 내부 처리"""
        content = match.group(1)
        result = []
        i = 0
        while i < len(content):
            if content[i] == '\\':
                # 이스케이프 시퀀스 처리
                if i + 1 < len(content):
                    esc_char = content[i + 1]
                    # 유효한 이스케이프 문자면 그대로 유지
                    if esc_char in '"\\/bfnrtu':
                        result.append(content[i:i+2])
                        i += 2
                        continue
                    elif esc_char == 'u' and i + 5 < len(content):
                        # \uXXXX 형태
                        result.append(content[i:i+6])
                        i += 6
                        continue
                    else:
                        # 잘못된 이스케이프는 백슬래시 이중화
                        result.append('\\\\' + esc_char)
                        i += 2
                        continue
            # 제어문자 처리 (이스케이프되지 않은 실제 제어문자)
            if ord(content[i]) < 32:
                # \n, \r, \t는 이스케이프 시퀀스로 변환
                if content[i] == '\n':
                    result.append('\\n')
                elif content[i] == '\r':
                    result.append('\\r')
                elif content[i] == '\t':
                    result.append('\\t')
                else:
                    # 그 외 제어문자는 공백으로
                    result.append(' ')
            else:
                result.append(content[i])
            i += 1
        return '"' + ''.join(result) + '"'
    
    # JSON 문자열 값 패턴 매칭 및 처리
    # 패턴: "..." (이스케이프된 따옴표와 백슬래시 고려)
    s = re.sub(r'"((?:[^"\\]|\\.)*)"', process_string_content, s)
    return s


def _repair_json_syntax(raw: str) -> str:
    """result.json의 흔한 문법 오류 수정 (script.sh 출력 버그 대응)."""
    # },,{ 또는 }, , { 형태의 연속 콤마를 },{ 로 수정 (배열 내 객체 사이)
    raw = re.sub(r"\}\s*,\s*,\s*\{", "},{", raw)
    # }],\n{ - 조기 배열 종료 수정 (], 를 제거하여 }, 로)
    raw = re.sub(r"\}\s*\]\s*,\s*\{\s*\n\s*\"check_id\"", r'},\n{\n  "check_id"', raw)
    # }\n{ "check_id" - 배열 내 객체 사이 누락 콤마 (객체 시작 패턴으로 한정)
    raw = re.sub(r'\}\s*\n\s*\{\s*\n\s*"check_id"', r'},\n{\n  "check_id"', raw)
    # U-28 세부내용 내 잘못된 \} (백슬래시+닫는중괄호) → \" (올바른 문자열 종료)
    # 예: "규칙 없음\"},{" → "규칙 없음"},{"
    raw = raw.replace('규칙 없음\\},{', '규칙 없음"},{')
    # U-22 등에서 잘못 생성된 따옴표 패턴 보정:
    #   "current_value": "소유자(\"\") 또는 권한(\"\") 부적절"
    #   "세부내용":"취약: 소유자가 \"\" 입니다. ..."
    #   "전체내용":"\"\"\""
    # JSON 구조를 깨뜨리는 내부 따옴표들을 안전한 문자열로 치환
    raw = raw.replace('소유자("") 또는 권한("") 부적절', '소유자() 또는 권한() 부적절')
    raw = raw.replace('소유자가 "" 입니다.', '소유자가 (정보 없음) 입니다.')
    raw = raw.replace('\"\"\"\"', '""')
    # U-35 등에서 배너 파일 내용이 JSON 문자열을 깨뜨리는 경우:
    #   "전체내용":"not runni"#########################################################################
    #   → "전체내용":"not runni\n#########################################################################"
    # "전체내용":"..." 다음에 따옴표 없이 #나 줄바꿈이 오는 경우 수정
    # 패턴: "전체내용":"...문자열"# 또는 "전체내용":"...문자열"\n#
    raw = re.sub(r'("전체내용":"[^"]*?)"([#\n])', r'\1\\n\2', raw)
    # 더 일반적인 패턴: 문자열 값이 닫히지 않고 특수문자로 이어지는 경우
    # "key":"value"# 형태를 "key":"value\n#" 로 수정 (단, 이미 올바른 JSON은 건드리지 않음)
    # 주의: 이 패턴은 "전체내용" 키에만 적용 (다른 키는 건드리지 않음)
    return raw


def _parse_result_json_file(path: Path) -> list[dict[str, Any]]:
    vulnerabilities: list[dict[str, Any]] = []
    if not path.exists():
        return vulnerabilities
    try:
        with open(path, "r", encoding="utf-8") as f:
            raw = f.read()
        raw = _repair_json_syntax(raw)  # 구조적 오류 먼저 수정 (개행 유지)
        raw = _sanitize_json_string(raw)
        items = json.loads(raw)
    except (json.JSONDecodeError, OSError) as e:
        logger.error("result.json 읽기/파싱 실패: %s - %s", path, e)
        return vulnerabilities
    if not isinstance(items, list):
        return vulnerabilities
    # check_id별 중복 제거 (동일 코드가 script.sh에서 여러 번 출력되는 경우)
    by_code: dict[str, dict[str, Any]] = {}
    for item in items:
        check_id = item.get("check_id", "")
        cat = find_by_code(check_id)
        status_raw = (item.get("status") or "SAFE").upper()
        details_raw = item.get("details")
        details_list = details_raw if isinstance(details_raw, list) else ([details_raw] if details_raw else [])

        # 원본 status를 그대로 보존: SAFE / VULNERABLE / MANUAL
        if status_raw == "VULNERABLE":
            mapped_status = "vulnerable"
        elif status_raw == "MANUAL":
            mapped_status = "manual"
        else:
            mapped_status = "safe"

        # MANUAL 또는 카탈로그 상 수동조치 항목은 별도 플래그로 표시
        is_manual = mapped_status == "manual" or requires_manual_remediation(check_id)

        by_code[check_id] = {
            "code": check_id,
            "name": item.get("description", cat.name if cat else check_id),
            "status": mapped_status,
            "severity": cat.severity if cat else "medium",
            "category": item.get("category", cat.category if cat else "기타"),
            "compliance": cat.compliance if cat else [],
            "current_value": item.get("current_value") or "",
            "expected_value": item.get("expected_value") or "",
            "details": [str(line).strip() for line in details_list if line],
            "requires_manual_remediation": is_manual,
            "os_type": item.get("os_type"),
            "os_version": item.get("os_version"),
        }
    vulnerabilities = list(by_code.values())
    logger.info("result.json 파싱 성공: %s → %d개 취약점 (중복 제거 후)", path, len(vulnerabilities))
    print(f"[ANSIBLE] result.json 파싱 성공: {path} → {len(vulnerabilities)}개 취약점")
    return vulnerabilities


def _parse_ansible_result(result: dict[str, Any], use_script: bool) -> list[dict[str, Any]]:
    vulnerabilities: list[dict[str, Any]] = []
    output = result.get("output", "")
    if not use_script:
        vulnerabilities.append({
            "code": "PLAYBOOK", "name": "Playbook Diagnostic", "status": "safe",
            "severity": "low", "category": "기타", "compliance": [],
            "current_value": "", "expected_value": "", "details": [],
        })
        return vulnerabilities
    start_marker, end_marker = "###AUTOISMS_JSON_START###", "###AUTOISMS_JSON_END###"
    start_idx, end_idx = output.find(start_marker), output.find(end_marker)
    if start_idx != -1 and end_idx != -1:
        try:
            json_str = output[start_idx + len(start_marker):end_idx].strip()
            for item in json.loads(json_str):
                check_id = item.get("check_id", "")
                cat = find_by_code(check_id)
                status_raw = (item.get("status") or "SAFE").upper()
                details_raw = item.get("details")
                details_list = details_raw if isinstance(details_raw, list) else ([details_raw] if details_raw else [])

                if status_raw == "VULNERABLE":
                    mapped_status = "vulnerable"
                elif status_raw == "MANUAL":
                    mapped_status = "manual"
                else:
                    mapped_status = "safe"

                is_manual = mapped_status == "manual" or requires_manual_remediation(check_id)

                vulnerabilities.append({
                    "code": check_id,
                    "name": item.get("description", cat.name if cat else check_id),
                    "status": mapped_status,
                    "severity": cat.severity if cat else "medium",
                    "category": item.get("category", cat.category if cat else "기타"),
                    "compliance": cat.compliance if cat else [],
                    "current_value": item.get("current_value") or "",
                    "expected_value": item.get("expected_value") or "",
                    "details": [str(line).strip() for line in details_list if line],
                    "requires_manual_remediation": is_manual,
                })
        except json.JSONDecodeError:
            pass
    # 더미 데이터 생성 로직 제거: JSON 파싱 실패 시 빈 리스트 반환
    # 이전에는 fallback으로 더미 데이터를 생성했지만, 이는 잘못된 결과를 반환할 수 있음
    # JSON 파싱이 실패하면 실제 데이터가 없으므로 빈 리스트를 반환하는 것이 올바름
    if not vulnerabilities:
        logger.warning("JSON 파싱 실패로 인해 취약점 데이터를 추출할 수 없습니다. result.json 파일을 확인하세요.")
    return vulnerabilities


def _extract_snapshot(result: dict[str, Any]) -> list[str]:
    output = result.get("output", "")
    if "PermitRootLogin" in output:
        return ["PermitRootLogin extracted"]
    return ["ANSIBLE_EXECUTION=1"]