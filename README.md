# AUTOISMS - KISA 보안 취약점 자동 진단 시스템

보안 실무자를 위한 자동화된 취약점 진단 및 조치 시스템

> **참고**: 이 프로젝트는 팀 프로젝트 기간 중 핫스팟 환경에서 개발 및 시연되었습니다.
> 해당 네트워크 환경이 더 이상 유지되지 않으므로, 코드에 남아있는 IP 주소로는 현재 실제 접속이 불가능합니다.

## 프로젝트 구조

```
project/
├── backend/                      # FastAPI 백엔드
│   ├── app/                      # 애플리케이션 코드
│   │   ├── reports/              # 보고서 생성 모듈
│   │   │   ├── fonts/            # PDF 한글 폰트 (Noto Sans KR)
│   │   │   ├── templates/        # HTML 보고서 템플릿
│   │   │   ├── download_fonts.py # 폰트 다운로드 스크립트
│   │   │   ├── report_generator.py
│   │   │   └── report_router.py
│   │   ├── main.py               # FastAPI 앱 진입점
│   │   ├── diagnostic_engine.py  # 진단 엔진 (SSH 직접)
│   │   ├── remediation_engine.py # 조치 엔진
│   │   ├── ansible_diagnostic.py # Ansible 진단 연동
│   │   ├── ansible_runner.py     # Ansible 실행기
│   │   ├── server_manager.py     # 서버 관리
│   │   ├── ssh_client.py         # SSH 클라이언트
│   │   ├── inventory_parser.py   # Ansible Inventory 파서
│   │   ├── vuln_catalog.py       # 취약점 카탈로그
│   │   ├── storage.py            # 데이터 저장소
│   │   ├── localdb.py            # 로컬 DB 관리
│   │   └── schemas.py            # Pydantic 스키마
│   ├── data/                     # 데이터 저장소 (자동 생성)
│   ├── requirements.txt
│   ├── start_server.sh
│   ├── check_connection.sh
│   └── install_deps.sh
├── frontend/                     # 프론트엔드 (HTML/JS)
│   ├── index.html
│   ├── css/
│   └── js/
│       ├── config.js             # API URL 설정
│       ├── init.js               # 초기화
│       ├── state.js              # 상태 관리
│       ├── dashboard.js          # 대시보드
│       ├── operations.js         # 진단/조치 동작
│       ├── modal.js              # 모달
│       ├── reports.js            # 보고서
│       ├── ui.js                 # UI 유틸
│       └── theme.js              # 테마
├── ansible/                      # Ansible 설정
│   ├── ansible.cfg
│   ├── inventory.yaml            # 타겟 서버 목록 (YAML)
│   ├── inventory.ini             # 타겟 서버 목록 (INI)
│   └── playbooks/
│       └── diagnostic.yml
├── script/                       # 진단/조치 Bash 스크립트
│   ├── analysis_script/          # 진단 스크립트 (u01.sh ~ u67.sh)
│   │   ├── all.sh                # 전체 진단 통합
│   │   └── u01.sh ~ u67.sh
│   └── remediation_script/       # 조치 스크립트 (u01.sh ~ u67.sh)
│       ├── remediation_common.sh # 공통 함수
│       └── u01.sh ~ u67.sh
└── README.md
```

## 서버 구성 (개발 당시 기준)

개발 및 시연 당시 구성이며, 현재는 해당 네트워크 환경이 존재하지 않습니다.

| 역할 | OS | 설명 |
|------|----|------|
| main (AUTOISMS 실행) | Ubuntu 22.04 | 백엔드 + 프론트엔드 실행 서버 |
| target1 | Ubuntu 24.04 | 진단 대상 서버 |
| target2 | Rocky Linux 9.7 | 진단 대상 서버 |
| target3 | Ubuntu 20.04 | 진단 대상 서버 |
| target4 | Rocky Linux 10 | 진단 대상 서버 |
| target5 | Ubuntu 25.04 | 진단 대상 서버 |


