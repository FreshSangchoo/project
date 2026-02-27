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


################################################################# 여기까지 함 (2/16 18:02) #############################################

################################################################# 다시 시작함 (2/17 11:10) #############################################

# ----------------------------------------------------------
# 함수명: U-41
# 설명: automountd 서비스 비활성화 점검
# ----------------------------------------------------------
function U-41() {
    local CHECK_ID="U-41"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="불필요한 automountd 제거"
    local EXPECTED_VAL="automount 서비스가 비활성화된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local VULNERABLE_COUNT=0
    local SECURE_COUNT=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # automount 관련 서비스 목록
    local AUTOMOUNT_SERVICES=(
        "autofs:AutoFS 서비스"
        "automount:Automount 데몬"
        "automountd:Automount 데몬 (legacy)"
    )

    # automount 설정 파일 목록
    local AUTOMOUNT_CONFIGS=(
        "/etc/auto.master"
        "/etc/auto.misc"
        "/etc/auto.net"
        "/etc/auto.smb"
        "/etc/auto_master"
        "/etc/auto_home"
    )

    # [점검 1] automount 서비스 상태 확인
    local service_found=0

    for service_info in "${AUTOMOUNT_SERVICES[@]}"; do
        local service=$(echo "$service_info" | cut -d':' -f1)
        local description=$(echo "$service_info" | cut -d':' -f2)

        if systemctl list-unit-files "$service" 2>/dev/null | grep -q "$service"; then
            service_found=1
            ((TOTAL_CHECKED++))

            local active_status=$(systemctl is-active "$service" 2>/dev/null)
            local enabled_status=$(systemctl is-enabled "$service" 2>/dev/null)

            if [ "$active_status" = "active" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service ($description) - 실행 중 (Active=$active_status, Enabled=$enabled_status)\"}")
                ((VULNERABLE_COUNT++))
                IS_VULN=1
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - 비활성화\"}")
                ((SECURE_COUNT++))
            fi
        fi
    done

    if [ $service_found -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: automount 서비스 없음\"}")
    fi

    # [점검 2] automount 프로세스 확인
    local auto_procs=$(ps aux | grep -E 'automount|autofs' | grep -v grep)

    if [ -n "$auto_procs" ]; then
        ((TOTAL_CHECKED++))

        local proc_count=$(echo "$auto_procs" | wc -l)
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: automount 프로세스 ${proc_count}개 실행 중\"}")

        echo "$auto_procs" | while IFS= read -r proc; do
            local proc_name=$(echo "$proc" | awk '{print $11}')
            local proc_pid=$(echo "$proc" | awk '{print $2}')
        done

        ((VULNERABLE_COUNT++))
        IS_VULN=1
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: automount 프로세스 없음\"}")
    fi

    # [점검 3] automount 설정 파일 확인
    local config_found=0

    for config_file in "${AUTOMOUNT_CONFIGS[@]}"; do
        if [ -f "$config_file" ]; then
            config_found=1
            ((TOTAL_CHECKED++))

            local config_lines=$(grep -v '^#' "$config_file" | grep -v '^$' | wc -l)

            if [ $config_lines -gt 0 ]; then
            ## 이게 설정이 하나라도 있으면(주석처리아닌것도) 이걸 취약으로 판단했음 -- 조치는 설정을 주석 처리 하는방향으로 다시 수정해야할듯
            ## 
                DETAILS_ARRAY+=("{\"점검항목\":\"$config_file\",\"상태\":\"취약\",\"세부내용\":\"취약:  $config_file - 설정 ${config_lines}줄 존재\"}")
                ##DETAILS_ARRAY+=("\"주의: $config_file - 설정 ${config_lines}줄 존재\"")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$config_file\",\"상태\":\"양호\",\"세부내용\":\"양호: $config_file - 설정 없음\"}")
            fi
        fi
    done

    # auto.* 패턴 파일 추가 검색
    local auto_files=$(find /etc -maxdepth 1 -name 'auto.*' -o -name 'auto_*' 2>/dev/null)

    if [ -n "$auto_files" ]; then
        local file_count=$(echo "$auto_files" | wc -l)
    fi

    if [ $config_found -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: automount 설정 파일 없음\"}")
    fi

    # [점검 4] /etc/fstab autofs 설정 확인
    if [ ! -f /etc/fstab ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/fstab\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/fstab 파일 없음\"}")
    else
        local autofs_entries=$(grep -v '^#' /etc/fstab | grep 'autofs')

        if [ -n "$autofs_entries" ]; then
            ((TOTAL_CHECKED++))

            local entry_count=$(echo "$autofs_entries" | wc -l)
            #DETAILS_ARRAY+=("\"양호(주의): /etc/fstab에 autofs 설정 ${entry_count}개 발견\"")
            ## 이것도 위의 점검3과 동일하게 마찬가지임
            DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/fstab에 autofs 설정 ${entry_count}개 발견\"}")
        

            while IFS= read -r line; do
                DETAILS_ARRAY+=("\"  - $line\"")
            done <<< "$autofs_entries"
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/fstab에 autofs 설정 없음\"}")
        fi
    fi

    # [점검 5] 현재 autofs 마운트 확인
    local autofs_mounts=$(mount | grep 'autofs')

    if [ -n "$autofs_mounts" ]; then
        ((TOTAL_CHECKED++))

        local mount_count=$(echo "$autofs_mounts" | wc -l)
        ## 이것도 위의 점검3,4랑 똑같음
        ## DETAILS_ARRAY+=("\"양호(주의): autofs 마운트 ${mount_count}개 발견\"")
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: autofs 마운트 ${mount_count}개 발견\"}")

        while IFS= read -r mount_line; do
            local mount_point=$(echo "$mount_line" | awk '{print $3}')
            ## DETAILS_ARRAY+=("\"  - $mount_point\"")
        done <<< "$autofs_mounts"
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: autofs 마운트 없음\"}")
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="automount 관련 서비스 및 설정 없음"
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: automount 관련 항목이 없습니다.\"}")
    elif [ $VULNERABLE_COUNT -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 항목 모두 안전"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 중 취약 ${VULNERABLE_COUNT}개, 안전 ${SECURE_COUNT}개"
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
echo "점검 시작 (단일 항목: U-41)..."
U-41

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
