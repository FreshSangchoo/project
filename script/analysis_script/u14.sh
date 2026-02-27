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
# U-14
# 설명: root 홈, 패스 디렉터리 권한 및 패스 설정
###############################################################################
function U-14() {

    local CHECK_ID="U-14"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="root 홈, 패스 디렉터리 권한 및 패스 설정"
    local EXPECTED_VALUE="PATH 환경변수에 '.'이 맨 앞이나 중간에 포함되지 않음"

    local STATUS="SAFE"
    local CURRENT_VALUE="PATH 환경변수 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # DETAILS_ARRAY+=("\"점검대상: $PATH\"")
    
    # 1. 현재 PATH 값 수집
    local CURRENT_PATH=$PATH

    # 2. PATH 환경변수 보안 진단
    # - ^\.: 맨 앞이 . 인 경우
    # - ^:: 맨 앞이 비어있는 경우 (현재 디렉터리 의미)
    # - :: : 중간이 비어있는 경우
    # - :\.: 중간에 . 이 있는 경우
    if echo "$CURRENT_PATH" | grep -qE '^\.|^:|::|:\.:'; then
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"PATH 환경변수\",\"상태\":\"취약\",\"세부내용\":\"취약: PATH 환경변수의 맨 앞 또는 중간에 '.'(현재 디렉터리)이 포함되어 있습니다.\"}")
    else
        # 맨 마지막에 . 이 있는 경우 (가이드상 양호)
        if echo "$CURRENT_PATH" | grep -qE ':\.$|:$'; then
            DETAILS_ARRAY+=("{\"점검항목\":\"PATH 환경변수\",\"상태\":\"양호\",\"세부내용\":\"양호: PATH 환경변수 맨 마지막에 '.'이 포함되어 있습니다. (가이드 기준 만족)\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"PATH 환경변수\",\"상태\":\"양호\",\"세부내용\":\"양호: PATH 환경변수에 '.' 또는 비어있는 경로가 포함되어 있지 않습니다.\"}")
        fi
    fi

    # 3. 최종 결과 판단
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="PATH 환경변수 내 취약한 경로(.) 설정 발견"
    fi
    
    
     if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # DETAILS_ARRAY를 JSON 배열 문자열로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출을 통한 결과 기록
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-14)..."
U-14

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
