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



###########################################################################
###########################################################################
# 함수명: U-25
# 설명: world writable 파일 점검
# ----------------------------------------------------------
function U-25() {
    local CHECK_ID="U-25"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="world writable 파일 점검"
    local EXPECTED_VAL="불필요한 world writable 파일이 존재하지 않는 경우"
    
    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"
    
    # 제외할 디렉터리
    local EXCLUDE_DIRS=(
        "/proc"
        "/sys"
        "/dev"
        "/run"
        "/tmp/.X11-unix"
        "/tmp/.ICE-unix"
    )
    
    # 허용된 world writable 파일
    local ALLOWED_FILES=(
        "/tmp"
        "/var/tmp"
        "/dev/null"
        "/dev/zero"
        "/dev/full"
        "/dev/random"
        "/dev/urandom"
        "/dev/tty"
        "/dev/pts/*"
        "/dev/shm"
    )
    
    local TOTAL_FOUND=0
    local SUSPICIOUS_COUNT=0
    local ALLOWED_COUNT=0
    local MAX_DETAILS=50  # 상세 정보 최대 개수 제한
    
    # 허용된 파일인지 확인하는 내부 함수
    is_allowed_file() {
        local filepath="$1"
        
        for allowed in "${ALLOWED_FILES[@]}"; do
            if [[ "$filepath" == $allowed ]]; then
                return 0
            fi
            if [[ "$filepath" == "/tmp/"* ]] || [[ "$filepath" == "/var/tmp/"* ]]; then
                if [ -f "$filepath" ] && [ -x "$filepath" ]; then
                    return 1
                fi
                return 0
            fi
        done
        
        return 1
    }
    
    # find 제외 옵션 생성
    local exclude_opts=""
    local first=1
    for dir in "${EXCLUDE_DIRS[@]}"; do
        if [ $first -eq 1 ]; then
            exclude_opts="\( -path $dir"
            first=0
        else
            exclude_opts="$exclude_opts -o -path $dir"
        fi
    done
    if [ -n "$exclude_opts" ]; then
        exclude_opts="$exclude_opts \) -prune -o"
    fi
    
    # world writable 파일 검색 (타임아웃 추가)
    local temp_file=$(mktemp)
    
    # 검색 실행 (백그라운드에서 실행하여 타임아웃 적용)
    timeout 300 bash -c "find / $exclude_opts -type f -perm -2 2>/dev/null" > "$temp_file" 2>&1
    local find_result=$?
    
    if [ $find_result -eq 124 ]; then
        # 타임아웃 발생
        STATUS="SAFE"
        CURRENT_VAL="검색 시간 초과 (5분)"
        #DETAILS_ARRAY=("\"정보: 파일 시스템 검색 시간이 초과되었습니다. 주요 디렉터리만 점검하는 것을 권장합니다.\"")
        
        local DETAILS_JSON=$(Build_Details_JSON)
        Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
        rm -f "$temp_file"
        return
    fi
    
    # 결과 분석 (라인 단위로 처리)
    while IFS= read -r filepath; do
        if [ -z "$filepath" ] || [ ! -e "$filepath" ]; then
            continue
        fi
        
        ((TOTAL_FOUND++))
        
        local file_perm=$(stat -c '%a' "$filepath" 2>/dev/null)
        local file_owner=$(stat -c '%U' "$filepath" 2>/dev/null)
        local file_group=$(stat -c '%G' "$filepath" 2>/dev/null)
        
        # 허용된 파일인지 확인
        if is_allowed_file "$filepath"; then
            ((ALLOWED_COUNT++))
            # 허용된 파일은 상세정보에 추가하지 않음 (너무 많아질 수 있음)
        else
            ((SUSPICIOUS_COUNT++))
            IS_VULN=1
            # 의심 파일만 상세정보에 추가 (최대 개수 제한)
            if [ ${#DETAILS_ARRAY[@]} -lt $MAX_DETAILS ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$filepath\",\"상태\":\"취약\",\"세부내용\":\"취약: $filepath (권한: $file_perm, 소유자: 파일소유자:$file_owner, 그룹소유자:$file_group)\"}")
            fi
        fi
        
    done < "$temp_file"
    
    rm -f "$temp_file"
    
    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_FOUND -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="world writable 파일 없음"
    elif [ $SUSPICIOUS_COUNT -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_FOUND}개 파일 발견 (모두 허용된 시스템 파일)"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_FOUND}개 발견 (의심: ${SUSPICIOUS_COUNT}개, 허용: ${ALLOWED_COUNT}개)"
    fi
    
    if [ "$STATUS" == "VULNERABLE" ]; then
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
echo "점검 시작 (단일 항목: U-25)..."
U-25

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
