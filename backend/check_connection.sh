#!/bin/bash
# AUTOISMS 백엔드 서버 상태 및 연결 종합 확인 스크립트

echo "=========================================="
echo "AUTOISMS 백엔드 상태 확인"
echo "=========================================="
echo ""

# 1. Python 설치 확인
echo "1. Python 버전 확인:"
if command -v python3 &> /dev/null || command -v python &> /dev/null; then
    python3 --version 2>/dev/null || python --version 2>/dev/null
else
    echo "   [FAIL] Python이 설치되지 않았습니다"
fi
echo ""

# 2. 의존성 확인
echo "2. 필수 패키지 확인:"
FASTAPI_OK=$(python3 -c "import fastapi; print('OK')" 2>/dev/null || echo "NO")
UVICORN_OK=$(python3 -c "import uvicorn; print('OK')" 2>/dev/null || echo "NO")
PARAMIKO_OK=$(python3 -c "import paramiko; print('OK')" 2>/dev/null || echo "NO")

if [ "$FASTAPI_OK" = "OK" ]; then
    echo "   [OK] FastAPI"
else
    echo "   [FAIL] FastAPI 설치 필요"
    NEED_INSTALL=1
fi
if [ "$UVICORN_OK" = "OK" ]; then
    echo "   [OK] Uvicorn"
else
    echo "   [FAIL] Uvicorn 설치 필요"
    NEED_INSTALL=1
fi
if [ "$PARAMIKO_OK" = "OK" ]; then
    echo "   [OK] Paramiko"
else
    echo "   [FAIL] Paramiko 설치 필요"
    NEED_INSTALL=1
fi
if [ "${NEED_INSTALL:-0}" = "1" ]; then
    echo ""
    echo "   [주의] 의존성 설치: python3 -m pip install -r requirements.txt"
fi
echo ""

# 3. 백엔드 서버 프로세스 확인
echo "3. 백엔드 서버 프로세스 확인:"
if pgrep -f "uvicorn.*app.main:app" > /dev/null; then
    echo "   [OK] 백엔드 서버가 실행 중입니다"
    ps aux | grep "uvicorn.*app.main:app" | grep -v grep | head -1
else
    echo "   [FAIL] 백엔드 서버가 실행되지 않았습니다"
    echo "   실행 방법: cd backend && ./start_server.sh"
fi
echo ""

# 4. 포트 8000 확인
echo "4. 포트 8000 확인:"
if command -v netstat > /dev/null; then
    if netstat -tuln 2>/dev/null | grep -q ":8000"; then
        echo "   [OK] 포트 8000이 열려있습니다"
        netstat -tuln | grep ":8000"
    else
        echo "   [FAIL] 포트 8000이 열려있지 않습니다"
    fi
elif command -v ss > /dev/null; then
    if ss -tuln 2>/dev/null | grep -q ":8000"; then
        echo "   [OK] 포트 8000이 열려있습니다"
        ss -tuln | grep ":8000"
    else
        echo "   [FAIL] 포트 8000이 열려있지 않습니다"
    fi
else
    echo "   [주의] netstat 또는 ss 명령어를 사용할 수 없습니다"
fi
echo ""

# 5. 로컬 연결 테스트
echo "5. 로컬 연결 테스트:"
if command -v curl > /dev/null; then
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "   [OK] localhost:8000 연결 성공"
        curl -s http://localhost:8000/health | head -1
    else
        echo "   [FAIL] localhost:8000 연결 실패"
    fi
else
    echo "   [주의] curl 명령어를 사용할 수 없습니다"
fi
echo ""

# 6. 외부 IP 연결 테스트
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
echo "6. 외부 IP 연결 테스트 (${SERVER_IP}:8000):"
if command -v curl > /dev/null; then
    if curl -s --connect-timeout 2 http://${SERVER_IP}:8000/health > /dev/null 2>&1; then
        echo "   [OK] ${SERVER_IP}:8000 연결 성공"
        curl -s http://${SERVER_IP}:8000/health | head -1
    else
        echo "   [FAIL] ${SERVER_IP}:8000 연결 실패"
        echo "   방화벽 설정을 확인하세요"
    fi
else
    echo "   [주의] curl 명령어를 사용할 수 없습니다"
fi
echo ""

# 7. 방화벽 확인
echo "7. 방화벽 상태 확인:"
if command -v ufw > /dev/null; then
    echo "   UFW 방화벽:"
    sudo ufw status 2>/dev/null | head -5
    if ! sudo ufw status 2>/dev/null | grep -q "8000"; then
        echo "   [주의] 포트 8000이 허용되지 않았습니다"
        echo "   실행: sudo ufw allow 8000/tcp"
    fi
elif command -v firewall-cmd > /dev/null; then
    echo "   firewalld 방화벽:"
    sudo firewall-cmd --list-all 2>/dev/null | grep -A 10 "ports:" || echo "   방화벽 정보를 가져올 수 없습니다"
else
    echo "   [주의] 방화벽 관리 도구를 찾을 수 없습니다"
fi
echo ""

# 8. 해결 방법 제시
echo "=========================================="
echo "해결 방법:"
echo "=========================================="
echo ""
echo "1. 백엔드 서버 실행:"
echo "   cd backend"
echo "   ./start_server.sh"
echo ""
echo "2. 의존성 설치:"
echo "   python3 -m pip install -r requirements.txt"
echo ""
echo "3. 방화벽 설정 (Ubuntu):"
echo "   sudo ufw allow 8000/tcp"
echo "   sudo ufw allow 8080/tcp"
echo ""
echo "4. 방화벽 설정 (Rocky Linux/CentOS):"
echo "   sudo firewall-cmd --permanent --add-port=8000/tcp"
echo "   sudo firewall-cmd --permanent --add-port=8080/tcp"
echo "   sudo firewall-cmd --reload"
echo ""
echo "5. 서버가 0.0.0.0으로 바인딩되었는지 확인:"
echo "   백엔드 실행 시 --host 0.0.0.0 옵션이 필요합니다"
echo ""
echo "6. 브라우저에서 직접 테스트:"
echo "   http://localhost:8000/health"
echo "   http://localhost:8000/docs"
echo ""
