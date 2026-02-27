#!/bin/bash
# 의존성 설치 스크립트

echo "=========================================="
echo "AUTOISMS 의존성 설치"
echo "=========================================="
echo ""

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Python 확인
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "오류: Python이 설치되지 않았습니다"
    exit 1
fi

PYTHON_CMD=$(command -v python3 || command -v python)
echo "Python 경로: $PYTHON_CMD"
$PYTHON_CMD --version
echo ""

# requirements.txt 확인
if [ ! -f "requirements.txt" ]; then
    echo "오류: requirements.txt를 찾을 수 없습니다"
    exit 1
fi

echo "의존성 설치를 시작합니다..."
echo "이 작업은 몇 분이 걸릴 수 있습니다."
echo ""

# pip 업그레이드
echo "[1/3] pip 업그레이드 중..."
$PYTHON_CMD -m pip install --upgrade pip -q
echo "완료"
echo ""

# 의존성 설치
echo "[2/3] 패키지 설치 중..."
$PYTHON_CMD -m pip install -r requirements.txt
INSTALL_RESULT=$?

if [ $INSTALL_RESULT -ne 0 ]; then
    echo ""
    echo "오류: 의존성 설치에 실패했습니다"
    exit 1
fi

echo ""
echo "[3/3] 설치 확인 중..."
echo ""

# 설치 확인
FASTAPI_OK=$(python3 -c "import fastapi; print('OK')" 2>/dev/null || echo "NO")
UVICORN_OK=$(python3 -c "import uvicorn; print('OK')" 2>/dev/null || echo "NO")
PARAMIKO_OK=$(python3 -c "import paramiko; print('OK')" 2>/dev/null || echo "NO")

if [ "$FASTAPI_OK" = "OK" ] && [ "$UVICORN_OK" = "OK" ] && [ "$PARAMIKO_OK" = "OK" ]; then
    echo "[OK] 모든 의존성이 성공적으로 설치되었습니다!"
    echo ""
    echo "다음 단계:"
    echo "  ./start_server.sh  또는"
    echo "  python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
    echo ""
else
    echo "[주의] 일부 패키지 설치에 문제가 있을 수 있습니다"
    echo "FastAPI: $FASTAPI_OK"
    echo "Uvicorn: $UVICORN_OK"
    echo "Paramiko: $PARAMIKO_OK"
    echo ""
    echo "수동으로 다시 설치해보세요:"
    echo "  python3 -m pip install -r requirements.txt"
fi
