# AUTOISMS 백엔드 API 재설계 문서

프론트엔드 요구사항에 맞춘 백엔드 API 설계

## 1. Ansible Inventory 관리

### 1.1 Ansible Inventory 파싱
```
GET /api/inventory/load
```
- Ansible inventory 파일을 파싱하여 타겟 서버 목록 반환
- 응답:
```json
{
  "servers": [
    {
      "ip": "192.168.1.10",
      "hostname": "web-server-01",
      "username": "root",
      "connected": true,
      "server_id": "uuid" // 이미 등록된 서버면 server_id 반환
    }
  ]
}
```

### 1.2 Inventory에서 서버 자동 등록
```
POST /api/inventory/register-servers
Body: {
  "servers": [
    {
      "ip": "192.168.1.10",
      "hostname": "web-server-01",
      "port": 22,
      "username": "root",
      "password": "password"
    }
  ]
}
```
- Inventory에서 발견된 서버들을 자동으로 등록
- 응답: 등록된 서버 목록

## 2. 다중 서버 진단

### 2.1 다중 서버 진단 실행
```
POST /api/analysis/run-bulk
Body: {
  "server_ids": ["server_id1", "server_id2", ...],
  "use_ansible": true
}
```
- 여러 서버에 대해 병렬/순차적으로 진단 실행
- 응답:
```json
{
  "results": [
    {
      "server_id": "server_id1",
      "ip": "192.168.1.10",
      "analysis_id": "analysis_id1",
      "vulnerabilities": [...],
      "vuln_count": 4,
      "status": "completed"
    }
  ],
  "snapshot_id": "snapshot_1" // 전체 진단 스냅샷 ID
}
```

### 2.2 서버 연결 상태 일괄 확인
```
POST /api/servers/check-connections
Body: {
  "server_ids": ["server_id1", "server_id2", ...]
}
```
- 여러 서버의 연결 상태를 확인
- 응답:
```json
{
  "results": [
    {
      "server_id": "server_id1",
      "ip": "192.168.1.10",
      "connected": true,
      "message": "연결 성공"
    }
  ]
}
```

## 3. 다중 서버 일괄 조치

### 3.1 다중 서버 일괄 조치
```
POST /api/remediation/bulk-servers
Body: {
  "server_analysis_map": {
    "server_id1": "analysis_id1",
    "server_id2": "analysis_id2"
  },
  "codes": ["U-01", "U-02", ...],
  "auto_backup": true
}
```
- 여러 서버의 취약점을 일괄 조치
- 응답:
```json
{
  "results": [
    {
      "server_id": "server_id1",
      "ip": "192.168.1.10",
      "applied_codes": ["U-01", "U-02"],
      "vulnerabilities": [...],
      "status": "completed"
    }
  ],
  "snapshot_id": "snapshot_2"
}
```

## 4. 스냅샷 관리

### 4.1 스냅샷 생성
```
POST /api/snapshots/create
Body: {
  "name": "스냅샷 #1",
  "description": "진단 완료 후",
  "server_analysis_map": {
    "server_id1": "analysis_id1",
    "server_id2": "analysis_id2"
  }
}
```
- 여러 서버의 분석 결과를 하나의 스냅샷으로 저장
- 응답:
```json
{
  "snapshot_id": "snapshot_1",
  "name": "스냅샷 #1",
  "created_at": "2024-01-01T00:00:00Z",
  "server_count": 2
}
```

### 4.2 스냅샷 목록 조회
```
GET /api/snapshots
```
- 저장된 스냅샷 목록 반환

### 4.3 스냅샷 비교 (회귀 감지)
```
POST /api/snapshots/compare
Body: {
  "before_snapshot_id": "snapshot_1",
  "after_snapshot_id": "snapshot_2"
}
```
- 두 스냅샷을 비교하여 회귀 감지
- 응답:
```json
{
  "regressions": [
    {
      "server_id": "server_id1",
      "ip": "192.168.1.10",
      "regression_codes": ["U-01", "U-02"],
      "regression_count": 2
    }
  ],
  "total_regressions": 2
}
```

## 5. 서버별 분석 결과 조회

### 5.1 서버별 최신 분석 결과
```
GET /api/servers/{server_id}/latest-analysis
```
- 서버의 최신 분석 결과 반환
- 응답: AnalysisRunResponse

### 5.2 서버별 취약점 목록
```
GET /api/servers/{server_id}/vulnerabilities
```
- 서버의 취약점 목록만 반환 (상세 정보 제외)

## 6. DIFF 표시

### 6.1 서버별 DIFF 조회
```
GET /api/diff/server/{server_id}
Query: {
  "before_analysis_id": "...",
  "after_analysis_id": "..."
}
```
- 특정 서버의 조치 전후 비교
- 응답: DiffResponse

## 7. 회귀 감지 및 알림

### 7.1 회귀 감지 실행
```
POST /api/regression/detect
Body: {
  "server_ids": ["server_id1", "server_id2"],
  "compare_with_snapshot_id": "snapshot_1"
}
```
- 지정된 스냅샷과 현재 상태를 비교하여 회귀 감지
- 응답:
```json
{
  "regressions": [...],
  "alerts_created": 3
}
```

### 7.2 회귀 알림 조회
```
GET /api/alerts/regression
Query: {
  "server_id": "..." (optional),
  "since_minutes": 60
}
```
- 회귀 관련 알림만 필터링하여 반환

## 구현 우선순위

### Phase 1: 기본 기능
1. Ansible Inventory 파싱 API
2. 다중 서버 진단 API
3. 다중 서버 일괄 조치 API

### Phase 2: 스냅샷 관리
4. 스냅샷 생성/조회 API
5. 스냅샷 비교 API

### Phase 3: 회귀 감지
6. 회귀 감지 API
7. 회귀 알림 API

## 데이터 구조 확장

### TargetServer 스키마 (프론트엔드용)
```python
class TargetServer(BaseModel):
    ip: str
    hostname: str
    port: int = 22
    username: str
    connected: bool
    server_id: str | None = None  # 등록된 서버면 ID
    vulnerabilities: list[Vulnerability] = []
    vuln_count: int = 0
    diagnosed: bool = False
    has_regression: bool = False
    analysis_id: str | None = None  # 최신 분석 ID
```

### Snapshot 스키마
```python
class Snapshot(BaseModel):
    snapshot_id: str
    name: str
    description: str | None = None
    created_at: datetime
    server_analysis_map: dict[str, str]  # server_id -> analysis_id
    server_count: int
```

### BulkAnalysisResponse 스키마
```python
class BulkAnalysisResponse(BaseModel):
    results: list[AnalysisRunResponse]
    snapshot_id: str | None = None
    total_servers: int
    completed: int
    failed: int
```
