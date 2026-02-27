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



#############################################################################################################################
function U-58() {
    local CHECK_ID="U-58"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="불필요한 SNMP 서비스 구동 점검"
    local EXPECTED_VAL="SNMP 서비스를 사용하지 않거나 비활성화된 경우"
    
    local STATUS="SAFE"
    local CURRENT_VAL="SNMP 서비스 비활성화 상태"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local SERVICE_NAME="snmpd"

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. 서비스 활성화 여부 확인
    if command -v systemctl &> /dev/null; then
        # systemctl이 존재하는 현대적인 OS 환경
        if systemctl is-active --quiet "$SERVICE_NAME"; then
            # 서비스가 실행 중인 경우
            IS_VULN=1
            # systemctl list-units 결과에서 상태 정보 추출 (좌우 공백 제거)
            local SERVICE_STATUS=$(systemctl list-units --type=service | grep "$SERVICE_NAME" | xargs)
            
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SNMP 서비스가 활성화(Active) 상태입니다.\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SNMP 서비스가 비활성화(Inactive/Dead) 상태입니다.\"}")
        fi
    else
        # systemctl이 없는 구형 OS 환경 (pgrep 활용)
        if pgrep -x "$SERVICE_NAME" >/dev/null; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SNMP 프로세스($SERVICE_NAME)가 실행 중입니다.\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SNMP 프로세스가 실행 중이지 않습니다.\"}")
        fi
    fi

    # 2. 예외 처리 가이드 및 최종 결과 판단
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="SNMP 서비스 활성화 확인됨"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-58)..."
U-58

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