## 주요 기능

### 서버 관리
- **서버 등록**: IP/PORT/USER/패스워드 입력
- **자동 판별**: 서버 타입 자동 감지 (Ubuntu/Rocky Linux)
- **권한 체크**: root 권한 자동 검증

### 진단
- **실시간 진단**: SSH 또는 Ansible을 선택하여 실제 서버에 접속, 취약점 진단
- **KISA 기준**: ISMS-P 기준 취약점 체크 (U-01 ~ U-67)
- **OS 자동 감지**: Redhat 계열(Rocky Linux)과 Debian 계열(Ubuntu)을 자동 판별하여 계열별 진단 수행
- **상태값 분류**: `safe` / `vulnerable` / `manual` / `fixed` / `regression` 으로 세분화하여 수동 조치가 필요한 항목은 `manual`로 별도 표시
- **Inventory 자동 로드**: `ansible/inventory.yaml` 파일에서 서버 자동 등록

### 조치
- **일괄 조치**: 선택한 취약점 전체 자동 수정 (SSH 전용, 명령 정확성 보장)
- **자동 백업**: 조치 전 설정 파일 자동 백업
- **실시간 피드백**: 터미널에서 진행 상황 확인

### 회귀 감지
- **자동 감지**: 직전 진단 이력과 현재 결과를 비교하여 Safe/Fixed → Vulnerable/Manual로 변경된 항목을 회귀(Regression)로 판단
- **알림 시스템**: 폴링 방식으로 회귀 발생 시 대시보드 상단 배너 알림
- **DIFF 비교**: 조치 전후 코드 변경 내역을 비교하여 어떤 설정이 어떻게 바뀌었는지 직관적으로 확인

### 보고서
- **PDF 보고서**: 진단/조치 결과를 그래프 포함 PDF로 생성 (WeasyPrint + Noto Sans KR)
- **CSV 보고서**: 취약 항목의 현재 설정값 포함 CSV 생성
- **JSON 보고서**: 진단/조치 결과 JSON 형식 출력

## 시나리오

### 정상 동작 시나리오

1. **서버 등록 또는 Inventory 로드**
   - 직접 IP/PORT/USER/패스워드 입력하여 등록
   - 또는 `ansible/inventory.yaml` 파일에서 자동 로드

2. **진단 실행**
   - 서버 선택 후 "분석 시작" 클릭
   - SSH로 실제 서버에 접속하여 진단 (또는 Ansible 사용)
   - 취약점 리스트 표시

3. **일괄 조치**
   - 취약점 선택 후 "일괄 조치" 클릭
   - 자동 백업 생성
   - 실제 서버에 보안 설정 적용
   - 조치 후 재진단

4. **DIFF 확인**
   - 조치 전후 분석 선택
   - 설정 변경사항 비교 표시

5. **회귀 감지**
   - 조치 후 재진단 시 회귀 자동 감지
   - 알림 배너 표시
   - 조치 버튼 활성화

6. **보고서 생성**
   - PDF/CSV/JSON 보고서 다운로드

## 기술 스택

### 백엔드
- **FastAPI**: Python 웹 프레임워크
- **Uvicorn**: ASGI 서버
- **Paramiko**: SSH 클라이언트
- **Cryptography**: 패스워드 암호화
- **Ansible / ansible-core**: 자동화 진단
- **WeasyPrint**: PDF 보고서 생성
- **openpyxl**: CSV/Excel 보고서 생성
- **Jinja2**: HTML 템플릿 렌더링
- **PyYAML**: YAML 파싱 (Inventory)

### 프론트엔드
- **Vanilla JavaScript**: 순수 JavaScript
- **Chart.js**: 차트/그래프
- **Fetch API**: 백엔드 통신

### 진단/조치 스크립트
- **Bash**: 진단 스크립트 (u01.sh ~ u67.sh)
- **JSON 출력**: 결과를 JSON 형식으로 표준 출력
