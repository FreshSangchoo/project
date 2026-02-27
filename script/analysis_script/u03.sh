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
# U-03
# 설명: 로그인 실패 시 계정 잠금 임계값(deny) 설정 여부 점검
# 수정: Ubuntu 시 @include 된 파일 내용까지 합쳐서 점검 (22.04/24.04/25.04 대응)
###############################################################################
function U-03() {

    local CHECK_ID="U-03"
    local CATEGORY="계정 관리"
    local DESCRIPTION="계정 잠금 임계값 설정"
    local EXPECTED_VALUE="계정 잠금 임계값이 10회 이하로 설정되어야 함 (조치 스크립트는 수동조치만 적용)"

    local STATUS="SAFE"
    local CURRENT_VALUE="계정 잠금 임계값 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local CHECK_FILES=()
    local ACCT_FILES=()

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # [1] OS별 점검 대상 파일 목록 설정 (Ubuntu 20.04, 22.04, 24.04, 25.04 동일)
    if [[ "$OS_TYPE" =~ ^(rocky|rhel|centos)$ ]]; then
        CHECK_FILES=("/etc/pam.d/system-auth" "/etc/pam.d/password-auth")
        ACCT_FILES=("/etc/pam.d/system-auth" "/etc/pam.d/password-auth")
    elif [[ "$OS_TYPE" =~ ^(debian|ubuntu)$ ]]; then
        CHECK_FILES=("/etc/pam.d/common-auth")
        ACCT_FILES=("/etc/pam.d/common-account")
    else
        CHECK_FILES=("/etc/pam.d/system-auth")
        ACCT_FILES=("/etc/pam.d/system-auth")
    fi

    # [2] 파일별 순회 점검
    local i=0
    for PAM_FILE in "${CHECK_FILES[@]}"; do
        local PAM_ACCT_FILE="${ACCT_FILES[$i]}"
        ((i++))

        if [ ! -f "$PAM_FILE" ]; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: $PAM_FILE 파일이 존재하지 않습니다.\"}")
            continue
        fi

        # 점검용 내용: 본문 + Ubuntu 등 @include 파일 내용 합침 (22.04/24.04/25.04 공통)
        local PAM_CONTENT=""
        if [[ "$OS_TYPE" =~ ^(debian|ubuntu)$ ]] && [[ "$PAM_FILE" == /etc/pam.d/* ]]; then
            PAM_CONTENT=$(cat "$PAM_FILE" 2>/dev/null)
            while read -r inc_line; do
                local inc_file=$(echo "$inc_line" | awk '{print $2}')
                [ -z "$inc_file" ] && continue
                [[ "$inc_file" != /* ]] && inc_file="/etc/pam.d/$inc_file"
                [ -f "$inc_file" ] && PAM_CONTENT="$PAM_CONTENT"$'\n'"$(cat "$inc_file" 2>/dev/null)"
            done < <(grep -v "^#" "$PAM_FILE" 2>/dev/null | grep "^@include")
        else
            PAM_CONTENT=$(cat "$PAM_FILE" 2>/dev/null)
        fi

        # 1. 사용 중인 모듈 식별 (합친 내용 기준)
        local MODULE_NAME=""
        if echo "$PAM_CONTENT" | grep -v "^#" | grep -q "pam_faillock.so"; then
            MODULE_NAME="pam_faillock.so"
        elif echo "$PAM_CONTENT" | grep -v "^#" | grep -q "pam_tally2.so"; then
            MODULE_NAME="pam_tally2.so"
        elif echo "$PAM_CONTENT" | grep -v "^#" | grep -q "pam_tally.so"; then
            MODULE_NAME="pam_tally.so"
        fi

        if [ -n "$MODULE_NAME" ]; then
            # 2. 모듈 실제 경로 확인 (Ubuntu 22/24/25 공통 경로 포함)
            local MODULE_FOUND=0
            for path in "/lib64/security/$MODULE_NAME" "/lib/security/$MODULE_NAME" "/usr/lib64/security/$MODULE_NAME" "/usr/lib/x86_64-linux-gnu/security/$MODULE_NAME"; do
                if [ -f "$path" ]; then MODULE_FOUND=1; break; fi
            done

            if [ $MODULE_FOUND -eq 0 ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: 모듈($MODULE_NAME) 파일이 라이브러리 경로에 없습니다.\"}")
            fi

            # 3. 설정값(deny, unlock_time) 추출 - 합친 내용에서 첫 번째 매칭 라인 사용
            local PAM_LINE=$(echo "$PAM_CONTENT" | grep -v "^#" | grep "$MODULE_NAME" | head -n 1)
            local DENY_COUNT=$(echo "$PAM_LINE" | grep -oE "deny=[0-9]+" | cut -d= -f2)
            local UNLOCK_TIME=$(echo "$PAM_LINE" | grep -oE "unlock_time=[0-9]+" | cut -d= -f2)

            if [ "$MODULE_NAME" == "pam_faillock.so" ] && [ -f "/etc/security/faillock.conf" ]; then
                [ -z "$DENY_COUNT" ] && DENY_COUNT=$(grep -v "^#" /etc/security/faillock.conf | grep "deny" | grep -oE "[0-9]+" | head -n 1)
                [ -z "$UNLOCK_TIME" ] && UNLOCK_TIME=$(grep -v "^#" /etc/security/faillock.conf | grep "unlock_time" | grep -oE "[0-9]+" | head -n 1)
            fi

            # 4. 임계값 진단 (10회 이하)
            if [ -n "$DENY_COUNT" ]; then
                if [ "$DENY_COUNT" -le 10 ] && [ "$DENY_COUNT" -gt 0 ]; then
                    DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"양호\",\"세부내용\":\"양호: $DENY_COUNT회\"}")
                else
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: $DENY_COUNT회 (10회 이하 권장)\"}")
                fi
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: deny 설정 누락\"}")
            fi

            # 5. 잠금 시간 정보
            if [ -z "$UNLOCK_TIME" ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: 계정 잠금 시간(unlock_time)이 설정되지 않음\"}")
            elif [ "$UNLOCK_TIME" -lt 120 ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: 계정 잠금 시간이 $UNLOCK_TIME초로 기준(120초)보다 낮음\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"양호\",\"세부내용\":\"양호: 계정 잠금 시간이 $UNLOCK_TIME초로 적절히 설정됨\"}")
            fi

            # 6. Account 구성 확인 (Ubuntu 시 common-account도 @include 내용 합쳐서 검사)
            if [ -n "$PAM_ACCT_FILE" ] && [ -f "$PAM_ACCT_FILE" ]; then
                local ACCT_CONTENT=""
                if [[ "$OS_TYPE" =~ ^(debian|ubuntu)$ ]] && [[ "$PAM_ACCT_FILE" == /etc/pam.d/* ]]; then
                    ACCT_CONTENT=$(cat "$PAM_ACCT_FILE" 2>/dev/null)
                    while read -r inc_line; do
                        local inc_file=$(echo "$inc_line" | awk '{print $2}')
                        [ -z "$inc_file" ] && continue
                        [[ "$inc_file" != /* ]] && inc_file="/etc/pam.d/$inc_file"
                        [ -f "$inc_file" ] && ACCT_CONTENT="$ACCT_CONTENT"$'\n'"$(cat "$inc_file" 2>/dev/null)"
                    done < <(grep -v "^#" "$PAM_ACCT_FILE" 2>/dev/null | grep "^@include")
                else
                    ACCT_CONTENT=$(cat "$PAM_ACCT_FILE" 2>/dev/null)
                fi
                if echo "$ACCT_CONTENT" | grep -v "^#" | grep "account" | grep -q "$MODULE_NAME"; then
                    DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"양호\",\"세부내용\":\"양호: Account 모듈 설정 확인됨\"}")
                else
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: $PAM_ACCT_FILE 내 account 설정 누락\"}")
                fi
            fi
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: $PAM_FILE(및 include) 내 계정 잠금 모듈 설정이 발견되지 않았습니다.\"}")
        fi
    done

    # [3] 최종 결과 판단
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="계정 잠금 임계값 미설정 또는 기준 초과"
        DETAILS_ARRAY+=("{\"점검항목\":\"U-03 조치 안내\",\"상태\":\"수동조치\",\"세부내용\":\"이 항목은 PAM 직접 수정 시 로그인 불가 위험이 있어 통합조치 스크립트에서 자동 적용하지 않습니다. deny=10, unlock_time=120 설정은 수동으로 적용하세요.\"}")
    fi

    if [ $IS_VULN -eq 1 ]; then
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
echo "점검 시작 (단일 항목: U-03)..."
U-03

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
