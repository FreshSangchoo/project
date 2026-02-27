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
# U-20 (2026 가이드라인 반영)
# 설명: /etc/(x)inetd.conf 및 관련 설정 파일 소유자 및 권한 점검
###############################################################################
function U-20() {
    local CHECK_ID="U-20"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="/etc/(x)inetd.conf 파일 소유자 및 권한 설정"
    local EXPECTED_VALUE="소유자 root, 권한 600 이하"

    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    local VULN_COUNT=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 점검 대상 목록 (가이드라인 명시 항목)
    local TARGET_ITEMS=(
        "/etc/inetd.conf"
        "/etc/xinetd.conf"
        "/etc/xinetd.d"
        "/etc/systemd/system.conf"
        "/etc/systemd"
    )

    for item in "${TARGET_ITEMS[@]}"; do
        if [ -e "$item" ]; then
            # 디렉터리인 경우 내부 파일들까지 점검 (가이드라인 Step 2 반영)
            local files_to_check=()
            if [ -d "$item" ]; then
                files_to_check=($(find "$item" -maxdepth 1 -type f))
            else
                files_to_check=("$item")
            fi

            for file in "${files_to_check[@]}"; do
                local owner=$(stat -c '%U' "$file" 2>/dev/null)
                local perm=$(stat -c '%a' "$file" 2>/dev/null)
                
                # 판단 기준: 소유자 root AND 권한 600 이하
                # (perm -gt 600은 8진수 비교 시 주의가 필요하므로 600보다 큰 권한 패턴 체크)
                if [ "$owner" != "root" ] || [ "$perm" -gt 600 ]; then
                    STATUS="VULNERABLE"
                    ((VULN_COUNT++))
                    DETAILS_ARRAY+=("{\"점검항목\":\"$file\",\"상태\":\"취약\",\"세부내용\":\"취약: $file (소유자:$owner, 권한:$perm)\"}")
                fi
            done
        fi
    done

    # 결과 판정
    if [ "$VULN_COUNT" -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VALUE="모든 설정 파일 양호"
        DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 주요 서비스 설정 파일의 소유자 및 권한이 기준을 준수함\"}")
    else
        STATUS="VULNERABLE"
        CURRENT_VALUE="${VULN_COUNT}개 항목 취약"
    fi
    
    # [수정 완료] STATUS 앞 $ 누락 및 비교 문법 교정
    if [ "$STATUS" = "VULNERABLE" ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-20)..."
U-20

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
