// API Base URL 설정
function getApiBaseUrl() {
    // 1. 메타 태그에서 확인
    const metaTag = document.querySelector('meta[name="api-base-url"]');
    if (metaTag && metaTag.content) {
        return metaTag.content;
    }

    // 2. URL 파라미터에서 확인
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('api_base')) {
        return urlParams.get('api_base');
    }

    // 3. 자동 감지 (현재 호스트 기반)
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:8000';
    } else {
        // 포트만 변경 (8080 -> 8000)
        return `http://${host}:8000`;
    }
}

const API_BASE_URL = getApiBaseUrl();

// API 연결 테스트
async function testApiConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
        if (response.ok) {
            addLog(`백엔드 연결 성공: ${API_BASE_URL}`, 'success');
            return true;
        } else {
            addLog(`백엔드 연결 실패: HTTP ${response.status}`, 'error');
            return false;
        }
    } catch (error) {
        addLog(`백엔드 연결 실패: ${error.message}`, 'error');
        addLog(`API URL: ${API_BASE_URL}`, 'info');
        addLog('백엔드 서버가 실행 중인지 확인하세요.', 'warning');
        return false;
    }
}

// API 호출 헬퍼 함수
async function apiCall(endpoint, method = 'GET', body = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API Call] ${method} ${url}`);

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        console.log('[API] fetch 시작...');
        const response = await fetch(url, options);
        console.log('[API] fetch 완료. Status:', response.status);

        if (!response.ok) {
            console.log('[API] 응답 에러. Status:', response.status);
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        console.log('[API] JSON 파싱 시작...');
        const data = await response.json();
        console.log('[API] JSON 파싱 완료. 데이터:', data);
        return data;
    } catch (error) {
        console.error(`[API ERROR] ${endpoint}:`, error);

        // 연결 실패 시 상세 정보 제공
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            const errorMsg = `백엔드 서버에 연결할 수 없습니다.\n\n` +
                `API URL: ${API_BASE_URL}\n` +
                `엔드포인트: ${endpoint}\n\n` +
                `해결 방법:\n` +
                `1. 백엔드 서버가 실행 중인지 확인\n` +
                `2. 포트 8000이 열려있는지 확인\n` +
                `3. 방화벽 설정 확인\n` +
                `4. 브라우저 콘솔에서 자세한 오류 확인`;
            addLog(`연결 실패: ${endpoint}`, 'error');
            throw new Error(errorMsg);
        }
        throw error;
    }
}
