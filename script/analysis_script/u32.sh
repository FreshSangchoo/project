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



#####################################################################################################################
# 함수명: U-32
# 설명: 홈 디렉토리 존재 여부 점검
# ----------------------------------------------------------
function U-32() {
    local CHECK_ID="U-32"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="홈 디렉토리로 지정한 디렉토리의 존재 관리"
    local EXPECTED_VAL="모든 사용자 계정에 홈 디렉토리가 존재하는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_USERS=0
    local MISSING_HOMEDIR=0
    local GOOD_CONFIG=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 점검 제외 계정 (시스템 계정)
    local EXCLUDE_USERS=(
        "root" "bin" "daemon" "adm" "lp" "sync" "shutdown" "halt" "mail"
        "operator" "games" "ftp" "nobody" "systemd-network" "dbus" "polkitd"
        "colord" "rpc" "saslauth" "libstoragemgmt" "setroubleshoot"
        "cockpit-ws" "cockpit-wsinstance" "sssd" "sshd" "chrony" "tcpdump" "tss"
    )

    # 제외 대상 사용자인지 확인
    is_excluded_user() {
        local username=$1
        for excluded in "${EXCLUDE_USERS[@]}"; do
            [ "$username" = "$excluded" ] && return 0
        done
        return 1
    }

    # [점검 1] 사용자 계정별 홈 디렉토리 존재 여부 확인
    while IFS=: read -r username _ uid gid _ homedir shell; do
        # UID 1000 미만 및 제외 계정 스킵
        [ $uid -lt 1000 ] && continue
        is_excluded_user "$username" && continue

        # nologin, false 쉘 계정 스킵
        [[ "$shell" =~ (nologin|false) ]] && continue

        ((TOTAL_USERS++))

        # 홈 디렉토리 존재 여부 확인
        if [ -d "$homedir" ]; then
            ((GOOD_CONFIG++))
            DETAILS_ARRAY+=("{\"점검항목\":\"$username\",\"상태\":\"양호\",\"세부내용\":\"양호: $username - 홈 디렉토리 존재 ($homedir)\"}")
        else
            ((MISSING_HOMEDIR++))
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"$username\",\"상태\":\"취약\",\"세부내용\":\"취약: $username - 홈 디렉토리 없음 ($homedir)\"}")
        fi

    done < /etc/passwd

    # [점검 2] 비정상적인 홈 디렉토리 위치 확인
    local abnormal_found=0

    while IFS=: read -r username _ uid gid _ homedir shell; do
        # UID 1000 미만 및 제외 계정 스킵
        [ $uid -lt 1000 ] && continue
        is_excluded_user "$username" && continue

        # nologin, false 쉘 계정 스킵
        [[ "$shell" =~ (nologin|false) ]] && continue

        # 홈 디렉토리가 /home 이외의 위치인 경우
        if [[ ! "$homedir" =~ ^/home/ ]] && [ -d "$homedir" ]; then
            abnormal_found=1
        fi

    done < /etc/passwd

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_USERS -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="점검 대상 사용자 없음"
        DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 점검 대상 사용자가 없습니다.\"}")
    elif [ $MISSING_HOMEDIR -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_USERS}명 모두 홈 디렉토리 존재"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_USERS}명 중 ${MISSING_HOMEDIR}명 홈 디렉토리 없음"
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
echo "점검 시작 (단일 항목: U-32)..."
U-32

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
