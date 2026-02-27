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



##############################################################################################################
# 함수명: U-27
# 설명: r-command 관련 파일 점검
#############################################################################################################
function U-27() {
    local CHECK_ID="U-27"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="\$HOME/.rhosts, hosts.equiv 사용 금지"
    local EXPECTED_VAL="r-command 서비스 미사용 또는 관련 파일의 소유자가 root/해당계정이고 권한 600 이하이며 '+' 설정이 없는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local VULNERABLE_COUNT=0
    local SAFE_COUNT=0
    local service_running=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # systemd 기반 서비스 확인
    if systemctl list-units --all 2>/dev/null | grep -qE 'rsh|rlogin|rexec'; then
        if systemctl is-active rsh.socket 2>/dev/null | grep -q "active"; then
            service_running=1
        fi
        if systemctl is-active rlogin.socket 2>/dev/null | grep -q "active"; then
            service_running=1
        fi
        if systemctl is-active rexec.socket 2>/dev/null | grep -q "active"; then
            service_running=1
        fi
    fi

    # xinetd 기반 서비스 확인
    if [ -d /etc/xinetd.d ]; then
        for service in rsh rlogin rexec; do
            if [ -f "/etc/xinetd.d/$service" ]; then
                if ! grep -q "disable.*=.*yes" "/etc/xinetd.d/$service" 2>/dev/null; then
                    service_running=1
                fi
            fi
        done
    fi

    if [ $service_running -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"r-command\",\"상태\":\"양호\",\"세부내용\":\"양호: r-command 서비스 미실행\"}")
    fi

    # 파일 점검 함수
    check_rcommand_file() {
        local filepath="$1"
        local expected_owner="$2"

        if [ ! -f "$filepath" ]; then
            return 2
        fi

        ((TOTAL_CHECKED++))

        local file_owner=$(stat -c '%U' "$filepath" 2>/dev/null)
        local file_perm=$(stat -c '%a' "$filepath" 2>/dev/null)
        local is_file_vuln=0
        local vuln_reason=""

        # 소유자 확인
        if [ "$file_owner" != "root" ] && [ "$file_owner" != "$expected_owner" ]; then
            is_file_vuln=1
            vuln_reason="부적절한 소유자: $file_owner"
        fi

        # 권한 확인 (600 이하)
        if [ "$file_perm" -gt 600 ]; then
            is_file_vuln=1
            if [ -n "$vuln_reason" ]; then
                vuln_reason="$vuln_reason, 권한 600 초과 (현재: $file_perm)"
            else
                vuln_reason="권한 600 초과 (현재: $file_perm)"
            fi
        fi

        # "+" 설정 확인
        if grep -qE '^\+|^[[:space:]]+\+' "$filepath" 2>/dev/null; then
            is_file_vuln=1
            if [ -n "$vuln_reason" ]; then
                vuln_reason="$vuln_reason, '+' 설정 발견 (모든 호스트 허용)"
            else
                vuln_reason="'+' 설정 발견 (모든 호스트 허용)"
            fi
        fi

        if [ $is_file_vuln -eq 1 ]; then
            ((VULNERABLE_COUNT++))
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"$filepath\",\"상태\":\"취약\",\"세부내용\":\"취약: $filepath (소유자: $file_owner, 권한: $file_perm) - $vuln_reason\"}")
            return 1
        else
            ((SAFE_COUNT++))
            DETAILS_ARRAY+=("{\"점검항목\":\"$filepath\",\"상태\":\"양호\",\"세부내용\":\"양호: $filepath (소유자: $file_owner, 권한: $file_perm)\"}")
            return 0
        fi
    }

    # /etc/hosts.equiv 점검
    if [ ! -f /etc/hosts.equiv ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.equiv\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/hosts.equiv 파일 없음\"}")
    else
        check_rcommand_file "/etc/hosts.equiv" "root"
    fi

    # 사용자별 .rhosts 파일 점검
    local rhosts_found=0
    while IFS=: read -r username _ uid _ _ home_dir shell; do
        if { [ "$uid" -ge 1000 ] || [ "$username" = "root" ]; } && \
           [ "$shell" != "/sbin/nologin" ] && \
           [ "$shell" != "/bin/false" ] && \
           [ -d "$home_dir" ]; then

            local rhosts_file="$home_dir/.rhosts"

            if [ -f "$rhosts_file" ]; then
                rhosts_found=1
                check_rcommand_file "$rhosts_file" "$username"
            fi
        fi
    done < /etc/passwd

    if [ $rhosts_found -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"사용자\",\"상태\":\"양호\",\"세부내용\":\"양호: 사용자 .rhosts 파일 없음\"}")
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        if [ $service_running -eq 0 ]; then
            STATUS="SAFE"
            CURRENT_VAL="r-command 서비스 미사용 및 관련 파일 없음"
        else
            STATUS="VULNERABLE"
            CURRENT_VAL="r-command 서비스 실행 중 (설정 파일 없음)"
            IS_VULN=1
        fi
    else
        if [ $IS_VULN -eq 1 ]; then
            STATUS="VULNERABLE"
            CURRENT_VAL="총 ${TOTAL_CHECKED}개 파일 점검 (취약: ${VULNERABLE_COUNT}개, 양호: ${SAFE_COUNT}개)"
        else
            STATUS="SAFE"
            CURRENT_VAL="총 ${TOTAL_CHECKED}개 파일 모두 양호"
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
echo "점검 시작 (단일 항목: U-27)..."
U-27

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
