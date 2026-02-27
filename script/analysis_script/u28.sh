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



######################################################################################################################
# 함수명: U-28
# 설명: 접속 IP 주소 및 포트 제한
# ----------------------------------------------------------
function U-28() {
    local CHECK_ID="U-28"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="접속 IP 및 포트 제한"
    local EXPECTED_VAL="TCP Wrapper, 방화벽 등 접근 제어 설정이 적용된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local CHECK_COUNT=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # OS 종류 감지
    local os_type=""
    if [ -f /etc/redhat-release ]; then
        os_type="rocky"
    elif [ -f /etc/lsb-release ] || [ -f /etc/debian_version ]; then
        os_type="ubuntu"
    else
        os_type="unknown"
    fi

    # [점검 1] TCP Wrapper 설정 확인

    local wrapper_found=0

    # /etc/hosts.allow 확인
    if [ -f /etc/hosts.allow ]; then
        if grep -v '^#' /etc/hosts.allow | grep -v '^$' > /dev/null 2>&1; then
            local allow_rules=$(grep -v '^#' /etc/hosts.allow | grep -v '^$' | wc -l)
            DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.allow\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/hosts.allow - ${allow_rules}개 규칙 설정됨\"}")
            wrapper_found=1
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.allow\",\"상태\":\"취약\",\"세부내용\":\"취약 /etc/hosts.allow 파일은 존재하나 설정된 접근 제어 규칙이 없음\"}")
            
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.allow\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/hosts.allow 파일이 존재하지 않음 (접근 제어 미설정)\"}")
    fi

    # /etc/hosts.deny 확인
    if [ -f /etc/hosts.deny ]; then
        if grep -v '^#' /etc/hosts.deny | grep -v '^$' > /dev/null 2>&1; then
            local deny_rules=$(grep -v '^#' /etc/hosts.deny | grep -v '^$' | wc -l)
            DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.deny\",\"상태\":\"양호\",\"세부내용\":\"양호 : /etc/hosts.deny - ${deny_rules}개 규칙 설정됨\"}")
            wrapper_found=1
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.deny\",\"상태\":\"취약\",\"세부내용\":\"취약 : /etc/hosts.deny 파일 존재하나 규칙 없음\"}")
            
           ## DETAILS_ARRAY+=("\"양호(주의): /etc/hosts.deny 파일 존재하나 규칙 없음\"")
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.deny\",\"상태\":\"취약\",\"세부내용\":\"취약 : /etc/hosts.deny 파일 없음\"}")
    fi

    [ $wrapper_found -eq 1 ] && ((CHECK_COUNT++))

    # [점검 2] firewalld 설정 확인 (Rocky Linux)
    if [ "$os_type" = "rocky" ]; then
        if command -v firewall-cmd > /dev/null 2>&1; then
            if systemctl is-active firewalld > /dev/null 2>&1; then
                local zones=$(firewall-cmd --get-active-zones 2>/dev/null | grep -v '^\s' | head -5 | tr '\n' ' ')
                DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: firewalld 활성화 (Zone: $zones)\"}")

                local rich_rules=$(firewall-cmd --list-rich-rules 2>/dev/null | wc -l)
                if [ $rich_rules -gt 0 ]; then
                    DETAILS_ARRAY+=("{\"점검항목\":\"Rich 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Rich Rules ${rich_rules}개 설정됨\"}")
                fi

                ((CHECK_COUNT++))
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: firewalld 비활성화\"}")
                #DETAILS_ARRAY+=("\"양호(주의): firewalld 비활성화\"")
            fi
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: firewalld 미설치\"}")
        fi
    fi

    # [점검 3] ufw 설정 확인 (Ubuntu)
    if [ "$os_type" = "ubuntu" ]; then
        if command -v ufw > /dev/null 2>&1; then
            local ufw_status=$(ufw status 2>/dev/null | head -1)

            if echo "$ufw_status" | grep -q "Status: active"; then
                local rule_count=$(ufw status numbered 2>/dev/null | grep '^\[' | wc -l)
                DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: ufw 활성화 (규칙: ${rule_count}개)\"}")
                ((CHECK_COUNT++))
            else
                #DETAILS_ARRAY+=("\"양호(주의): ufw 비활성화\"")
                DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: ufw 비활성화\"}")
            fi
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약 : ufw 미설치\"}")
        fi
    fi

    # [점검 4] iptables 규칙 확인
    if command -v iptables > /dev/null 2>&1; then
        local input_rules=$(iptables -L INPUT -n 2>/dev/null | grep -v '^Chain' | grep -v '^target' | grep -v '^$' | wc -l)
        local forward_rules=$(iptables -L FORWARD -n 2>/dev/null | grep -v '^Chain' | grep -v '^target' | grep -v '^$' | wc -l)
        local output_rules=$(iptables -L OUTPUT -n 2>/dev/null | grep -v '^Chain' | grep -v '^target' | grep -v '^$' | wc -l)

        local total_rules=$((input_rules + forward_rules + output_rules))

        if [ $total_rules -gt 0 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"양호\",\"세부내용\":\"양호 : iptables 규칙 설정됨 (INPUT: ${input_rules}, FORWARD: ${forward_rules}, OUTPUT: ${output_rules})\"}")
            ((CHECK_COUNT++))
        else
            
            DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약 : iptables 규칙 없음\"}")
            ##DETAILS_ARRAY+=("\"양호(주의): iptables 규칙 없음\"")
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약 : iptables 미설치\"}")
    fi

    # [점검 5] nftables 규칙 확인
    if command -v nft > /dev/null 2>&1; then
        local nft_rules=$(nft list ruleset 2>/dev/null | grep -v '^#' | grep -v '^$' | wc -l)

        if [ $nft_rules -gt 5 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: nftables 규칙 설정됨 (${nft_rules}줄)\"}")
            ((CHECK_COUNT++))
        else
            
            DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약 : nftables 규칙 없음\"}")
            ##DETAILS_ARRAY+=("\"양호(주의): nftables 규칙 없음\"")
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: nftables 미설치\"}")
    fi

    # 최종 상태 및 현재 값 설정
    if [ $CHECK_COUNT -ge 1 ]; then
        STATUS="SAFE"
        CURRENT_VAL="접근 제어 설정 확인됨 (${CHECK_COUNT}개 항목)"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="IP주소 및 포트 제한 설정 없음"
        IS_VULN=1
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
echo "점검 시작 (단일 항목: U-28)..."
U-28

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
