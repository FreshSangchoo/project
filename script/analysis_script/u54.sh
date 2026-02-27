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
# ----------------------------------------------------------
# 함수명: U-54
# 설명: 암호화되지 않은 FTP 서비스 비활성화 여부 점검
# ----------------------------------------------------------
function U-54() {
    local CHECK_ID="U-54"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="암호화되지 않은 FTP 서비스 비활성화"
    local EXPECTED_VAL="일반 FTP 서비스를 비활성화하고 SFTP 또는 FTPS를 사용하는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. FTP 관련 서비스 유닛 상태 확인 (vsftpd, proftpd, pure-ftpd 등)
    local FTP_SERVICES=("vsftpd" "proftpd" "pure-ftpd")
    local ACTIVE_SERVICES=()

    for svc in "${FTP_SERVICES[@]}"; do
        if systemctl is-active "$svc" > /dev/null 2>&1; then
            ACTIVE_SERVICES+=("$svc")
            IS_VULN=1
        fi
    done

    # 2. 포트 리스닝 확인 (표준 FTP 포트: 21)
    if ss -tuln | grep -q ":21 "; then
        IS_VULN=1
        local PORT_DETAIL=$(ss -tuln | grep ":21 " | awk '{print $5}')
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 21번 포트(FTP)가 현재 리스닝 상태입니다. ($PORT_DETAIL)\"}")
    fi

    # 3. xinetd 기반 FTP 서비스 확인 (일부 레거시 환경)
    if [ -d /etc/xinetd.d ]; then
        local XINETD_FTP=$(grep -lE "service[[:space:]]+ftp" /etc/xinetd.d/* 2>/dev/null)
        for conf in $XINETD_FTP; do
            if ! grep -q "disable[[:space:]]*=[[:space:]]*yes" "$conf"; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: xinetd 설정에 의해 FTP 서비스가 활성화되어 있습니다. ($conf)\"}")
            fi
        done
    fi

    # 최종 상태 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
        # 실행 중인 서비스 이름이 있으면 포함
        if [ ${#ACTIVE_SERVICES[@]} -gt 0 ]; then
            CURRENT_VAL="암호화되지 않은 FTP 서비스(${ACTIVE_SERVICES[*]})가 활성화됨"
            DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 현재 실행 중인 서비스: ${ACTIVE_SERVICES[*]}\"}")
        else
            CURRENT_VAL="암호화되지 않은 FTP 서비스(21번 포트)가 활성화되어 있음"
        fi
    else
        STATUS="SAFE"
        CURRENT_VAL="암호화되지 않은 FTP 서비스가 비활성화됨"
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 일반 FTP 서비스 유닛이 중지되어 있으며 21번 포트가 닫혀 있습니다.\"}")
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-54)..."
U-54

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
