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
# U-09 (가이드라인 반영)
# 설명: 계정이 존재하지 않는 GID 금지
###############################################################################
function U-09() {
    local CHECK_ID="U-09"
    local CATEGORY="계정 관리"
    local DESCRIPTION="계정이 존재하지 않는 GID 금지"
    local EXPECTED_VALUE="사용자가 포함되지 않은 불필요한 그룹이 삭제되어야 함"

    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    # 가이드 Step 1: /etc/group 파일을 분석
    # 기본 시스템 그룹(GID 0~999)을 제외하고, 
    # 멤버 필드(4번째 필드)가 비어 있고, 해당 그룹을 기본 그룹으로 쓰는 사용자도 없는 경우를 체크
    
    local ALL_GROUPS=$(awk -F: '$3 >= 1000 {print $1}' /etc/group) # 일반 사용자 그룹 대상

    for GROUP in $ALL_GROUPS; do
        # 1. /etc/group의 4번째 필드(멤버)가 비어 있는지 확인
        local MEMBERS=$(grep "^${GROUP}:" /etc/group | cut -d: -f4)
        
        # 2. /etc/passwd의 4번째 필드(GID)에서 이 그룹을 기본 그룹으로 쓰는 유저가 있는지 확인
        local GID=$(grep "^${GROUP}:" /etc/group | cut -d: -f3)
        local PRIMARY_USER=$(awk -F: -v gid="$GID" '$4 == gid {print $1}' /etc/passwd)

        if [ -z "$MEMBERS" ] && [ -z "$PRIMARY_USER" ]; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"빈 그룹 확인\",\"상태\":\"취약\",\"세부내용\":\"취약: 멤버가 없는 불필요한 그룹 발견($GROUP)\"}")
        fi
    done

    # 결과 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="불필요한 그룹 존재"
    else
        STATUS="SAFE"
        CURRENT_VALUE="정상 (불필요 그룹 없음)"
        DETAILS_ARRAY+=("{\"점검항목\":\"빈 그룹 확인\",\"상태\":\"양호\",\"세부내용\":\"양호: 모든 그룹에 소속된 사용자가 존재하거나 필요한 그룹입니다.\"}")
    fi

    # 터미널 출력
    if [ "$STATUS" == "VULNERABLE" ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동 점검] $CHECK_ID 사용지 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi
    
    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-09)..."
U-09

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
