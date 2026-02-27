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
# U-12 (2026 가이드라인 반영)
# 설명: 세션 종료 시간 설정 점검
###############################################################################
function U-12() {
    local CHECK_ID="U-12"
    local CATEGORY="계정 관리"
    local DESCRIPTION="세션 종료 시간 설정"
    local EXPECTED_VALUE="TMOUT(또는 autologout) 600초 이하 설정"

    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    # 1. [sh, bash] 계열 점검 파일
    local BASH_FILES=("/etc/profile" "/etc/bashrc" "/root/.bashrc")
    local FOUND_TMOUT=false
    local MIN_TMOUT=999999

    for file in "${BASH_FILES[@]}"; do
        if [ -f "$file" ]; then
            local TMOUT_VAL=$(grep -E '^[[:space:]]*TMOUT=' "$file" | grep -v '^#' | sed 's/.*TMOUT=//' | sed 's/[^0-9]//g' | head -1)
            if [ -n "$TMOUT_VAL" ]; then
                FOUND_TMOUT=true
                [ "$TMOUT_VAL" -lt "$MIN_TMOUT" ] && MIN_TMOUT=$TMOUT_VAL
            fi
        fi
    done

    # 2. [csh] 계열 점검 (가이드 내용 반영)
    local CSH_FILES=("/etc/csh.cshrc" "/etc/csh.login")
    for file in "${CSH_FILES[@]}"; do
        if [ -f "$file" ]; then
            local AUTO_VAL=$(grep -E '^[[:space:]]*set[[:space:]]+autologout=' "$file" | grep -v '^#' | sed 's/.*autologout=//' | sed 's/[^0-9]//g' | head -1)
            if [ -n "$AUTO_VAL" ]; then
                # csh autologout은 '분' 단위이므로 10분(600초)으로 체크함
                if [ "$AUTO_VAL" -gt 10 ]; then
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"세션 타임아웃\",\"상태\":\"취약\",\"세부내용\":\"취약: $file (autologout=${AUTO_VAL}분) 권장:600초(10분)이하\"}")
                fi
            fi
        fi
    done

    # 3. 최종 판정
    if [ "$FOUND_TMOUT" = false ] && [ $IS_VULN -eq 0 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="설정 미비"
        DETAILS_ARRAY+=("{\"점검항목\":\"세션 타임아웃\",\"상태\":\"취약\",\"세부내용\":\"취약: Session Timeout 설정이 발견되지 않음\"}")
    elif [ "$FOUND_TMOUT" = true ] && [ "$MIN_TMOUT" -gt 600 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="TMOUT=${MIN_TMOUT}s"
        #DETAILS_ARRAY+=("{\"점검항목\":\"세션 타임아웃\",\"상태\":\"취약\",\"세부내용\":\"취약: TMOUT이 600초(10분)를 초과함\"}")
    else
        STATUS="SAFE"
        CURRENT_VALUE="기준 준수"
        DETAILS_ARRAY+=("{\"점검항목\":\"세션 타임아웃\",\"상태\":\"양호\",\"세부내용\":\"양호: TMOUT이 600초 이내\"}")
    fi

    # [수정] 오타 수정: STATUS 앞에 $ 추가 및 비교 구문 교정
    if [ "$STATUS" = "VULNERABLE" ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-12)..."
U-12

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
