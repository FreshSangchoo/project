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
# U-19
# 설명: /etc/hosts 파일의 소유자가 root이고, 권한이 600 이하인지 점검
###############################################################################
function U-19() {

    local CHECK_ID="U-19"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="/etc/hosts 파일 소유자 및 권한 설정"
    local EXPECTED_VALUE="소유자 root, 권한 600 이하"

    local STATUS="SAFE"
    local CURRENT_VALUE="소유자 및 권한 설정 양호"
    local DETAILS_ARRAY=()
    local TARGET_FILE="/etc/hosts"
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. 파일 존재 여부 확인
    if [ ! -f "$TARGET_FILE" ]; then
        STATUS="SAFE"
        CURRENT_VALUE="파일 미존재"
        DETAILS_ARRAY+=("{\"점검항목\":\"$TARGET_FILE\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): $TARGET_FILE 파일이 존재하지 않습니다. 추후 필요에 따라 수동 점검이 필요할 수 있습니다.(시스템 점검 필요)\"}")
    else
        # stat 명령어로 소유자(%U)와 권한(%a) 추출
        local FILE_OWNER=$(stat -c "%U" "$TARGET_FILE")
        local FILE_PERM=$(stat -c "%a" "$TARGET_FILE")

        # 2. 소유자 확인 (root 여야 함)
        if [ "$FILE_OWNER" == "root" ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"소유자가\",\"상태\":\"양호\",\"세부내용\":\"양호: 소유자가 $FILE_OWNER 입니다.\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 소유자가 $FILE_OWNER 입니다. (root여야 함)\"}")
        fi

        # 3. 권한 확인 (600 이하)
        # 600(rw-------) 이하인 경우(400, 000 등 포함) 양호로 판단
        if [ "$FILE_PERM" -le 600 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 권한이 $FILE_PERM 입니다. (기준: 600 이하)\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 권한이 $FILE_PERM 입니다. (기준: 600 이하)\"}")
        fi
        
        # 최종 상태 업데이트
        if [ $IS_VULN -eq 1 ]; then
            STATUS="VULNERABLE"
            CURRENT_VALUE="소유자($FILE_OWNER) 또는 권한($FILE_PERM) 부적절"
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
    
    

    # DETAILS_ARRAY를 JSON 배열 문자열로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출을 통한 결과 기록
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-19)..."
U-19

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
