// 전역 상태 변수
let logCount = 0;
let currentSnapshot = 0;
let currentTargetIP = null;
let currentSortColumn = null;
let currentSortDirection = 'asc';
let currentModalSortColumn = null;
let currentModalSortDirection = 'asc';
let chartInstance = null;
let lineChartInstance = null;
let pieChartInstance = null;
let severityChartInstance = null;
let statusChartInstance = null;
let categoryChartInstance = null;
let serverChartInstance = null;
let targetServers = [];

const vulnerabilityTemplate = [
    { code: 'U-01', name: 'root 계정 원격 접속 제한', severity: 'high', status: 'not-scanned', category: '계정관리', current_value: '', expected_value: 'SSH PermitRootLogin no 설정', details: [] },
    { code: 'U-02', name: '패스워드 복잡도 설정', severity: 'high', status: 'not-scanned', category: '계정관리', current_value: '', expected_value: '최소 8자 이상, 영문/숫자/특수문자 조합', details: [] },
    { code: 'U-44', name: 'root 이외 UID가 0 금지', severity: 'medium', status: 'not-scanned', category: '계정관리', current_value: '', expected_value: 'root 계정만 UID 0 보유', details: [] },
    { code: 'U-45', name: 'root 계정 su 제한', severity: 'medium', status: 'not-scanned', category: '계정관리', current_value: '', expected_value: 'wheel 그룹만 su 사용 가능', details: [] },
    { code: 'U-08', name: '/etc/shadow 파일 권한 설정', severity: 'high', status: 'not-scanned', category: '파일 및 디렉터리', current_value: '', expected_value: '권한 000 또는 400', details: [] },
    { code: 'U-09', name: '/etc/passwd 파일 권한 설정', severity: 'medium', status: 'not-scanned', category: '파일 및 디렉터리', current_value: '', expected_value: '권한 644 이하', details: [] },
    { code: 'U-23', name: '불필요한 서비스 제거', severity: 'medium', status: 'not-scanned', category: '서비스 관리', current_value: '', expected_value: '필수 서비스만 실행', details: [] },
    { code: 'U-24', name: 'NFS 서비스 비활성화', severity: 'medium', status: 'not-scanned', category: '서비스 관리', current_value: '', expected_value: 'NFS 미사용 시 비활성화', details: [] },
    { code: 'U-42', name: '최신 보안 패치 적용', severity: 'high', status: 'not-scanned', category: '패치 관리', current_value: '', expected_value: '최신 보안 패치 적용됨', details: [] },
    { code: 'U-43', name: '로그 기록 및 정기 검토', severity: 'medium', status: 'not-scanned', category: '로그 관리', current_value: '', expected_value: '로그 정기적으로 검토', details: [] },
];

// 로그 데이터 생성 함수
function generateVulnDetails(code, hostname) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const details = [];

    switch(code) {
        case 'U-01':
            details.push(`[${timestamp}] SSH 설정 파일 확인 시작: /etc/ssh/sshd_config`);
            details.push(`[${timestamp}] PermitRootLogin 설정 값: yes (취약)`);
            details.push(`[${timestamp}] Telnet 서비스 확인: 활성화 상태`);
            details.push(`[${timestamp}] 취약점 발견: root 원격 로그인 허용됨`);
            break;
        case 'U-02':
            details.push(`[${timestamp}] 패스워드 정책 파일 확인: /etc/security/pwquality.conf`);
            details.push(`[${timestamp}] minlen = 6 (기준: 8 이상)`);
            details.push(`[${timestamp}] dcredit, ucredit, ocredit 미설정`);
            details.push(`[${timestamp}] 취약점 발견: 패스워드 복잡도 정책 미흡`);
            break;
        case 'U-44':
            details.push(`[${timestamp}] /etc/passwd 파일 분석 시작`);
            details.push(`[${timestamp}] UID 0인 계정 확인: root, admin`);
            details.push(`[${timestamp}] 취약점 발견: root 외 'admin' 계정이 UID 0 사용 중`);
            break;
        case 'U-45':
            details.push(`[${timestamp}] /etc/pam.d/su 파일 확인`);
            details.push(`[${timestamp}] pam_wheel.so 설정 없음`);
            details.push(`[${timestamp}] 취약점 발견: 모든 사용자가 su 명령 사용 가능`);
            break;
        case 'U-08':
            details.push(`[${timestamp}] /etc/shadow 파일 권한 확인`);
            details.push(`[${timestamp}] 현재 권한: 644 (rw-r--r--)`);
            details.push(`[${timestamp}] 취약점 발견: shadow 파일이 일반 사용자도 읽기 가능`);
            break;
        case 'U-09':
            details.push(`[${timestamp}] /etc/passwd 파일 권한 확인`);
            details.push(`[${timestamp}] 현재 권한: 666 (rw-rw-rw-)`);
            details.push(`[${timestamp}] 취약점 발견: passwd 파일이 모든 사용자가 쓰기 가능`);
            break;
        case 'U-23':
            details.push(`[${timestamp}] 실행 중인 서비스 확인: systemctl list-units --type=service`);
            details.push(`[${timestamp}] 불필요한 서비스 발견: telnet, rlogin, rexec`);
            details.push(`[${timestamp}] 취약점 발견: 보안 위험이 높은 서비스 실행 중`);
            break;
        case 'U-24':
            details.push(`[${timestamp}] NFS 서비스 상태 확인`);
            details.push(`[${timestamp}] nfs-server.service: active (running)`);
            details.push(`[${timestamp}] /etc/exports 설정 확인: 공유 설정 존재`);
            details.push(`[${timestamp}] 취약점 발견: 사용하지 않는 NFS 서비스 실행 중`);
            break;
        case 'U-42':
            details.push(`[${timestamp}] 시스템 패키지 업데이트 확인`);
            details.push(`[${timestamp}] yum check-update 실행`);
            details.push(`[${timestamp}] 보안 업데이트 가능 패키지: 15개 발견`);
            details.push(`[${timestamp}] 취약점 발견: 중요 보안 패치 미적용`);
            break;
        case 'U-43':
            details.push(`[${timestamp}] 로그 설정 파일 확인: /etc/rsyslog.conf`);
            details.push(`[${timestamp}] 로그 파일 보관 기간 확인: 설정 없음`);
            details.push(`[${timestamp}] 로그 정기 검토 스크립트: 없음`);
            details.push(`[${timestamp}] 취약점 발견: 로그 관리 정책 미흡`);
            break;
        default:
            details.push(`[${timestamp}] 점검 시작: ${code}`);
            details.push(`[${timestamp}] 취약점 발견`);
    }

    return details;
}

