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



###############################################################################################################################
function U-60() {
    local CHECK_ID="U-60"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="SNMP Community String 복잡성 설정"
    local EXPECTED_VAL="영문/숫자 10자 이상 또는 특수문자 포함 8자 이상 (public/private 사용 금지)"
    
    local STATUS="SAFE"
    local CURRENT_VAL="Community String 복잡성 기준 만족"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local SNMP_CONF="/etc/snmp/snmpd.conf"

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. SNMP 서비스 활성화 여부 확인
    if ! pgrep -x "snmpd" >/dev/null; then
        DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SNMP 서비스(snmpd)가 실행 중이지 않습니다.\"}")
        #DETAILS_ARRAY+=("\"[참고] 서비스를 사용하지 않는 환경이 보안상 가장 안전합니다.\"")
    else
        #DETAILS_ARRAY+=("\"[서비스] 정보: SNMP 서비스(snmpd)가 실행 중입니다. 설정을 점검합니다.\"")

        if [ -f "$SNMP_CONF" ]; then
            # Community String 추출 (RedHat/Debian 스타일 통합 추출)
            local STRINGS_RHEL=$(grep -vE "^\s*#" "$SNMP_CONF" | grep "com2sec" | awk '{print $4}')
            local STRINGS_DEB=$(grep -vE "^\s*#" "$SNMP_CONF" | grep -E "rocommunity|rwcommunity" | awk '{print $2}')
            local ALL_STRINGS="$STRINGS_RHEL $STRINGS_DEB"

            if [ -z "$(echo $ALL_STRINGS | xargs)" ]; then
                :
                #DETAILS_ARRAY+=("\"[설정] 정보: 설정 파일 내 Community String 설정이 발견되지 않았습니다. (v3 전용 가능성)\"")
            else
                local WEAK_FOUND=0
                for COM_STR in $ALL_STRINGS; do
                    local LEN=${#COM_STR}
                    local IS_WEAK=0
                    local REASON=""

                    # [검사 1] 기본값 사용 여부
                    if [[ "$COM_STR" == "public" || "$COM_STR" == "private" ]]; then
                        IS_WEAK=1
                        REASON="기본값($COM_STR) 사용"
                    # [검사 2] 복잡도 및 길이 검사
                    else
                        # 특수문자 포함 여부 확인
                        if [[ "$COM_STR" =~ [^a-zA-Z0-9] ]]; then
                            if [ $LEN -lt 8 ]; then
                                IS_WEAK=1
                                REASON="특수문자 포함 8자 미만(현재: ${LEN}자)"
                            fi
                        else
                            if [ $LEN -lt 10 ]; then
                                IS_WEAK=1
                                REASON="영문/숫자 구성 10자 미만(현재: ${LEN}자)"
                            fi
                        fi
                    fi

                    # 결과 기록
                    if [ $IS_WEAK -eq 1 ]; then
                        WEAK_FOUND=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"발견된\",\"상태\":\"취약\",\"세부내용\":\"취약: 발견된 String: $COM_STR (사유: $REASON)\"}")
                    else
                        DETAILS_ARRAY+=("{\"점검항목\":\"발견된\",\"상태\":\"양호\",\"세부내용\":\"양호: 발견된 String: $COM_STR (복잡도 기준 만족)\"}")
                    fi
                done

                # 최종 판정
                if [ $WEAK_FOUND -eq 1 ]; then
                    IS_VULN=1
                    STATUS="VULNERABLE"
                    CURRENT_VAL="취약한 Community String 발견"
                    #DETAILS_ARRAY+=("\"[조치] vi $SNMP_CONF 수정 후 'systemctl restart snmpd'로 적용하십시오.\"")
                fi
            fi
        else
            IS_VULN=1
            STATUS="VULNERABLE"
            CURRENT_VAL="SNMP 설정 파일 미존재"
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SNMP 설정 파일($SNMP_CONF)을 찾을 수 없습니다.\"}")
        fi
    fi

    # 2. 최종 결과 출력 (화면)
    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-60)..."
U-60

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
