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



#####################################################################################################################
# ----------------------------------------------------------
# 함수명: U-51
# 설명: DNS 서비스의 취약한 동적 업데이트 설정 여부 점검
# ----------------------------------------------------------
function U-51() {
    local CHECK_ID="U-51"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="DNS 서비스의 취약한 동적 업데이트 설정 금지"
    local EXPECTED_VAL="DNS 서비스를 사용하지 않거나, 동적 업데이트가 특정 호스트로 제한(또는 none)된 경우"

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
        DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: DNS 서비스(named/bind9)가 실행 중이지 않아 보안 위협이 없습니다.\"}")
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
            DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): 서비스는 실행 중이나 설정 파일(named.conf)을 찾을 수 없습니다. 수동 확인이 필요합니다.\"}")
            ## DETAILS_ARRAY+=("\"양호(주의): 서비스는 실행 중이나 설정 파일(named.conf)을 찾을 수 없습니다. 수동 확인이 필요합니다.\"")
        else
            # 3. 전역(options) 및 구역(zone) 내 allow-update 설정 확인
            # 주석 제외 후 allow-update 라인 추출
            local update_configs=$(grep -vE '^[[:space:]]*(//|#)' "$CONF_PATH" | grep "allow-update")

            if [ -z "$update_configs" ]; then
                # BIND 기본값은 allow-update { none; }; 이므로 설정이 없으면 양호로 간주함
                # 단, 명시적인 설정을 권장하므로 정보성 메시지 출력
                STATUS="SAFE"
                CURRENT_VAL="명시적인 동적 업데이트 설정 없음 (기본값 none 적용)"
                DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 설정 파일에 allow-update 설정이 없으며, BIND 기본값인 'none'으로 동작합니다.\"}")
            else
                # allow-update 설정이 존재하는 경우 분석
                while read -r line; do
                    if echo "$line" | grep -qiE "any|0\.0\.0\.0/0"; then
                        IS_VULN=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"취약한\",\"상태\":\"취약\",\"세부내용\":\"취약: 취약한 동적 업데이트 설정 발견: $line\"}")
                    else
                        DETAILS_ARRAY+=("{\"점검항목\":\"제한된\",\"상태\":\"양호\",\"세부내용\":\"양호: 제한된 업데이트 설정 확인: $line\"}")
                    fi
                done <<< "$update_configs"
            fi
        fi
    fi

    # 최종 상태 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="DNS 동적 업데이트가 모든 호스트(any)에 대해 허용되어 있음"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        [ -z "$CURRENT_VAL" ] && CURRENT_VAL="동적 업데이트가 적절히 제한되어 있음"
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-51)..."
U-51

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
