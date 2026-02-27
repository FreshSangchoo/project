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
# U-23 SUID, SGID, Sticky bit 설정 파일 점검
# SUID/SGID는 실행 시 소유자 권한으로 동작하므로, 악용될 경우 권한 상승의 통로가 됨.
###############################################################################
function U-23() {
    local CHECK_ID="U-23"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="SUID, SGID, Sticky bit 설정 파일 점검"
    local EXPECTED_VALUE="불필요한 SUID/SGID 설정이 없거나, 최소한으로 관리되어야 함"

    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()

    # 점검 대상 주요 바이너리 디렉토리
    local SEARCH_DIRS=("/usr/bin" "/usr/sbin" "/bin" "/sbin")

    local SUID_COUNT=0
    local SGID_COUNT=0
    local DANGEROUS_COUNT=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 보안 가이드라인에서 권고하는 주요 점검 대상 파일 (시스템 환경에 따라 확장 가능)
    local DANGEROUS_FILES=(
        "/usr/bin/newgrp"
        "/usr/sbin/traceroute"
        "/usr/bin/at"       # 추가 예시
        "/usr/bin/lpq"      # 추가 예시
    )

    for dir in "${SEARCH_DIRS[@]}"; do
        if [ -d "$dir" ]; then

            # 1. SUID 점검 (-perm -4000: 파일 실행 시 소유자 권한 획득)
            while IFS= read -r file; do
                ((SUID_COUNT++))

                for danger in "${DANGEROUS_FILES[@]}"; do
                    if [ "$file" == "$danger" ]; then
                        STATUS="VULNERABLE"
                        ((DANGEROUS_COUNT++))
                        # 발견된 위험 파일의 정보를 상세하게 기록
                        local FILE_INFO=$(ls -l "$file")
                        DETAILS_ARRAY+=("{\"점검항목\":\"SUID/SGID 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $file (현재 설정: $FILE_INFO)\"}")
                        # DETAILS_ARRAY+=("\"취약점 우려: $file (현재 설정: $FILE_INFO)\"")
                    fi
                done
            done < <(find "$dir" -type f -perm -4000 2>/dev/null)

            # 2. SGID 점검 (-perm -2000: 파일 실행 시 그룹 권한 획득)
            while IFS= read -r file; do
                ((SGID_COUNT++))
            done < <(find "$dir" -type f -perm -2000 2>/dev/null)
        fi
    done

    # 최종 결과 판정 로직
    if [ $DANGEROUS_COUNT -eq 0 ]; then
        CURRENT_VALUE="특이사항 없음 (주요 위험 파일 미발견)"
        DETAILS_ARRAY+=("{\"점검항목\":\"SUID/SGID 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 주요 보안 점검 대상 SUID 파일의 권한이 적절함\"}")
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    else
        # [중요] SUID 파일은 시스템 운영에 필수적인 경우도 있으므로, 
        # 일괄 취약 판정보다는 관리자가 직접 업무 필요성을 검토하도록 '수동 점검' 권고
        STATUS="MANUAL"
        CURRENT_VALUE="위험 의심 파일 ${DANGEROUS_COUNT}개 발견 (수동 검토 필요)"
        
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    fi

    # JSON 결과 생성을 위한 배열 결합
    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-23)..."
U-23

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
