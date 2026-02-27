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



#########################################################################################################################
# ----------------------------------------------------------
# 함수명: U-53
# 설명: FTP 서비스 접속 시 버전 및 시스템 정보 노출 여부 점검
# ----------------------------------------------------------
function U-53() {
    local CHECK_ID="U-53"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="FTP 서비스 정보 노출 제한"
    local EXPECTED_VAL="FTP 서비스를 사용하지 않거나, 접속 배너에서 버전/시스템 정보가 노출되지 않는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. FTP 서비스 실행 여부 확인 (vsftpd, proftpd 등)
    local FTP_ACTIVE=0
    if systemctl is-active vsftpd > /dev/null 2>&1 || systemctl is-active proftpd > /dev/null 2>&1; then
        FTP_ACTIVE=1
    fi

    # 21번 포트 리스닝 확인
    if ss -tuln | grep -q ":21 "; then
        FTP_ACTIVE=1
    fi

    if [ $FTP_ACTIVE -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="FTP 서비스 미사용 또는 비활성화"
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 서비스가 실행 중이지 않아 정보 노출 위험이 없습니다.\"}")
    else
        # 2. vsftpd 설정 점검
        if [ -f /etc/vsftpd/vsftpd.conf ] || [ -f /etc/vsftpd.conf ]; then
            local VSF_CONF=$( [ -f /etc/vsftpd/vsftpd.conf ] && echo "/etc/vsftpd/vsftpd.conf" || echo "/etc/vsftpd.conf" )

            # ftpd_banner 또는 banner_file 설정 확인
            local BANNER_SETTING=$(grep -vE '^[[:space:]]*#' "$VSF_CONF" | grep -E "ftpd_banner|banner_file")

            if [ -z "$BANNER_SETTING" ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: vsftpd 설정에 ftpd_banner 설정이 없어 기본 버전 정보가 노출될 수 있습니다. ($VSF_CONF)\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: vsftpd 접속 배너가 설정되어 있습니다. ($BANNER_SETTING)\"}")
            fi
        fi

        # 3. proftpd 설정 점검
        if [ -f /etc/proftpd.conf ] || [ -f /etc/proftpd/proftpd.conf ]; then
            local PRO_CONF=$( [ -f /etc/proftpd.conf ] && echo "/etc/proftpd.conf" || echo "/etc/proftpd/proftpd.conf" )

            # ServerIdent 설정 확인 (Off 여부)
            local IDENT_SETTING=$(grep -vE '^[[:space:]]*#' "$PRO_CONF" | grep -i "ServerIdent")

            if echo "$IDENT_SETTING" | grep -qi "Off"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: proftpd ServerIdent 설정이 Off로 되어 있어 정보가 숨겨집니다.\"}")
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: proftpd ServerIdent 설정이 없거나 On으로 되어 있어 정보가 노출될 수 있습니다.\"}")
            fi
        fi
    fi

    # 최종 상태 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="FTP 서비스 접속 시 버전 및 시스템 정보가 노출될 위험이 있음"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        [ "$FTP_ACTIVE" -eq 1 ] && CURRENT_VAL="FTP 접속 배너 정보 노출이 차단되어 있음"
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-53)..."
U-53

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
