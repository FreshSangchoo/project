# AUTOISMS 테스트 가이드

시스템 실행 및 테스트 방법

## 1단계: 백엔드 실행

### 1.1 의존성 설치

```bash
cd backend
python -m pip install -r requirements.txt
```

### 1.2 백엔드 서버 실행

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**성공 확인:**
- 터미널에 `Uvicorn running on http://0.0.0.0:8000` 메시지 표시
- 브라우저에서 `http://localhost:8000/health` 접속 시 `{"status":"ok"}` 응답 확인
- API 문서: `http://localhost:8000/docs` 접속하여 Swagger UI 확인

## 2단계: 프론트엔드 실행

### 2.1 프론트엔드 서버 실행 (새 터미널)

```bash
cd frontend
python -m http.server 8080
```

**성공 확인:**
- 터미널에 `Serving HTTP on 0.0.0.0 port 8080` 메시지 표시
- 브라우저에서 `http://localhost:8080` 접속하여 UI 확인

## 3단계: 기본 테스트

### 3.1 서버 등록 테스트

1. **백엔드 API로 직접 테스트:**
```bash
curl -X POST "http://localhost:8000/api/servers/register" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "192.168.1.100",
    "port": 22,
    "username": "root",
    "password": "your_password",
    "name": "Test Server"
  }'
```

2. **프론트엔드에서 테스트:**
   - 브라우저에서 `http://localhost:8080` 접속
   - "Ansible Inventory 확인" 버튼 클릭
   - 등록된 서버가 목록에 표시되는지 확인

### 3.2 Inventory 로드 테스트

1. **백엔드 API 테스트:**
```bash
curl http://localhost:8000/api/inventory/load
```

2. **프론트엔드에서 테스트:**
   - "Ansible Inventory 확인" 버튼 클릭
   - 서버 목록이 표시되는지 확인
   - 연결 상태가 올바르게 표시되는지 확인

### 3.3 진단 실행 테스트

1. **백엔드 API 테스트:**
```bash
# 먼저 서버 ID 확인
curl http://localhost:8000/api/servers

# 진단 실행
curl -X POST "http://localhost:8000/api/analysis/run-bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "server_ids": ["your_server_id"],
    "use_ansible": true
  }'
```

2. **프론트엔드에서 테스트:**
   - 서버 목록에서 서버 선택
   - "전체 진단" 또는 "선택 항목 진단" 버튼 클릭
   - 취약점 목록이 표시되는지 확인

### 3.4 조치 실행 테스트

1. **백엔드 API 테스트:**
```bash
curl -X POST "http://localhost:8000/api/remediation/bulk-servers" \
  -H "Content-Type: application/json" \
  -d '{
    "server_analysis_map": {
      "server_id": "analysis_id"
    },
    "codes": ["U-01", "U-02"],
    "auto_backup": true
  }'
```

2. **프론트엔드에서 테스트:**
   - 진단 완료 후 "전체 조치" 버튼 클릭
   - 조치 진행 상황 확인
   - 조치 완료 후 취약점 개수 감소 확인

## 4단계: 전체 워크플로우 테스트

### 시나리오 1: 기본 워크플로우

1. **서버 등록**
   - 프론트엔드에서 "Ansible Inventory 확인" 클릭
   - 또는 백엔드 API로 서버 등록

2. **연결 확인**
   - 서버 목록에서 연결 상태 확인
   - 연결 끊김 서버는 "재연결" 버튼 클릭

3. **진단 실행**
   - "전체 진단" 버튼 클릭
   - 진행 상황 모달 확인
   - 취약점 개수 확인

4. **조치 실행**
   - "전체 조치" 버튼 클릭
   - 조치 완료 확인
   - 스냅샷 #2 생성 확인

5. **회귀 감지**
   - 조치 후 자동으로 회귀 감지 실행
   - 회귀 항목 확인
   - 스냅샷 #3 생성 확인

### 시나리오 2: 개별 서버 상세 조치

1. **서버 상세보기**
   - 진단 완료된 서버의 "상세보기" 버튼 클릭
   - 취약점 목록 확인

2. **개별 조치**
   - 특정 취약점의 "조치하기" 버튼 클릭
   - 조치 완료 확인

3. **DIFF 확인**
   - 조치 완료 후 DIFF 섹션 확인
   - Before/After 비교 확인

## 5단계: 문제 해결

### 백엔드가 시작되지 않는 경우

1. **포트 충돌 확인:**
```bash
# Windows
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000
```

2. **의존성 문제 확인:**
```bash
python -m pip list | grep fastapi
python -m pip list | grep uvicorn
```

3. **에러 로그 확인:**
   - 터미널에 표시된 에러 메시지 확인
   - `backend/data/` 디렉토리 권한 확인

### 프론트엔드가 백엔드에 연결되지 않는 경우

1. **CORS 문제 확인:**
   - 브라우저 개발자 도구(F12) → Network 탭 확인
   - CORS 에러가 있는지 확인

2. **API_BASE 확인:**
   - `frontend/index.html`의 `API_BASE` 상수 확인
   - `http://localhost:8000`으로 설정되어 있는지 확인

3. **백엔드 실행 확인:**
   - `http://localhost:8000/health` 접속하여 백엔드 실행 확인

### 진단이 실행되지 않는 경우

1. **서버 연결 확인:**
   - SSH 연결이 가능한지 확인
   - 방화벽 설정 확인

2. **권한 확인:**
   - root 권한 또는 sudo 권한 확인
   - 서버 등록 시 권한 메시지 확인

3. **Ansible 설치 확인:**
```bash
ansible --version
ansible-playbook --version
```

### 조치가 실행되지 않는 경우

1. **분석 ID 확인:**
   - 진단이 완료되었는지 확인
   - `analysis_id`가 올바르게 저장되었는지 확인

2. **서버 권한 확인:**
   - root 권한이 있는지 확인
   - 파일 쓰기 권한 확인

## 6단계: API 문서 확인

백엔드 실행 후 다음 주소에서 API 문서 확인:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 7단계: 데이터 확인

### 저장된 데이터 확인

1. **서버 목록:**
   - `backend/data/servers.json` 파일 확인

2. **분석 결과:**
   - `backend/data/db.sqlite` (로컬 DB) 확인
   - 예: `sqlite3 backend/data/db.sqlite "SELECT analysis_id, server_id FROM analyses LIMIT 5;"`

3. **스냅샷:**
   - `backend/data/db.sqlite` 내 `snapshots` 테이블 확인

## 체크리스트

- [ ] 백엔드 서버 실행 성공
- [ ] 프론트엔드 서버 실행 성공
- [ ] 서버 등록 성공
- [ ] Inventory 로드 성공
- [ ] 진단 실행 성공
- [ ] 조치 실행 성공
- [ ] 회귀 감지 작동
- [ ] DIFF 표시 작동
- [ ] 스냅샷 생성 확인

## 다음 단계

모든 테스트가 성공하면:

1. **실제 서버로 테스트**
   - 실제 SSH 접속 가능한 서버로 테스트
   - 실제 취약점 진단 및 조치 확인

2. **성능 최적화**
   - 다중 서버 진단 시 병렬 처리 확인
   - 대용량 데이터 처리 확인

3. **보안 강화**
   - 환경변수로 암호화 키 설정
   - HTTPS 설정 (프로덕션 환경)

4. **기능 확장**
   - 추가 취약점 체크 항목 추가
   - 보고서 생성 기능 완성
   - 알림 시스템 개선
