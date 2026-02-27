from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# 취약점 상태
# - "manual"은 수동 조치만 가능한 상태 (report/result.json의 MANUAL에 대응)
VulnerabilityStatus = Literal["not-scanned", "checking", "vulnerable", "safe", "fixed", "manual"]


class Vulnerability(BaseModel):
    code: str
    name: str
    status: VulnerabilityStatus
    severity: str | None = Field(default=None, description="high, medium, low")
    category: str | None = Field(default=None, description="카테고리명 (예: 계정관리, 파일 및 디렉터리)")
    compliance: list[str] = Field(default_factory=list)
    # result.json 로그 연동: 상세 로그/현재값/권장값 (프론트 상세 로그 영역 표시용)
    current_value: str | None = Field(default=None, description="현재 설정값")
    expected_value: str | None = Field(default=None, description="권장 설정값")
    details: list[str] = Field(default_factory=list, description="상세 로그 라인 목록")
    requires_manual_remediation: bool = Field(default=False, description="True면 자동 조치 스크립트 없음, 수동 조치 필요")


class AnalysisRunRequest(BaseModel):
    server: str = Field(default="ubuntu", description="예: ubuntu, rocky9, rocky10, windows, postgresql")


class AnalysisRunResponse(BaseModel):
    analysis_id: str
    server: str
    started_at: datetime
    completed_at: datetime
    vulnerabilities: list[Vulnerability]


class RemediationApplyRequest(BaseModel):
    analysis_id: str
    code: str
    auto_backup: bool = True


class RemediationBulkRequest(BaseModel):
    analysis_id: str
    codes: list[str]
    auto_backup: bool = True


class FailedRemediationItem(BaseModel):
    code: str
    reason: str


class RemediationResponse(BaseModel):
    analysis_id: str
    applied_codes: list[str]
    auto_backup: bool
    message: str
    vulnerabilities: list[Vulnerability]
    manual_required: list[str] = Field(default_factory=list, description="수동 조치 필요 항목")
    failed_codes: list[FailedRemediationItem] = Field(default_factory=list, description="스크립트 실행됐으나 조치 미반영")


class DiffResponse(BaseModel):
    before_analysis_id: str
    after_analysis_id: str
    removed: list[str] = Field(default_factory=list)
    added: list[str] = Field(default_factory=list)
    unchanged: list[str] = Field(default_factory=list)
    summary: dict[str, int] = Field(default_factory=dict)


class RegressionSimulateRequest(BaseModel):
    analysis_id: str
    newly_vulnerable_codes: list[str] = Field(default_factory=lambda: ["U-12", "U-18"])


class ReportGenerateRequest(BaseModel):
    analysis_id: str
    type: Literal["pdf", "excel", "compliance"]


class ReportGenerateGlobalRequest(BaseModel):
    """전체진단 보고서 시 포함할 서버 ID 목록. 비어 있거나 없으면 등록된 전체 서버 사용."""
    server_ids: list[str] | None = None


class ReportGenerateResponse(BaseModel):
    analysis_id: str
    type: str
    filename: str
    content_type: str
    bytes_base64: str


class ServerRegisterRequest(BaseModel):
    host: str
    port: int = 22
    username: str
    password: str | None = None
    key_file: str | None = None
    name: str | None = None


class ServerRegisterResponse(BaseModel):
    server_id: str
    name: str
    host: str
    port: int
    username: str
    server_type: str
    has_root: bool
    can_sudo: bool
    privilege_message: str


class ServerInfo(BaseModel):
    server_id: str
    name: str
    host: str
    port: int
    username: str
    server_type: str
    has_root: bool
    can_sudo: bool
    privilege_message: str


class AnalysisRunWithServerRequest(BaseModel):
    server_id: str


class AlertInfo(BaseModel):
    alert_id: str
    type: str  # regression, error_repeat
    message: str
    severity: str  # warning, error
    analysis_id: str | None = None
    server_id: str | None = None
    created_at: datetime


class ServerConnectionInfo(BaseModel):
    """서버 연결 정보 (비밀번호 값 제외, 확인용)"""
    server_id: str
    host: str
    port: int
    username: str
    has_password: bool
    key_file: str | None = None


class ServerTestConnectionRequest(BaseModel):
    host: str
    port: int
    username: str
    password: str | None = None
    key_file: str | None = None


class ServerTestConnectionResponse(BaseModel):
    success: bool
    message: str
    server_type: str | None = None
    has_root: bool | None = None
    can_sudo: bool | None = None
    privilege_message: str | None = None


# 프론트엔드용 새로운 스키마
class TargetServer(BaseModel):
    ip: str
    hostname: str
    port: int = 22
    username: str
    connected: bool
    server_id: str | None = None
    vulnerabilities: list[Vulnerability] = Field(default_factory=list)
    vuln_count: int = 0
    diagnosed: bool = False
    has_regression: bool = False
    regression_codes: list[str] = Field(default_factory=list)
    analysis_id: str | None = None


