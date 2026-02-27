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
# U-17
# 설명: 시스템 시작 스크립트의 소유자가 root이고, Other에게 쓰기 권한이 없는지 점검
###############################################################################
function U-17() {

    local CHECK_ID="U-17"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="시스템 시작 스크립트 권한 설정"
    local EXPECTED_VALUE="시작 스크립트 소유자가 root이고, Other 쓰기 권한이 없음"

    local STATUS="SAFE"
    local CURRENT_VALUE="시작 스크립트 권한 및 소유자 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. 점검 대상 디렉터리 설정 및 유효성 확인
    local CHECK_DIRS="/etc/init.d /etc/rc.d/init.d /etc/systemd/system"
    local TARGET_DIRS=""

    for DIR in $CHECK_DIRS; do
        if [ -d "$DIR" ]; then
            TARGET_DIRS="$TARGET_DIRS $DIR"
        fi
    done

    # 2. 취약 파일 검색
    # -user root가 아니거나(!), -perm -002(Other Write) 권한이 있는 파일 검색
    local VULN_FILES=""
    if [ -z "$TARGET_DIRS" ]; then
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요"
        DETAILS_ARRAY+=("{\"점검항목\":\"시스템 시작 스크립트\",\"상태\":\"취약\",\"세부내용\":\"취약(수동점검): 점검 대상 디렉터리(/etc/init.d, /etc/rc.d/init.d, /etc/systemd/system)가 존재하지 않아 점검할 수 없습니다. (수동 점검 권장)\"}")
        echo -e "${RED}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
        local DETAILS_JSON=$(Build_Details_JSON)
        Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
        "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
        return
    fi

    VULN_FILES=$(find $TARGET_DIRS -type f \( ! -user root -o -perm -002 \) -exec ls -l {} \; 2>/dev/null)

    # 3. 결과 분석
    if [ -z "$VULN_FILES" ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 모든 시작 스크립트의 소유자가 root이고 Other 쓰기 권한이 없습니다.\"}")
    else
        IS_VULN=1
        local FILE_COUNT=$(echo "$VULN_FILES" | wc -l)
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 소유자가 root가 아니거나 o+w 권한이 있는 파일이 발견되었습니다.\"}")
        
        # 발견된 파일 리스트를 배열에 추가
        while IFS= read -r line; do
            if [ -n "$line" ]; then
                local ESCAPED_LINE=$(echo "$line" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
            fi
        done <<< "$VULN_FILES"

        STATUS="VULNERABLE"
        CURRENT_VALUE="취약한 시작 스크립트 ${FILE_COUNT}개 발견"
    fi

    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # DETAILS_ARRAY를 JSON 배열 문자열로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출을 통한 결과 기록
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-17)..."
U-17

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
