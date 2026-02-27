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
# 함수명: U-31
# 설명: 홈 디렉토리 소유자 및 권한 설정
# ----------------------------------------------------------
function U-31() {
    local CHECK_ID="U-31"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="홈 디렉토리 소유자 및 권한 설정"
    local EXPECTED_VAL="홈 디렉토리 소유자가 해당 계정과 일치하고, 타 사용자 쓰기 권한이 없는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_USERS=0
    local OWNER_MISMATCH=0
    local WRITABLE_BY_OTHERS=0
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

    # 타 사용자 쓰기 권한 확인
    check_other_write() {
        local perm=$1
        local other_perm=${perm:2:1}

        if [ $((other_perm & 2)) -ne 0 ]; then
            return 1  # 쓰기 권한 있음 (취약)
        else
            return 0  # 쓰기 권한 없음 (양호)
        fi
    }

    # [점검 1] /etc/passwd 기반 홈 디렉토리 점검
    while IFS=: read -r username _ uid gid _ homedir shell; do
        # UID 1000 미만 및 제외 계정 스킵
        [ $uid -lt 1000 ] && continue
        is_excluded_user "$username" && continue

        # nologin, false 쉘 계정 스킵
        [[ "$shell" =~ (nologin|false) ]] && continue

        # 홈 디렉토리가 존재하지 않으면 스킵
        [ ! -d "$homedir" ] && continue

        ((TOTAL_USERS++))

        local owner=$(stat -c '%U' "$homedir" 2>/dev/null)
        local group=$(stat -c '%G' "$homedir" 2>/dev/null)
        local perm=$(stat -c '%a' "$homedir" 2>/dev/null)

        local issues=()
        local is_vulnerable=0

        # 소유자 확인
        if [ "$owner" != "$username" ]; then
            issues+=("소유자 불일치 (${owner} ≠ ${username})")
            ((OWNER_MISMATCH++))
            is_vulnerable=1
        fi

        # 타 사용자 쓰기 권한 확인
        if ! check_other_write "$perm"; then
            issues+=("타 사용자 쓰기 권한 있음")
            ((WRITABLE_BY_OTHERS++))
            is_vulnerable=1
        fi

        # 결과 기록
        if [ $is_vulnerable -eq 1 ]; then
            IS_VULN=1
            local issue_str=$(IFS=", "; echo "${issues[*]}")
            DETAILS_ARRAY+=("{\"점검항목\":\"$username\",\"상태\":\"취약\",\"세부내용\":\"취약: $username ($homedir) - 권한: $perm - ${issue_str}\"}")
        else
            ((GOOD_CONFIG++))
            DETAILS_ARRAY+=("{\"점검항목\":\"$username\",\"상태\":\"양호\",\"세부내용\":\"양호: $username ($homedir) - 소유자: $owner, 권한: $perm\"}")
        fi

    done < /etc/passwd

    # [점검 2] /home 내 추가 디렉토리 점검
    local home_dirs=$(find /home -maxdepth 1 -mindepth 1 -type d 2>/dev/null)
    local additional_found=0

    while IFS= read -r homedir; do
        [ -z "$homedir" ] && continue

        # /etc/passwd에 등록된 디렉토리는 스킵
        if grep -q ":${homedir}:" /etc/passwd 2>/dev/null; then
            continue
        fi

        additional_found=1

        local owner=$(stat -c '%U' "$homedir" 2>/dev/null)
        local perm=$(stat -c '%a' "$homedir" 2>/dev/null)

        # 타 사용자 쓰기 권한 확인
        if ! check_other_write "$perm"; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"$homedir\",\"상태\":\"취약\",\"세부내용\":\"취약: $homedir (소유자: $owner, 권한: $perm) - 타 사용자 쓰기 권한 있음\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"$homedir\",\"상태\":\"양호\",\"세부내용\":\"양호: $homedir (소유자: $owner, 권한: $perm) - 추가 디렉토리\"}")
        fi

    done <<< "$home_dirs"

    # 최종 상태 및 현재 값 설정
    local total_issues=$((OWNER_MISMATCH + WRITABLE_BY_OTHERS))

    if [ $TOTAL_USERS -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="점검 대상 사용자 없음"
        DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 점검 대상 사용자가 없습니다.\"}")
    elif [ $total_issues -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_USERS}명 모두 양호"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_USERS}명 중 문제: 소유자불일치 ${OWNER_MISMATCH}명, 타사용자쓰기권한 ${WRITABLE_BY_OTHERS}명"
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
echo "점검 시작 (단일 항목: U-31)..."
U-31

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
