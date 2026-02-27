#!/bin/bash

# 로컬 환경 설정 (한글 깨짐 방지)
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export TZ=Asia/Seoul

## 그래도 깨져보이면 이거 쓰기
## export LANG=C.UTF-8
## export LC_ALL=C.UTF-8

###############################################################################
# Script Name: security_check.sh
# Description: 보안 점검 스크립트 (JSON 출력)
# Target OS: Rocky Linux 9.7, Ubuntu 24
# Author: Security Automation Project
# Date: 2026-02-09
###############################################################################

# [환경 설정]
RESULT_JSON="result.json"
HOSTNAME=$(hostname)

# OS 타입 자동 감지
if [ -f /etc/rocky-release ]; then
    OS_TYPE="rocky"
elif [ -f /etc/lsb-release ] && grep -q "Ubuntu" /etc/lsb-release; then
    OS_TYPE="ubuntu"
else
    OS_TYPE="unknown"
fi

OS_VERSION=$(grep -oP '(?<=^VERSION_ID=).+' /etc/os-release | tr -d '"' 2>/dev/null || echo "unknown")

# [JSON 초기화]
echo "[" > "$RESULT_JSON"

# ----------------------------------------------------------
# 함수명: Write_JSON_Result
# 설명: 모든 점검 항목을 동일한 JSON 규격으로 기록
# ----------------------------------------------------------
function Write_JSON_Result() {
    local CHECK_ID=$1
    local CATEGORY=$2
    local DESCRIPTION=$3
    local STATUS=$4
    local CURRENT_VAL=$5
    local EXPECTED_VAL=$6
    local DETAILS=$7

    if [ $(wc -l < "$RESULT_JSON") -gt 1 ]; then
        sed -i '$s/$/,/' "$RESULT_JSON"
    fi

    cat <<EOF >> "$RESULT_JSON"
{
  "check_id": "$CHECK_ID",
  "category": "$CATEGORY",
  "description": "$DESCRIPTION",
  "hostname": "$HOSTNAME",
  "os_type": "$OS_TYPE",
  "os_version": "$OS_VERSION",
  "timestamp": "$(date '+%Y-%m-%d %H:%M:%S')",
  "status": "$STATUS",
  "current_value": "$CURRENT_VAL",
  "expected_value": "$EXPECTED_VAL",
  "details": $DETAILS
}
EOF
}

# ----------------------------------------------------------
# 함수명: Add_Detail_Item
# 설명: 구조화된 점검 항목을 DETAILS_ARRAY에 JSON 객체로 추가
# 인자: check_name, check_file, check_cmd, status, detail
# ----------------------------------------------------------
function Add_Detail_Item() {
    local check_name="$1"
    local check_file="$2"
    local check_cmd="$3"
    local status="$4"
    local detail="$5"

    # 특수문자 이스케이프 (백슬래시, 큰따옴표)
    check_cmd=$(echo "$check_cmd" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
    detail=$(echo "$detail" | sed 's/"/\\"/g')

    local json_obj="{\"점검항목\":\"$check_name\",\"상태\":\"$status\",\"세부내용\":\"$detail\"}"
    DETAILS_ARRAY+=("$json_obj")
}

# ----------------------------------------------------------
# 함수명: Build_Details_JSON
# 설명: DETAILS_ARRAY를 JSON 배열 문자열로 변환
# ----------------------------------------------------------
function Build_Details_JSON() {
    local DETAILS_JSON="["
    for i in "${!DETAILS_ARRAY[@]}"; do
        [ $i -gt 0 ] && DETAILS_JSON+=","
        DETAILS_JSON+="${DETAILS_ARRAY[$i]}"
    done
    DETAILS_JSON+="]"
    echo "$DETAILS_JSON"
}



###############################################################################
# U-34 (2026 가이드라인 반영)
# 설명: 시스템 정보 노출 위험이 있는 Finger 서비스의 비활성화 여부 점검
###############################################################################
function U-34() {
    local CHECK_ID="U-34"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="Finger 서비스 비활성화"
    local EXPECTED_VALUE="Finger 서비스 비활성화 또는 미설치"

    local STATUS="SAFE"
    local CURRENT_VALUE="Finger 서비스 비활성화 상태"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. inetd 점검 (가이드라인 Step 1 반영)
    if [ -f "/etc/inetd.conf" ]; then
        ##만약 finger라는 단어가 주석 없이 있다면 취약
        if grep -vE "^#|^\s*#" /etc/inetd.conf | grep -qi "finger"; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"etc/inetd.conf\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/inetd.conf 내 Finger 서비스가 활성화됨\"}")
        fi
    fi

    # 2. xinetd 점검 (가이드라인 Step 1 반영)
    if [ -f "/etc/xinetd.d/finger" ]; then
        if grep -vE "^#|^\s*#" /etc/xinetd.d/finger | grep -qi "disable" | grep -q "no"; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/xinetd.d/finger 설정이 활성화(disable=no)됨\"}")
        fi
    fi

    # 3. Systemd 서비스 및 포트 점검
    if command -v systemctl >/dev/null 2>&1; then
        local finger_units=("finger.service" "finger.socket" "fingerd.service" "cfingerd.service")
        for unit in "${finger_units[@]}"; do
            if systemctl is-active --quiet "$unit" 2>/dev/null; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"Systemd\",\"상태\":\"취약\",\"세부내용\":\"취약: Systemd $unit 서비스가 활성화(active) 상태임\"}")
            fi
        done
    fi

    # 4. 결과 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="Finger 서비스 활성화 확인됨"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        STATUS="SAFE"
        CURRENT_VALUE="Finger 서비스 비활성화 상태"
        DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 가동 중인 Finger 서비스가 발견되지 않았습니다.\"}")
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-34)..."
U-34

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
