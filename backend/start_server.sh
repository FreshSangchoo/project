#!/bin/bash
# AUTOISMS 백엔드 서버 시작 스크립트

echo "AUTOISMS 백엔드 서버를 시작합니다..."

# 프로젝트 루트로 이동
cd "$(dirname "$0")"

# Python 가상환경 활성화 (있는 경우)
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "가상환경 활성화됨"
fi

# 의존성 확인
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "의존성이 설치되지 않았습니다. 설치를 시작합니다..."
    python3 -m pip install -r requirements.txt
fi

# 환경변수 설정
if [ -z "$AUTOISMS_ENCRYPTION_KEY" ]; then
    export AUTOISMS_ENCRYPTION_KEY="dev-key-$(date +%s)"
    echo "임시 암호화 키 설정됨 (프로덕션에서는 반드시 변경하세요)"
fi

# 서버 시작 (모든 인터페이스에서 접근 가능하도록 0.0.0.0 사용)
echo "백엔드 서버를 시작합니다 (http://0.0.0.0:8000)..."
echo "접속 주소: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):8000"
echo "헬스체크: http://localhost:8000/health"
echo ""
echo "서버를 중지하려면 Ctrl+C를 누르세요."
echo ""

python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
