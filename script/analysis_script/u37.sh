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



##########################################################################################################
# 함수명: U-37
# 설명: crontab 및 at 서비스 권한 설정 점검
# ----------------------------------------------------------
function U-37() {
    local CHECK_ID="U-37"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="crontab 설정파일 권한 설정 미흡"
    local EXPECTED_VAL="cron/at 관련 파일 및 명령어의 소유자가 root이고 권한이 적절하게 설정된 경우 (명령어 750 이하, 파일 640 이하)"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local VULNERABLE_COUNT=0
    local SECURE_COUNT=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 점검 대상 파일 목록
    local CRON_FILES=(
        "/etc/cron.allow"
        "/etc/cron.deny"
        "/etc/crontab"
        "/etc/cron.d"
        "/etc/cron.daily"
        "/etc/cron.hourly"
        "/etc/cron.monthly"
        "/etc/cron.weekly"
        "/var/spool/cron"
    )

    local AT_FILES=(
        "/etc/at.allow"
        "/etc/at.deny"
        "/var/spool/at"
        "/var/spool/cron/atjobs"
    )

    local CRON_COMMANDS=(
        "/usr/bin/crontab"
        "/bin/crontab"
    )

    local AT_COMMANDS=(
        "/usr/bin/at"
        "/bin/at"
    )

    # 권한 검증 (640 또는 750 이하인지 확인)
    validate_permission() {
        local perm=$1
        local limit=$2

        local owner=${perm:0:1}
        local group=${perm:1:1}
        local other=${perm:2:1}

        local limit_owner=${limit:0:1}
        local limit_group=${limit:1:1}
        local limit_other=${limit:2:1}

        [ $owner -gt $limit_owner ] && return 1
        [ $group -gt $limit_group ] && return 1
        [ $other -gt $limit_other ] && return 1

        return 0
    }

    # [점검 1] crontab 명령어 권한 확인
    local found=0
    for cmd in "${CRON_COMMANDS[@]}"; do
        if [ -f "$cmd" ]; then
            found=1
            ((TOTAL_CHECKED++))

            local perm=$(stat -c '%a' "$cmd" 2>/dev/null)
            local owner=$(stat -c '%U:%G' "$cmd" 2>/dev/null)
            local symbolic=$(stat -c '%A' "$cmd" 2>/dev/null)

            if validate_permission "$perm" "750"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$cmd\",\"상태\":\"양호\",\"세부내용\":\"양호: $cmd (권한: $perm, 소유자: $owner)\"}")
                ((SECURE_COUNT++))
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $cmd (권한: $perm, 소유자: $owner) - 750 초과\"}")
                ((VULNERABLE_COUNT++))
                IS_VULN=1
            fi
        fi
    done

    # [점검 2] at 명령어 권한 확인
    found=0
    for cmd in "${AT_COMMANDS[@]}"; do
        if [ -f "$cmd" ]; then
            found=1
            ((TOTAL_CHECKED++))

            local perm=$(stat -c '%a' "$cmd" 2>/dev/null)
            local owner=$(stat -c '%U:%G' "$cmd" 2>/dev/null)
            local symbolic=$(stat -c '%A' "$cmd" 2>/dev/null)

            if validate_permission "$perm" "750"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$cmd\",\"상태\":\"양호\",\"세부내용\":\"양호: $cmd (권한: $perm, 소유자: $owner)\"}")
                ((SECURE_COUNT++))
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $cmd (권한: $perm, 소유자: $owner) - 750 초과\"}")
                ((VULNERABLE_COUNT++))
                IS_VULN=1
            fi
        fi
    done

    # [점검 3] cron 관련 파일 권한 확인
    for file in "${CRON_FILES[@]}"; do
        if [ -e "$file" ]; then
            ((TOTAL_CHECKED++))

            local perm=$(stat -c '%a' "$file" 2>/dev/null)
            local owner=$(stat -c '%U:%G' "$file" 2>/dev/null)

            if validate_permission "$perm" "640"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$file\",\"상태\":\"양호\",\"세부내용\":\"양호: $file (권한: $perm, 소유자: $owner)\"}")
                ((SECURE_COUNT++))
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $file (권한: $perm, 소유자: $owner) - 640 초과\"}")
                ((VULNERABLE_COUNT++))
                IS_VULN=1
            fi
        fi
    done

    # [점검 4] at 관련 파일 권한 확인
    found=0
    for file in "${AT_FILES[@]}"; do
        if [ -e "$file" ]; then
            found=1
            ((TOTAL_CHECKED++))

            local perm=$(stat -c '%a' "$file" 2>/dev/null)
            local owner=$(stat -c '%U:%G' "$file" 2>/dev/null)

            if validate_permission "$perm" "640"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$file\",\"상태\":\"양호\",\"세부내용\":\"양호: $file (권한: $perm, 소유자: $owner)\"}")
                ((SECURE_COUNT++))
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $file (권한: $perm, 소유자: $owner) - 640 초과\"}")
                ((VULNERABLE_COUNT++))
                IS_VULN=1
            fi
        fi
    done

    # [점검 5] allow/deny 파일 설정 확인
    if [ -f /etc/cron.allow ]; then
        local user_count=$(wc -l < /etc/cron.allow)
    else
        :
        #DETAILS_ARRAY+=("\"정보: cron.allow 없음\"")
    fi

    if [ -f /etc/cron.deny ]; then
        local deny_count=$(wc -l < /etc/cron.deny)
    fi

    if [ -f /etc/at.allow ]; then
        local user_count=$(wc -l < /etc/at.allow)
    else
        :
        #DETAILS_ARRAY+=("\"정보: at.allow 없음\"")
    fi

    if [ -f /etc/at.deny ]; then
        local deny_count=$(wc -l < /etc/at.deny)
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="점검 대상 파일 없음"
        DETAILS_ARRAY+=("{\"점검항목\":\"Cron 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: cron/at 관련 파일이 없습니다.\"}")
    elif [ $VULNERABLE_COUNT -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 모두 안전"
    else
        STATUS="VULNERABLE"
        IS_VULN=1

        CURRENT_VAL="총 ${TOTAL_CHECKED}개 중 취약 ${VULNERABLE_COUNT}개, 안전 ${SECURE_COUNT}개"
    fi
    
    if [ $IS_VULN -eq 1 ]; then
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
echo "점검 시작 (단일 항목: U-37)..."
U-37

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
