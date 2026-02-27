# AUTOISMS Scripts

KISA 취약점 진단 및 조치를 수행하는 Bash 스크립트 모음입니다.

---

## 목차

- [디렉터리 구조](#디렉터리-구조)
- [진단 스크립트](#진단-스크립트)
- [조치 스크립트](#조치-스크립트)
- [출력 형식](#출력-형식)

---

## 디렉터리 구조

```
script/
├── analysis_script/        # 진단 스크립트
│   ├── all.sh              # 전체 진단 통합 스크립트
│   ├── u01.sh ~ u67.sh     # 취약점별 진단
│   └── ...
│
└── remediation_script/     # 조치 스크립트
    ├── remediation_common.sh  # 공통 함수 (JSON 출력, OS 감지 등)
    ├── u01.sh ~ u67.sh     # 취약점별 조치
    └── ...
```

---

## 진단 스크립트

### all.sh

- 전체 취약점(U-01 ~ U-67)을 한 번에 진단합니다.
- 백엔드 `diagnostic_engine`은 개별 `uNN.sh` 또는 `all.sh`를 원격 실행하고 결과를 수집합니다.

### uNN.sh (u01.sh ~ u67.sh)

- 각 스크립트는 KISA 가이드의 해당 항목만 진단합니다.
- `result.json` 형식으로 결과를 출력합니다.

### 출력 (result.json)

```json
[
  {
    "check_id": "U-01",
    "status": "safe",
    "current_value": "...",
    "expected_value": "...",
    "details": { ... }
  }
]
```

- `status`: `safe`, `vulnerable`, `manual`, `checking`
- 공통 함수: `Write_JSON_Result`, `Add_Detail_Item`, `Build_Details_JSON`

---

## 조치 스크립트

### remediation_common.sh

- 공통 헤더: `json_escape`, `generate_json_output`, `normalize_prepost_value` 등
- 대상 OS: Rocky Linux 9.7/10.1, Ubuntu 22.04/24.04/25.04

### uNN.sh (u01.sh ~ u67.sh)

- 각 스크립트는 해당 취약점을 수정합니다.
- `remediation_common.sh`를 `source`로 로드합니다.
- 조치 전 설정 파일 자동 백업 (`BACKUP_BASE`).

### 출력 (remediation_result.json)

```json
{
  "results": [
    {
      "check_id": "U-01",
      "status": "SAFE",
      "pre_value": "...",
      "post_value": "...",
      "details": { ... }
    }
  ]
}
```

### 실행 방식

- 백엔드가 SSH로 스크립트를 원격에 업로드한 뒤 실행합니다.
- `remediation_common.sh`는 항상 선행 배포되며, 일부 조치 스크립트(u01, u02, u66 등)에서 `source`로 사용합니다.

---

## 출력 형식

### 진단 (analysis_script)

| 필드 | 설명 |
|------|------|
| check_id | U-01, U-02, ... |
| status | safe, vulnerable, manual, checking |
| current_value | 현재 설정값 |
| expected_value | 기대값 |
| details | 상세 정보 (JSON 객체) |

### 조치 (remediation_script)

| 필드 | 설명 |
|------|------|
| check_id | U-01, U-02, ... |
| status | SAFE, Vulnerable, Manual 등 |
| pre_value | 조치 전 값 |
| post_value | 조치 후 값 |
| details | 상세 정보 (JSON 객체) |
