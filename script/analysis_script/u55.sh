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



########################################################################################################################
# ----------------------------------------------------------
# 함수명: U-55
# 설명: FTP 기본 계정에 로그인이 불가능한 쉘 부여 여부 점검
# ----------------------------------------------------------
function U-55() {
    local CHECK_ID="U-55"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="FTP 계정 Shell 제한"
    local EXPECTED_VAL="FTP 계정에 /bin/false 또는 /sbin/nologin 쉘이 부여된 경우"
    
    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. 시스템 내 FTP 관련 계정 확인 (일반적으로 'ftp')
    local FTP_USER_INFO=$(grep "^ftp:" /etc/passwd)

    if [ -z "$FTP_USER_INFO" ]; then
        STATUS="SAFE"
        CURRENT_VAL="시스템에 FTP 기본 계정이 존재하지 않음"
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 시스템에 'ftp' 기본 계정이 존재하지 않아 보안 위협이 없습니다.\"}")
    else
        # 2. 부여된 쉘 확인
        local USER_SHELL=$(echo "$FTP_USER_INFO" | awk -F: '{print $7}')
        
        # 3. 판단 기준 적용 (/bin/false 또는 /sbin/nologin 인지 확인)
        case "$USER_SHELL" in
            *"/sbin/nologin" | *"/bin/false")
                STATUS="SAFE"
                CURRENT_VAL="FTP 계정에 로그인 불가능한 쉘($USER_SHELL)이 적절히 부여됨"
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 계정의 쉘이 $USER_SHELL 로 설정되어 시스템 접근이 차단되어 있습니다.\"}")
                ;;
            *)
                IS_VULN=1
                STATUS="VULNERABLE"
                CURRENT_VAL="FTP 계정에 취약한 쉘($USER_SHELL)이 부여되어 있음"
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: FTP 계정('ftp')에 시스템 접근이 가능한 쉘($USER_SHELL)이 부여되어 있습니다.\"}")
                ;;
        esac
    fi

    # 4. 추가 점검: FTP 서비스 실행 여부와 관계없이 계정 설정 위주로 판단
    if systemctl is-active vsftpd > /dev/null 2>&1 || systemctl is-active proftpd > /dev/null 2>&1; then
        ## DETAILS_ARRAY+=("\"정보: 현재 FTP 서비스가 활성화 상태입니다. 계정 보안 설정이 더욱 중요합니다.\"")
        :
    fi

    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-55)..."
U-55

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
