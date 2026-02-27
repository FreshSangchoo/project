# AUTOISMS Backend

FastAPI 기반 백엔드. 서버 관리, 진단, 조치, 회귀 감지, 보고서 API를 제공합니다.

---

## 목차

- [실행](#실행)
- [API 개요](#api-개요)
- [데이터 저장](#데이터-저장)
- [SQLite 사용](#sqlite-사용)
- [연결 확인](#연결-확인)
- [보안](#보안)

---

## 실행

### 의존성 설치

```bash
cd backend
python3 -m pip install -r requirements.txt
# 또는
./install_deps.sh
```

### 환경 변수 (선택)

```bash
# 배포 시 반드시 설정 권장
export AUTOISMS_ENCRYPTION_KEY="your-secret-key-base64"
```

### 서버 시작

```bash
./start_server.sh
```

또는 수동:

```bash
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> `--host 0.0.0.0`이 있어야 외부에서 접근할 수 있습니다.

---

## API 개요

### 헬스체크

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/health` | 서버 상태 확인 |

### 서버 관리

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/servers/register` | 서버 등록 |
| GET | `/api/servers` | 서버 목록 |
| GET | `/api/servers/{server_id}` | 서버 상세 |
| DELETE | `/api/servers/{server_id}` | 서버 삭제 |
| POST | `/api/servers/test-connection` | 등록 전 연결 테스트 |
| POST | `/api/servers/{server_id}/test-connection` | 등록된 서버 연결 테스트 |

### 인벤토리

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/inventory/load` | Ansible 인벤토리 로드 |
| POST | `/api/inventory/register-servers` | 인벤토리 서버 일괄 등록 |
| POST | `/api/inventory/add-server` | 서버 추가 |
| POST | `/api/inventory/remove-servers` | 서버 제거 |
| POST | `/api/inventory/check-connections` | 인벤토리 호스트 연결 확인 |

### 진단

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/analysis/run-with-server` | 단일 서버 진단 |
| POST | `/api/analysis/run-bulk` | 다중 서버 진단 |
| GET | `/api/servers/{server_id}/analyses` | 서버별 분석 목록 |
| GET | `/api/servers/{server_id}/analyses/latest` | 최신 분석 결과 |

### 조치

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/remediation/apply` | 단건 조치 |
| POST | `/api/remediation/bulk` | 단일 서버 일괄 조치 |
| POST | `/api/remediation/bulk-servers` | 다중 서버 일괄 조치 |

### DIFF / 회귀

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/diff` | 조치 전후 비교 |
| POST | `/api/regression/simulate` | 회귀 시뮬레이션 |

### 스냅샷

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/snapshots/create` | 스냅샷 생성 |
| GET | `/api/snapshots` | 스냅샷 목록 |
| POST | `/api/snapshots/compare` | 스냅샷 비교(회귀 감지) |

### 알림

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/alerts` | 알림 목록 (폴링용) |
| POST | `/api/alerts/{alert_id}/read` | 알림 읽음 처리 |

### 보고서

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/report/generate` | 개별 보고서 (PDF/Excel/Compliance) |
| POST | `/api/report/generate-global` | 전체 보고서 |
| GET | `/api/reports/analysis/global` | 전체 진단 보고서 (PDF/CSV/JSON) |
| GET | `/api/reports/analysis/server/{hostname}` | 서버별 진단 보고서 |
| GET | `/api/reports/remediation/global` | 전체 조치 보고서 |
| GET | `/api/reports/remediation/server/{hostname}` | 서버별 조치 보고서 |

> 상세 API 스펙은 `http://localhost:8000/docs` (Swagger UI)에서 확인할 수 있습니다.

---

## 데이터 저장

| 경로 | 용도 |
|------|------|
| `backend/data/db.sqlite` | 분석 결과, 알림, 스냅샷 |
| `backend/data/servers.json` | 서버 정보 (비밀번호 암호화 저장) |
| `analysis_results/` | 진단 결과 JSON (호스트별/타임스탬프별) |
| `remediation_results/` | 조치 결과 JSON |

> `db.json`은 사용하지 않습니다. 삭제해도 되며, 데이터는 `db.sqlite`에만 저장됩니다.

---

## SQLite 사용

### 백업

```bash
cp backend/data/db.sqlite backend/data/db.sqlite.$(date +%Y%m%d)
```

### 조회 (CLI)

```bash
cd backend
sqlite3 data/db.sqlite
```

```sql
.tables
SELECT analysis_id, server_id, completed_at FROM analyses ORDER BY completed_at DESC LIMIT 5;
SELECT * FROM alerts ORDER BY created_at DESC LIMIT 5;
.quit
```

### 초기화

서버 중지 후 `backend/data/db.sqlite`를 삭제하면 됩니다. 다음 기동 시 빈 DB가 생성됩니다.  
서버 목록은 `servers.json`에 있으므로 DB만 초기화해도 서버 등록 정보는 유지됩니다.

### 보관 기간 (7일)

- 분석(analyses), 알림(alerts), 스냅샷(snapshots)은 **7일 초과 시 자동 삭제**됩니다.
- 백엔드 **기동 시마다** 1회 실행됩니다.

---

## 연결 확인

```bash
./check_connection.sh
```

다음을 점검합니다:

- 백엔드 프로세스 실행 여부
- 포트 8000 열림 여부
- localhost 연결
- 외부 IP 연결
- 방화벽 상태

---

## 보안

- 서버 비밀번호는 암호화되어 저장됩니다.
- 배포 시 `AUTOISMS_ENCRYPTION_KEY`를 반드시 설정하세요.
- SSH 키 파일은 별도 보안 저장소에 보관하는 것을 권장합니다.
