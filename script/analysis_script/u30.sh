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



###################################################################################################
# 함수명: U-30
# 설명: UMASK 설정 적절성 점검
# ----------------------------------------------------------
function U-30() {
    local CHECK_ID="U-30"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="UMASK 설정 관리"
    local EXPECTED_VAL="UMASK 값이 022 이상으로 설정된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local WEAK_UMASK_COUNT=0
    local GOOD_UMASK_COUNT=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 점검 대상 파일 목록
    local GLOBAL_FILES=(
        "/etc/profile"
        "/etc/bashrc"
        "/etc/bash.bashrc"
        "/etc/csh.cshrc"
        "/etc/csh.login"
        "/etc/environment"
        "/etc/login.defs"
    )

    local USER_FILES=(
        ".profile"
        ".bashrc"
        ".bash_profile"
        ".cshrc"
        ".kshrc"
        ".login"
    )

    # UMASK 값 검증 (022 이상인지 확인)
    validate_umask() {
        local umask_value=$1
        local umask_dec=$((8#$umask_value))
        local standard_dec=$((8#022))

        if [ $umask_dec -ge $standard_dec ]; then
            return 0  # 양호
        else
            return 1  # 취약
        fi
    }

    # 파일에서 UMASK 설정 추출 및 검증
    check_file_umask() {
        local filepath=$1

        if [ ! -f "$filepath" ]; then
            return
        fi

        ((TOTAL_CHECKED++))

        local umask_lines=$(grep -n '^[^#]*umask' "$filepath" 2>/dev/null)

        if [ -z "$umask_lines" ]; then
            return
        fi

        while IFS= read -r line; do
            local line_num=$(echo "$line" | cut -d':' -f1)
            local line_content=$(echo "$line" | cut -d':' -f2-)
            local umask_value=$(echo "$line_content" | grep -oP 'umask\s+\K[0-9]+' | head -1)

            if [ -n "$umask_value" ]; then
                if validate_umask "$umask_value"; then
                    ((GOOD_UMASK_COUNT++))
                    DETAILS_ARRAY+=("{\"점검항목\":\"UMASK 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $filepath (라인 ${line_num}) - umask ${umask_value} (022 이상)\"}")
                else
                    ((WEAK_UMASK_COUNT++))
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"UMASK 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $filepath (라인 ${line_num}) - umask ${umask_value} (022 미만)\"}")
                fi
            fi
        done <<< "$umask_lines"
    }

    # [점검 1] 현재 시스템 UMASK 값 확인
    local current_umask=$(umask)

    if validate_umask "$current_umask"; then
        DETAILS_ARRAY+=("{\"점검항목\":\"UMASK 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 현재 UMASK ${current_umask} (022 이상)\"}")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"UMASK 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 현재 UMASK ${current_umask} (022 미만)\"}")
        IS_VULN=1
    fi

    # [점검 2] 전역 설정 파일 점검
    for file in "${GLOBAL_FILES[@]}"; do
        check_file_umask "$file"
    done

    # [점검 3] 사용자별 설정 파일 점검

    local home_dirs=$(find /home -maxdepth 1 -type d 2>/dev/null | grep -v '^/home$')

    if [ -z "$home_dirs" ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"검사할\",\"상태\":\"양호\",\"세부내용\":\"양호: 검사할 사용자 홈 디렉터리 없음\"}")
    else
        while IFS= read -r home_dir; do
            local username=$(basename "$home_dir")

            for userfile in "${USER_FILES[@]}"; do
                local filepath="${home_dir}/${userfile}"

                if [ -f "$filepath" ]; then
                    local umask_lines=$(grep -n '^[^#]*umask' "$filepath" 2>/dev/null)

                    if [ -n "$umask_lines" ]; then
                        while IFS= read -r line; do
                            local line_num=$(echo "$line" | cut -d':' -f1)
                            local line_content=$(echo "$line" | cut -d':' -f2-)
                            local umask_value=$(echo "$line_content" | grep -oP 'umask\s+\K[0-9]+' | head -1)

                            if [ -n "$umask_value" ]; then
                                if validate_umask "$umask_value"; then
                                    ((GOOD_UMASK_COUNT++))
                                    DETAILS_ARRAY+=("{\"점검항목\":\"UMASK 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: ${username}/${userfile} - umask ${umask_value} (022 이상)\"}")
                                else
                                    ((WEAK_UMASK_COUNT++))
                                    IS_VULN=1
                                    DETAILS_ARRAY+=("{\"점검항목\":\"UMASK 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: ${username}/${userfile} - umask ${umask_value} (022 미만)\"}")
                                fi
                            fi
                        done <<< "$umask_lines"
                    fi
                fi
            done
        done <<< "$home_dirs"
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="시스템 UMASK ${current_umask}, 설정 파일 없음"
        if ! validate_umask "$current_umask"; then
            STATUS="VULNERABLE"
            IS_VULN=1
        fi
    else
        if [ $IS_VULN -eq 1 ]; then
            STATUS="VULNERABLE"
            CURRENT_VAL="총 ${TOTAL_CHECKED}개 파일 점검 (취약: ${WEAK_UMASK_COUNT}개, 양호: ${GOOD_UMASK_COUNT}개)"
        else
            STATUS="SAFE"
            CURRENT_VAL="총 ${TOTAL_CHECKED}개 파일 모두 양호 (UMASK 022 이상)"
        fi
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
echo "점검 시작 (단일 항목: U-30)..."
U-30

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
