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


###############################################################################
# U-01
# 설명: root 계정 원격 접속 제한
###############################################################################

###############################################################################
# U-01: root 계정 원격 접속 제한
# 조치 스크립트와 완벽히 일치하도록 수정
###############################################################################

###############################################################################
# 📝 Details 구조화 가이드
# 
# 각 함수를 다음 패턴으로 수정하세요:
#
# Before:
#   DETAILS_ARRAY+=("\"현재상태: PermitRootLogin no\"")
#   DETAILS_ARRAY+=("\"판정결과: 양호\"")
#   DETAILS_ARRAY+=("\"보안효과: SSH를 통한 root 직접 로그인 차단\"")
#
# After:
#   Add_Detail_Item \
#       "SSH 원격 접속 설정" \
#       "/etc/ssh/sshd_config" \
#       "grep -i '^PermitRootLogin' /etc/ssh/sshd_config" \
#       "양호" \
#       "PermitRootLogin no 설정됨. 보안효과: SSH를 통한 root 직접 로그인 차단"
#
###############################################################################

function U-01() {
    local CHECK_ID="U-01"
    local CATEGORY="계정 관리"
    local DESCRIPTION="root 계정 원격 접속 제한"
    local EXPECTED_VALUE="PermitRootLogin: no, Securetty pts 차단"
    
    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"
    
    # 1. SSH 설정 점검
    local SSH_CONFIG="/etc/ssh/sshd_config"
    if [ -f "$SSH_CONFIG" ]; then
        # 조치: grep -i "^PermitRootLogin" | awk '{print $2}'
        local SSH_CHECK=$(grep -i "^PermitRootLogin" "$SSH_CONFIG" | awk '{print $2}' | head -n 1)
        
        if [[ "$SSH_CHECK" =~ ^(no|No|NO)$ ]]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"SSH 원격 접속 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SSH PermitRootLogin이 'no'로 설정됨\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"SSH 원격 접속 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SSH PermitRootLogin이 '${SSH_CHECK:-설정없음}'로 설정됨 ('no' 필요)\"}")
        fi
    else
        # SSH 설정 파일이 없는 경우
        ## IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"SSH 원격 접속 설정\",\"상태\":\"양호\",\"세부내용\":\"양호:(주의) SSH 설정 파일(/etc/ssh/sshd_config)이 존재하지 않아 설정을 확인할 수 없음\"}")
    fi
    
    # 2. Securetty 설정 점검
    local SECURETTY="/etc/securetty"
    if [ -f "$SECURETTY" ]; then
        # 조치: grep -vE "^#|^\s*#" | grep "^pts"
        if grep -vE "^#|^\s*#" "$SECURETTY" | grep -q "^pts"; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"Securetty 콘솔 접속 제한\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/securetty에 pts 허용으로 root 원격 접속 가능함\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"Securetty 콘솔 접속 제한\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/securetty에 pts 항목이 없어 root 원격 접속 차단됨\"}")
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"Securetty 콘솔 접속 제한\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/securetty 파일이 없어 root 원격 접속 기본 차단됨\"}")
    fi
    
    # 3. 최종 판정 (조치 스크립트와 동일한 로직)
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="root 원격 접속 차단 미흡"
    else
        CURRENT_VALUE="root 원격 접속 완전 차단"
    fi
    
    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi
    
    local DETAILS_JSON=$(Build_Details_JSON)
    
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
        "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-01)..."
U-01

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
