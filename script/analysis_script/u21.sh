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
# U-21 /etc/(r)syslog.conf 파일 소유자 및 권한 설정
###############################################################################
function U-21() {
    local CHECK_ID="U-21"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="/etc/(r)syslog.conf 파일 소유자 및 권한 설정"
    local EXPECTED_VALUE="소유자: root, bin, sys 중 하나 / 권한: 640 이하"

    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 점검 대상 파일 목록 (OS별 syslog 설정 파일)
    local SYSLOG_FILES=("/etc/syslog.conf" "/etc/rsyslog.conf")
    # 허용되는 소유자 목록
    local ALLOWED_OWNERS=("root" "bin" "sys")

    local FOUND_FILES=0
    local VULN_COUNT=0

    for conf_file in "${SYSLOG_FILES[@]}"; do
        if [ -f "$conf_file" ]; then
            ((FOUND_FILES++))

            # 소유자 및 권한 추출
            local FILE_OWNER=$(stat -c '%U' "$conf_file" 2>/dev/null)
            local FILE_PERM=$(stat -c '%a' "$conf_file" 2>/dev/null)
            local IS_VULN=0

            # 1. 소유자 점검
            local OWNER_OK=0
            for owner in "${ALLOWED_OWNERS[@]}"; do
                if [ "$FILE_OWNER" == "$owner" ]; then
                    OWNER_OK=1
                    break
                fi
            done

            if [ $OWNER_OK -eq 0 ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: ${conf_file}의 소유자가 '${FILE_OWNER}'임 (권장: root, bin, sys)\"}")
            fi

            # 2. 권한 점검 (8진수 640을 10진수로 변환하면 416)
            # 계산법: (6*8^2) + (4*8^1) + (0*8^0) = 384 + 32 + 0 = 416
            if [ -n "$FILE_PERM" ]; then
                local PERM_DEC=$((8#$FILE_PERM))
                # 권한이 416보다 크다면 취약
                if [ $PERM_DEC -gt 416 ]; then
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: ${conf_file}의 권한이 '${FILE_PERM}'임 (권장: 640 이하)\"}")
                fi
            fi

            # 파일별 최종 결과 취합
            if [ $IS_VULN -eq 1 ]; then
                STATUS="VULNERABLE"
                ((VULN_COUNT++))
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"${conf_file}\",\"상태\":\"양호\",\"세부내용\":\"양호: ${conf_file} (소유자: ${FILE_OWNER}, 권한: ${FILE_PERM})\"}")
            fi
        fi
    done

    # 최종 결과 요약 및 상태 결정
    if [ $FOUND_FILES -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VALUE="syslog 설정 파일이 존재하지 않음"
    elif [ $VULN_COUNT -eq 0 ]; then
        CURRENT_VALUE="모든 syslog 파일의 소유자 및 권한 설정이 적절함"
    else
        CURRENT_VALUE="${VULN_COUNT}개의 syslog 파일 설정 미흡"
    fi
    
    # 화면 출력 (VULN_COUNT 기준으로 판단하도록 수정)
    if [ "$STATUS" == "VULNERABLE" ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-21)..."
U-21

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
