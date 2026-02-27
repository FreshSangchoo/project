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
# U-15 (2026 가이드라인 반영)
# 설명: 소유자(UID) 또는 그룹(GID)이 존재하지 않는 파일이 없는지 점검
###############################################################################
function U-15() {
    local CHECK_ID="U-15"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="파일 및 디렉토리 소유자 설정"
    local EXPECTED_VALUE="소유자(UID) 또는 그룹(GID)이 존재하지 않는 파일이 없어야 함"

    local STATUS="SAFE"
    local CURRENT_VALUE="소유자 없는 파일 미발견"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    # 가이드 Step 1: 소유자/그룹이 없는 파일
    # 전체 시스템(/)을 뒤지되 네트워크 드라이브 등은 제외(-xdev)
    local NO_OWNER_FILES=$(find / \( -nouser -o -nogroup \) -xdev -ls 2>/dev/null)

    if [ -z "$NO_OWNER_FILES" ]; then
        STATUS="SAFE"
        CURRENT_VALUE="소유자 없는 파일 미발견"
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 없는 파일\",\"상태\":\"양호\",\"세부내용\":\"양호: 소유자(nouser) 또는 그룹(nogroup)이 없는 파일이 존재하지 않습니다.\"}")
    else
        IS_VULN=1
        STATUS="VULNERABLE"
        local FILE_COUNT=$(echo "$NO_OWNER_FILES" | wc -l)
        CURRENT_VALUE="소유자/그룹 없는 파일 ${FILE_COUNT}개 발견"
        
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 없는 파일\",\"상태\":\"취약\",\"세부내용\":\"취약: 소유자 또는 그룹이 존재하지 않는 파일/디렉터리가 발견되었습니다.\"}")
        
        # 상세 리스트 추가 (최대 20개까지만 리스트업하여 JSON 비대화 방지)
        while IFS= read -r line; do
            [ -z "$line" ] && continue
            local ESCAPED_LINE=$(echo "$line" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
        done <<< "$(echo "$NO_OWNER_FILES" | head -n 20)"
    fi

    # [수정 완료] STATUS 변수 앞에 $ 기호를 붙여 실제 값 비교
    if [ "$STATUS" = "VULNERABLE" ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-15)..."
U-15

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
