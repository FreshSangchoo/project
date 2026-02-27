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

# ----------------------------------------------------------
# 함수명: U-38
# 설명: DoS 공격에 취약한 서비스 비활성화 점검
# ----------------------------------------------------------
function U-38() {
    local CHECK_ID="U-38"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="DoS 공격에 취약한 서비스 비활성화"
    local EXPECTED_VAL="echo, discard, daytime, chargen, time, tftp 등 DoS 취약 서비스가 비활성화된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local ACTIVE_VULNERABLE=0
    local INACTIVE_SERVICES=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # DoS 공격에 취약한 서비스 목록
    local VULNERABLE_SERVICES=(
        "echo:7:UDP Echo 프로토콜 (증폭 공격)"
        "discard:9:Discard 프로토콜 (증폭 공격)"
        "daytime:13:Daytime 프로토콜 (증폭 공격)"
        "chargen:19:Character Generator (증폭 공격)"
        "time:37:Time 프로토콜"
        "tftp:69:TFTP (인증 없는 파일 전송)"
    )

    # systemd 서비스 이름
    local SYSTEMD_SERVICES=(
        "echo.socket" "echo-dgram.socket"
        "discard.socket" "discard-dgram.socket"
        "daytime.socket" "daytime-dgram.socket"
        "chargen.socket" "chargen-dgram.socket"
        "time.socket" "time-dgram.socket"
        "tftp.socket" "tftp"
    )

    # [점검 1] xinetd 기반 취약 서비스 확인
    if ! command -v xinetd > /dev/null 2>&1; then
        DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: xinetd 미설치\"}")
    elif ! systemctl is-active xinetd > /dev/null 2>&1; then
        DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: xinetd 비활성화\"}")
    else
        if [ ! -d /etc/xinetd.d ]; then
            :
            #DETAILS_ARRAY+=("\"정보: /etc/xinetd.d 디렉토리 없음\"")
        else
            local vulnerable_found=0

            for service_info in "${VULNERABLE_SERVICES[@]}"; do
                local service_name=$(echo "$service_info" | cut -d':' -f1)
                local service_port=$(echo "$service_info" | cut -d':' -f2)
                local service_desc=$(echo "$service_info" | cut -d':' -f3)

                local config_file="/etc/xinetd.d/${service_name}"

                if [ -f "$config_file" ]; then
                    ((TOTAL_CHECKED++))

                    local disable_status=$(grep -i "disable" "$config_file" | grep -v "^#" | awk '{print $3}')

                    if [ "$disable_status" = "no" ]; then
                        DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $service_name (포트 $service_port) - xinetd 활성화 - $service_desc\"}")
                        ((ACTIVE_VULNERABLE++))
                        IS_VULN=1
                        vulnerable_found=1
                    else
                        DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $service_name - xinetd 비활성화\"}")
                        ((INACTIVE_SERVICES++))
                    fi
                fi
            done

            if [ $vulnerable_found -eq 0 ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: xinetd 취약 서비스 설정 없음\"}")
            fi
        fi
    fi

    # [점검 2] systemd 기반 취약 서비스 확인
    for service in "${SYSTEMD_SERVICES[@]}"; do
        if systemctl list-unit-files "$service" > /dev/null 2>&1; then
            ((TOTAL_CHECKED++))

            local status=$(systemctl is-active "$service" 2>/dev/null)

            if [ "$status" = "active" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - 실행 중\"}")
                ((ACTIVE_VULNERABLE++))
                IS_VULN=1
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - 비활성화\"}")
                ((INACTIVE_SERVICES++))
            fi
        fi
    done

    # [점검 3] inetd.conf 파일 확인
    if [ ! -f /etc/inetd.conf ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/inetd.conf\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/inetd.conf 파일 없음\"}")
    else
        local vulnerable_found=0

        for service_info in "${VULNERABLE_SERVICES[@]}"; do
            local service_name=$(echo "$service_info" | cut -d':' -f1)
            local service_desc=$(echo "$service_info" | cut -d':' -f3)

            if grep "^[^#]*${service_name}" /etc/inetd.conf > /dev/null 2>&1; then
                ((TOTAL_CHECKED++))
                DETAILS_ARRAY+=("{\"점검항목\":\"$service_name\",\"상태\":\"취약\",\"세부내용\":\"취약: $service_name - inetd.conf 활성화 - $service_desc\"}")
                ((ACTIVE_VULNERABLE++))
                IS_VULN=1
                vulnerable_found=1
            fi
        done

        if [ $vulnerable_found -eq 0 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"inetd.conf\",\"상태\":\"양호\",\"세부내용\":\"양호: inetd.conf 취약 서비스 설정 없음\"}")
        fi
    fi

    # [점검 4] 취약 포트 리스닝 여부 확인
    local vulnerable_ports=(7 9 13 19 37 69)
    local found_listening=0

    for port in "${vulnerable_ports[@]}"; do
        if ss -tuln 2>/dev/null | grep -q ":${port} "; then
            ((TOTAL_CHECKED++))

            local protocol=$(ss -tuln 2>/dev/null | grep ":${port} " | awk '{print $1}' | head -1)
            local address=$(ss -tuln 2>/dev/null | grep ":${port} " | awk '{print $5}' | head -1)

            DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 포트 $port/$protocol 리스닝 중 ($address)\"}")
            ((ACTIVE_VULNERABLE++))
            IS_VULN=1
            found_listening=1
        fi
    done

    if [ $found_listening -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 취약 포트 리스닝 없음\"}")
    fi

    # [점검 5] 추가 점검 서비스 확인 (NTP, SNMP)
    local OPTIONAL_SYSTEMD=("ntpd" "snmpd")

    for service in "${OPTIONAL_SYSTEMD[@]}"; do
        if systemctl list-unit-files "$service" > /dev/null 2>&1; then
            local status=$(systemctl is-active "$service" 2>/dev/null)

            if [ "$status" = "active" ]; then
                
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호 :(주의) $service - 실행 중 (보안 설정 확인 필요)\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - 비활성화\"}")
            fi
        fi
    done

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="점검 대상 서비스 없음"
        # DETAILS_ARRAY+=("{\"점검항목\":\"DoS\",\"상태\":\"양호\",\"세부내용\":\"양호: DoS 취약 서비스가 설치되지 않았습니다.\"}")
    elif [ $ACTIVE_VULNERABLE -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 서비스 모두 비활성화"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 중 활성화 ${ACTIVE_VULNERABLE}개, 비활성화 ${INACTIVE_SERVICES}개"
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
echo "점검 시작 (단일 항목: U-38)..."
U-38

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