function generateCurrentValue(code) {
    switch(code) {
        case 'U-01': return 'SSH PermitRootLogin yes, Telnet 활성화';
        case 'U-02': return 'minlen=6, 복잡도 정책 미설정';
        case 'U-44': return 'root, admin 계정이 UID 0 사용';
        case 'U-45': return 'pam_wheel.so 미설정';
        case 'U-08': return '권한 644 (rw-r--r--)';
        case 'U-09': return '권한 666 (rw-rw-rw-)';
        case 'U-23': return 'telnet, rlogin, rexec 실행 중';
        case 'U-24': return 'NFS 서비스 실행 중';
        case 'U-42': return '15개 보안 업데이트 대기 중';
        case 'U-43': return '로그 관리 정책 미설정';
        default: return '취약';
    }
}

// 세부 항목을 표시용 문자열로 변환 (객체/문자열)
function formatDetailItem(item) {
    if (item == null) return '';
    if (typeof item === 'object') {
        const itemName = item['점검항목'] || item['check_name'] || '';
        const status = item['상태'] || item['status'] || '';
        const detail = item['세부내용'] || item['세부 내역'] || item['detail'] || '';
        if (detail) {
            return (itemName ? `[${itemName}] ` : '') + (status ? `${status}: ` : '') + detail;
        }
        if (item['조치 전 상태'] || item['조치 후 상태'] || item['조치 명령어']) {
            const parts = [];
            if (item['조치 전 상태']) parts.push(`조치 전: ${item['조치 전 상태']}`);
            if (item['조치 후 상태']) parts.push(`조치 후: ${item['조치 후 상태']}`);
            if (item['조치 명령어']) parts.push(`조치 명령: ${item['조치 명령어']}`);
            if (item['세부 내역']) parts.push(String(item['세부 내역']).replace(/\\n/g, '\n'));
            return parts.join('\n');
        }
        return JSON.stringify(item);
    }
    return String(item).trim();
}

// details를 '--- 조치 내역 ---' 기준으로 분리
function splitDetailsForModal(details) {
    if (!details || !Array.isArray(details)) return { before: [], after: [] };
    const idx = details.findIndex(d => {
        const s = typeof d === 'string' ? d.trim() : '';
        return s === '--- 조치 내역 ---';
    });
    if (idx < 0) return { before: details, after: [] };
    return { before: details.slice(0, idx), after: details.slice(idx + 1) };
}

// 로그 HTML 생성 (단일 섹션)
function generateLogHTML(details) {
    if (!details || details.length === 0) {
        return '<div style="color: #64748b;">데이터가 없습니다.</div>';
    }

    return details.map(log => {
        const text = formatDetailItem(log);
        if (!text) return '';
        let color = '#94a3b8';
        if (text.includes('취약점 발견') || text.includes('취약:')) {
            color = '#fca5a5';
        } else if (text.includes('조치 완료') || text.includes('최종 상태') || text.includes('정상') || text.includes('양호')) {
            color = '#86efac';
        } else if (text.includes('회귀 발견')) {
            color = '#fbbf24';
        } else if (text.includes('조치 전') || text.includes('조치 후') || text.includes('조치 명령')) {
            color = '#93c5fd';
        } else if (text.includes('확인') || text.includes('시작') || text.includes('설정 값')) {
            color = '#93c5fd';
        }
        return `<div style="margin-bottom: 6px; color: ${color}; white-space: pre-wrap;">${escapeHtml(text)}</div>`;
    }).filter(Boolean).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 상세 로그 토글
function toggleVulnDetail(index) {
    const detailRow = document.getElementById(`vuln-detail-${index}`);
    if (detailRow.style.display === 'none') {
        // 다른 모든 로그 닫기
        document.querySelectorAll('[id^="vuln-detail-"]').forEach(row => {
            row.style.display = 'none';
        });
        // 현재 로그 열기
        detailRow.style.display = 'table-row';
    } else {
        // 현재 로그 닫기
        detailRow.style.display = 'none';
    }
}