class InventoryLoadResponse(BaseModel):
    servers: list[TargetServer]


class InventoryServerInfo(BaseModel):
    ip: str
    hostname: str
    port: int = 22
    username: str
    password: str | None = None


class InventoryRegisterRequest(BaseModel):
    servers: list[InventoryServerInfo]


class InventoryAddServerRequest(BaseModel):
    """대시보드에서 inventory에 서버 추가 시 사용"""
    hostname: str = Field(..., description="Ansible 호스트명 (예: target1)")
    ip: str = Field(..., description="서버 IP 주소")
    port: int = Field(22, ge=1, le=65535, description="SSH 포트")
    username: str = Field("root", description="SSH 사용자명 (root 권한 필요)")


class InventoryAddServerResponse(BaseModel):
    success: bool = True
    message: str = "서버가 inventory에 추가되었습니다."
    hostname: str | None = None


class InventoryRemoveServersRequest(BaseModel):
    """inventory에서 서버(호스트) 제거 시 사용 – 선택 삭제/전체 삭제"""
    hostnames: list[str] = Field(..., description="제거할 Ansible 호스트명 목록 (예: ['target1', 'target2'])")


class InventoryRemoveServersResponse(BaseModel):
    success: bool = True
    message: str = "선택한 서버가 inventory에서 제거되었습니다."
    removed: list[str] = Field(default_factory=list, description="실제로 제거된 호스트명 목록")
    not_found: list[str] = Field(default_factory=list, description="inventory에 없어서 제거되지 않은 호스트명")


class BulkAnalysisRequest(BaseModel):
    server_ids: list[str] | None = None  # None이면 현재 인벤토리 기준 서버만 사용
    use_ansible: bool = False


class ServerAnalysisResult(BaseModel):
    server_id: str
    ip: str
    hostname: str
    analysis_id: str | None = None
    vulnerabilities: list[Vulnerability] = Field(default_factory=list)
    vuln_count: int = 0
    status: str  # completed, failed
    error: str | None = None
    has_regression: bool = False
    regression_codes: list[str] = Field(default_factory=list, description="회귀된 취약점 코드 목록 (예: U-19, U-23)")


class BulkAnalysisResponse(BaseModel):
    results: list[ServerAnalysisResult]
    snapshot_id: str | None = None
    total_servers: int
    completed: int
    failed: int


class BulkConnectionCheckRequest(BaseModel):
    server_ids: list[str]


class InventoryHostCheckItem(BaseModel):
    """inventory 호스트 연결 확인 요청용 (server_id 없는 호스트)"""
    ip: str
    port: int = 22
    username: str = "root"
    hostname: str | None = None


class InventoryCheckConnectionsRequest(BaseModel):
    """server_id 없이 IP/포트로 연결 확인 (새로 추가된 서버 등)"""
    hosts: list[InventoryHostCheckItem]


class InventoryHostCheckResult(BaseModel):
    ip: str
    hostname: str | None = None
    connected: bool


class InventoryCheckConnectionsResponse(BaseModel):
    results: list[InventoryHostCheckResult]


class ConnectionCheckResult(BaseModel):
    server_id: str
    ip: str
    connected: bool
    message: str


class BulkConnectionCheckResponse(BaseModel):
    results: list[ConnectionCheckResult]


class BulkRemediationRequest(BaseModel):
    server_analysis_map: dict[str, str]  # server_id -> analysis_id
    codes: list[str]
    auto_backup: bool = True


class ServerRemediationResult(BaseModel):
    server_id: str
    ip: str
    applied_codes: list[str]
    vulnerabilities: list[Vulnerability]
    status: str
    error: str | None = None
    manual_required: list[str] = Field(default_factory=list, description="자동 조치 불가, 수동 조치 필요한 취약점 코드 목록")
    failed_codes: list[FailedRemediationItem] = Field(default_factory=list, description="스크립트 실행됐으나 조치 미반영")


class BulkRemediationResponse(BaseModel):
    results: list[ServerRemediationResult]
    snapshot_id: str | None = None


class SnapshotCreateRequest(BaseModel):
    name: str
    description: str | None = None
    server_analysis_map: dict[str, str]  # server_id -> analysis_id


class SnapshotInfo(BaseModel):
    snapshot_id: str
    name: str
    description: str | None = None
    created_at: datetime
    server_analysis_map: dict[str, str]
    server_count: int


class SnapshotCompareRequest(BaseModel):
    before_snapshot_id: str
    after_snapshot_id: str


class ServerRegressionInfo(BaseModel):
    server_id: str
    ip: str
    regression_codes: list[str]
    regression_count: int


class SnapshotCompareResponse(BaseModel):
    regressions: list[ServerRegressionInfo]
    total_regressions: int
