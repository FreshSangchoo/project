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



#############################################################################################################################
function U-67() {
    local CHECK_ID="U-67"
    local CATEGORY="로그 관리"
    local DESCRIPTION="로그 디렉터리 소유자 및 권한 설정"
    local EXPECTED_VAL="/var/log 내 주요 로그 파일 소유자가 root이고, 권한이 644 이하임"
    
    local STATUS="SAFE"
    local CURRENT_VAL="로그 파일 소유자 및 권한 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    local LOG_DIR="/var/log"
    
    # 1. /var/log 내의 파일 검색 (최대 깊이 2, journal 디렉터리 등 특수 경로 제외)
    local FIND_FILES=$(find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" 2>/dev/null)

    if [ -z "$FIND_FILES" ]; then
        :
        #DETAILS_ARRAY+=("\"[파일] /var/log 내에서 점검할 파일을 찾지 못했습니다.\"")
    else
        local VULN_COUNT=0
        
        # 2. 파일별 순회 점검
        for LOG_FILE in $FIND_FILES; do
            local F_OWNER=$(stat -c '%U' "$LOG_FILE")
            local F_PERM=$(stat -c '%a' "$LOG_FILE")
            local IS_THIS_VULN=0
            local FILE_REASON=""

            # [Check 1] 소유자 체크 (root 여부)
            if [ "$F_OWNER" != "root" ]; then
                IS_THIS_VULN=1
                FILE_REASON="소유자($F_OWNER) 부적절"
            fi

            # [Check 2] 권한 체크 (644 초과 여부)
            if [ "$F_PERM" -gt 644 ]; then
                [ -n "$FILE_REASON" ] && FILE_REASON="${FILE_REASON}, "
                FILE_REASON="${FILE_REASON}권한($F_PERM) 초과"
                IS_THIS_VULN=1
            fi

            # 취약점 발견 시 상세 내역에 추가
            if [ $IS_THIS_VULN -eq 1 ]; then
                IS_VULN=1
                ((VULN_COUNT++))
                # 리포트 가독성을 위해 취약 파일은 상위 10개 정도만 상세히 기록하거나 전체 기록
                DETAILS_ARRAY+=("{\"점검항목\":\"$LOG_FILE\",\"상태\":\"취약\",\"세부내용\":\"취약: $LOG_FILE : $FILE_REASON\"}")
            fi
        done

        # 3. 결과 요약 기록
        if [ $IS_VULN -eq 0 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 모든 로그 파일의 소유자(root) 및 권한(644 이하) 설정이 적절합니다.\"}")
        else
            STATUS="VULNERABLE"
            CURRENT_VAL="일부 로그 파일($VULN_COUNT건) 소유자 또는 권한 미흡"
            #DETAILS_ARRAY+=("\"[조치] 위 파일들의 소유자를 root로 변경(chown)하고 권한을 644 이하로 조정(chmod)하십시오.\"")
        fi
    fi

    # [4] 최종 결과 출력 (화면)
    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-67)..."
U-67

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
