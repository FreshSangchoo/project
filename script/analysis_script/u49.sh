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


#######################################################################################################################
# ----------------------------------------------------------
# 함수명: U-49
# 설명: BIND(DNS) 서비스의 버전 확인 및 보안 취약점 점검
# ----------------------------------------------------------
function U-49() {
    local CHECK_ID="U-49"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="DNS 보안 버전 패치"
    local EXPECTED_VAL="DNS 서비스를 사용하지 않거나, 최신 보안 패치가 적용된 버전을 사용하는 경우"

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
        CURRENT_VAL="BIND 서비스 미사용 또는 비활성화"
        DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: DNS 서비스(named/bind9)가 실행 중이지 않습니다.\"}")
    else
        # 2. BIND 버전 추출
        local BIND_VER=""
        if command -v named > /dev/null 2>&1; then
            BIND_VER=$(named -v | awk '{print $2}')
        fi

        if [ -z "$BIND_VER" ]; then
            # 패키지 매니저를 통한 버전 확인 (OS별)
            if [ -f /etc/redhat-release ]; then
                BIND_VER=$(rpm -q bind --queryformat '%{VERSION}')
            else
                BIND_VER=$(dpkg-l bind9 | grep ^ii | awk '{print $3}' | cut -d'-' -f1)
            fi
        fi

        # 3. 취약 버전 범위 체크 (예시: 9.16.23 미만 등 주요 취약점 기준)
        # 실제 점검 시에는 보안 공고에 따른 최신 기준 적용 필요
        # 여기서는 구체적인 버전 비교 로직 대신 '업데이트 필요 여부' 확인으로 대체

        # 4. 보안 설정 확인 (버전 숨김 설정 여부)
        local CONFIG_PATH=""
        [ -f /etc/named.conf ] && CONFIG_PATH="/etc/named.conf"
        [ -f /etc/bind/named.conf ] && CONFIG_PATH="/etc/bind/named.conf"

        if [ -n "$CONFIG_PATH" ]; then
            if grep -qi "version" "$CONFIG_PATH" | grep -qvE "^[[:space:]]*//|^[[:space:]]*#"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 설정 파일($CONFIG_PATH)에 version 옵션(버전 숨김)이 존재합니다.\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): version 옵션이 설정되지 않아 DNS 쿼리를 통해 버전 정보가 유출될 수 있습니다.\"}")
                ## DETAILS_ARRAY+=("\"양호(주의): version 옵션이 설정되지 않아 DNS 쿼리를 통해 버전 정보가 유출될 수 있습니다.\"")
            fi
        fi

        # 5. OS별 업데이트 가능 여부 체크 (실제 패치 필요성 확인)
        local UPDATE_AVAIL=""
        if [ -f /etc/redhat-release ]; then
            UPDATE_AVAIL=$(dnf check-update bind 2>/dev/null | grep -i "^bind")
        else
            apt update > /dev/null 2>&1
            UPDATE_AVAIL=$(apt list --upgradable bind9 2>/dev/null | grep -i "upgradable")
        fi

        if [ -n "$UPDATE_AVAIL" ]; then
            IS_VULN=1
            STATUS="VULNERABLE"
            CURRENT_VAL="보안 패치가 포함된 상위 버전의 업데이트가 존재함"
            DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 현재 버전에 대한 최신 보안 패치(업데이트)가 발견되었습니다.\"}")
            
        else
            CURRENT_VAL="BIND 최신 패치 적용 상태 (버전: $BIND_VER)"
            

        fi
    fi
    
    if [ "$STATUS" == "VULNERABLE" ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi
    

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-49)..."
U-49

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
