#!/bin/bash
# AUTOISMS 프론트엔드 서버 시작 스크립트

echo "AUTOISMS 프론트엔드 서버를 시작합니다..."

# 프로젝트 루트로 이동
cd "$(dirname "$0")"

# Python 3 HTTP 서버 시작
echo "프론트엔드 서버를 시작합니다 (http://0.0.0.0:8080)..."
echo "접속 주소: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):8080"
echo ""
echo "서버를 중지하려면 Ctrl+C를 누르세요."
echo ""

python3 -m http.server 8080
