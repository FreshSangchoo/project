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



############################################################################################################################
function U-65() {
    local CHECK_ID="U-65"
    local CATEGORY="로그 관리"
    local DESCRIPTION="NTP 및 시각 동기화 설정"
    local EXPECTED_VAL="Chrony 또는 NTP 서비스가 활성화되어 있고 동기화 서버가 설정되어 있음"
    
    local STATUS="SAFE"
    local CURRENT_VAL="시각 동기화 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local SYNC_FOUND=0

    echo "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # [1] Chrony 서비스 점검 (현대적인 Linux 표준)
    if command -v systemctl >/dev/null 2>&1; then
        if systemctl is-active chronyd 2>/dev/null | grep -q "active"; then
            SYNC_FOUND=1
            #DETAILS_ARRAY+=("\"[서비스] Chrony 서비스(chronyd)가 활성화되어 있습니다.\"")
            
            # 설정 파일 경로 탐색
            local CHRONY_CONF=""
            [ -f "/etc/chrony.conf" ] && CHRONY_CONF="/etc/chrony.conf"
            [ -f "/etc/chrony/chrony.conf" ] && CHRONY_CONF="/etc/chrony/chrony.conf"

            if [ -n "$CHRONY_CONF" ] && grep -vE "^\s*#" "$CHRONY_CONF" | grep -E "^server|^pool" >/dev/null; then
                #DETAILS_ARRAY+=("\"[설정] $CHRONY_CONF 내 동기화 서버(server/pool) 설정 확인\"")
                
                # 동기화 상태 정보 수집
                if command -v chronyc >/dev/null 2>&1; then
                    local CHRONY_STATUS=$(chronyc sources | tail -n +3 | head -n 3 | xargs)
                    #DETAILS_ARRAY+=("\"[상태] Chrony 동기화 소스 정보: $CHRONY_STATUS\"")
                fi
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"NTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Chrony 서비스는 구동 중이나 동기화 서버 설정이 누락되었습니다.\"}")
            fi
        fi
    fi

    # [2] NTP 서비스 점검 (Chrony가 없거나 비활성인 경우)
    if [ $SYNC_FOUND -eq 0 ]; then
        if command -v systemctl >/dev/null 2>&1; then
            if systemctl is-active ntp 2>/dev/null | grep -q "active" || systemctl is-active ntpd 2>/dev/null | grep -q "active"; then
                SYNC_FOUND=1
                #DETAILS_ARRAY+=("\"[서비스] NTP 서비스(ntp/ntpd)가 활성화되어 있습니다.\"")

                if [ -f "/etc/ntp.conf" ] && grep -vE "^\s*#" "/etc/ntp.conf" | grep -E "^server|^pool" >/dev/null; then
                    #DETAILS_ARRAY+=("\"[설정] /etc/ntp.conf 내 동기화 서버 설정 확인\"")
                    
                    # 동기화 상태 정보 수집
                    if command -v ntpq >/dev/null 2>&1; then
                        local NTP_STATUS=$(ntpq -pn | tail -n +3 | head -n 3 | xargs)
                        #DETAILS_ARRAY+=("\"[상태] NTP 동기화 소스 정보: $NTP_STATUS\"")
                    fi
                else
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"NTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: NTP 서비스는 구동 중이나 설정 파일에 서버 설정이 누락되었습니다.\"}")
                fi
            fi
        fi
    fi

    # [3] 서비스 미구동 시 최종 판단
    if [ $SYNC_FOUND -eq 0 ]; then
        IS_VULN=1
        STATUS="VULNERABLE"
        CURRENT_VAL="시각 동기화 서비스 미구동"
        DETAILS_ARRAY+=("{\"점검항목\":\"NTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Chrony 또는 NTP 서비스가 실행되고 있지 않습니다.\"}")
        #DETAILS_ARRAY+=("\"[조치] chrony 또는 ntp 패키지를 설치하고 서비스를 활성화(systemctl enable --now) 하십시오.\"")
    elif [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="시각 동기화 서버 설정 미흡"
        # echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: chrony 또는 ntp 서비스의 서버설정이 잘되어있습니다.\"}")
        # echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    if [ "$STATUS" == "VULNERABLE" ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VAL="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi



    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-65)..."
U-65

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
