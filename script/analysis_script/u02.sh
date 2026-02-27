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


################################################################################################
################################################################################################
function U-02() {

    local CHECK_ID="U-02"
    local CATEGORY="계정 관리"
    local DESCRIPTION="비밀번호 관리정책 설정"
    local EXPECTED_VALUE="복잡성(8자 3종류/10자 2종류), 기간(최대 90일, 최소 1일), 기억(최근 4회) 설정 및 root 강제 적용"

    local STATUS="SAFE"
    local CURRENT_VALUE="비밀번호 정책 기준 만족"
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local CONFIG_FILE="/etc/security/pwquality.conf"
    local LOGIN_DEFS="/etc/login.defs"
    local PAM_FILE=""
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # OS별 PAM 파일 경로 설정
    if [[ "$OS_TYPE" =~ ^(rocky|rhel|centos)$ ]]; then
        PAM_FILE="/etc/pam.d/system-auth"
    elif [[ "$OS_TYPE" =~ ^(debian|ubuntu)$ ]]; then
        PAM_FILE="/etc/pam.d/common-password"
    else
        if [ -f "/etc/pam.d/system-auth" ]; then PAM_FILE="/etc/pam.d/system-auth"
        elif [ -f "/etc/pam.d/common-password" ]; then PAM_FILE="/etc/pam.d/common-password"
        fi
    fi

    # 점검1. 비밀번호 사용 기간 점검 확인 ()
    if [ -f "$LOGIN_DEFS" ]; then
         
        local MAX_DAYS=$(grep "^PASS_MAX_DAYS" "$LOGIN_DEFS" | awk '{print $2}')
        local MIN_DAYS=$(grep "^PASS_MIN_DAYS" "$LOGIN_DEFS" | awk '{print $2}')
        
        if [ -n "$MAX_DAYS" ] && [ "$MAX_DAYS" -le 90 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 사용 기간\",\"상태\":\"양호\",\"세부내용\":\"양호: 최대 사용 기간($MAX_DAYS일)이 90일 이하입니다.\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 사용 기간\",\"상태\":\"취약\",\"세부내용\":\"취약: 최대 사용 기간(${MAX_DAYS:-미설정}일)이 90일을 초과하거나 설정되지 않았습니다.\"}")
        fi

        local MIN_DAYS_CRITERIA=1
        if [ -n "$MIN_DAYS" ] && [ "$MIN_DAYS" -ge "$MIN_DAYS_CRITERIA" ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 사용 기간\",\"상태\":\"양호\",\"세부내용\":\"양호: 최소 사용 기간($MIN_DAYS일)이 ${MIN_DAYS_CRITERIA}일 이상입니다.\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 사용 기간\",\"상태\":\"취약\",\"세부내용\":\"취약: 최소 사용 기간(${MIN_DAYS:-미설정}일)이 ${MIN_DAYS_CRITERIA}일 미만입니다.\"}")
        fi
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 사용 기간\",\"상태\":\"취약\",\"세부내용\":\"취약: $LOGIN_DEFS 파일이 존재하지 않습니다.\"}")
    fi


    # 점검2. 비밀번호 복잡성 점검
    local V_MINLEN=0; local V_MINCLASS=0; local V_LCREDIT=0; local V_UCREDIT=0; 
    local V_DCREDIT=0; local V_OCREDIT=0; local V_ENFORCE_ROOT="미설정"

    if [ -f "$CONFIG_FILE" ]; then
        V_MINLEN=$(grep -v "^#" "$CONFIG_FILE" | grep "minlen" | cut -d= -f2 | tr -d ' ')
        V_MINCLASS=$(grep -v "^#" "$CONFIG_FILE" | grep "minclass" | cut -d= -f2 | tr -d ' ')
        V_LCREDIT=$(grep -v "^#" "$CONFIG_FILE" | grep "lcredit" | cut -d= -f2 | tr -d ' ')
        V_UCREDIT=$(grep -v "^#" "$CONFIG_FILE" | grep "ucredit" | cut -d= -f2 | tr -d ' ')
        V_DCREDIT=$(grep -v "^#" "$CONFIG_FILE" | grep "dcredit" | cut -d= -f2 | tr -d ' ')
        V_OCREDIT=$(grep -v "^#" "$CONFIG_FILE" | grep "ocredit" | cut -d= -f2 | tr -d ' ')
        grep -v "^#" "$CONFIG_FILE" | grep -q "enforce_for_root" && V_ENFORCE_ROOT="설정됨"
    fi

    # PAM 설정 오버라이드 확인
    if [ -n "$PAM_FILE" ] && [ -f "$PAM_FILE" ]; then
        local PAM_LINE=$(grep -E "^\s*password.*(pam_pwquality\.so|pam_cracklib\.so)" "$PAM_FILE" | grep -v "^#" | head -n 1)
        if [ -n "$PAM_LINE" ]; then
            [[ "$PAM_LINE" =~ minlen=([-0-9]+) ]] && V_MINLEN=${BASH_REMATCH[1]}
            [[ "$PAM_LINE" =~ minclass=([-0-9]+) ]] && V_MINCLASS=${BASH_REMATCH[1]}
            [[ "$PAM_LINE" =~ lcredit=([-0-9]+) ]] && V_LCREDIT=${BASH_REMATCH[1]}
            [[ "$PAM_LINE" =~ ucredit=([-0-9]+) ]] && V_UCREDIT=${BASH_REMATCH[1]}
            [[ "$PAM_LINE" =~ dcredit=([-0-9]+) ]] && V_DCREDIT=${BASH_REMATCH[1]}
            [[ "$PAM_LINE" =~ ocredit=([-0-9]+) ]] && V_OCREDIT=${BASH_REMATCH[1]}
            [[ "$PAM_LINE" == *"enforce_for_root"* ]] && V_ENFORCE_ROOT="설정됨"
        fi
    fi

    # 복잡성 클래스 계산
    local CHECK_CLASS=${V_MINCLASS:-0}
    if [ "$CHECK_CLASS" -eq 0 ]; then
        [ "${V_LCREDIT:-0}" -lt 0 ] && ((CHECK_CLASS++))
        [ "${V_UCREDIT:-0}" -lt 0 ] && ((CHECK_CLASS++))
        [ "${V_DCREDIT:-0}" -lt 0 ] && ((CHECK_CLASS++))
        [ "${V_OCREDIT:-0}" -lt 0 ] && ((CHECK_CLASS++))
    fi

    # 복잡성 판정 // -ge는 같거나 작을때를 의미함
    if { [ "$CHECK_CLASS" -ge 3 ] && [ "${V_MINLEN:-0}" -ge 8 ]; } || { [ "$CHECK_CLASS" -ge 2 ] && [ "${V_MINLEN:-0}" -ge 10 ]; }; then
        if [ "$V_ENFORCE_ROOT" == "설정됨" ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 복잡도\",\"상태\":\"양호\",\"세부내용\":\"양호: 비밀번호 복잡성(길이 $V_MINLEN, 종류 $CHECK_CLASS) 및 Root 강제 적용이 확인되었습니다.\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 복잡도\",\"상태\":\"취약\",\"세부내용\":\"취약: 비밀번호 복잡성은 만족하나, Root 강제 적용(enforce_for_root) 설정이 누락되었습니다.\"}")
        fi
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 복잡도\",\"상태\":\"취약\",\"세부내용\":\"취약: 비밀번호 복잡성 기준 미달 (현재: 길이 ${V_MINLEN:-0}, 종류 $CHECK_CLASS)\"}")
    fi

    # 점검3. 비밀번호 기억 점검
    local REMEMBER_VAL=""
    if [ -n "$PAM_FILE" ] && [ -f "$PAM_FILE" ]; then
        local HIST_LINE=$(grep -E "^\s*password.*(pam_pwhistory\.so|pam_unix\.so)" "$PAM_FILE" | grep -v "^#" | grep "remember=" | head -n 1)
        [[ "$HIST_LINE" =~ remember=([0-9]+) ]] && REMEMBER_VAL=${BASH_REMATCH[1]}
    fi

    if [ -z "$REMEMBER_VAL" ] && [ -f "/etc/security/pwhistory.conf" ]; then
        REMEMBER_VAL=$(grep -v "^#" /etc/security/pwhistory.conf | grep "remember" | cut -d= -f2 | tr -d ' ')
    fi

    if [ -n "$REMEMBER_VAL" ] && [ "$REMEMBER_VAL" -ge 4 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 재사용 제한\",\"상태\":\"양호\",\"세부내용\":\"양호: 이전 비밀번호 기억 횟수가 ${REMEMBER_VAL}회로 설정되어 있습니다.\"}")
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 재사용 제한\",\"상태\":\"취약\",\"세부내용\":\"취약: 이전 비밀번호 기억 횟수가 ${REMEMBER_VAL:-미설정}회 입니다. (4회 이상 필요)\"}")
    fi

    # 최종 결과 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="비밀번호 관리정책 기준 미달"
    fi
    
     if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # JSON 데이터 생성 및 공통 함수 호출
    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-02)..."
U-02

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
