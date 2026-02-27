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


###########################################################################################################################
#################################################
#  U-46
#################################################
function U-46() {
    local CHECK_ID="U-46"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="일반 사용자의 메일 서비스 실행 방지"
    local EXPECTED_VAL="Sendmail restrictqrun 옵션 설정 또는 SMTP 제어 명령어(postsuper, exiqgrep 등)의 일반 사용자 실행 권한 제한"
    
    local STATUS="SAFE"
    local CURRENT_VAL="메일 서비스 실행 권한 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local SMTP_FOUND=0

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. Sendmail 점검
    if ps -ef | grep "sendmail" | grep -v "grep" > /dev/null || [ -f "/etc/mail/sendmail.cf" ]; then
        SMTP_FOUND=1
        local CONF_FILE="/etc/mail/sendmail.cf"
        
        if [ -f "$CONF_FILE" ]; then
            # PrivacyOptions 내 restrictqrun 옵션 포함 여부 확인
            if grep -v '^ *#' "$CONF_FILE" | grep -i "PrivacyOptions" | grep -q "restrictqrun"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"PrivacyOptions에\",\"상태\":\"양호\",\"세부내용\":\"양호: PrivacyOptions에 restrictqrun 옵션이 설정되어 있습니다.\"}")
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"restrictqrun\",\"상태\":\"취약\",\"세부내용\":\"취약: restrictqrun 옵션이 설정되어 있지 않습니다.\"}")
            fi
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: [Sendmail] 서비스 감지되었으나 설정파일($CONF_FILE)이 없습니다.\"}")
        fi
    fi

    # 2. Postfix 점검
    if [ -f "/usr/sbin/postsuper" ]; then
        SMTP_FOUND=1
        local POST_FILE="/usr/sbin/postsuper"
        # Other 실행 권한(x) 확인
        local PERM_OTHER=$(ls -l "$POST_FILE" | awk '{print $1}' | cut -c 10)

        if [ "$PERM_OTHER" == "x" ]; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"$POST_FILE\",\"상태\":\"취약\",\"세부내용\":\"취약: $POST_FILE 파일에 일반 사용자 실행 권한이 부여되어 있습니다.\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"$POST_FILE\",\"상태\":\"양호\",\"세부내용\":\"양호: $POST_FILE 파일의 일반 사용자 실행 권한이 제한되어 있습니다.\"}")
        fi
    fi

    # 3. Exim 점검
    if [ -f "/usr/sbin/exiqgrep" ]; then
        SMTP_FOUND=1
        local EXIM_FILE="/usr/sbin/exiqgrep"
        local PERM_OTHER=$(ls -l "$EXIM_FILE" | awk '{print $1}' | cut -c 10)

        if [ "$PERM_OTHER" == "x" ]; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $EXIM_FILE 파일에 일반 사용자 실행 권한이 부여되어 있습니다.\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $EXIM_FILE 파일의 일반 사용자 실행 권한이 제한되어 있습니다.\"}")
        fi
    fi

    # 4. 결과 종합 처리
    if [ $SMTP_FOUND -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 시스템에서 주요 SMTP 서비스(Sendmail, Postfix, Exim)가 발견되지 않았습니다.\"}")
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    else 
        STATUS="VULNERABLE"
        CURRENT_VAL="일부 메일 서비스 제어 권한 미흡"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-46)..."
U-46

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
