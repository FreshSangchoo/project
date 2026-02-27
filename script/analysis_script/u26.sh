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



#####################################################################################
######################################################################################
# 함수명: U-26
# 설명: /dev 디렉터리 내 파일 점검


function U-26() {
    local CHECK_ID="U-26"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="/dev에 존재하지 않는 device 파일 점검"
    local EXPECTED_VAL="/dev 디렉터리 내 비정상적인 일반 파일이 존재하지 않는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 예외 목록 // 여기 안에 있으면 그냥 넘어가기
    local EXCEPTION_LIST=(
        "/dev/mqueue" "/dev/shm" "/dev/hugepages" "/dev/pts" "/dev/fd"
        "/dev/stdin" "/dev/stdout" "/dev/stderr" "/dev/core"
        "/dev/.udev" "/dev/.lxc" "/dev/.lxd" "/dev/.mdadm"
    )

    ## 이런것들이 비정상적인 일반 파일임
    local EXCEPTION_PATTERNS=(
        "^/dev/\.udev" "^/dev/\.systemd" "^/dev/\.mount"
        "^/dev/mqueue/" "^/dev/shm/" "^/dev/hugepages/"
    )

    local TOTAL_FILES=0
    local SUSPICIOUS_FILES=0
    local NORMAL_FILES=0

    # 예외 파일 여부 확인
    is_exception() {
        local filepath="$1"
        for exception in "${EXCEPTION_LIST[@]}"; do
            [[ "$filepath" == "$exception" ]] && return 0
        done
        for pattern in "${EXCEPTION_PATTERNS[@]}"; do
            [[ "$filepath" =~ $pattern ]] && return 0
        done
        return 1
    }

    # /dev 디렉터리 내 일반 파일 검색
    while IFS= read -r filepath; do
        [ -z "$filepath" ] && continue
        ((TOTAL_FILES++))

        if is_exception "$filepath"; then
            ((NORMAL_FILES++))
            continue
        fi

        ((SUSPICIOUS_FILES++))
        IS_VULN=1

        local file_perm=$(stat -c '%a' "$filepath" 2>/dev/null)
        local file_owner=$(stat -c '%U:%G' "$filepath" 2>/dev/null)
        local file_size=$(stat -c '%s' "$filepath" 2>/dev/null)
        local file_mtime=$(stat -c '%y' "$filepath" 2>/dev/null | cut -d'.' -f1)

        DETAILS_ARRAY+=("{\"점검항목\":\"$filepath\",\"상태\":\"취약\",\"세부내용\":\"취약: $filepath (권한: $file_perm, 소유자: $file_owner, 크기: $file_size bytes, 수정일: $file_mtime)\"}")

    done < <(find /dev -type f 2>/dev/null)

    # 숨겨진 파일 검색
    local hidden_count=0
    while IFS= read -r filepath; do
        [ -z "$filepath" ] && continue
        local filename=$(basename "$filepath")
        [[ ! "$filename" =~ ^\. ]] && continue
        is_exception "$filepath" && continue

        ((hidden_count++))
        IS_VULN=1

        local file_perm=$(stat -c '%a' "$filepath" 2>/dev/null)
        local file_owner=$(stat -c '%U:%G' "$filepath" 2>/dev/null)

        DETAILS_ARRAY+=("{\"점검항목\":\"숨김파일 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: (숨김파일: $filepath 권한: $file_perm, 소유자: $file_owner)\"}")

    done < <(find /dev -name ".*" -type f 2>/dev/null)

    if [ $hidden_count -gt 0 ]; then
        ((SUSPICIOUS_FILES+=$hidden_count))
        ((TOTAL_FILES+=$hidden_count))
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_FILES -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="/dev 디렉터리 내 일반 파일 없음"
        DETAILS_ARRAY+=("{\"점검항목\":\"디렉터리 내 파일 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: /dev 디렉터리 내 일반 파일이 발견되지 않았습니다.\"}")

        ## DETAILS_ARRAY=("\"양호: /dev 디렉터리 내 일반 파일이 발견되지 않았습니다.\"")
    elif [ $SUSPICIOUS_FILES -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_FILES}개 파일 발견 (모두 정상 시스템 파일)"
        DETAILS_ARRAY+=("{\"점검항목\":\"디렉터리 내 파일 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 발견된 ${TOTAL_FILES}개 파일은 모두 시스템 정상 파일입니다.\"}")
        ## DETAILS_ARRAY=("\"양호: 발견된 ${TOTAL_FILES}개 파일은 모두 시스템 정상 파일입니다.\"")
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_FILES}개 발견 (의심: ${SUSPICIOUS_FILES}개, 정상: ${NORMAL_FILES}개)"
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
echo "점검 시작 (단일 항목: U-26)..."
U-26

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
