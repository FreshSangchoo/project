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
# U-13 (2026 가이드라인 반영)
# 설명: 안전한 비밀번호 암호화 알고리즘 사용 점검
###############################################################################
function U-13() {
    local CHECK_ID="U-13"
    local CATEGORY="계정 관리"
    local DESCRIPTION="안전한 비밀번호 암호화 알고리즘 사용"
    local EXPECTED_VALUE="SHA-256($5), SHA-512($6) 또는 YESCRYPT($y) 사용"

    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    local WEAK_COUNT=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    if [ ! -r /etc/shadow ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="shadow 접근 불가"
        DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 암호화\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/shadow 파일을 읽을 수 없습니다.\"}")
    else
        # shadow 파일을 한 줄씩 읽어 알고리즘 식별자 확인
        while IFS=: read -r username password _; do
            # 1. 암호가 설정되지 않은 계정(!, *, !! 등)은 점검 제외
            if [[ "$password" =~ ^(!|\*|!!|)$ ]]; then
                continue
            fi

            # 2. 알고리즘 식별자 체크
            # $5$: SHA-256, $6$: SHA-512, $y$: YESCRYPT(최신 표준)
            if [[ "$password" =~ ^\$6\$ ]] || [[ "$password" =~ ^\$5\$ ]] || [[ "$password" =~ ^\$y\$ ]]; then
                continue
            else
                ((WEAK_COUNT++))
                DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 암호화\",\"상태\":\"취약\",\"세부내용\":\"취약: ${username} 계정이 안전하지 않은 알고리즘 사용 중\"}")
            fi
        done < /etc/shadow

        if [ $WEAK_COUNT -eq 0 ]; then
            STATUS="SAFE"
            CURRENT_VALUE="모든 계정 안전한 알고리즘 사용"
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 암호화\",\"상태\":\"양호\",\"세부내용\":\"양호: SHA-2 이상의 알고리즘이 적용되어 있습니다.\"}")
        else
            STATUS="VULNERABLE"
            CURRENT_VALUE="${WEAK_COUNT}개 계정 취약"
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

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-13)..."
U-13

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
