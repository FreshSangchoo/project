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




##################################################################################################################################
function U-61() {
    local CHECK_ID="U-61"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="SNMP Access Control 설정"
    local EXPECTED_VAL="SNMP 서비스에 특정 IP/네트워크 접근 제어(ACL) 설정"
    
    local STATUS="SAFE"
    local CURRENT_VAL="SNMP 접근 제어 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local SNMP_CONF="/etc/snmp/snmpd.conf"

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. SNMP 서비스 활성화 여부 확인
    if ! pgrep -x "snmpd" >/dev/null; then
        DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SNMP 서비스(snmpd)가 실행 중이지 않습니다.\"}")
        #DETAILS_ARRAY+=("\"[참고] 서비스를 사용하지 않는 환경이 보안상 가장 안전합니다.\"")
    else
        #DETAILS_ARRAY+=("\"[서비스] 정보: SNMP 서비스(snmpd)가 실행 중입니다. ACL 설정을 점검합니다.\"")

        if [ -f "$SNMP_CONF" ]; then
            local ACCESS_CONTROL_FOUND=0
            
            # 2. RedHat 계열 점검 (com2sec 설정 확인)
            # com2sec <NAME> <SOURCE> <COMMUNITY>
            local RHEL_CHECK=$(grep -vE "^\s*#" "$SNMP_CONF" | grep "com2sec")
            
            if [ -n "$RHEL_CHECK" ]; then
                # SOURCE 필드가 default나 0.0.0.0이 아닌 특정 IP/대역 설정 여부 확인
                if echo "$RHEL_CHECK" | grep -vE "default|0.0.0.0" >/dev/null; then
                    ACCESS_CONTROL_FOUND=1
                    local RHEL_SAMPLE=$(echo "$RHEL_CHECK" | grep -vE "default|0.0.0.0" | head -n 1 | xargs)
                    DETAILS_ARRAY+=("{\"점검항목\":\"RedHat\",\"상태\":\"양호\",\"세부내용\":\"양호: RedHat 계열(com2sec) 접근 제어 확인 ($RHEL_SAMPLE)\"}")
                fi
            fi

            # 3. Debian 계열 점검 (rocommunity / rwcommunity 설정 확인)
            # rocommunity <COMMUNITY> [SOURCE IP] -> 컬럼 수가 3개 이상이어야 IP 지정됨
            local DEB_CHECK=$(grep -vE "^\s*#" "$SNMP_CONF" | grep -E "rocommunity|rwcommunity")
            
            if [ -n "$DEB_CHECK" ]; then
                while read -r LINE; do
                    local COL_CNT=$(echo "$LINE" | awk '{print NF}')
                    if [ "$COL_CNT" -ge 3 ]; then
                        ACCESS_CONTROL_FOUND=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Debian 계열(ro/rwcommunity) 접근 제어 확인 ($(echo "$LINE" | xargs))\"}")
                    fi
                done <<< "$DEB_CHECK"
            fi

            # 4. 결과 판단
            if [ $ACCESS_CONTROL_FOUND -eq 1 ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 모든 SNMP 커뮤니티 설정에 IP 기반 접근 제어가 적용되어 있습니다.\"}")
            else
                IS_VULN=1
                STATUS="VULNERABLE"
                CURRENT_VAL="SNMP 접근 제어(IP 제한) 설정 미흡"
                DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SNMP 서비스가 구동 중이나 모든 호스트(default)에 개방되어 있습니다.\"}")
                #DETAILS_ARRAY+=("\"[조치] $SNMP_CONF 파일에서 com2sec 또는 rocommunity 뒤에 허용할 특정 IP/대역을 명시하십시오.\"")
                #DETAILS_ARRAY+=("\"[적용] 설정 변경 후 'systemctl restart snmpd' 명령으로 재시작이 필요합니다.\"")
            fi

        else
            IS_VULN=1
            STATUS="VULNERABLE"
            CURRENT_VAL="SNMP 설정 파일 미존재"
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SNMP 설정 파일($SNMP_CONF)을 찾을 수 없습니다.\"}")
        fi
    fi

    # 5. 최종 결과 출력 (화면)
    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-61)..."
U-61

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
