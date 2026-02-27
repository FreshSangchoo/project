// Initialize
window.addEventListener('load', async () => {
    initTheme();
    initNav();
    addLog('AUTOISMS 시스템 초기화 완료', 'success');
    addLog(`API Base URL: ${API_BASE_URL}`, 'info');

    // 백엔드 연결 테스트
    const connected = await testApiConnection();
    if (!connected) {
        const errorMsg = `백엔드 서버에 연결할 수 없습니다.\n\n` +
            `현재 API URL: ${API_BASE_URL}\n\n` +
            `해결 방법:\n` +
            `1. 백엔드 서버 실행:\n` +
            `   cd backend\n` +
            `   ./start_server.sh\n\n` +
            `2. 서버 상태 확인:\n` +
            `   curl ${API_BASE_URL}/health\n\n` +
            `3. 방화벽 확인:\n` +
            `   sudo ufw allow 8000/tcp\n\n` +
            `4. API URL 변경 (필요시):\n` +
            `   URL에 ?api_base=http://<서버IP>:8000 추가`;
        console.error(errorMsg);
    }
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
