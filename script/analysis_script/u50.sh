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


#################################################################################################################
# ----------------------------------------------------------
# 함수명: U-50
# 설명: DNS Zone Transfer를 특정 서버로 제한했는지 점검
# ----------------------------------------------------------
function U-50() {
    local CHECK_ID="U-50"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="DNS Zone Transfer 설정"
    local EXPECTED_VAL="DNS 서비스를 사용하지 않거나, Zone Transfer를 특정 IP 또는 none으로 제한한 경우"
    
    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. BIND 서비스 실행 여부 확인
    local SERVICE_ACTIVE=0
    if systemctl is-active named > /dev/null 2>&1 || systemctl is-active bind9 > /dev/null 2>&1; then
        SERVICE_ACTIVE=1
    fi

    if [ $SERVICE_ACTIVE -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="DNS 서비스 미사용 또는 비활성화"
        DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: DNS 서비스(named/bind9)가 실행 중이지 않아 점검이 불필요합니다.\"}")
    else
        # 2. BIND 설정 파일 경로 탐색
        local CONF_PATH=""
        local SEARCH_PATHS=("/etc/named.conf" "/etc/bind/named.conf" "/var/named/chroot/etc/named.conf")
        for path in "${SEARCH_PATHS[@]}"; do
            [ -f "$path" ] && CONF_PATH="$path" && break
        done

        if [ -z "$CONF_PATH" ]; then
            STATUS="SAFE"
            CURRENT_VAL="설정 파일을 찾을 수 없음"
            DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): BIND 서비스는 실행 중이나 표준 경로에서 named.conf를 찾을 수 없습니다.\"}")
            ## DETAILS_ARRAY+=("\"양호(주의): BIND 서비스는 실행 중이나 표준 경로에서 named.conf를 찾을 수 없습니다.\"")
        else
            # 3. options 블록 내 전역 allow-transfer 확인
            # 주석(//, #)을 제외하고 allow-transfer 행 추출
            local global_transfer=$(grep -vE '^[[:space:]]*(//|#)' "$CONF_PATH" | grep "allow-transfer")

            if [ -z "$global_transfer" ]; then
                # 설정이 아예 없으면 기본값이 'any'이므로 취약
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 전역 allow-transfer 설정이 누락되었습니다 (기본값 any로 작동).\"}")
            elif echo "$global_transfer" | grep -qiE "any|0\.0\.0\.0/0"; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 전역 allow-transfer가 'any' 또는 전체 대역(0.0.0.0/0)으로 허용되어 있습니다.\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 전역 allow-transfer가 설정되어 있습니다: $(echo $global_transfer | xargs)\"}")
            fi

            # 4. 개별 Zone 블록 내 allow-transfer 확인 (추가 점검)
            # 전역 설정이 양호하더라도 개별 Zone에서 any로 풀려있을 수 있음
            local zone_any_count=$(grep -vE '^[[:space:]]*(//|#)' "$CONF_PATH" | sed -n '/zone/,/}/p' | grep "allow-transfer" | grep -ci "any")
echo "점검 시작 (단일 항목: U-50)..."
U-50

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
