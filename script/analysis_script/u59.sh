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



######################################################################################################################
function U-59() {
    local CHECK_ID="U-59"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="안전한 SNMP 버전 사용"
    local EXPECTED_VAL="SNMP v3 사용 및 v1/v2c 비활성화(설정 제거)"
    
    local STATUS="SAFE"
    local CURRENT_VAL="안전한 SNMP v3 사용 중"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local SNMP_CONF="/etc/snmp/snmpd.conf"

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # [1] SNMP 서비스 활성화 여부 확인
    if ! pgrep -x "snmpd" >/dev/null; then
        DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SNMP 서비스(snmpd)가 실행 중이지 않습니다.\"}")
        #DETAILS_ARRAY+=("\"[참고] 서비스를 사용하지 않는 환경이 가장 안전합니다.\"")
    else
        #DETAILS_ARRAY+=("\"정보: SNMP 서비스(snmpd)가 실행 중입니다. 설정을 점검합니다.\"")

        if [ -f "$SNMP_CONF" ]; then
            local V1_V2_FOUND=0
            local V3_FOUND=0

            # [2] v1 / v2c (취약한 버전) 설정 존재 여부 확인
            # 주석 제외하고 rocommunity, rwcommunity, com2sec 키워드 검색
            local V2_LINES=$(grep -vE "^\s*#" "$SNMP_CONF" | grep -E "rocommunity|rwcommunity|com2sec")
            if [ -n "$V2_LINES" ]; then
                V1_V2_FOUND=1
                DETAILS_ARRAY+=("{\"점검항목\":\"v1/v2c\",\"상태\":\"취약\",\"세부내용\":\"취약: v1/v2c 설정이 발견되었습니다.\"}")
                # 발견된 첫 번째 설정을 예시로 기록
                local SAMPLE_V2=$(echo "$V2_LINES" | head -n 1 | xargs)
                #DETAILS_ARRAY+=("\"   >> 발견된 설정 예시: $SAMPLE_V2\"")
            fi

            # [3] v3 (안전한 버전) 설정 존재 여부 확인
            if grep -vE "^\s*#" "$SNMP_CONF" | grep -E "rouser|rwuser|createUser|defVersion\s+3" >/dev/null; then
                V3_FOUND=1
                #DETAILS_ARRAY+=("\"[설정] 정보: SNMP v3 설정(rouser, createUser 등)이 확인되었습니다.\"")
            fi

            # [4] 최종 판단 로직
            if [ $V1_V2_FOUND -eq 1 ]; then
                IS_VULN=1
                STATUS="VULNERABLE"
                CURRENT_VAL="취약한 SNMP 버전(v1/v2c) 설정 잔존"
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: v3 설정 여부와 관계없이 v1/v2c 설정이 활성화되어 있어 위험.\"}")
                #DETAILS_ARRAY+=("\"[조치] 1. $SNMP_CONF 내 com2sec, rocommunity, rwcommunity 항목 주석 처리\"")
                #DETAILS_ARRAY+=("\"[조치] 2. v3 사용자(createUser) 및 권한(rouser) 설정만 유지 후 서비스 재시작\"")
            elif [ $V3_FOUND -eq 1 ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: v1/v2c 설정이 없으며 SNMP v3 정책이 적용되어 있습니다.\"}")
            else
                IS_VULN=1
                STATUS="VULNERABLE"
                CURRENT_VAL="SNMP v3 미설정"
                DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 명확한 SNMP v3 설정(rouser/createUser)을 찾을 수 없습니다.\"}")
                #DETAILS_ARRAY+=("\"[조치] net-snmp-create-v3-user 명령어를 사용하여 v3 사용자를 생성하십시오.\"")
            fi
        else
            IS_VULN=1
            STATUS="VULNERABLE"
            CURRENT_VAL="SNMP 설정 파일 미존재"
            ## 흐음 흐음 
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SNMP 설정 파일($SNMP_CONF)을 찾을 수 없습니다.\"}")
        fi
    fi

    # [5] 최종 결과 출력 (화면)
    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-59)..."
U-59

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
