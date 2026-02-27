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
# U-01
# 설명: root 계정 원격 접속 제한
###############################################################################

###############################################################################
# 📝 Details 구조화 가이드
# 
# 각 함수를 다음 패턴으로 수정하세요:
#
# Before:
#   DETAILS_ARRAY+=("\"현재상태: PermitRootLogin no\"")
#   DETAILS_ARRAY+=("\"판정결과: 양호\"")
#   DETAILS_ARRAY+=("\"보안효과: SSH를 통한 root 직접 로그인 차단\"")
#
# After:
#   Add_Detail_Item \
#       "SSH 원격 접속 설정" \
#       "/etc/ssh/sshd_config" \
#       "grep -i '^PermitRootLogin' /etc/ssh/sshd_config" \
#       "양호" \
#       "PermitRootLogin no 설정됨. 보안효과: SSH를 통한 root 직접 로그인 차단"
#
###############################################################################

function U-01() {
    local CHECK_ID="U-01"
    local CATEGORY="계정 관리"
    local DESCRIPTION="root 계정 원격 접속 제한"
    local EXPECTED_VALUE="PermitRootLogin: no, Securetty pts 차단"
    
    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"
    
    # 1. SSH 설정 점검
    local SSH_CONFIG="/etc/ssh/sshd_config"
    if [ -f "$SSH_CONFIG" ]; then
        # 파일 전체 내용을 읽어서 점검 수행 (내부적으로 cat으로 전체 파일 확인)
        local SSH_FILE_CONTENT=$(cat "$SSH_CONFIG")
        
        # 점검 항목만 추출: PermitRootLogin 관련 라인만
        local PERMITROOTLOGIN_LINES=$(echo "$SSH_FILE_CONTENT" | grep -i "^PermitRootLogin" 2>/dev/null | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
        if [ -z "$PERMITROOTLOGIN_LINES" ]; then
            PERMITROOTLOGIN_LINES="PermitRootLogin 설정이 없습니다."
        fi
        
        # 조치: grep -i "^PermitRootLogin" | awk '{print $2}'
        local SSH_CHECK=$(echo "$SSH_FILE_CONTENT" | grep -i "^PermitRootLogin" | awk '{print $2}' | head -n 1)
        
        if [[ "$SSH_CHECK" =~ ^(no|No|NO)$ ]]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"SSH 원격 접속 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SSH PermitRootLogin이 'no'로 설정됨\",\"점검명령어\":\"grep -i '^PermitRootLogin' $SSH_CONFIG\",\"전체내용\":\"$PERMITROOTLOGIN_LINES\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"SSH 원격 접속 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SSH PermitRootLogin이 '${SSH_CHECK:-설정없음}'로 설정됨 ('no' 필요)\",\"점검명령어\":\"grep -i '^PermitRootLogin' $SSH_CONFIG\",\"전체내용\":\"$PERMITROOTLOGIN_LINES\"}")
        fi
    else
        # SSH 설정 파일이 없는 경우
        ## IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"SSH 원격 접속 설정\",\"상태\":\"양호\",\"세부내용\":\"양호:(주의) SSH 설정 파일(/etc/ssh/sshd_config)이 존재하지 않아 설정을 확인할 수 없음\",\"점검명령어\":\"grep -i '^PermitRootLogin' $SSH_CONFIG\",\"전체내용\":\"\"}")
    fi
    
    # 2. Securetty 설정 점검
    local SECURETTY="/etc/securetty"
    if [ -f "$SECURETTY" ]; then
        # 파일 전체 내용을 읽어서 점검 수행 (내부적으로 cat으로 전체 파일 확인)
        local SECURETTY_FILE_CONTENT=$(cat "$SECURETTY")
        
        # 점검 항목만 추출: pts 관련 라인만 (주석 제외)
        local PTS_LINES=$(echo "$SECURETTY_FILE_CONTENT" | grep -vE "^#|^\s*#" 2>/dev/null | grep "^pts" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
        if [ -z "$PTS_LINES" ]; then
            PTS_LINES="pts 항목이 없습니다."
        fi
        
        # 조치: grep -vE "^#|^\s*#" | grep "^pts"
        if echo "$SECURETTY_FILE_CONTENT" | grep -vE "^#|^\s*#" | grep -q "^pts"; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"Securetty 설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/securetty에 pts 허용으로 root 원격 접속 가능함\",\"점검명령어\":\"grep -vE '^#|^\\\\s*#' $SECURETTY | grep '^pts'\",\"전체내용\":\"$PTS_LINES\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"Securetty 설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/securetty에 pts 항목이 없어 root 원격 접속 차단됨\",\"점검명령어\":\"grep -vE '^#|^\\\\s*#' $SECURETTY | grep '^pts'\",\"전체내용\":\"$PTS_LINES\"}")
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"Securetty 설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/securetty 파일이 없어 root 원격 접속 기본 차단됨\",\"점검명령어\":\"grep -vE '^#|^\\\\s*#' $SECURETTY | grep '^pts'\",\"전체내용\":\"\"}")
    fi
    
    # 3. 최종 판정 (조치 스크립트와 동일한 로직)
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="root 원격 접속 차단 미흡"
    else
        CURRENT_VALUE="root 원격 접속 완전 차단"
    fi
    
    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi
    
    local DETAILS_JSON=$(Build_Details_JSON)
    
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
        "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
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
    local LOGIN_DEFS_SETTINGS=""
    if [ -f "$LOGIN_DEFS" ]; then
        # 파일 전체 내용을 읽어서 점검 수행 (내부적으로 cat으로 전체 파일 확인)
        local LOGIN_DEFS_CONTENT=$(cat "$LOGIN_DEFS")
        
        # 점검 항목만 추출: PASS_MAX_DAYS, PASS_MIN_DAYS 관련 라인만
        local PASS_MAX_LINE=$(echo "$LOGIN_DEFS_CONTENT" | grep "^PASS_MAX_DAYS" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
        local PASS_MIN_LINE=$(echo "$LOGIN_DEFS_CONTENT" | grep "^PASS_MIN_DAYS" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
        
        if [ -n "$PASS_MAX_LINE" ]; then
            LOGIN_DEFS_SETTINGS="$PASS_MAX_LINE"
        fi
        if [ -n "$PASS_MIN_LINE" ]; then
            if [ -n "$LOGIN_DEFS_SETTINGS" ]; then
                LOGIN_DEFS_SETTINGS="${LOGIN_DEFS_SETTINGS}\\n${PASS_MIN_LINE}"
            else
                LOGIN_DEFS_SETTINGS="$PASS_MIN_LINE"
            fi
        fi
        if [ -z "$LOGIN_DEFS_SETTINGS" ]; then
            LOGIN_DEFS_SETTINGS="PASS_MAX_DAYS 또는 PASS_MIN_DAYS 설정이 없습니다."
        fi
         
        local MAX_DAYS=$(echo "$LOGIN_DEFS_CONTENT" | grep "^PASS_MAX_DAYS" | awk '{print $2}')
        local MIN_DAYS=$(echo "$LOGIN_DEFS_CONTENT" | grep "^PASS_MIN_DAYS" | awk '{print $2}')
        
        if [ -n "$MAX_DAYS" ] && [ "$MAX_DAYS" -le 90 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 사용 기간\",\"상태\":\"양호\",\"세부내용\":\"양호: 최대 사용 기간($MAX_DAYS일)이 90일 이하입니다.\",\"점검명령어\":\"grep '^PASS_MAX_DAYS\\\\|^PASS_MIN_DAYS' $LOGIN_DEFS\",\"전체내용\":\"$LOGIN_DEFS_SETTINGS\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 사용 기간\",\"상태\":\"취약\",\"세부내용\":\"취약: 최대 사용 기간(${MAX_DAYS:-미설정}일)이 90일을 초과하거나 설정되지 않았습니다.\",\"점검명령어\":\"grep '^PASS_MAX_DAYS\\\\|^PASS_MIN_DAYS' $LOGIN_DEFS\",\"전체내용\":\"$LOGIN_DEFS_SETTINGS\"}")
        fi

        local MIN_DAYS_CRITERIA=1
        if [ -n "$MIN_DAYS" ] && [ "$MIN_DAYS" -ge "$MIN_DAYS_CRITERIA" ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 사용 기간\",\"상태\":\"양호\",\"세부내용\":\"양호: 최소 사용 기간($MIN_DAYS일)이 ${MIN_DAYS_CRITERIA}일 이상입니다.\",\"점검명령어\":\"grep '^PASS_MAX_DAYS\\\\|^PASS_MIN_DAYS' $LOGIN_DEFS\",\"전체내용\":\"$LOGIN_DEFS_SETTINGS\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 사용 기간\",\"상태\":\"취약\",\"세부내용\":\"취약: 최소 사용 기간(${MIN_DAYS:-미설정}일)이 ${MIN_DAYS_CRITERIA}일 미만입니다.\",\"점검명령어\":\"grep '^PASS_MAX_DAYS\\\\|^PASS_MIN_DAYS' $LOGIN_DEFS\",\"전체내용\":\"$LOGIN_DEFS_SETTINGS\"}")
        fi
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 사용 기간\",\"상태\":\"취약\",\"세부내용\":\"취약: $LOGIN_DEFS 파일이 존재하지 않습니다.\",\"점검명령어\":\"grep '^PASS_MAX_DAYS\\\\|^PASS_MIN_DAYS' $LOGIN_DEFS\",\"전체내용\":\"\"}")
    fi


    # 점검2. 비밀번호 복잡성 점검
    local V_MINLEN=0; local V_MINCLASS=0; local V_LCREDIT=0; local V_UCREDIT=0; 
    local V_DCREDIT=0; local V_OCREDIT=0; local V_ENFORCE_ROOT="미설정"
    local COMPLEXITY_SETTINGS=""

    if [ -f "$CONFIG_FILE" ]; then
        # 파일 전체 내용을 읽어서 점검 수행 (내부적으로 cat으로 전체 파일 확인)
        local CONFIG_FILE_CONTENT=$(cat "$CONFIG_FILE")
        
        # 점검 항목만 추출: 비밀번호 복잡성 관련 설정만 (주석 제외)
        local COMPLEXITY_LINES=$(echo "$CONFIG_FILE_CONTENT" | grep -v "^#" | grep -E "(minlen|minclass|lcredit|ucredit|dcredit|ocredit|enforce_for_root)" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
        if [ -n "$COMPLEXITY_LINES" ]; then
            COMPLEXITY_SETTINGS="${CONFIG_FILE}: ${COMPLEXITY_LINES}"
        fi
        
        V_MINLEN=$(echo "$CONFIG_FILE_CONTENT" | grep -v "^#" | grep "minlen" | cut -d= -f2 | tr -d ' ')
        V_MINCLASS=$(echo "$CONFIG_FILE_CONTENT" | grep -v "^#" | grep "minclass" | cut -d= -f2 | tr -d ' ')
        V_LCREDIT=$(echo "$CONFIG_FILE_CONTENT" | grep -v "^#" | grep "lcredit" | cut -d= -f2 | tr -d ' ')
        V_UCREDIT=$(echo "$CONFIG_FILE_CONTENT" | grep -v "^#" | grep "ucredit" | cut -d= -f2 | tr -d ' ')
        V_DCREDIT=$(echo "$CONFIG_FILE_CONTENT" | grep -v "^#" | grep "dcredit" | cut -d= -f2 | tr -d ' ')
        V_OCREDIT=$(echo "$CONFIG_FILE_CONTENT" | grep -v "^#" | grep "ocredit" | cut -d= -f2 | tr -d ' ')
        echo "$CONFIG_FILE_CONTENT" | grep -v "^#" | grep -q "enforce_for_root" && V_ENFORCE_ROOT="설정됨"
    fi

    # PAM 설정 오버라이드 확인
    if [ -n "$PAM_FILE" ] && [ -f "$PAM_FILE" ]; then
        # 파일 전체 내용을 읽어서 점검 수행 (내부적으로 cat으로 전체 파일 확인)
        local PAM_FILE_CONTENT=$(cat "$PAM_FILE")
        
        # 점검 항목만 추출: pam_pwquality.so 또는 pam_cracklib.so 관련 라인만
        local PAM_LINE=$(echo "$PAM_FILE_CONTENT" | grep -E "^\s*password.*(pam_pwquality\.so|pam_cracklib\.so)" | grep -v "^#" | head -n 1)
        if [ -n "$PAM_LINE" ]; then
            local PAM_LINE_ESCAPED=$(echo "$PAM_LINE" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
            if [ -n "$COMPLEXITY_SETTINGS" ]; then
                COMPLEXITY_SETTINGS="${COMPLEXITY_SETTINGS}\\n${PAM_FILE}: ${PAM_LINE_ESCAPED}"
            else
                COMPLEXITY_SETTINGS="${PAM_FILE}: ${PAM_LINE_ESCAPED}"
            fi
            
            [[ "$PAM_LINE" =~ minlen=([-0-9]+) ]] && V_MINLEN=${BASH_REMATCH[1]}
            [[ "$PAM_LINE" =~ minclass=([-0-9]+) ]] && V_MINCLASS=${BASH_REMATCH[1]}
            [[ "$PAM_LINE" =~ lcredit=([-0-9]+) ]] && V_LCREDIT=${BASH_REMATCH[1]}
            [[ "$PAM_LINE" =~ ucredit=([-0-9]+) ]] && V_UCREDIT=${BASH_REMATCH[1]}
            [[ "$PAM_LINE" =~ dcredit=([-0-9]+) ]] && V_DCREDIT=${BASH_REMATCH[1]}
            [[ "$PAM_LINE" =~ ocredit=([-0-9]+) ]] && V_OCREDIT=${BASH_REMATCH[1]}
            [[ "$PAM_LINE" == *"enforce_for_root"* ]] && V_ENFORCE_ROOT="설정됨"
        fi
    fi
    
    if [ -z "$COMPLEXITY_SETTINGS" ]; then
        COMPLEXITY_SETTINGS="비밀번호 복잡성 설정이 발견되지 않음"
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
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 복잡도\",\"상태\":\"양호\",\"세부내용\":\"양호: 비밀번호 복잡성(길이 $V_MINLEN, 종류 $CHECK_CLASS) 및 Root 강제 적용이 확인되었습니다.\",\"점검명령어\":\"grep -v '^#' $CONFIG_FILE; [ -f '$PAM_FILE' ] && grep -E '^\\\\s*password.*(pam_pwquality\\\\.so|pam_cracklib\\\\.so)' $PAM_FILE\",\"전체내용\":\"$COMPLEXITY_SETTINGS\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 복잡도\",\"상태\":\"취약\",\"세부내용\":\"취약: 비밀번호 복잡성은 만족하나, Root 강제 적용(enforce_for_root) 설정이 누락되었습니다.\",\"점검명령어\":\"grep -v '^#' $CONFIG_FILE; [ -f '$PAM_FILE' ] && grep -E '^\\\\s*password.*(pam_pwquality\\\\.so|pam_cracklib\\\\.so)' $PAM_FILE\",\"전체내용\":\"$COMPLEXITY_SETTINGS\"}")
        fi
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 복잡도\",\"상태\":\"취약\",\"세부내용\":\"취약: 비밀번호 복잡성 기준 미달 (현재: 길이 ${V_MINLEN:-0}, 종류 $CHECK_CLASS)\",\"점검명령어\":\"grep -v '^#' $CONFIG_FILE; [ -f '$PAM_FILE' ] && grep -E '^\\\\s*password.*(pam_pwquality\\\\.so|pam_cracklib\\\\.so)' $PAM_FILE\",\"전체내용\":\"$COMPLEXITY_SETTINGS\"}")
    fi

    # 점검3. 비밀번호 기억 점검
    local REMEMBER_VAL=""
    local REMEMBER_SETTINGS=""
    local REMEMBER_FILE=""
    
    if [ -n "$PAM_FILE" ] && [ -f "$PAM_FILE" ]; then
        # 파일 전체 내용을 읽어서 점검 수행 (내부적으로 cat으로 전체 파일 확인)
        local PAM_FILE_CONTENT=$(cat "$PAM_FILE")
        
        # 점검 항목만 추출: remember= 관련 라인만
        local HIST_LINE=$(echo "$PAM_FILE_CONTENT" | grep -E "^\s*password.*(pam_pwhistory\.so|pam_unix\.so)" | grep -v "^#" | grep "remember=" | head -n 1)
        if [ -n "$HIST_LINE" ]; then
            local HIST_LINE_ESCAPED=$(echo "$HIST_LINE" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
            REMEMBER_SETTINGS="${PAM_FILE}: ${HIST_LINE_ESCAPED}"
            REMEMBER_FILE="$PAM_FILE"
        fi
        [[ "$HIST_LINE" =~ remember=([0-9]+) ]] && REMEMBER_VAL=${BASH_REMATCH[1]}
    fi

    if [ -z "$REMEMBER_VAL" ] && [ -f "/etc/security/pwhistory.conf" ]; then
        # 파일 전체 내용을 읽어서 점검 수행 (내부적으로 cat으로 전체 파일 확인)
        local PWHISTORY_CONTENT=$(cat "/etc/security/pwhistory.conf")
        
        # 점검 항목만 추출: remember 관련 라인만 (주석 제외)
        local REMEMBER_LINE=$(echo "$PWHISTORY_CONTENT" | grep -v "^#" | grep "remember" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
        if [ -n "$REMEMBER_LINE" ]; then
            if [ -n "$REMEMBER_SETTINGS" ]; then
                REMEMBER_SETTINGS="${REMEMBER_SETTINGS}\\n/etc/security/pwhistory.conf: ${REMEMBER_LINE}"
            else
                REMEMBER_SETTINGS="/etc/security/pwhistory.conf: ${REMEMBER_LINE}"
            fi
            REMEMBER_FILE="/etc/security/pwhistory.conf"
        fi
        REMEMBER_VAL=$(echo "$PWHISTORY_CONTENT" | grep -v "^#" | grep "remember" | cut -d= -f2 | tr -d ' ')
    fi
    
    if [ -z "$REMEMBER_SETTINGS" ]; then
        REMEMBER_SETTINGS="비밀번호 재사용 제한 설정이 발견되지 않음"
    fi

    if [ -n "$REMEMBER_VAL" ] && [ "$REMEMBER_VAL" -ge 4 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 재사용 제한\",\"상태\":\"양호\",\"세부내용\":\"양호: 이전 비밀번호 기억 횟수가 ${REMEMBER_VAL}회로 설정되어 있습니다.\",\"점검명령어\":\"[ -f '$PAM_FILE' ] && grep -E '^\\\\s*password.*(pam_pwhistory\\\\.so|pam_unix\\\\.so)' $PAM_FILE | grep 'remember=' || [ -f '/etc/security/pwhistory.conf' ] && grep -v '^#' /etc/security/pwhistory.conf | grep 'remember'\",\"전체내용\":\"$REMEMBER_SETTINGS\"}")
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 재사용 제한\",\"상태\":\"취약\",\"세부내용\":\"취약: 이전 비밀번호 기억 횟수가 ${REMEMBER_VAL:-미설정}회 입니다. (4회 이상 필요)\",\"점검명령어\":\"[ -f '$PAM_FILE' ] && grep -E '^\\\\s*password.*(pam_pwhistory\\\\.so|pam_unix\\\\.so)' $PAM_FILE | grep 'remember=' || [ -f '/etc/security/pwhistory.conf' ] && grep -v '^#' /etc/security/pwhistory.conf | grep 'remember'\",\"전체내용\":\"$REMEMBER_SETTINGS\"}")
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

###############################################################################
# U-03
# 설명: 로그인 실패 시 계정 잠금 임계값(deny) 설정 여부 점검
# 수정: Ubuntu 시 @include 된 파일 내용까지 합쳐서 점검 (22.04/24.04/25.04 대응)
###############################################################################
function U-03() {

    local CHECK_ID="U-03"
    local CATEGORY="계정 관리"
    local DESCRIPTION="계정 잠금 임계값 설정"
    local EXPECTED_VALUE="계정 잠금 임계값이 10회 이하로 설정되어야 함 (조치 스크립트는 수동조치만 적용)"

    local STATUS="SAFE"
    local CURRENT_VALUE="계정 잠금 임계값 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local CHECK_FILES=()
    local ACCT_FILES=()

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # [1] OS별 점검 대상 파일 목록 설정 (Ubuntu 20.04, 22.04, 24.04, 25.04 동일)
    if [[ "$OS_TYPE" =~ ^(rocky|rhel|centos)$ ]]; then
        CHECK_FILES=("/etc/pam.d/system-auth" "/etc/pam.d/password-auth")
        ACCT_FILES=("/etc/pam.d/system-auth" "/etc/pam.d/password-auth")
    elif [[ "$OS_TYPE" =~ ^(debian|ubuntu)$ ]]; then
        CHECK_FILES=("/etc/pam.d/common-auth")
        ACCT_FILES=("/etc/pam.d/common-account")
    else
        CHECK_FILES=("/etc/pam.d/system-auth")
        ACCT_FILES=("/etc/pam.d/system-auth")
    fi

    # [2] 파일별 순회 점검
    local i=0
    for PAM_FILE in "${CHECK_FILES[@]}"; do
        local PAM_ACCT_FILE="${ACCT_FILES[$i]}"
        ((i++))

        if [ ! -f "$PAM_FILE" ]; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: $PAM_FILE 파일이 존재하지 않습니다.\",\"점검명령어\":\"ls -l $PAM_FILE\",\"전체내용\":\"\"}")
            continue
        fi

        # 점검용 내용: 본문 + Ubuntu 등 @include 파일 내용 합침 (22.04/24.04/25.04 공통)
        local PAM_CONTENT=""
        if [[ "$OS_TYPE" =~ ^(debian|ubuntu)$ ]] && [[ "$PAM_FILE" == /etc/pam.d/* ]]; then
            PAM_CONTENT=$(cat "$PAM_FILE" 2>/dev/null)
            while read -r inc_line; do
                local inc_file=$(echo "$inc_line" | awk '{print $2}')
                [ -z "$inc_file" ] && continue
                [[ "$inc_file" != /* ]] && inc_file="/etc/pam.d/$inc_file"
                [ -f "$inc_file" ] && PAM_CONTENT="$PAM_CONTENT"$'\n'"$(cat "$inc_file" 2>/dev/null)"
            done < <(grep -v "^#" "$PAM_FILE" 2>/dev/null | grep "^@include")
        else
            PAM_CONTENT=$(cat "$PAM_FILE" 2>/dev/null)
        fi

        # 1. 사용 중인 모듈 식별 (합친 내용 기준)
        local MODULE_NAME=""
        if echo "$PAM_CONTENT" | grep -v "^#" | grep -q "pam_faillock.so"; then
            MODULE_NAME="pam_faillock.so"
        elif echo "$PAM_CONTENT" | grep -v "^#" | grep -q "pam_tally2.so"; then
            MODULE_NAME="pam_tally2.so"
        elif echo "$PAM_CONTENT" | grep -v "^#" | grep -q "pam_tally.so"; then
            MODULE_NAME="pam_tally.so"
        fi

        if [ -n "$MODULE_NAME" ]; then
            # 2. 모듈 실제 경로 확인 (Ubuntu 22/24/25 공통 경로 포함)
            local MODULE_FOUND=0
            for path in "/lib64/security/$MODULE_NAME" "/lib/security/$MODULE_NAME" "/usr/lib64/security/$MODULE_NAME" "/usr/lib/x86_64-linux-gnu/security/$MODULE_NAME"; do
                if [ -f "$path" ]; then MODULE_FOUND=1; break; fi
            done

            if [ $MODULE_FOUND -eq 0 ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: 모듈($MODULE_NAME) 파일이 라이브러리 경로에 없습니다.\",\"점검명령어\":\"ls -l /lib*/security/$MODULE_NAME /usr/lib*/security/$MODULE_NAME 2>/dev/null\",\"전체내용\":\"\"}")
            fi

            # 3. 설정값(deny, unlock_time) 추출 - 합친 내용에서 첫 번째 매칭 라인 사용
            local PAM_LINE=$(echo "$PAM_CONTENT" | grep -v "^#" | grep "$MODULE_NAME" | head -n 1)
            local DENY_COUNT=$(echo "$PAM_LINE" | grep -oE "deny=[0-9]+" | cut -d= -f2)
            local UNLOCK_TIME=$(echo "$PAM_LINE" | grep -oE "unlock_time=[0-9]+" | cut -d= -f2)

            if [ "$MODULE_NAME" == "pam_faillock.so" ] && [ -f "/etc/security/faillock.conf" ]; then
                [ -z "$DENY_COUNT" ] && DENY_COUNT=$(grep -v "^#" /etc/security/faillock.conf | grep "deny" | grep -oE "[0-9]+" | head -n 1)
                [ -z "$UNLOCK_TIME" ] && UNLOCK_TIME=$(grep -v "^#" /etc/security/faillock.conf | grep "unlock_time" | grep -oE "[0-9]+" | head -n 1)
            fi

            # 4. 임계값 진단 (10회 이하)
            if [ -n "$DENY_COUNT" ]; then
                if [ "$DENY_COUNT" -le 10 ] && [ "$DENY_COUNT" -gt 0 ]; then
                    DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"양호\",\"세부내용\":\"양호: $DENY_COUNT회\",\"점검명령어\":\"grep -v '^#' $PAM_FILE | grep '$MODULE_NAME'\",\"전체내용\":\"$PAM_LINE\"}")
                else
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: $DENY_COUNT회 (10회 이하 권장)\",\"점검명령어\":\"grep -v '^#' $PAM_FILE | grep '$MODULE_NAME'\",\"전체내용\":\"$PAM_LINE\"}")
                fi
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: deny 설정 누락\",\"점검명령어\":\"grep -v '^#' $PAM_FILE | grep '$MODULE_NAME'\",\"전체내용\":\"$PAM_LINE\"}")
            fi

            # 5. 잠금 시간 정보
            if [ -z "$UNLOCK_TIME" ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: 계정 잠금 시간(unlock_time)이 설정되지 않음\",\"점검명령어\":\"grep -v '^#' $PAM_FILE | grep '$MODULE_NAME'\",\"전체내용\":\"$PAM_LINE\"}")
            elif [ "$UNLOCK_TIME" -lt 120 ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: 계정 잠금 시간이 $UNLOCK_TIME초로 기준(120초)보다 낮음\",\"점검명령어\":\"grep -v '^#' $PAM_FILE | grep '$MODULE_NAME'\",\"전체내용\":\"$PAM_LINE\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"양호\",\"세부내용\":\"양호: 계정 잠금 시간이 $UNLOCK_TIME초로 적절히 설정됨\",\"점검명령어\":\"grep -v '^#' $PAM_FILE | grep '$MODULE_NAME'\",\"전체내용\":\"$PAM_LINE\"}")
            fi

            # 6. Account 구성 확인 (Ubuntu 시 common-account도 @include 내용 합쳐서 검사)
            if [ -n "$PAM_ACCT_FILE" ] && [ -f "$PAM_ACCT_FILE" ]; then
                local ACCT_CONTENT=""
                if [[ "$OS_TYPE" =~ ^(debian|ubuntu)$ ]] && [[ "$PAM_ACCT_FILE" == /etc/pam.d/* ]]; then
                    ACCT_CONTENT=$(cat "$PAM_ACCT_FILE" 2>/dev/null)
                    while read -r inc_line; do
                        local inc_file=$(echo "$inc_line" | awk '{print $2}')
                        [ -z "$inc_file" ] && continue
                        [[ "$inc_file" != /* ]] && inc_file="/etc/pam.d/$inc_file"
                        [ -f "$inc_file" ] && ACCT_CONTENT="$ACCT_CONTENT"$'\n'"$(cat "$inc_file" 2>/dev/null)"
                    done < <(grep -v "^#" "$PAM_ACCT_FILE" 2>/dev/null | grep "^@include")
                else
                    ACCT_CONTENT=$(cat "$PAM_ACCT_FILE" 2>/dev/null)
                fi
                if echo "$ACCT_CONTENT" | grep -v "^#" | grep "account" | grep -q "$MODULE_NAME"; then
                    DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"양호\",\"세부내용\":\"양호: Account 모듈 설정 확인됨\",\"점검명령어\":\"grep -v '^#' $PAM_ACCT_FILE | grep '$MODULE_NAME'\",\"전체내용\":\"$PAM_ACCT_FILE\"}")
                else
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: $PAM_ACCT_FILE 내 account 설정 누락\",\"점검명령어\":\"grep -v '^#' $PAM_ACCT_FILE | grep '$MODULE_NAME'\",\"전체내용\":\"$PAM_ACCT_FILE\"}")
                fi
            fi
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"계정 잠금 임계값\",\"상태\":\"취약\",\"세부내용\":\"취약: $PAM_FILE(및 include) 내 계정 잠금 모듈 설정이 발견되지 않았습니다.\",\"점검명령어\":\"grep -v '^#' $PAM_FILE | grep 'pam_faillock\\\\.so\\\\|pam_tally2\\\\.so\\\\|pam_tally\\\\.so'\",\"전체내용\":\"$PAM_FILE\"}")
        fi
    done

    # [3] 최종 결과 판단
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="계정 잠금 임계값 미설정 또는 기준 초과"
        DETAILS_ARRAY+=("{\"점검항목\":\"U-03 조치 안내\",\"상태\":\"수동조치\",\"세부내용\":\"이 항목은 PAM 직접 수정 시 로그인 불가 위험이 있어 통합조치 스크립트에서 자동 적용하지 않습니다. deny=10, unlock_time=120 설정은 수동으로 적용하세요.\"}")
    fi

    if [ $IS_VULN -eq 1 ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

   

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-04
# 설명: 쉐도우(Shadow) 패스워드 시스템 사용 여부 점검 (/etc/shadow 파일 존재 확인)
###############################################################################
function U-04() {

    local CHECK_ID="U-04"
    local CATEGORY="계정 관리"
    local DESCRIPTION="비밀번호 파일 보호"
    local EXPECTED_VALUE="/etc/shadow 파일을 사용하여 패스워드를 암호화하여 저장해야 함"

    local STATUS="SAFE"
    local CURRENT_VALUE="Shadow Password 사용 중"
    local DETAILS_ARRAY=()
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    # 1. /etc/shadow 파일 존재 여부 확인
    if [ ! -f "/etc/shadow" ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="/etc/shadow 미존재"
        DETAILS_ARRAY+=("{\"점검항목\":\"Shadow 패스워드 시스템\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/shadow 파일이 존재하지 않습니다. (쉐도우 패스워드 미사용)\",\"점검명령어\":\"ls -l /etc/shadow\",\"전체내용\":\"\"}")
    else
        # 2. /etc/passwd 파일 내 패스워드 필드('x') 확인
        if [ -f "/etc/passwd" ]; then
            # 두 번째 필드가 'x'가 아닌 계정이 있는지 확인
            local UNSHADOWED_ACCOUNTS
            UNSHADOWED_ACCOUNTS=$(awk -F: '$2 != "x" {print $1}' /etc/passwd)

            if [ -z "$UNSHADOWED_ACCOUNTS" ]; then
                STATUS="SAFE"
                CURRENT_VALUE="Shadow Password 사용 중"
                DETAILS_ARRAY+=("{\"점검항목\":\"Shadow 패스워드 시스템\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/shadow 파일이 존재하며, /etc/passwd의 모든 계정이 암호화(x) 처리되어 있습니다.\",\"점검명령어\":\"awk -F: '\$2 != \\\"x\\\" {print \$1}' /etc/passwd\",\"전체내용\":\"\"}")
            else
                STATUS="VULNERABLE"
                local FORMATTED_ACCOUNTS
                FORMATTED_ACCOUNTS=$(echo "$UNSHADOWED_ACCOUNTS" | tr '\n' ',' | sed 's/,$//')
                CURRENT_VALUE="일부 계정 Shadow 미적용"
                DETAILS_ARRAY+=("{\"점검항목\":\"Shadow 패스워드 시스템\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/shadow 파일은 존재하나, 다음 계정들이 Shadow 패스워드를 사용하지 않습니다: $FORMATTED_ACCOUNTS\",\"점검명령어\":\"awk -F: '\$2 != \\\"x\\\" {print \$1}' /etc/passwd\",\"전체내용\":\"$FORMATTED_ACCOUNTS\"}")
            fi
        else
            STATUS="VULNERABLE"
            CURRENT_VALUE="/etc/passwd 미존재"
            DETAILS_ARRAY+=("{\"점검항목\":\"Shadow 패스워드 시스템\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/passwd 파일을 찾을 수 없습니다.\",\"점검명령어\":\"ls -l /etc/passwd\",\"전체내용\":\"\"}")
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

###############################################################################
# U-05
# 설명: root 이외의 UID가 ‘0’ 금지
###############################################################################
function U-05() {

    local CHECK_ID="U-05"
    local CATEGORY="계정 관리"
    local DESCRIPTION="root 이외의 UID가 '0' 금지"
    local EXPECTED_VALUE="root 계정만 UID 0을 가져야 함"

    local STATUS=""
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    local UID_ZERO_ACCOUNTS
    UID_ZERO_ACCOUNTS=$(awk -F: '$3 == 0 {print $1}' /etc/passwd)

    if [ -z "$UID_ZERO_ACCOUNTS" ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="No UID 0 accounts found"
        DETAILS_ARRAY+=("{\"점검항목\":\"UID 0 계정 확인\",\"상태\":\"취약\",\"세부내용\":\"취약: UID 0인 계정을 찾을 수 없음\",\"점검명령어\":\"awk -F: '\$3 == 0 {print \$1}' /etc/passwd\",\"전체내용\":\"\"}")

    elif [ "$UID_ZERO_ACCOUNTS" = "root" ]; then
        STATUS="SAFE"
        CURRENT_VALUE="root"
        DETAILS_ARRAY+=("{\"점검항목\":\"UID 0 계정 확인\",\"상태\":\"양호\",\"세부내용\":\"양호: root 계정만 UID 0을 가지고 있음\",\"점검명령어\":\"awk -F: '\$3 == 0 {print \$1}' /etc/passwd\",\"전체내용\":\"$UID_ZERO_ACCOUNTS\"}")

    else
        STATUS="VULNERABLE"
        CURRENT_VALUE=$(echo "$UID_ZERO_ACCOUNTS" | tr '\n' ',' | sed 's/,$//')

        while IFS= read -r account; do
            if [ -n "$account" ] && [ "$account" != "root" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"UID 0 계정 확인\",\"상태\":\"취약\",\"세부내용\":\"취약: ${account} 계정이 UID 0을 사용 중\",\"점검명령어\":\"awk -F: '\$3 == 0 {print \$1}' /etc/passwd\",\"전체내용\":\"$UID_ZERO_ACCOUNTS\"}")
            fi
        done <<< "$UID_ZERO_ACCOUNTS"
    fi
    
    
    if [ "$STATUS" == "VULNERABLE" ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-06
# 설명: 사용자 계정 su 기능 제한
###############################################################################
function U-06() {

    local CHECK_ID="U-06"
    local CATEGORY="계정 관리"
    local DESCRIPTION="사용자 계정 su 기능 제한"
    local EXPECTED_VALUE="su 명령어를 특정 그룹만 사용하도록 설정"

    local STATUS="VULNERABLE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    local PAM_SU_FILE="/etc/pam.d/su"
    if [ ! -f "$PAM_SU_FILE" ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="PAM su 설정 파일 없음"
        DETAILS_ARRAY+=("{\"점검항목\":\"PAM su 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $PAM_SU_FILE 파일이 존재하지 않음\",\"점검명령어\":\"ls -l $PAM_SU_FILE\",\"전체내용\":\"\"}")

    else
        # 파일 전체 내용을 읽어서 점검 수행 (내부적으로 cat으로 전체 파일 확인)
        local PAM_SU_CONTENT=$(cat "$PAM_SU_FILE" 2>/dev/null)
        
        # 점검 항목만 추출: pam_wheel.so 관련 라인만
        local WHEEL_CONFIG=$(echo "$PAM_SU_CONTENT" | grep -E "^[[:space:]]*auth[[:space:]]+required[[:space:]]+pam_wheel\.so" 2>/dev/null)
        local COMMENTED_WHEEL=$(echo "$PAM_SU_CONTENT" | grep -E "^[[:space:]]*#.*auth.*required.*pam_wheel\.so" 2>/dev/null)
        
        local CHECK_SETTINGS=""
        if [ -n "$WHEEL_CONFIG" ]; then
            CHECK_SETTINGS=$(echo "$WHEEL_CONFIG" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
        elif [ -n "$COMMENTED_WHEEL" ]; then
            CHECK_SETTINGS=$(echo "$COMMENTED_WHEEL" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
        else
            CHECK_SETTINGS="pam_wheel.so 설정이 없습니다."
        fi

        if [ -n "$WHEEL_CONFIG" ]; then
            STATUS="SAFE"
            CURRENT_VALUE="pam_wheel.so 설정됨"

            DETAILS_ARRAY+=("{\"점검항목\":\"PAM su 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: su 명령어가 wheel 그룹으로 제한되어 있음\",\"점검명령어\":\"grep -E '^[[:space:]]*auth[[:space:]]+required[[:space:]]+pam_wheel\\\\.so' $PAM_SU_FILE\",\"전체내용\":\"$CHECK_SETTINGS\"}")
        else
            if [ -n "$COMMENTED_WHEEL" ]; then
                CURRENT_VALUE="pam_wheel.so 주석 처리됨"
                DETAILS_ARRAY+=("{\"점검항목\":\"PAM su 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: pam_wheel.so 설정이 주석 처리되어 있음\",\"점검명령어\":\"grep -E '^[[:space:]]*#.*auth.*required.*pam_wheel\\\\.so' $PAM_SU_FILE\",\"전체내용\":\"$CHECK_SETTINGS\"}")
            else
                CURRENT_VALUE="pam_wheel.so 미설정"
                DETAILS_ARRAY+=("{\"점검항목\":\"PAM su 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: pam_wheel.so 설정이 존재하지 않음\",\"점검명령어\":\"grep -E 'pam_wheel\\\\.so' $PAM_SU_FILE\",\"전체내용\":\"$CHECK_SETTINGS\"}")
            fi
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
     
    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}



###############################################################################
# U-07 (2026 가이드라인 기준)
# 설명: 불필요한 계정 제거
###############################################################################
function U-07() {
    local CHECK_ID="U-07"
    local CATEGORY="계정 관리"
    local DESCRIPTION="불필요한 계정 제거"
    local EXPECTED_VALUE="lp, uucp, nuucp 등 불필요한 계정이 삭제되어야 함"

    local STATUS="SAFE"
    local CURRENT_VALUE="불필요한 계정 없음"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    # 1. 제거 대상이 되는 표준 불필요 계정임
    local UNUSED_ACCOUNTS=("lp" "uucp" "nuucp" "games")

    for ACCOUNT in "${UNUSED_ACCOUNTS[@]}"; do
        # /etc/passwd 파일에서 해당 계정이 존재하는지 확인
        if grep -q "^${ACCOUNT}:" /etc/passwd; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"불필요한 계정\",\"상태\":\"취약\",\"세부내용\":\"취약: 불필요한 계정($ACCOUNT)이 존재함\",\"점검명령어\":\"grep '^${ACCOUNT}:' /etc/passwd\",\"전체내용\":\"$ACCOUNT\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"불필요한 계정\",\"상태\":\"양호\",\"세부내용\":\"양호: 불필요한 계정($ACCOUNT)이 없음\",\"점검명령어\":\"grep '^${ACCOUNT}:' /etc/passwd\",\"전체내용\":\"\"}")
        fi
    done

    # 2. 결과 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="불필요한 계정 발견"
    else
        STATUS="SAFE"
        CURRENT_VALUE="정상 (불필요 계정 없음)"
    fi
    
    if [ "$STATUS" == "VULNERABLE" ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi
    

    # JSON 결과 기록
    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-08 (가이드라인 반영)
# 설명: 관리자 그룹에 최소한의 계정 포함
###############################################################################
function U-08() {
    local CHECK_ID="U-08"
    local CATEGORY="계정 관리"
    local DESCRIPTION="관리자 그룹에 최소한의 계정 포함"
    local EXPECTED_VALUE="root 그룹에는 root 계정 외 불필요한 계정이 없어야 함"

    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    # 가이드 Step 1: /etc/group 파일에서 root 그룹
    # GID가 0인 root 그룹의 4번째 필드(멤버 리스트)를 추출
    local ROOT_GROUP_MEMBERS
    ROOT_GROUP_MEMBERS=$(grep "^root:x:0:" /etc/group | cut -d: -f4)

    if [ -z "$ROOT_GROUP_MEMBERS" ] || [ "$ROOT_GROUP_MEMBERS" == "root" ]; then
        # 멤버가 없거나(기본 상태) root만 있는 경우
        DETAILS_ARRAY+=("{\"점검항목\":\"root 그룹 멤버\",\"상태\":\"양호\",\"세부내용\":\"양호: root 그룹 내 관리자(root) 외 추가 계정이 발견되지 않았습니다.\",\"점검명령어\":\"grep '^root:x:0:' /etc/group\",\"전체내용\":\"$ROOT_GROUP_MEMBERS\"}")
        CURRENT_VALUE="정상 (추가 계정 없음)"
    else
        # root 외에 다른 계정이 발견된 경우
        IS_VULN=1
        STATUS="VULNERABLE"
        DETAILS_ARRAY+=("{\"점검항목\":\"root 그룹 멤버\",\"상태\":\"취약\",\"세부내용\":\"취약: root 그룹 내 불필요한 계정 존재: [$ROOT_GROUP_MEMBERS]\",\"점검명령어\":\"grep '^root:x:0:' /etc/group\",\"전체내용\":\"$ROOT_GROUP_MEMBERS\"}")
        CURRENT_VALUE="불필요 계정 발견: $ROOT_GROUP_MEMBERS"
    fi

    # 터미널 출력 및 결과 기록
    if [ "$STATUS" == "VULNERABLE" ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-09 (가이드라인 반영)
# 설명: 계정이 존재하지 않는 GID 금지
###############################################################################
function U-09() {
    local CHECK_ID="U-09"
    local CATEGORY="계정 관리"
    local DESCRIPTION="계정이 존재하지 않는 GID 금지"
    local EXPECTED_VALUE="사용자가 포함되지 않은 불필요한 그룹이 삭제되어야 함"

    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    # 가이드 Step 1: /etc/group 파일을 분석
    # 기본 시스템 그룹(GID 0~999)을 제외하고, 
    # 멤버 필드(4번째 필드)가 비어 있고, 해당 그룹을 기본 그룹으로 쓰는 사용자도 없는 경우를 체크
    
    local ALL_GROUPS=$(awk -F: '$3 >= 1000 {print $1}' /etc/group) # 일반 사용자 그룹 대상

    for GROUP in $ALL_GROUPS; do
        # 1. /etc/group의 4번째 필드(멤버)가 비어 있는지 확인
        local MEMBERS=$(grep "^${GROUP}:" /etc/group | cut -d: -f4)
        
        # 2. /etc/passwd의 4번째 필드(GID)에서 이 그룹을 기본 그룹으로 쓰는 유저가 있는지 확인
        local GID=$(grep "^${GROUP}:" /etc/group | cut -d: -f3)
        local PRIMARY_USER=$(awk -F: -v gid="$GID" '$4 == gid {print $1}' /etc/passwd)

        if [ -z "$MEMBERS" ] && [ -z "$PRIMARY_USER" ]; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"빈 그룹 확인\",\"상태\":\"취약\",\"세부내용\":\"취약: 멤버가 없는 불필요한 그룹 발견($GROUP)\",\"점검명령어\":\"grep '^${GROUP}:' /etc/group; awk -F: -v gid='$GID' '\$4 == gid {print \$1}' /etc/passwd\",\"전체내용\":\"GROUP=${GROUP}, MEMBERS=${MEMBERS}, PRIMARY_USER=${PRIMARY_USER}\"}")
        fi
    done

    # 결과 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="불필요한 그룹 존재"
    else
        STATUS="SAFE"
        CURRENT_VALUE="정상 (불필요 그룹 없음)"
        DETAILS_ARRAY+=("{\"점검항목\":\"빈 그룹 확인\",\"상태\":\"양호\",\"세부내용\":\"양호: 모든 그룹에 소속된 사용자가 존재하거나 필요한 그룹입니다.\",\"점검명령어\":\"awk -F: '\$3 >= 1000 {print \$1}' /etc/group\",\"전체내용\":\"\"}")
    fi

    # 터미널 출력
    if [ "$STATUS" == "VULNERABLE" ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동 점검] $CHECK_ID 사용지 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi
    
    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-10 (가이드라인 반영)
# 설명: 동일한 UID 금지
###############################################################################
function U-10() {
    local CHECK_ID="U-10"
    local CATEGORY="계정 관리"
    local DESCRIPTION="동일한 UID 금지"
    local EXPECTED_VALUE="모든 계정은 고유한 UID를 가져야 함"

    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    # 가이드 Step 1: /etc/passwd 파일에 동일한 UID
    # UID(3번째 필드)를 추출하여 중복된 값 리스트 생성
    local DUPLICATE_UIDS=$(awk -F: '{print $3}' /etc/passwd | sort | uniq -d)

    if [ -z "$DUPLICATE_UIDS" ]; then
        # 중복이 없는 경우
        STATUS="SAFE"
        CURRENT_VALUE="중복 UID 없음"
        DETAILS_ARRAY+=("{\"점검항목\":\"UID 중복\",\"상태\":\"양호\",\"세부내용\":\"양호: 동일한 UID로 설정된 사용자 계정이 존재하지 않습니다.\",\"점검명령어\":\"awk -F: '{print \$3}' /etc/passwd | sort | uniq -d\",\"전체내용\":\"\"}")
    else
        # 중복이 발견된 경우
        IS_VULN=1
        STATUS="VULNERABLE"
        CURRENT_VALUE="중복 UID 발견"
        
        # 어떤 UID가 어떤 계정들에서 중복되는지 상세 기록
        for uid in $DUPLICATE_UIDS; do
            local ACCOUNTS=$(awk -F: -v u="$uid" '$3 == u {print $1}' /etc/passwd | xargs | tr ' ' ',')
            DETAILS_ARRAY+=("{\"점검항목\":\"UID 중복\",\"상태\":\"취약\",\"세부내용\":\"취약: UID($uid) 중복 사용 계정 [$ACCOUNTS]\",\"점검명령어\":\"awk -F: '{print \$3}' /etc/passwd | sort | uniq -d; awk -F: -v u='$uid' '\$3 == u {print \$1}' /etc/passwd\",\"전체내용\":\"UID=$uid, ACCOUNTS=$ACCOUNTS\"}")
        done
    fi

    # 터미널 출력
    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # JSON 형식으로 결과 저장
    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-11
# 설명: 로그인이 불필요한 계정의 쉘 설정 점검
###############################################################################
function U-11() {
    local CHECK_ID="U-11"
    local CATEGORY="계정 관리"
    local DESCRIPTION="사용자 shell 점검"
    local EXPECTED_VALUE="로그인이 필요하지 않은 계정에 /bin/false 또는 /sbin/nologin 설정"

    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    local VULNERABLE_ACCOUNTS=()
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    # 점검 대상 시스템 계정 목록
    local SYSTEM_ACCOUNTS=("daemon" "bin" "sys" "adm" "listen" "nobody" "nobody4" "noaccess" "diag" "operator" "gopher" "games" "ftp" "lp" "sync" "shutdown" "halt" "mail" "news" "uucp")

    for account in "${SYSTEM_ACCOUNTS[@]}"; do
        if grep -q "^${account}:" /etc/passwd 2>/dev/null; then
            local ACCOUNT_SHELL=$(grep "^${account}:" /etc/passwd | cut -d: -f7)

            # 판정 로직: nologin, false, sync, shutdown, halt 중 하나라도 포함되어 있는지 확인
            # 가이드라인의 예외 항목(sync, shutdown 등)을 반영한 정규식입니다.
            if [[ ! "$ACCOUNT_SHELL" =~ (nologin|false|sync|shutdown|halt)$ ]]; then
                VULNERABLE_ACCOUNTS+=("${account}:${ACCOUNT_SHELL}")
                DETAILS_ARRAY+=("{\"점검항목\":\"시스템 계정 Shell\",\"상태\":\"취약\",\"세부내용\":\"취약: ${account} 계정의 쉘이 ${ACCOUNT_SHELL}로 설정되어 있음\",\"점검명령어\":\"grep '^${account}:' /etc/passwd\",\"전체내용\":\"${account}:${ACCOUNT_SHELL}\"}")
            fi
        fi
    done

    # 최종 상태 판정
    if [ ${#VULNERABLE_ACCOUNTS[@]} -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VALUE="모든 시스템 계정에 안전한 쉘 설정됨"
        DETAILS_ARRAY+=("{\"점검항목\":\"시스템 계정 Shell\",\"상태\":\"양호\",\"세부내용\":\"양호: 로그인이 필요하지 않은 계정에 안전한 쉘 설정됨\",\"점검명령어\":\"grep -E '^(daemon|bin|sys|adm|listen|nobody|nobody4|noaccess|diag|operator|gopher|games|ftp|lp|sync|shutdown|halt|mail|news|uucp):' /etc/passwd\",\"전체내용\":\"\"}")
    else
        STATUS="VULNERABLE"
        CURRENT_VALUE="${#VULNERABLE_ACCOUNTS[@]}개의 계정 취약"
    fi
    
    # 터미널 출력 (기존 오타 [ STATUS="VULNERABLE" ] 수정 완료)
    if [ "$STATUS" = "VULNERABLE" ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-12 (2026 가이드라인 반영)
# 설명: 세션 종료 시간 설정 점검
###############################################################################
function U-12() {
    local CHECK_ID="U-12"
    local CATEGORY="계정 관리"
    local DESCRIPTION="세션 종료 시간 설정"
    local EXPECTED_VALUE="TMOUT(또는 autologout) 600초 이하 설정"

    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    # 1. [sh, bash] 계열 점검 파일
    local BASH_FILES=("/etc/profile" "/etc/bashrc" "/root/.bashrc")
    local FOUND_TMOUT=false
    local MIN_TMOUT=999999
    local TMOUT_LINES_ALL=""

    for file in "${BASH_FILES[@]}"; do
        if [ -f "$file" ]; then
            # 파일 전체 내용을 읽어서 점검 수행 (내부적으로 cat으로 전체 파일 확인)
            local FILE_CONTENT=$(cat "$file")
            
            # 점검 항목만 추출: TMOUT= 관련 라인만 (주석 제외)
            local TMOUT_LINES=$(echo "$FILE_CONTENT" | grep -E '^[[:space:]]*TMOUT=' | grep -v '^#' | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
            
            if [ -n "$TMOUT_LINES" ]; then
                if [ -n "$TMOUT_LINES_ALL" ]; then
                    TMOUT_LINES_ALL="${TMOUT_LINES_ALL}\\n${file}: ${TMOUT_LINES}"
                else
                    TMOUT_LINES_ALL="${file}: ${TMOUT_LINES}"
                fi
            fi
            
            local TMOUT_VAL=$(echo "$FILE_CONTENT" | grep -E '^[[:space:]]*TMOUT=' | grep -v '^#' | sed 's/.*TMOUT=//' | sed 's/[^0-9]//g' | head -1)
            if [ -n "$TMOUT_VAL" ]; then
                FOUND_TMOUT=true
                [ "$TMOUT_VAL" -lt "$MIN_TMOUT" ] && MIN_TMOUT=$TMOUT_VAL
            fi
        fi
    done

    # 2. [csh] 계열 점검 (가이드 내용 반영)
    local CSH_FILES=("/etc/csh.cshrc" "/etc/csh.login")
    local AUTOLOGOUT_LINES_ALL=""
    
    for file in "${CSH_FILES[@]}"; do
        if [ -f "$file" ]; then
            # 파일 전체 내용을 읽어서 점검 수행 (내부적으로 cat으로 전체 파일 확인)
            local FILE_CONTENT=$(cat "$file")
            
            # 점검 항목만 추출: autologout= 관련 라인만 (주석 제외)
            local AUTOLOGOUT_LINES=$(echo "$FILE_CONTENT" | grep -E '^[[:space:]]*set[[:space:]]+autologout=' | grep -v '^#' | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
            
            if [ -n "$AUTOLOGOUT_LINES" ]; then
                if [ -n "$AUTOLOGOUT_LINES_ALL" ]; then
                    AUTOLOGOUT_LINES_ALL="${AUTOLOGOUT_LINES_ALL}\\n${file}: ${AUTOLOGOUT_LINES}"
                else
                    AUTOLOGOUT_LINES_ALL="${file}: ${AUTOLOGOUT_LINES}"
                fi
            fi
            
            local AUTO_VAL=$(echo "$FILE_CONTENT" | grep -E '^[[:space:]]*set[[:space:]]+autologout=' | grep -v '^#' | sed 's/.*autologout=//' | sed 's/[^0-9]//g' | head -1)
            if [ -n "$AUTO_VAL" ]; then
                # csh autologout은 '분' 단위이므로 10분(600초)으로 체크함
                if [ "$AUTO_VAL" -gt 10 ]; then
                    IS_VULN=1
                fi
            fi
        fi
    done

    # 3. 최종 판정 및 JSON 생성
    local CHECK_SETTINGS=""
    if [ -n "$TMOUT_LINES_ALL" ]; then
        CHECK_SETTINGS="$TMOUT_LINES_ALL"
    fi
    if [ -n "$AUTOLOGOUT_LINES_ALL" ]; then
        if [ -n "$CHECK_SETTINGS" ]; then
            CHECK_SETTINGS="${CHECK_SETTINGS}\\n${AUTOLOGOUT_LINES_ALL}"
        else
            CHECK_SETTINGS="$AUTOLOGOUT_LINES_ALL"
        fi
    fi
    if [ -z "$CHECK_SETTINGS" ]; then
        CHECK_SETTINGS="세션 타임아웃 설정이 발견되지 않음"
    fi
    
    if [ "$FOUND_TMOUT" = false ] && [ $IS_VULN -eq 0 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="설정 미비"
        DETAILS_ARRAY+=("{\"점검항목\":\"세션 타임아웃\",\"상태\":\"취약\",\"세부내용\":\"취약: Session Timeout 설정이 발견되지 않음\",\"점검명령어\":\"grep -E '^[[:space:]]*TMOUT=' /etc/profile /etc/bashrc /root/.bashrc 2>/dev/null; grep -E '^[[:space:]]*set[[:space:]]+autologout=' /etc/csh.cshrc /etc/csh.login 2>/dev/null\",\"전체내용\":\"$CHECK_SETTINGS\"}")
    elif [ "$FOUND_TMOUT" = true ] && [ "$MIN_TMOUT" -gt 600 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="TMOUT=${MIN_TMOUT}s"
        DETAILS_ARRAY+=("{\"점검항목\":\"세션 타임아웃\",\"상태\":\"취약\",\"세부내용\":\"취약: TMOUT이 600초(10분)를 초과함\",\"점검명령어\":\"grep -E '^[[:space:]]*TMOUT=' /etc/profile /etc/bashrc /root/.bashrc 2>/dev/null; grep -E '^[[:space:]]*set[[:space:]]+autologout=' /etc/csh.cshrc /etc/csh.login 2>/dev/null\",\"전체내용\":\"$CHECK_SETTINGS\"}")
    else
        STATUS="SAFE"
        CURRENT_VALUE="기준 준수"
        DETAILS_ARRAY+=("{\"점검항목\":\"세션 타임아웃\",\"상태\":\"양호\",\"세부내용\":\"양호: TMOUT이 600초 이내\",\"점검명령어\":\"grep -E '^[[:space:]]*TMOUT=' /etc/profile /etc/bashrc /root/.bashrc 2>/dev/null; grep -E '^[[:space:]]*set[[:space:]]+autologout=' /etc/csh.cshrc /etc/csh.login 2>/dev/null\",\"전체내용\":\"$CHECK_SETTINGS\"}")
    fi

    # [수정] 오타 수정: STATUS 앞에 $ 추가 및 비교 구문 교정
    if [ "$STATUS" = "VULNERABLE" ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-13 (2026 가이드라인 반영)
# 설명: 안전한 비밀번호 암호화 알고리즘 사용 점검
###############################################################################
function U-13() {
    local CHECK_ID="U-13"
    local CATEGORY="계정 관리"
    local DESCRIPTION="안전한 비밀번호 암호화 알고리즘 사용"
    local EXPECTED_VALUE="SHA-256(\$5), SHA-512(\$6) 또는 YESCRYPT(\$y) 사용"

    local STATUS="SAFE"
    local CURRENT_VALUE=""
    local DETAILS_ARRAY=()
    local WEAK_COUNT=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    if [ ! -r /etc/shadow ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="shadow 접근 불가"
        DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 암호화\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/shadow 파일을 읽을 수 없습니다.\",\"점검명령어\":\"ls -l /etc/shadow\",\"전체내용\":\"\"}")
    else
        # shadow 파일을 한 줄씩 읽어 알고리즘 식별자 확인
        while IFS=: read -r username password _; do
            # 1. 암호가 설정되지 않은 계정(!, *, !! 등)은 점검 제외
            if [[ "$password" =~ ^(!|\*|!!|)$ ]]; then
                continue
            fi

            # 2. 알고리즘 식별자 체크
            # $5$: SHA-256, $6$: SHA-512, $y$: YESCRYPT(최신 표준)
            if [[ "$password" =~ ^\$6\$ ]] || [[ "$password" =~ ^\$5\$ ]] || [[ "$password" =~ ^\$y\$ ]]; then
                continue
            else
                ((WEAK_COUNT++))
                DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 암호화\",\"상태\":\"취약\",\"세부내용\":\"취약: ${username} 계정이 안전하지 않은 알고리즘 사용 중\",\"점검명령어\":\"grep '^${username}:' /etc/shadow\",\"전체내용\":\"${username}\"}")
            fi
        done < /etc/shadow

        if [ $WEAK_COUNT -eq 0 ]; then
            STATUS="SAFE"
            CURRENT_VALUE="모든 계정 안전한 알고리즘 사용"
            DETAILS_ARRAY+=("{\"점검항목\":\"비밀번호 암호화\",\"상태\":\"양호\",\"세부내용\":\"양호: SHA-2 이상의 알고리즘이 적용되어 있습니다.\",\"점검명령어\":\"cat /etc/shadow\",\"전체내용\":\"\"}")
        else
            STATUS="VULNERABLE"
            CURRENT_VALUE="${WEAK_COUNT}개 계정 취약"
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

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-14
# 설명: root 홈, 패스 디렉터리 권한 및 패스 설정
###############################################################################
function U-14() {

    local CHECK_ID="U-14"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="root 홈, 패스 디렉터리 권한 및 패스 설정"
    local EXPECTED_VALUE="PATH 환경변수에 '.'이 맨 앞이나 중간에 포함되지 않음"

    local STATUS="SAFE"
    local CURRENT_VALUE="PATH 환경변수 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # DETAILS_ARRAY+=("\"점검대상: $PATH\"")
    
    # 1. 현재 PATH 값 수집
    local CURRENT_PATH=$PATH

    # 2. PATH 환경변수 보안 진단
    # - ^\.: 맨 앞이 . 인 경우
    # - ^:: 맨 앞이 비어있는 경우 (현재 디렉터리 의미)
    # - :: : 중간이 비어있는 경우
    # - :\.: 중간에 . 이 있는 경우
    if echo "$CURRENT_PATH" | grep -qE '^\.|^:|::|:\.:'; then
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"PATH 환경변수\",\"상태\":\"취약\",\"세부내용\":\"취약: PATH 환경변수의 맨 앞 또는 중간에 '.'(현재 디렉터리)이 포함되어 있습니다.\",\"점검명령어\":\"echo \\\"$PATH\\\"\",\"전체내용\":\"$CURRENT_PATH\"}")
    else
        # 맨 마지막에 . 이 있는 경우 (가이드상 양호)
        if echo "$CURRENT_PATH" | grep -qE ':\.$|:$'; then
            DETAILS_ARRAY+=("{\"점검항목\":\"PATH 환경변수\",\"상태\":\"양호\",\"세부내용\":\"양호: PATH 환경변수 맨 마지막에 '.'이 포함되어 있습니다. (가이드 기준 만족)\",\"점검명령어\":\"echo \\\"$PATH\\\"\",\"전체내용\":\"$CURRENT_PATH\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"PATH 환경변수\",\"상태\":\"양호\",\"세부내용\":\"양호: PATH 환경변수에 '.' 또는 비어있는 경로가 포함되어 있지 않습니다.\",\"점검명령어\":\"echo \\\"$PATH\\\"\",\"전체내용\":\"$CURRENT_PATH\"}")
        fi
    fi

    # 3. 최종 결과 판단
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="PATH 환경변수 내 취약한 경로(.) 설정 발견"
    fi
    
    
     if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # DETAILS_ARRAY를 JSON 배열 문자열로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출을 통한 결과 기록
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-15 (2026 가이드라인 반영)
# 설명: 소유자(UID) 또는 그룹(GID)이 존재하지 않는 파일이 없는지 점검
###############################################################################
function U-15() {
    local CHECK_ID="U-15"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="파일 및 디렉토리 소유자 설정"
    local EXPECTED_VALUE="소유자(UID) 또는 그룹(GID)이 존재하지 않는 파일이 없어야 함"

    local STATUS="SAFE"
    local CURRENT_VALUE="소유자 없는 파일 미발견"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    
    # 가이드 Step 1: 소유자/그룹이 없는 파일
    # 전체 시스템(/)을 뒤지되 네트워크 드라이브 등은 제외(-xdev)
    local NO_OWNER_FILES=$(find / \( -nouser -o -nogroup \) -xdev -ls 2>/dev/null)

    if [ -z "$NO_OWNER_FILES" ]; then
        STATUS="SAFE"
        CURRENT_VALUE="소유자 없는 파일 미발견"
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 없는 파일\",\"상태\":\"양호\",\"세부내용\":\"양호: 소유자(nouser) 또는 그룹(nogroup)이 없는 파일이 존재하지 않습니다.\",\"점검명령어\":\"find / \\\\( -nouser -o -nogroup \\\\) -xdev -ls 2>/dev/null\",\"전체내용\":\"\"}")
    else
        IS_VULN=1
        STATUS="VULNERABLE"
        local FILE_COUNT=$(echo "$NO_OWNER_FILES" | wc -l)
        CURRENT_VALUE="소유자/그룹 없는 파일 ${FILE_COUNT}개 발견"
        
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 없는 파일\",\"상태\":\"취약\",\"세부내용\":\"취약: 소유자 또는 그룹이 존재하지 않는 파일/디렉터리가 발견되었습니다.\",\"점검명령어\":\"find / \\\\( -nouser -o -nogroup \\\\) -xdev -ls 2>/dev/null\",\"전체내용\":\"COUNT=${FILE_COUNT}\"}")
        
        # 상세 리스트 추가 (최대 20개까지만 리스트업하여 JSON 비대화 방지)
        while IFS= read -r line; do
            [ -z "$line" ] && continue
            local ESCAPED_LINE=$(echo "$line" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
        done <<< "$(echo "$NO_OWNER_FILES" | head -n 20)"
    fi

    # [수정 완료] STATUS 변수 앞에 $ 기호를 붙여 실제 값 비교
    if [ "$STATUS" = "VULNERABLE" ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-16
# 설명: /etc/passwd 파일 소유자 및 권한 설정 점검
###############################################################################
function U-16() {

    local CHECK_ID="U-16"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="/etc/passwd 파일 소유자 및 권한 설정"
    local EXPECTED_VALUE="소유자 root, 권한 644 이하"

    local STATUS="SAFE"
    local CURRENT_VALUE="소유자 및 권한 설정 양호"
    local DETAILS_ARRAY=()
    local TARGET_FILE="/etc/passwd"
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. 파일 존재 여부 확인
    if [ ! -f "$TARGET_FILE" ]; then
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요"
        DETAILS_ARRAY+=("{\"점검항목\":\"$TARGET_FILE\",\"상태\":\"취약\",\"세부내용\":\"취약(수동점검): $TARGET_FILE 파일이 존재하지 않습니다.\",\"점검명령어\":\"ls -l $TARGET_FILE\",\"전체내용\":\"\"}")
        echo -e "${RED}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
        local DETAILS_JSON=$(Build_Details_JSON)
        Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
        "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
        return
    fi

    # stat 명령어로 소유자(%U)와 권한(%a) 추출
    local FILE_OWNER=$(stat -c "%U" "$TARGET_FILE")
    local FILE_PERM=$(stat -c "%a" "$TARGET_FILE")
    local LS_LINE="$(ls -ld "$TARGET_FILE" 2>/dev/null)"

    # 2. 소유자 확인 (root 여야 함)
    if [ "$FILE_OWNER" == "root" ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 소유자가 root 입니다.\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 소유자가 $FILE_OWNER 입니다. (root여야 함)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
    fi

    # 3. 권한 확인 (644 이하)
    if [ "$FILE_PERM" -le 644 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 권한이 $FILE_PERM 입니다. (644 이하)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 권한이 $FILE_PERM 입니다. (644 이하 설정 필요)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
    fi

    # 최종 상태 업데이트
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="소유자($FILE_OWNER) 또는 권한($FILE_PERM) 부적절"
    fi

    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # DETAILS_ARRAY를 JSON 배열 문자열로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출을 통한 결과 기록
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-17
# 설명: 시스템 시작 스크립트의 소유자가 root이고, Other에게 쓰기 권한이 없는지 점검
###############################################################################
function U-17() {

    local CHECK_ID="U-17"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="시스템 시작 스크립트 권한 설정"
    local EXPECTED_VALUE="시작 스크립트 소유자가 root이고, Other 쓰기 권한이 없음"

    local STATUS="SAFE"
    local CURRENT_VALUE="시작 스크립트 권한 및 소유자 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. 점검 대상 디렉터리 설정 및 유효성 확인
    local CHECK_DIRS="/etc/init.d /etc/rc.d/init.d /etc/systemd/system"
    local TARGET_DIRS=""

    for DIR in $CHECK_DIRS; do
        if [ -d "$DIR" ]; then
            TARGET_DIRS="$TARGET_DIRS $DIR"
        fi
    done

    # 2. 취약 파일 검색
    # -user root가 아니거나(!), -perm -002(Other Write) 권한이 있는 파일 검색
    local VULN_FILES=""
    if [ -z "$TARGET_DIRS" ]; then
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요"
        DETAILS_ARRAY+=("{\"점검항목\":\"시스템 시작 스크립트\",\"상태\":\"취약\",\"세부내용\":\"취약(수동점검): 점검 대상 디렉터리(/etc/init.d, /etc/rc.d/init.d, /etc/systemd/system)가 존재하지 않아 점검할 수 없습니다. (수동 점검 권장)\",\"점검명령어\":\"ls -ld /etc/init.d /etc/rc.d/init.d /etc/systemd/system 2>/dev/null\",\"전체내용\":\"\"}")
        echo -e "${RED}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
        local DETAILS_JSON=$(Build_Details_JSON)
        Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
        "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
        return
    fi

    VULN_FILES=$(find $TARGET_DIRS -type f \( ! -user root -o -perm -002 \) -exec ls -l {} \; 2>/dev/null)

    # 3. 결과 분석
    if [ -z "$VULN_FILES" ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 모든 시작 스크립트의 소유자가 root이고 Other 쓰기 권한이 없습니다.\",\"점검명령어\":\"find $TARGET_DIRS -type f \\\\( ! -user root -o -perm -002 \\\\) -exec ls -l {} \\\\; 2>/dev/null\",\"전체내용\":\"\"}")
    else
        IS_VULN=1
        local FILE_COUNT=$(echo "$VULN_FILES" | wc -l)
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 소유자가 root가 아니거나 o+w 권한이 있는 파일이 발견되었습니다.\",\"점검명령어\":\"find $TARGET_DIRS -type f \\\\( ! -user root -o -perm -002 \\\\) -exec ls -l {} \\\\; 2>/dev/null\",\"전체내용\":\"COUNT=${FILE_COUNT}\"}")
        
        # 발견된 파일 리스트는 필요시 점검명령어를 직접 실행해 확인

        STATUS="VULNERABLE"
        CURRENT_VALUE="취약한 시작 스크립트 ${FILE_COUNT}개 발견"
    fi

    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # DETAILS_ARRAY를 JSON 배열 문자열로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출을 통한 결과 기록
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}

###############################################################################
# U-18
# 설명: /etc/shadow 파일 소유자 및 권한 설정 점검
###############################################################################
function U-18() {

    local CHECK_ID="U-18"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="/etc/shadow 파일 소유자 및 권한 설정"
    local EXPECTED_VALUE="소유자 root, 권한 400 이하(또는 000)"

    local STATUS="SAFE"
    local CURRENT_VALUE="소유자 및 권한 설정 양호"
    local DETAILS_ARRAY=()
    local TARGET_FILE="/etc/shadow"
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. 파일 존재 여부 확인
    if [ ! -f "$TARGET_FILE" ]; then
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요"
        DETAILS_ARRAY+=("{\"점검항목\":\"$TARGET_FILE\",\"상태\":\"취약\",\"세부내용\":\"취약(수동점검): $TARGET_FILE 파일이 존재하지 않습니다.\",\"점검명령어\":\"ls -l $TARGET_FILE\",\"전체내용\":\"\"}")
        echo -e "${RED}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
        local DETAILS_JSON=$(Build_Details_JSON)
        Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
        "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
        return
    fi

    # stat 명령어로 소유자(%U)와 권한(%a) 추출
    local FILE_OWNER=$(stat -c "%U" "$TARGET_FILE")
    local FILE_PERM=$(stat -c "%a" "$TARGET_FILE")
    local LS_LINE="$(ls -ld "$TARGET_FILE" 2>/dev/null)"

    # 2. 소유자 확인 (root 여야 함)
    if [ "$FILE_OWNER" == "root" ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 소유자가 $FILE_OWNER 입니다.\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 소유자가 $FILE_OWNER 입니다. (기준 : root여야 함)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
    fi

    # 3. 권한 확인 (400 이하)
    # 400(r--------) 이하인 경우(000 포함) 양호로 판단
    if [ "$FILE_PERM" -le 400 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 권한이 $FILE_PERM 입니다. (기준: 400 이하)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 권한이 $FILE_PERM 입니다. (기준: 400 이하)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
    fi

    # 최종 상태 업데이트
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="소유자($FILE_OWNER) 또는 권한($FILE_PERM) 부적절"
    fi

    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # DETAILS_ARRAY를 JSON 배열 문자열로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출을 통한 결과 기록
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
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
        DETAILS_ARRAY+=("{\"점검항목\":\"$TARGET_FILE\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): $TARGET_FILE 파일이 존재하지 않습니다. 추후 필요에 따라 수동 점검이 필요할 수 있습니다.(시스템 점검 필요)\",\"점검명령어\":\"ls -l $TARGET_FILE\",\"전체내용\":\"\"}")
    else
        # stat 명령어로 소유자(%U)와 권한(%a) 추출
        local FILE_OWNER=$(stat -c "%U" "$TARGET_FILE")
        local FILE_PERM=$(stat -c "%a" "$TARGET_FILE")
        local LS_LINE="$(ls -ld "$TARGET_FILE" 2>/dev/null)"

        # 2. 소유자 확인 (root 여야 함)
        if [ "$FILE_OWNER" == "root" ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 소유자가 $FILE_OWNER 입니다.\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 소유자가 $FILE_OWNER 입니다. (root여야 함)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
        fi

        # 3. 권한 확인 (600 이하)
        # 600(rw-------) 이하인 경우(400, 000 등 포함) 양호로 판단
        if [ "$FILE_PERM" -le 600 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 권한이 $FILE_PERM 입니다. (기준: 600 이하)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 권한이 $FILE_PERM 입니다. (기준: 600 이하)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
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
                local ls_line="$(ls -ld "$file" 2>/dev/null)"
                
                # 판단 기준: 소유자 root AND 권한 600 이하
                # (perm -gt 600은 8진수 비교 시 주의가 필요하므로 600보다 큰 권한 패턴 체크)
                if [ "$owner" != "root" ] || [ "$perm" -gt 600 ]; then
                    STATUS="VULNERABLE"
                    ((VULN_COUNT++))
                    DETAILS_ARRAY+=("{\"점검항목\":\"$file\",\"상태\":\"취약\",\"세부내용\":\"취약: $file (소유자:$owner, 권한:$perm)\",\"점검명령어\":\"stat -c '%U %a' $file; ls -ld $file\",\"전체내용\":\"$ls_line\"}")
                fi
            done
        fi
    done

    # 결과 판정
    if [ "$VULN_COUNT" -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VALUE="모든 설정 파일 양호"
        DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 주요 서비스 설정 파일의 소유자 및 권한이 기준을 준수함\",\"점검명령어\":\"for f in /etc/inetd.conf /etc/xinetd.conf; do [ -f \\\"\$f\\\" ] && stat -c '%U %a' \$f && ls -ld \$f; done\",\"전체내용\":\"\"}")
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

            # 파일 전체 내용을 읽어서 점검 수행 (내부적으로 cat으로 전체 파일 확인)
            local FILE_CONTENT=$(cat "$conf_file" 2>/dev/null)
            
            # 소유자 및 권한 추출
            local FILE_OWNER=$(stat -c '%U' "$conf_file" 2>/dev/null)
            local FILE_PERM=$(stat -c '%a' "$conf_file" 2>/dev/null)
            local IS_VULN=0
            
            # 점검 항목만 추출: ls -ld 한 줄 형태로 저장
            # 예: "-rw-r----- 1 root root 1234 Jan  1 00:00 /etc/rsyslog.conf"
            local CHECK_SETTINGS="$(ls -ld "$conf_file" 2>/dev/null)"

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
                DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: ${conf_file}의 소유자가 '${FILE_OWNER}'임 (권장: root, bin, sys)\",\"점검명령어\":\"ls -ld ${conf_file}\",\"전체내용\":\"$CHECK_SETTINGS\"}")
            fi

            # 2. 권한 점검 (8진수 640을 10진수로 변환하면 416)
            # 계산법: (6*8^2) + (4*8^1) + (0*8^0) = 384 + 32 + 0 = 416
            if [ -n "$FILE_PERM" ]; then
                local PERM_DEC=$((8#$FILE_PERM))
                # 권한이 416보다 크다면 취약
                if [ $PERM_DEC -gt 416 ]; then
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: ${conf_file}의 권한이 '${FILE_PERM}'임 (권장: 640 이하)\",\"점검명령어\":\"ls -ld ${conf_file}\",\"전체내용\":\"$CHECK_SETTINGS\"}")
                fi
            fi

            # 파일별 최종 결과 취합
            if [ $IS_VULN -eq 1 ]; then
                STATUS="VULNERABLE"
                ((VULN_COUNT++))
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"${conf_file}\",\"상태\":\"양호\",\"세부내용\":\"양호: ${conf_file} (소유자: ${FILE_OWNER}, 권한: ${FILE_PERM})\",\"점검명령어\":\"ls -ld ${conf_file}\",\"전체내용\":\"$CHECK_SETTINGS\"}")
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

###############################################################################
# U-22
# 설명: /etc/services 파일 소유자 및 권한 설정
###############################################################################
function U-22() {

    local CHECK_ID="U-22"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="/etc/services 파일 소유자 및 권한 설정"
    local EXPECTED_VALUE="소유자 root, bin, 또는 sys / 권한 644 이하"

    local STATUS="SAFE"
    local CURRENT_VALUE="소유자 및 권한 설정 양호"
    local DETAILS_ARRAY=()
    local TARGET_FILE="/etc/services"
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. 파일 존재 여부 확인
    ## 조금 애매함 파일이 없다를 취약으로 준다면 이걸 조치에서 어떻게 조치를 하고 이걸 양호로 바꿔야 하는데 되려나? 일단 양호로 바꾸는게 좋을듯
    if [ ! -f "$TARGET_FILE" ]; then
        STATUS="SAFE"
        CURRENT_VALUE="파일 미존재(취약항목 없음)"
        DETAILS_ARRAY+=("{\"점검항목\":\"$TARGET_FILE\",\"상태\":\"양호\",\"세부내용\":\"양호: $TARGET_FILE 파일이 존재하지 않아 해당 취약점 없음. ()\",\"점검명령어\":\"ls -l $TARGET_FILE\",\"전체내용\":\"\"}")
    else
        # stat 명령어로 정보 수집 (소유자 %U, 권한 %a) - 실패 시 에러 숨기고 빈 값으로 처리
        local FILE_OWNER=$(stat -c "%U" "$TARGET_FILE" 2>/dev/null || echo "")
        local FILE_PERM=$(stat -c "%a" "$TARGET_FILE" 2>/dev/null || echo "")
        local LS_LINE="$(ls -ld "$TARGET_FILE" 2>/dev/null)"

        # 2. 소유자 확인 (root, bin, sys 허용)
        if [[ "$FILE_OWNER" == "root" || "$FILE_OWNER" == "bin" || "$FILE_OWNER" == "sys" ]]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 소유자가 $FILE_OWNER 입니다.\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 소유자가 $FILE_OWNER 입니다. (root, bin, sys 중 하나여야 함)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
        fi

        # 3. 권한 확인 (644 이하) - FILE_PERM이 숫자가 아닐 경우도 방어
        if [[ "$FILE_PERM" =~ ^[0-9]+$ ]]; then
            if [ "$FILE_PERM" -le 644 ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 권한이 $FILE_PERM 입니다. (기준: 644 이하)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 권한이 $FILE_PERM 입니다. (기준: 644 이하)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
            fi
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 권한 정보를 가져오지 못했습니다. (stat 실패 또는 비정상 권한 값)\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$LS_LINE\"}")
        fi
        
        # 최종 상태 업데이트
        if [ $IS_VULN -eq 1 ]; then
            STATUS="VULNERABLE"
            CURRENT_VALUE="소유자($FILE_OWNER) 또는 권한($FILE_PERM) 부적절"
        fi
    fi
    
    
     if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # DETAILS_ARRAY를 JSON 배열 문자열로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출을 통한 결과 기록
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
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
                        DETAILS_ARRAY+=("{\"점검항목\":\"SUID/SGID 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $file (현재 설정: $FILE_INFO)\",\"점검명령어\":\"ls -l $file\",\"전체내용\":\"$FILE_INFO\"}")
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
        DETAILS_ARRAY+=("{\"점검항목\":\"SUID/SGID 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 주요 보안 점검 대상 SUID 파일의 권한이 적절함\",\"점검명령어\":\"find /usr/bin /usr/sbin /bin /sbin -type f -perm -4000 2>/dev/null\",\"전체내용\":\"\"}")
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

############################################################
# 함수명: U-24
# 설명: 홈 디렉터리 환경변수 파일 소유자 및 권한 점검
#############################################################
function U-24() {
    local CHECK_ID="U-24"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="사용자, 시스템 환경변수 파일 소유자 및 권한 설정"
    local EXPECTED_VAL="환경변수 파일의 소유자가 root 또는 해당 계정이며, others 쓰기 권한이 없는 경우"
    
    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"
    
    # 환경변수 파일 목록
    local ENV_FILES=(".profile" ".kshrc" ".cshrc" ".bashrc" ".bash_profile" ".login" ".exrc" ".netrc")
    
    local TOTAL_CHECKED=0
    local VULNERABLE_COUNT=0
    local SAFE_COUNT=0
    
    # 사용자별 점검
    while IFS=: read -r username _ uid _ _ home_dir shell; do
        # root 또는 일반 사용자만 점검 (시스템 계정 제외)
        if { [ "$uid" -ge 1000 ] || [ "$username" = "root" ]; } && \
           [ "$shell" != "/sbin/nologin" ] && \
           [ "$shell" != "/bin/false" ] && \
           [ -d "$home_dir" ]; then
            
            for env_file in "${ENV_FILES[@]}"; do
                local file_path="$home_dir/$env_file"
                
                # 파일이 존재하지 않으면 건너뛰기
                if [ ! -f "$file_path" ]; then
                    continue
                fi
                
                ((TOTAL_CHECKED++))
                
                # 파일 소유자 확인
                local file_owner=$(stat -c '%U' "$file_path" 2>/dev/null)
                local file_perm=$(stat -c '%a' "$file_path" 2>/dev/null)
                local other_write=$(echo "$file_perm" | cut -c3)
                
                local is_file_vuln=0
                local vuln_reason=""
                
                # 소유자가 root 또는 해당 계정이 아닌 경우
                if [ "$file_owner" != "root" ] && [ "$file_owner" != "$username" ]; then
                    is_file_vuln=1
                    vuln_reason="부적절한 소유자: $file_owner (예상: root 또는 $username)"
                fi
                
                # others에게 쓰기 권한이 있는지 확인
                if [ "$other_write" -eq 2 ] || [ "$other_write" -eq 3 ] || \
                   [ "$other_write" -eq 6 ] || [ "$other_write" -eq 7 ]; then
                    is_file_vuln=1
                    if [ -n "$vuln_reason" ]; then
                        vuln_reason="$vuln_reason, others 쓰기 권한 존재"
                    else
                        vuln_reason="others 쓰기 권한 존재 (권한: $file_perm)"
                    fi
                fi
                
                # 결과 기록
                if [ $is_file_vuln -eq 1 ]; then
                    ((VULNERABLE_COUNT++))
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"$file_path\",\"상태\":\"취약\",\"세부내용\":\"취약: $file_path - $vuln_reason\",\"점검명령어\":\"stat -c '%U %a' $file_path; ls -ld $file_path\",\"전체내용\":\"소유자:$file_owner,권한:$file_perm\"}")
                else
                    ((SAFE_COUNT++))
                    DETAILS_ARRAY+=("{\"점검항목\":\"$file_path\",\"상태\":\"양호\",\"세부내용\":\"양호: $file_path (소유자: $file_owner, 권한: $file_perm)\",\"점검명령어\":\"stat -c '%U %a' $file_path; ls -ld $file_path\",\"전체내용\":\"소유자:$file_owner,권한:$file_perm\"}")
                fi
            done
        fi
    done < /etc/passwd
    
    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="점검 대상 환경변수 파일 없음"
        # DETAILS_ARRAY=("\"양호: 점검 대상 환경변수 파일이 존재하지 않습니다.\"")
    elif [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 파일 중 ${VULNERABLE_COUNT}개 취약, ${SAFE_COUNT}개 양호"
    else
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 파일 모두 양호"
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


###########################################################################
###########################################################################
# 함수명: U-25
# 설명: world writable 파일 점검
# ----------------------------------------------------------
function U-25() {
    local CHECK_ID="U-25"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="world writable 파일 점검"
    local EXPECTED_VAL="world writable 파일이 존재하지 않거나, 존재 시 설정 이유를 인지하고 있는 경우"
    
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
        # 타임아웃 발생 → 수동 점검 유도
        STATUS="MANUAL"
        CURRENT_VAL="검색 시간 초과 (5분). 수동 점검 권장."
        DETAILS_ARRAY+=("{\"점검항목\":\"U-25\",\"상태\":\"정보\",\"세부내용\":\"find 검색 시간이 초과되었습니다. 수동으로 'find / -type f -perm -2 -exec ls -l {} \\;' 실행 후 판단하세요.\"}")
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
        
        # 파일만 처리 (디렉터리 스킵) - find -type f이지만 방어 로직
        if [ ! -f "$filepath" ]; then
            continue
        fi
        
        # 제외 디렉터리 내 경로 스킵 (방어 로직: /dev, /proc, /sys, /run 등)
        local skip_excluded=0
        for exdir in "${EXCLUDE_DIRS[@]}"; do
            if [[ "$filepath" == "$exdir" ]] || [[ "$filepath" == "$exdir/"* ]]; then
                skip_excluded=1
                break
            fi
        done
        [ $skip_excluded -eq 1 ] && continue
        
        ((TOTAL_FOUND++))
        
        local file_perm=$(stat -c '%a' "$filepath" 2>/dev/null)
        local file_owner=$(stat -c '%U' "$filepath" 2>/dev/null)
        local file_group=$(stat -c '%G' "$filepath" 2>/dev/null)
        
        # 점검 항목만 추출: 권한, 소유자, 그룹 정보만
        local CHECK_SETTINGS="권한: ${file_perm}, 소유자: ${file_owner}, 그룹: ${file_group}"
        
        # 허용된 파일인지 확인
        if is_allowed_file "$filepath"; then
            ((ALLOWED_COUNT++))
            # 허용된 파일은 상세정보에 추가하지 않음 (너무 많아질 수 있음)
        else
            ((SUSPICIOUS_COUNT++))
            IS_VULN=1
            # 의심 파일만 상세정보에 추가 (최대 개수 제한)
            if [ ${#DETAILS_ARRAY[@]} -lt $MAX_DETAILS ]; then
                # JSON 안전 문자열로 변환 (경로, 상세내용, ls 출력)
                local safe_path=$(printf '%s' "$filepath" | sed 's/\\/\\\\/g; s/\"/\\\\\"/g')
                local detail_text=$(printf '취약: %s (권한: %s, 소유자: 파일소유자:%s, 그룹소유자:%s)' "$filepath" "$file_perm" "$file_owner" "$file_group" | sed 's/\\/\\\\/g; s/\"/\\\\\"/g')
                local ls_line=$(ls -ld "$filepath" 2>/dev/null | sed 's/\\/\\\\/g; s/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"$safe_path\",\"상태\":\"취약\",\"세부내용\":\"$detail_text\",\"점검명령어\":\"find / -type f -perm -2; ls -ld $filepath\",\"전체내용\":\"$ls_line\"}")
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
        CURRENT_VAL="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi
    
    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)
    
    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
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
        local ls_line="$(ls -ld "$filepath" 2>/dev/null)"

        DETAILS_ARRAY+=("{\"점검항목\":\"$filepath\",\"상태\":\"취약\",\"세부내용\":\"취약: $filepath (권한: $file_perm, 소유자: $file_owner, 크기: $file_size bytes, 수정일: $file_mtime)\",\"점검명령어\":\"ls -ld $filepath\",\"전체내용\":\"$ls_line\"}")

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
        local ls_line="$(ls -ld "$filepath" 2>/dev/null)"

        DETAILS_ARRAY+=("{\"점검항목\":\"숨김파일 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: (숨김파일: $filepath 권한: $file_perm, 소유자: $file_owner)\",\"점검명령어\":\"ls -ld $filepath\",\"전체내용\":\"$ls_line\"}")

    done < <(find /dev -name ".*" -type f 2>/dev/null)

    if [ $hidden_count -gt 0 ]; then
        ((SUSPICIOUS_FILES+=$hidden_count))
        ((TOTAL_FILES+=$hidden_count))
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_FILES -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="/dev 디렉터리 내 일반 파일 없음"
        DETAILS_ARRAY+=("{\"점검항목\":\"디렉터리 내 파일 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: /dev 디렉터리 내 일반 파일이 발견되지 않았습니다.\",\"점검명령어\":\"find /dev -type f 2>/dev/null\",\"전체내용\":\"\"}")

        ## DETAILS_ARRAY=("\"양호: /dev 디렉터리 내 일반 파일이 발견되지 않았습니다.\"")
    elif [ $SUSPICIOUS_FILES -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_FILES}개 파일 발견 (모두 정상 시스템 파일)"
        DETAILS_ARRAY+=("{\"점검항목\":\"디렉터리 내 파일 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 발견된 ${TOTAL_FILES}개 파일은 모두 시스템 정상 파일입니다.\",\"점검명령어\":\"find /dev -type f 2>/dev/null\",\"전체내용\":\"TOTAL=${TOTAL_FILES},SUSPICIOUS=0\"}")
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
        DETAILS_ARRAY+=("{\"점검항목\":\"r-command\",\"상태\":\"양호\",\"세부내용\":\"양호: r-command 서비스 미실행\",\"점검명령어\":\"systemctl list-units --all | grep 'rsh\\\\|rlogin\\\\|rexec'; ls /etc/xinetd.d 2>/dev/null\",\"전체내용\":\"service_running=0\"}")
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
            DETAILS_ARRAY+=("{\"점검항목\":\"$filepath\",\"상태\":\"취약\",\"세부내용\":\"취약: $filepath (소유자: $file_owner, 권한: $file_perm) - $vuln_reason\",\"점검명령어\":\"stat -c '%U %a' $filepath; grep -E '^\\\\+|^[[:space:]]+\\\\+' $filepath 2>/dev/null\",\"전체내용\":\"owner=$file_owner,perm=$file_perm\"}")
            return 1
        else
            ((SAFE_COUNT++))
            DETAILS_ARRAY+=("{\"점검항목\":\"$filepath\",\"상태\":\"양호\",\"세부내용\":\"양호: $filepath (소유자: $file_owner, 권한: $file_perm)\",\"점검명령어\":\"stat -c '%U %a' $filepath; grep -E '^\\\\+|^[[:space:]]+\\\\+' $filepath 2>/dev/null\",\"전체내용\":\"owner=$file_owner,perm=$file_perm\"}")
            return 0
        fi
    }

    # /etc/hosts.equiv 점검
    if [ ! -f /etc/hosts.equiv ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.equiv\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/hosts.equiv 파일 없음\",\"점검명령어\":\"ls -l /etc/hosts.equiv\",\"전체내용\":\"\"}")
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
        DETAILS_ARRAY+=("{\"점검항목\":\"사용자\",\"상태\":\"양호\",\"세부내용\":\"양호: 사용자 .rhosts 파일 없음\",\"점검명령어\":\"find /home -name '.rhosts' 2>/dev/null\",\"전체내용\":\"\"}")
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


######################################################################################################################
# 함수명: U-28
# 설명: 접속 IP 주소 및 포트 제한
# ----------------------------------------------------------
function U-28() {
    local CHECK_ID="U-28"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="접속 IP 및 포트 제한"
    local EXPECTED_VAL="TCP Wrapper, 방화벽 등 접근 제어 설정이 적용된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local CHECK_COUNT=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # OS 종류 감지
    local os_type=""
    if [ -f /etc/redhat-release ]; then
        os_type="rocky"
    elif [ -f /etc/lsb-release ] || [ -f /etc/debian_version ]; then
        os_type="ubuntu"
    else
        os_type="unknown"
    fi

    # [점검 1] TCP Wrapper 설정 확인

    local wrapper_found=0

    # /etc/hosts.allow 확인
    if [ -f /etc/hosts.allow ]; then
        if grep -v '^#' /etc/hosts.allow | grep -v '^$' > /dev/null 2>&1; then
            local allow_rules=$(grep -v '^#' /etc/hosts.allow | grep -v '^$' | wc -l)
            DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.allow\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/hosts.allow - ${allow_rules}개 규칙 설정됨\",\"점검명령어\":\"grep -v '^#' /etc/hosts.allow | grep -v '^$'\",\"전체내용\":\"rules=${allow_rules}\"}")
            wrapper_found=1
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.allow\",\"상태\":\"취약\",\"세부내용\":\"취약 /etc/hosts.allow 파일은 존재하나 설정된 접근 제어 규칙이 없음\",\"점검명령어\":\"grep -v '^#' /etc/hosts.allow | grep -v '^$'\",\"전체내용\":\"rules=0\"}")
            
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.allow\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/hosts.allow 파일이 존재하지 않음 (접근 제어 미설정)\",\"점검명령어\":\"ls -l /etc/hosts.allow\",\"전체내용\":\"\"}")
    fi

    # /etc/hosts.deny 확인
    if [ -f /etc/hosts.deny ]; then
        if grep -v '^#' /etc/hosts.deny | grep -v '^$' > /dev/null 2>&1; then
            local deny_rules=$(grep -v '^#' /etc/hosts.deny | grep -v '^$' | wc -l)
            DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.deny\",\"상태\":\"양호\",\"세부내용\":\"양호 : /etc/hosts.deny - ${deny_rules}개 규칙 설정됨\",\"점검명령어\":\"grep -v '^#' /etc/hosts.deny | grep -v '^$'\",\"전체내용\":\"rules=${deny_rules}\"}")
            wrapper_found=1
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.deny\",\"상태\":\"취약\",\"세부내용\":\"취약 : /etc/hosts.deny 파일 존재하나 규칙 없음\",\"점검명령어\":\"grep -v '^#' /etc/hosts.deny | grep -v '^$'\",\"전체내용\":\"rules=0\"}")
            
           ## DETAILS_ARRAY+=("\"양호(주의): /etc/hosts.deny 파일 존재하나 규칙 없음\"")
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.deny\",\"상태\":\"취약\",\"세부내용\":\"취약 : /etc/hosts.deny 파일 없음\",\"점검명령어\":\"ls -l /etc/hosts.deny\",\"전체내용\":\"\"}")
    fi

    [ $wrapper_found -eq 1 ] && ((CHECK_COUNT++))

    # [점검 2] firewalld 설정 확인 (Rocky Linux)
    if [ "$os_type" = "rocky" ]; then
        if command -v firewall-cmd > /dev/null 2>&1; then
            if systemctl is-active firewalld > /dev/null 2>&1; then
                local zones=$(firewall-cmd --get-active-zones 2>/dev/null | grep -v '^\s' | head -5 | tr '\n' ' ')
                DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: firewalld 활성화 (Zone: $zones)\",\"점검명령어\":\"firewall-cmd --get-active-zones\",\"전체내용\":\"$zones\"}")

                local rich_rules=$(firewall-cmd --list-rich-rules 2>/dev/null | wc -l)
                if [ $rich_rules -gt 0 ]; then
                    DETAILS_ARRAY+=("{\"점검항목\":\"Rich 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Rich Rules ${rich_rules}개 설정됨\",\"점검명령어\":\"firewall-cmd --list-rich-rules\",\"전체내용\":\"count=${rich_rules}\"}")
                fi

                ((CHECK_COUNT++))
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: firewalld 비활성화\",\"점검명령어\":\"systemctl is-active firewalld\",\"전체내용\":\"inactive\"}")
                #DETAILS_ARRAY+=("\"양호(주의): firewalld 비활성화\"")
            fi
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: firewalld 미설치\",\"점검명령어\":\"command -v firewall-cmd\",\"전체내용\":\"not installed\"}")
        fi
    fi

    # [점검 3] ufw 설정 확인 (Ubuntu)
    if [ "$os_type" = "ubuntu" ]; then
        if command -v ufw > /dev/null 2>&1; then
            local ufw_status=$(ufw status 2>/dev/null | head -1)

            if echo "$ufw_status" | grep -q "Status: active"; then
                local rule_count=$(ufw status numbered 2>/dev/null | grep '^\[' | wc -l)
                DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: ufw 활성화 (규칙: ${rule_count}개)\",\"점검명령어\":\"ufw status; ufw status numbered\",\"전체내용\":\"rules=${rule_count}\"}")
                ((CHECK_COUNT++))
            else
                #DETAILS_ARRAY+=("\"양호(주의): ufw 비활성화\"")
                DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: ufw 비활성화\",\"점검명령어\":\"ufw status\",\"전체내용\":\"$ufw_status\"}")
            fi
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약 : ufw 미설치\",\"점검명령어\":\"command -v ufw\",\"전체내용\":\"not installed\"}")
        fi
    fi

    # [점검 4] iptables 규칙 확인
    if command -v iptables > /dev/null 2>&1; then
        local input_rules=$(iptables -L INPUT -n 2>/dev/null | grep -v '^Chain' | grep -v '^target' | grep -v '^$' | wc -l)
        local forward_rules=$(iptables -L FORWARD -n 2>/dev/null | grep -v '^Chain' | grep -v '^target' | grep -v '^$' | wc -l)
        local output_rules=$(iptables -L OUTPUT -n 2>/dev/null | grep -v '^Chain' | grep -v '^target' | grep -v '^$' | wc -l)

        local total_rules=$((input_rules + forward_rules + output_rules))

        if [ $total_rules -gt 0 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"양호\",\"세부내용\":\"양호 : iptables 규칙 설정됨 (INPUT: ${input_rules}, FORWARD: ${forward_rules}, OUTPUT: ${output_rules})\",\"점검명령어\":\"iptables -L INPUT -n; iptables -L FORWARD -n; iptables -L OUTPUT -n\",\"전체내용\":\"total=${total_rules}\"}")
            ((CHECK_COUNT++))
        else
            
            DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약 : iptables 규칙 없음\",\"점검명령어\":\"iptables -L INPUT -n; iptables -L FORWARD -n; iptables -L OUTPUT -n\",\"전체내용\":\"total=0\"}")
            ##DETAILS_ARRAY+=("\"양호(주의): iptables 규칙 없음\"")
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약 : iptables 미설치\",\"점검명령어\":\"command -v iptables\",\"전체내용\":\"not installed\"}")
    fi

    # [점검 5] nftables 규칙 확인
    if command -v nft > /dev/null 2>&1; then
        local nft_rules=$(nft list ruleset 2>/dev/null | grep -v '^#' | grep -v '^$' | wc -l)

        if [ $nft_rules -gt 5 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: nftables 규칙 설정됨 (${nft_rules}줄)\",\"점검명령어\":\"nft list ruleset\",\"전체내용\":\"lines=${nft_rules}\"}")
            ((CHECK_COUNT++))
        else
            
            DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약 : nftables 규칙 없음\",\"점검명령어\":\"nft list ruleset\",\"전체내용\":\"lines=${nft_rules}\"}")
            ##DETAILS_ARRAY+=("\"양호(주의): nftables 규칙 없음\"")
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"방화벽 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: nftables 미설치\",\"점검명령어\":\"command -v nft\",\"전체내용\":\"not installed\"}")
    fi

    # 최종 상태 및 현재 값 설정
    if [ $CHECK_COUNT -ge 1 ]; then
        STATUS="SAFE"
        CURRENT_VAL="접근 제어 설정 확인됨 (${CHECK_COUNT}개 항목)"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="IP주소 및 포트 제한 설정 없음"
        IS_VULN=1
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


#########################여기까지 수정했음#############################################


# ----------------------------------------------------------
# 함수명: U-29
# 설명: /etc/hosts.lpd 파일 제거 및 권한 설정
# ----------------------------------------------------------
function U-29() {
    local CHECK_ID="U-29"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="hosts.lpd 파일 소유자 및 권한 설정"
    local EXPECTED_VAL="/etc/hosts.lpd 파일이 존재하지 않거나, 존재 시 소유자 root이고 권한 600 이하인 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    local TARGET_FILE="/etc/hosts.lpd"

    # [점검 1] 파일 존재 여부 확인
    if [ ! -f "$TARGET_FILE" ]; then
        STATUS="SAFE"
        CURRENT_VAL="/etc/hosts.lpd 파일 존재하지 않음"
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.lpd\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/hosts.lpd 파일이 존재하지 않습니다.\",\"점검명령어\":\"ls -l $TARGET_FILE\",\"전체내용\":\"\"}")

        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"

        # 배열을 JSON 형식으로 변환
        local DETAILS_JSON=$(Build_Details_JSON)

        # 공통 함수 호출
        Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
        return
    fi

    local owner_ok=0
    local perm_ok=0

    # [점검 2] 파일 소유자 확인
    local owner=$(stat -c '%U' "$TARGET_FILE" 2>/dev/null)
    local group=$(stat -c '%G' "$TARGET_FILE" 2>/dev/null)

    if [ "$owner" = "root" ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 소유자 root (${owner}:${group})\",\"점검명령어\":\"stat -c '%U %G %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"owner=${owner},group=${group}\"}")
        owner_ok=1
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 소유자가 root가 아님 (${owner}:${group})\",\"점검명령어\":\"stat -c '%U %G %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"owner=${owner},group=${group}\"}")
        IS_VULN=1
    fi

    # [점검 3] 파일 권한 확인 (600 이하)
    local perm=$(stat -c '%a' "$TARGET_FILE" 2>/dev/null)
    local symbolic=$(stat -c '%A' "$TARGET_FILE" 2>/dev/null)

    local owner_perm=${perm:0:1}
    local group_perm=${perm:1:1}
    local other_perm=${perm:2:1}

    # Owner는 6(rw-) 이하, Group과 Other는 0이어야 함
    if [ $owner_perm -le 6 ] && [ $group_perm -eq 0 ] && [ $other_perm -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 권한 ${perm} (${symbolic}) - 600 이하\",\"점검명령어\":\"stat -c '%U %G %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"perm=${perm},symbolic=${symbolic}\"}")
        perm_ok=1
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 권한 ${perm} (${symbolic}) - 600 초과\",\"점검명령어\":\"stat -c '%U %G %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"perm=${perm},symbolic=${symbolic}\"}")
        IS_VULN=1
    fi

    # [점검 4] 파일 내용 확인
    if [ -r "$TARGET_FILE" ]; then
        local line_count=$(wc -l < "$TARGET_FILE" 2>/dev/null)
        local content_lines=$(grep -v '^#' "$TARGET_FILE" | grep -v '^$' | wc -l)
        if [ $content_lines -gt 0 ]; then
            # 최대 5개 호스트만 표시
            local host_list=$(grep -v '^#' "$TARGET_FILE" | grep -v '^$' | head -5 | tr '\n' ', ' | sed 's/,$//')
        fi
    else
        :
        #DETAILS_ARRAY+=("\"양호(주의): 파일 읽기 권한 없음\"")
    fi

    # 최종 상태 및 현재 값 설정
    if [ $owner_ok -eq 1 ] && [ $perm_ok -eq 1 ]; then
        STATUS="SAFE"
        CURRENT_VAL="파일 존재, 소유자 root, 권한 ${perm}"
    else
        STATUS="VULNERABLE"
        if [ $owner_ok -eq 0 ] && [ $perm_ok -eq 0 ]; then
            CURRENT_VAL="파일 존재, 소유자: ${owner}, 권한: ${perm} (둘 다 부적합)"
        elif [ $owner_ok -eq 0 ]; then
            CURRENT_VAL="파일 존재, 소유자: ${owner} (부적합), 권한: ${perm} (적합)"
        else
            CURRENT_VAL="파일 존재, 소유자: root (적합), 권한: ${perm} (부적합)"
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


###################################################################################################
# 함수명: U-30
# 설명: UMASK 설정 적절성 점검
# ----------------------------------------------------------
function U-30() {
    local CHECK_ID="U-30"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="UMASK 설정 관리"
    local EXPECTED_VAL="UMASK 값이 022 이상으로 설정된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local WEAK_UMASK_COUNT=0
    local GOOD_UMASK_COUNT=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 점검 대상 파일 목록
    local GLOBAL_FILES=(
        "/etc/profile"
        "/etc/bashrc"
        "/etc/bash.bashrc"
        "/etc/csh.cshrc"
        "/etc/csh.login"
        "/etc/environment"
        "/etc/login.defs"
    )

    local USER_FILES=(
        ".profile"
        ".bashrc"
        ".bash_profile"
        ".cshrc"
        ".kshrc"
        ".login"
    )

    # UMASK 값 검증 (022 이상인지 확인)
    validate_umask() {
        local umask_value=$1
        local umask_dec=$((8#$umask_value))
        local standard_dec=$((8#022))

        if [ $umask_dec -ge $standard_dec ]; then
            return 0  # 양호
        else
            return 1  # 취약
        fi
    }

    # 파일에서 UMASK 설정 추출 및 검증 (전역 설정 파일용)
    check_file_umask() {
        local filepath=$1

        if [ ! -f "$filepath" ]; then
            return
        fi

        ((TOTAL_CHECKED++))

        local umask_lines
        umask_lines=$(grep -n '^[^#]*umask' "$filepath" 2>/dev/null)

        if [ -z "$umask_lines" ]; then
            return
        fi

        while IFS= read -r line; do
            local line_num
            local line_content
            local umask_value

            line_num=$(echo "$line" | cut -d':' -f1)
            line_content=$(echo "$line" | cut -d':' -f2-)
            umask_value=$(echo "$line_content" | grep -oP 'umask\s+\K[0-9]+' | head -1)

            if [ -n "$umask_value" ]; then
                if validate_umask "$umask_value"; then
                    ((GOOD_UMASK_COUNT++))
                    DETAILS_ARRAY+=("{\"점검항목\":\"UMASK 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $filepath (라인 ${line_num}) - umask ${umask_value} (022 이상)\",\"점검명령어\":\"grep -n '^[^#]*umask' $filepath\",\"전체내용\":\"${filepath}:${line_num}:umask ${umask_value}\"}")
                else
                    ((WEAK_UMASK_COUNT++))
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"UMASK 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $filepath (라인 ${line_num}) - umask ${umask_value} (022 미만)\",\"점검명령어\":\"grep -n '^[^#]*umask' $filepath\",\"전체내용\":\"${filepath}:${line_num}:umask ${umask_value}\"}")
                fi
            fi
        done <<< "$umask_lines"
    }

    # [점검 1] 현재 시스템 UMASK 값 확인
    local current_umask=$(umask)

    if validate_umask "$current_umask"; then
        DETAILS_ARRAY+=("{\"점검항목\":\"UMASK 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 현재 UMASK ${current_umask} (022 이상)\",\"점검명령어\":\"umask\",\"전체내용\":\"${current_umask}\"}")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"UMASK 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 현재 UMASK ${current_umask} (022 미만)\",\"점검명령어\":\"umask\",\"전체내용\":\"${current_umask}\"}")
        IS_VULN=1
    fi

    # [점검 2] 전역 설정 파일 점검
    for file in "${GLOBAL_FILES[@]}"; do
        check_file_umask "$file"
    done

    # [점검 3] 사용자별 설정 파일 점검
    local home_dirs
    home_dirs=$(find /home -maxdepth 1 -type d 2>/dev/null | grep -v '^/home$')

    if [ -z "$home_dirs" ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"검사할\",\"상태\":\"양호\",\"세부내용\":\"양호: 검사할 사용자 홈 디렉터리 없음\",\"점검명령어\":\"find /home -maxdepth 1 -type d 2>/dev/null\",\"전체내용\":\"\"}")
    else
        while IFS= read -r home_dir; do
            local username
            username=$(basename "$home_dir")

            for userfile in "${USER_FILES[@]}"; do
                local filepath="${home_dir}/${userfile}"

                if [ -f "$filepath" ]; then
                    local umask_lines
                    umask_lines=$(grep -n '^[^#]*umask' "$filepath" 2>/dev/null)

                    if [ -n "$umask_lines" ]; then
                        while IFS= read -r line; do
                            local line_num
                            local line_content
                            local umask_value

                            line_num=$(echo "$line" | cut -d':' -f1)
                            line_content=$(echo "$line" | cut -d':' -f2-)
                            umask_value=$(echo "$line_content" | grep -oP 'umask\s+\K[0-9]+' | head -1)

                            if [ -n "$umask_value" ]; then
                                if validate_umask "$umask_value"; then
                                    ((GOOD_UMASK_COUNT++))
                                    DETAILS_ARRAY+=("{\"점검항목\":\"UMASK 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: ${username}/${userfile} - umask ${umask_value} (022 이상)\",\"점검명령어\":\"grep -n '^[^#]*umask' ${home_dir}/${userfile}\",\"전체내용\":\"${username}/${userfile}:${line_num}:umask ${umask_value}\"}")
                                else
                                    ((WEAK_UMASK_COUNT++))
                                    IS_VULN=1
                                    DETAILS_ARRAY+=("{\"점검항목\":\"UMASK 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: ${username}/${userfile} - umask ${umask_value} (022 미만)\",\"점검명령어\":\"grep -n '^[^#]*umask' ${home_dir}/${userfile}\",\"전체내용\":\"${username}/${userfile}:${line_num}:umask ${umask_value}\"}")
                                fi
                            fi
                        done <<< "$umask_lines"
                    fi
                fi
            done
        done <<< "$home_dirs"
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="시스템 UMASK ${current_umask}, 설정 파일 없음"
        if ! validate_umask "$current_umask"; then
            STATUS="VULNERABLE"
            IS_VULN=1
        fi
    else
        if [ $IS_VULN -eq 1 ]; then
            STATUS="VULNERABLE"
            CURRENT_VAL="총 ${TOTAL_CHECKED}개 파일 점검 (취약: ${WEAK_UMASK_COUNT}개, 양호: ${GOOD_UMASK_COUNT}개)"
        else
            STATUS="SAFE"
            CURRENT_VAL="총 ${TOTAL_CHECKED}개 파일 모두 양호 (UMASK 022 이상)"
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


#####################################################################################################################
# 함수명: U-31
# 설명: 홈 디렉토리 소유자 및 권한 설정
# ----------------------------------------------------------
function U-31() {
    local CHECK_ID="U-31"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="홈 디렉토리 소유자 및 권한 설정"
    local EXPECTED_VAL="홈 디렉토리 소유자가 해당 계정과 일치하고, 타 사용자 쓰기 권한이 없는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_USERS=0
    local OWNER_MISMATCH=0
    local WRITABLE_BY_OTHERS=0
    local GOOD_CONFIG=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 점검 제외 계정 (시스템 계정)
    local EXCLUDE_USERS=(
        "root" "bin" "daemon" "adm" "lp" "sync" "shutdown" "halt" "mail"
        "operator" "games" "ftp" "nobody" "systemd-network" "dbus" "polkitd"
        "colord" "rpc" "saslauth" "libstoragemgmt" "setroubleshoot"
        "cockpit-ws" "cockpit-wsinstance" "sssd" "sshd" "chrony" "tcpdump" "tss"
    )

    # 제외 대상 사용자인지 확인
    is_excluded_user() {
        local username=$1
        for excluded in "${EXCLUDE_USERS[@]}"; do
            [ "$username" = "$excluded" ] && return 0
        done
        return 1
    }

    # 타 사용자 쓰기 권한 확인
    check_other_write() {
        local perm=$1
        local other_perm=${perm:2:1}

        if [ $((other_perm & 2)) -ne 0 ]; then
            return 1  # 쓰기 권한 있음 (취약)
        else
            return 0  # 쓰기 권한 없음 (양호)
        fi
    }

    # [점검 1] /etc/passwd 기반 홈 디렉토리 점검
    while IFS=: read -r username _ uid gid _ homedir shell; do
        # UID 1000 미만 및 제외 계정 스킵
        [ $uid -lt 1000 ] && continue
        is_excluded_user "$username" && continue

        # nologin, false 쉘 계정 스킵
        [[ "$shell" =~ (nologin|false) ]] && continue

        # 홈 디렉토리가 존재하지 않으면 스킵
        [ ! -d "$homedir" ] && continue

        ((TOTAL_USERS++))

        local owner=$(stat -c '%U' "$homedir" 2>/dev/null)
        local group=$(stat -c '%G' "$homedir" 2>/dev/null)
        local perm=$(stat -c '%a' "$homedir" 2>/dev/null)

        local issues=()
        local is_vulnerable=0

        # 소유자 확인
        if [ "$owner" != "$username" ]; then
            issues+=("소유자 불일치 (${owner} ≠ ${username})")
            ((OWNER_MISMATCH++))
            is_vulnerable=1
        fi

        # 타 사용자 쓰기 권한 확인
        if ! check_other_write "$perm"; then
            issues+=("타 사용자 쓰기 권한 있음")
            ((WRITABLE_BY_OTHERS++))
            is_vulnerable=1
        fi

        # 결과 기록
        if [ $is_vulnerable -eq 1 ]; then
            IS_VULN=1
            local issue_str=$(IFS=", "; echo "${issues[*]}")
            DETAILS_ARRAY+=("{\"점검항목\":\"$username\",\"상태\":\"취약\",\"세부내용\":\"취약: $username ($homedir) - 권한: $perm - ${issue_str}\",\"점검명령어\":\"stat -c '%U %a' $homedir; ls -ld $homedir\",\"전체내용\":\"$homedir:owner=$owner,perm=$perm\"}")
        else
            ((GOOD_CONFIG++))
            DETAILS_ARRAY+=("{\"점검항목\":\"$username\",\"상태\":\"양호\",\"세부내용\":\"양호: $username ($homedir) - 소유자: $owner, 권한: $perm\",\"점검명령어\":\"stat -c '%U %a' $homedir; ls -ld $homedir\",\"전체내용\":\"$homedir:owner=$owner,perm=$perm\"}")
        fi

    done < /etc/passwd

    # [점검 2] /home 내 추가 디렉토리 점검
    local home_dirs=$(find /home -maxdepth 1 -mindepth 1 -type d 2>/dev/null)
    local additional_found=0

    while IFS= read -r homedir; do
        [ -z "$homedir" ] && continue

        # /etc/passwd에 등록된 디렉토리는 스킵
        if grep -q ":${homedir}:" /etc/passwd 2>/dev/null; then
            continue
        fi

        additional_found=1

        local owner=$(stat -c '%U' "$homedir" 2>/dev/null)
        local perm=$(stat -c '%a' "$homedir" 2>/dev/null)

        # 타 사용자 쓰기 권한 확인
        if ! check_other_write "$perm"; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"$homedir\",\"상태\":\"취약\",\"세부내용\":\"취약: $homedir (소유자: $owner, 권한: $perm) - 타 사용자 쓰기 권한 있음\",\"점검명령어\":\"stat -c '%U %a' $homedir; ls -ld $homedir\",\"전체내용\":\"$homedir:owner=$owner,perm=$perm\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"$homedir\",\"상태\":\"양호\",\"세부내용\":\"양호: $homedir (소유자: $owner, 권한: $perm) - 추가 디렉토리\",\"점검명령어\":\"stat -c '%U %a' $homedir; ls -ld $homedir\",\"전체내용\":\"$homedir:owner=$owner,perm=$perm\"}")
        fi

    done <<< "$home_dirs"

    # 최종 상태 및 현재 값 설정
    local total_issues=$((OWNER_MISMATCH + WRITABLE_BY_OTHERS))

    if [ $TOTAL_USERS -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="점검 대상 사용자 없음"
        DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 점검 대상 사용자가 없습니다.\",\"점검명령어\":\"cat /etc/passwd\",\"전체내용\":\"TOTAL_USERS=0\"}")
    elif [ $total_issues -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_USERS}명 모두 양호"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_USERS}명 중 문제: 소유자불일치 ${OWNER_MISMATCH}명, 타사용자쓰기권한 ${WRITABLE_BY_OTHERS}명"
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


#####################################################################################################################
# 함수명: U-32
# 설명: 홈 디렉토리 존재 여부 점검
# ----------------------------------------------------------
function U-32() {
    local CHECK_ID="U-32"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="홈 디렉토리로 지정한 디렉토리의 존재 관리"
    local EXPECTED_VAL="모든 사용자 계정에 홈 디렉토리가 존재하는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_USERS=0
    local MISSING_HOMEDIR=0
    local GOOD_CONFIG=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 점검 제외 계정 (시스템 계정)
    local EXCLUDE_USERS=(
        "root" "bin" "daemon" "adm" "lp" "sync" "shutdown" "halt" "mail"
        "operator" "games" "ftp" "nobody" "systemd-network" "dbus" "polkitd"
        "colord" "rpc" "saslauth" "libstoragemgmt" "setroubleshoot"
        "cockpit-ws" "cockpit-wsinstance" "sssd" "sshd" "chrony" "tcpdump" "tss"
    )

    # 제외 대상 사용자인지 확인
    is_excluded_user() {
        local username=$1
        for excluded in "${EXCLUDE_USERS[@]}"; do
            [ "$username" = "$excluded" ] && return 0
        done
        return 1
    }

    # [점검 1] 사용자 계정별 홈 디렉토리 존재 여부 확인
    while IFS=: read -r username _ uid gid _ homedir shell; do
        # UID 1000 미만 및 제외 계정 스킵
        [ $uid -lt 1000 ] && continue
        is_excluded_user "$username" && continue

        # nologin, false 쉘 계정 스킵
        [[ "$shell" =~ (nologin|false) ]] && continue

        ((TOTAL_USERS++))

        # 홈 디렉토리 존재 여부 확인
        if [ -d "$homedir" ]; then
            ((GOOD_CONFIG++))
            DETAILS_ARRAY+=("{\"점검항목\":\"$username\",\"상태\":\"양호\",\"세부내용\":\"양호: $username - 홈 디렉토리 존재 ($homedir)\",\"점검명령어\":\"[ -d '$homedir' ] && ls -ld $homedir || echo 'missing'\",\"전체내용\":\"$homedir:exists\"}")
        else
            ((MISSING_HOMEDIR++))
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"$username\",\"상태\":\"취약\",\"세부내용\":\"취약: $username - 홈 디렉토리 없음 ($homedir)\",\"점검명령어\":\"[ -d '$homedir' ] && ls -ld $homedir || echo 'missing'\",\"전체내용\":\"$homedir:missing\"}")
        fi

    done < /etc/passwd

    # [점검 2] 비정상적인 홈 디렉토리 위치 확인
    local abnormal_found=0

    while IFS=: read -r username _ uid gid _ homedir shell; do
        # UID 1000 미만 및 제외 계정 스킵
        [ $uid -lt 1000 ] && continue
        is_excluded_user "$username" && continue

        # nologin, false 쉘 계정 스킵
        [[ "$shell" =~ (nologin|false) ]] && continue

        # 홈 디렉토리가 /home 이외의 위치인 경우
        if [[ ! "$homedir" =~ ^/home/ ]] && [ -d "$homedir" ]; then
            abnormal_found=1
        fi

    done < /etc/passwd

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_USERS -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="점검 대상 사용자 없음"
        DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 점검 대상 사용자가 없습니다.\",\"점검명령어\":\"cat /etc/passwd\",\"전체내용\":\"TOTAL_USERS=0\"}")
    elif [ $MISSING_HOMEDIR -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_USERS}명 모두 홈 디렉토리 존재"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_USERS}명 중 ${MISSING_HOMEDIR}명 홈 디렉토리 없음"
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


##########################################################################################################################
# 함수명: U-33
# 설명: 숨겨진 파일 및 디렉토리 점검
# ----------------------------------------------------------
function U-33() {
    local CHECK_ID="U-33"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="숨겨진 파일 및 디렉토리 검색 및 제거"
    local EXPECTED_VAL="의심스러운 숨김 파일이 존재하지 않는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_HIDDEN=0
    local SUSPICIOUS_FILES=0
    local NORMAL_FILES=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 정상적인 숨김 파일/디렉토리 (화이트리스트)
    local WHITELIST_FILES=(
        ".bash_logout" ".bash_profile" ".bashrc" ".profile" ".cshrc"
        ".login" ".logout" ".zshrc" ".vimrc" ".vim" ".ssh" ".gnupg"
        ".cache" ".config" ".local" ".mozilla" ".thunderbird"
        ".ICEauthority" ".Xauthority" ".lesshst" ".bash_history"
        ".viminfo" ".mysql_history" ".python_history" ".wget-hsts"
        ".gitconfig" ".git" ".subversion" ".docker" ".npm" ".gem"
        ".cargo" ".rustup" ".gradle" ".m2" ".ansible" ".kube"
    )

    # 의심스러운 파일명 패턴
    local SUSPICIOUS_PATTERNS=(
        "\.\.\..*" ".*\.bak$" ".*~$" ".*\.tmp$" ".*\.swp$"
        ".*backdoor.*" ".*hack.*" ".*exploit.*" ".*shell.*"
        ".*payload.*" ".*rootkit.*"
    )

    # 화이트리스트 파일인지 확인
    is_whitelisted() {
        local filename=$1
        for white in "${WHITELIST_FILES[@]}"; do
            [ "$filename" = "$white" ] && return 0
        done
        return 1
    }

    # 의심스러운 패턴인지 확인
    is_suspicious_pattern() {
        local filename=$1
        for pattern in "${SUSPICIOUS_PATTERNS[@]}"; do
            if [[ "$filename" =~ $pattern ]]; then
                return 0
            fi
        done
        return 1
    }

    # [점검 1] 사용자 홈 디렉토리 내 숨김 파일 점검
    local home_dirs=$(find /home -maxdepth 1 -mindepth 1 -type d 2>/dev/null)

    while IFS= read -r homedir; do
        [ -z "$homedir" ] && continue

        local username=$(basename "$homedir")

        while IFS= read -r filepath; do
            [ -z "$filepath" ] && continue

            local filename=$(basename "$filepath")
            ((TOTAL_HIDDEN++))

            local file_perm=$(stat -c '%a' "$filepath" 2>/dev/null)
            local file_owner=$(stat -c '%U:%G' "$filepath" 2>/dev/null)
            local file_size=$(stat -c '%s' "$filepath" 2>/dev/null)

            # 화이트리스트 확인
            if is_whitelisted "$filename"; then
                ((NORMAL_FILES++))
                continue
            fi

            # 의심스러운 패턴 확인
            if is_suspicious_pattern "$filename"; then
                ((SUSPICIOUS_FILES++))
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"$filepath\",\"상태\":\"취약\",\"세부내용\":\"취약: $username/$filename (크기: $file_size bytes, 권한: $file_perm, 소유자: $file_owner) - 의심 패턴\",\"점검명령어\":\"ls -ld $filepath\",\"전체내용\":\"$(ls -ld "$filepath" 2>/dev/null)\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$filepath\",\"상태\":\"양호\",\"세부내용\":\"양호: (주의) $username/$filename (크기: $file_size bytes, 권한: $file_perm, 소유자: $file_owner)\",\"점검명령어\":\"ls -ld $filepath\",\"전체내용\":\"$(ls -ld "$filepath" 2>/dev/null)\"}")
            fi
 
        done < <(find "$homedir" -maxdepth 1 -name ".*" ! -name "." ! -name ".." 2>/dev/null)

    done <<< "$home_dirs"

    # [점검 2] 시스템 임시 디렉토리 내 숨김 파일 점검
    local check_dirs=("/tmp" "/var/tmp")

    for dir in "${check_dirs[@]}"; do
        local found_hidden=0

        while IFS= read -r filepath; do
            [ -z "$filepath" ] && continue

            found_hidden=1
            local filename=$(basename "$filepath")
            ((TOTAL_HIDDEN++))

            local file_perm=$(stat -c '%a' "$filepath" 2>/dev/null)
            local file_owner=$(stat -c '%U:%G' "$filepath" 2>/dev/null)
            local file_size=$(stat -c '%s' "$filepath" 2>/dev/null)

            if is_suspicious_pattern "$filename"; then
                ((SUSPICIOUS_FILES++))
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"$dir/$filename\",\"상태\":\"취약\",\"세부내용\":\"취약: $dir/$filename (소유자: $file_owner, 권한: $file_perm)\",\"점검명령어\":\"ls -ld $filepath\",\"전체내용\":\"$(ls -ld "$filepath" 2>/dev/null)\"}")
            else
                :
                DETAILS_ARRAY+=("{\"점검항목\":\"$dir/$filename\",\"상태\":\"양호\",\"세부내용\":\"양호: (주의) $dir/$filename (소유자: $file_owner, 권한: $file_perm)\",\"점검명령어\":\"ls -ld $filepath\",\"전체내용\":\"$(ls -ld "$filepath" 2>/dev/null)\"}")
            
            fi

        done < <(find "$dir" -maxdepth 1 -name ".*" ! -name "." ! -name ".." 2>/dev/null)

        if [ $found_hidden -eq 0 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"$dir\",\"상태\":\"양호\",\"세부내용\":\"양호: $dir - 숨김 파일 없음\",\"점검명령어\":\"find $dir -maxdepth 1 -name '.*' ! -name '.' ! -name '..' 2>/dev/null\",\"전체내용\":\"\"}")
        fi
    done

    # [점검 3] 루트(/) 디렉토리 내 숨김 파일 점검
    local root_hidden=0

    while IFS= read -r filepath; do
        [ -z "$filepath" ] && continue

        local filename=$(basename "$filepath")
        ((TOTAL_HIDDEN++))
        ((SUSPICIOUS_FILES++))
        IS_VULN=1
        root_hidden=1

        local file_perm=$(stat -c '%a' "$filepath" 2>/dev/null)
        local file_owner=$(stat -c '%U:%G' "$filepath" 2>/dev/null)

        DETAILS_ARRAY+=("{\"점검항목\":\"/$filename\",\"상태\":\"취약\",\"세부내용\":\"취약: /$filename (권한: $file_perm, 소유자: $file_owner) - 루트 디렉토리에 숨김 파일 존재\",\"점검명령어\":\"ls -ld $filepath\",\"전체내용\":\"$(ls -ld "$filepath" 2>/dev/null)\"}")

    done < <(find / -maxdepth 1 -name ".*" ! -name "." ! -name ".." -type f 2>/dev/null)

    if [ $root_hidden -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 루트 디렉토리에 숨김 파일 없음\",\"점검명령어\":\"find / -maxdepth 1 -name '.*' ! -name '.' ! -name '..' -type f 2>/dev/null\",\"전체내용\":\"\"}")
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_HIDDEN -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="숨김 파일 없음"
    elif [ $SUSPICIOUS_FILES -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_HIDDEN}개 발견 (모두 정상, 의심 파일 없음)"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_HIDDEN}개 발견 (의심: ${SUSPICIOUS_FILES}개, 정상: ${NORMAL_FILES}개)"
    fi

    if [ $IS_VULN -eq 1 ]; then
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


###############################################################################
# U-34 (2026 가이드라인 반영)
# 설명: 시스템 정보 노출 위험이 있는 Finger 서비스의 비활성화 여부 점검
###############################################################################
function U-34() {
    local CHECK_ID="U-34"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="Finger 서비스 비활성화"
    local EXPECTED_VALUE="Finger 서비스 비활성화 또는 미설치"

    local STATUS="SAFE"
    local CURRENT_VALUE="Finger 서비스 비활성화 상태"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. inetd 점검 (가이드라인 Step 1 반영)
    if [ -f "/etc/inetd.conf" ]; then
        ##만약 finger라는 단어가 주석 없이 있다면 취약
        if grep -vE "^#|^\s*#" /etc/inetd.conf | grep -qi "finger"; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"etc/inetd.conf\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/inetd.conf 내 Finger 서비스가 활성화됨\",\"점검명령어\":\"grep -vE '^#|^\\\\s*#' /etc/inetd.conf | grep -i 'finger'\",\"전체내용\":\"$(grep -vE '^#|^\\\\s*#' /etc/inetd.conf 2>/dev/null | grep -i 'finger' | head -5 | sed 's/\"/\\\\\"/g')\"}")
        fi
    fi

    # 2. xinetd 점검 (가이드라인 Step 1 반영)
    if [ -f "/etc/xinetd.d/finger" ]; then
        if grep -vE "^#|^\s*#" /etc/xinetd.d/finger | grep -qi "disable" | grep -q "no"; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/xinetd.d/finger 설정이 활성화(disable=no)됨\",\"점검명령어\":\"grep -vE '^#|^\\\\s*#' /etc/xinetd.d/finger | grep -i 'disable'\",\"전체내용\":\"$(grep -vE '^#|^\\\\s*#' /etc/xinetd.d/finger 2>/dev/null | grep -i 'disable' | head -5 | sed 's/\"/\\\\\"/g')\"}")
        fi
    fi

    # 3. Systemd 서비스 및 포트 점검
    if command -v systemctl >/dev/null 2>&1; then
        local finger_units=("finger.service" "finger.socket" "fingerd.service" "cfingerd.service")
        for unit in "${finger_units[@]}"; do
            if systemctl is-active --quiet "$unit" 2>/dev/null; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"Systemd\",\"상태\":\"취약\",\"세부내용\":\"취약: Systemd $unit 서비스가 활성화(active) 상태임\",\"점검명령어\":\"systemctl status $unit\",\"전체내용\":\"$(systemctl is-active $unit 2>/dev/null)\"}")
            fi
        done
    fi

    # 4. 결과 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="Finger 서비스 활성화 확인됨"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        STATUS="SAFE"
        CURRENT_VALUE="Finger 서비스 비활성화 상태"
        DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 가동 중인 Finger 서비스가 발견되지 않았습니다.\",\"점검명령어\":\"systemctl list-units --all | grep -i 'finger'\",\"전체내용\":\"none\"}")
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}


############################################################################################################
# 함수명: U-35
# 설명: NFS, Samba, FTP, TFTP 등 공유 서비스의 익명 접근 제한 설정 점검
# ----------------------------------------------------------
function U-35() {
    local CHECK_ID="U-35"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="공유 서비스에 대한 익명 접근 제한 설정"
    local EXPECTED_VAL="공유 서비스(NFS, Samba, FTP, TFTP)를 사용하지 않거나, 사용 시 익명 접근이 차단된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. NFS 서비스 점검
    if systemctl is-active nfs-server > /dev/null 2>&1 || systemctl is-active nfs-kernel-server > /dev/null 2>&1; then
        if [ -f /etc/exports ]; then
            local nfs_vuln_lines=$(grep -v '^#' /etc/exports | grep -E "no_root_squash|all_squash" -v | grep -v '^$')
            local nfs_root_squash=$(grep -v '^#' /etc/exports | grep "no_root_squash")

            if [ -n "$nfs_vuln_lines" ] || [ -n "$nfs_root_squash" ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: NFS 공유 설정 중 익명 접근 제한 옵션(all_squash) 누락 또는 no_root_squash 발견\",\"점검명령어\":\"grep -v '^#' /etc/exports\",\"전체내용\":\"$(grep -v '^#' /etc/exports 2>/dev/null | head -10 | sed 's/\"/\\\\\"/g')\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 서비스 실행 중이나 익명 접근 제한 설정됨\",\"점검명령어\":\"grep -v '^#' /etc/exports\",\"전체내용\":\"$(grep -v '^#' /etc/exports 2>/dev/null | head -10 | sed 's/\"/\\\\\"/g')\"}")
            fi
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 서비스 비활성화 상태\",\"점검명령어\":\"systemctl is-active nfs-server nfs-kernel-server\",\"전체내용\":\"inactive\"}")
    fi

    # 2. Samba 서비스 점검
    if systemctl is-active smbd > /dev/null 2>&1 || systemctl is-active smb > /dev/null 2>&1; then
        local smb_conf="/etc/samba/smb.conf"
        [ ! -f "$smb_conf" ] && smb_conf="/etc/smb.conf"

        if [ -f "$smb_conf" ]; then
            if grep -qiE "guest ok.*=.*yes|map to guest.*=.*bad user|public.*=.*yes" "$smb_conf"; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"Samba 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Samba 설정 중 guest ok 또는 public 등 익명 접근 허용 옵션 발견\",\"점검명령어\":\"grep -i 'guest ok\\|map to guest\\|public' $smb_conf\",\"전체내용\":\"$(grep -i 'guest ok\\|map to guest\\|public' \"$smb_conf\" 2>/dev/null | head -10 | sed 's/\"/\\\\\"/g')\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"Samba 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Samba 서비스 실행 중이나 익명 접근 제한 설정됨\",\"점검명령어\":\"grep -i 'guest ok\\|map to guest\\|public' $smb_conf\",\"전체내용\":\"\"}")
            fi
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"Samba 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Samba 서비스 비활성화 상태\",\"점검명령어\":\"systemctl is-active smbd smb\",\"전체내용\":\"inactive\"}")
    fi

    # 3. FTP(vsftpd) 서비스 점검
    if systemctl is-active vsftpd > /dev/null 2>&1; then
        local ftp_conf="/etc/vsftpd/vsftpd.conf"
        [ ! -f "$ftp_conf" ] && ftp_conf="/etc/vsftpd.conf"

        if [ -f "$ftp_conf" ]; then
            local anon_enable=$(grep -i "^anonymous_enable" "$ftp_conf" | cut -d'=' -f2 | tr -d ' ' | tail -1)
            if [[ "${anon_enable^^}" == "YES" ]]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: FTP 서비스(vsftpd)에서 익명 접근(anonymous_enable=YES) 허용됨\",\"점검명령어\":\"grep -i '^anonymous_enable' $ftp_conf\",\"전체내용\":\"$(grep -i '^anonymous_enable' \"$ftp_conf\" 2>/dev/null | head -5 | sed 's/\"/\\\\\"/g')\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 서비스 실행 중이나 익명 접근 차단됨\",\"점검명령어\":\"grep -i '^anonymous_enable' $ftp_conf\",\"전체내용\":\"$(grep -i '^anonymous_enable' \"$ftp_conf\" 2>/dev/null | head -5 | sed 's/\"/\\\\\"/g')\"}")
            fi
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 서비스 비활성화 상태\",\"점검명령어\":\"systemctl is-active vsftpd\",\"전체내용\":\"inactive\"}")
    fi

    # 4. TFTP 서비스 점검
    if systemctl is-active tftp > /dev/null 2>&1 || systemctl is-active tftp.socket > /dev/null 2>&1; then
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: TFTP 서비스 활성화 상태 (TFTP는 기본적으로 인증을 지원하지 않음)\",\"점검명령어\":\"systemctl is-active tftp tftp.socket\",\"전체내용\":\"active\"}")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: TFTP 서비스 비활성화 상태\",\"점검명령어\":\"systemctl is-active tftp tftp.socket\",\"전체내용\":\"inactive\"}")
    fi

    # 최종 상태 및 현재 값 설정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="하나 이상의 공유 서비스에서 익명 접근 허용 설정 발견"
    else
        STATUS="SAFE"
        CURRENT_VAL="모든 공유 서비스 비활성화 또는 익명 접근 제한됨"
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


###############################################################################
# U-36 (2026 가이드라인 반영)
# 설명: rlogin, rsh, rexec 등 보안에 취약한 r 계열 서비스의 비활성화 점검
###############################################################################
function U-36() {
    local CHECK_ID="U-36"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="r 계열 서비스 비활성화"
    local EXPECTED_VALUE="r 계열 서비스 비활성화 및 인증 우회 파일 미존재"

    local STATUS="SAFE"
    local CURRENT_VALUE="r 계열 서비스 비활성화 상태"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo -e "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. Systemd 서비스 및 소켓 점검
    local SERVICE_LIST="rlogin.socket rexec.socket rsh.socket rlogin.service rexec.service rsh.service shell.socket shell.service login.socket login.service exec.socket exec.service"
    if command -v systemctl >/dev/null 2>&1; then
        for svc in $SERVICE_LIST; do
            if systemctl is-active --quiet "$svc" 2>/dev/null; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"Systemd\",\"상태\":\"취약\",\"세부내용\":\"취약: Systemd 서비스 $svc 가 가동 중입니다.\",\"점검명령어\":\"systemctl status $svc\",\"전체내용\":\"$(systemctl is-active $svc 2>/dev/null)\"}")
            fi
        done
    fi

    # 2. xinetd 및 inetd 설정 점검 (Legacy 대응)
    if [ -d /etc/xinetd.d ]; then
        for r_svc in rlogin rsh rexec shell login exec; do
            if [ -f "/etc/xinetd.d/$r_svc" ]; then
                if grep -vE "^#|^\s*#" "/etc/xinetd.d/$r_svc" | grep -q "disable[[:space:]]*=[[:space:]]*no"; then
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: xinetd 내 $r_svc 서비스가 활성화되어 있습니다.\",\"점검명령어\":\"grep -vE '^#|^\\\\s*#' /etc/xinetd.d/$r_svc | grep 'disable'\",\"전체내용\":\"$(grep -vE '^#|^\\\\s*#' /etc/xinetd.d/$r_svc 2>/dev/null | grep 'disable' | head -5 | sed 's/\"/\\\\\"/g')\"}")
                fi
            fi
        done
    fi

    if [ -f /etc/inetd.conf ]; then
        if grep -vE "^#|^\s*#" /etc/inetd.conf | grep -qE "rlogin|rsh|rexec|shell|login|exec"; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"etc/inetd.conf\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/inetd.conf 내 r 계열 서비스 설정이 존재합니다.\",\"점검명령어\":\"grep -vE '^#|^\\\\s*#' /etc/inetd.conf | grep -E 'rlogin|rsh|rexec|shell|login|exec'\",\"전체내용\":\"$(grep -vE '^#|^\\\\s*#' /etc/inetd.conf 2>/dev/null | grep -E 'rlogin|rsh|rexec|shell|login|exec' | head -5 | sed 's/\"/\\\\\"/g')\"}")
        fi
    fi

    # 3. 인증 우회 파일 점검 (가이드라인 강조 사항)
    if [ -f "/etc/hosts.equiv" ]; then
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.equiv\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/hosts.equiv 파일이 존재합니다 (무인증 접속 위험)\",\"점검명령어\":\"ls -l /etc/hosts.equiv\",\"전체내용\":\"$(ls -l /etc/hosts.equiv 2>/dev/null | sed 's/\"/\\\\\"/g')\"}")
    fi
    local root_rhosts="/root/.rhosts"
    if [ -f "$root_rhosts" ]; then
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"$root_rhosts\",\"상태\":\"취약\",\"세부내용\":\"취약: $root_rhosts 파일이 존재합니다 (무인증 접속 위험)\",\"점검명령어\":\"ls -l $root_rhosts\",\"전체내용\":\"$(ls -l $root_rhosts 2>/dev/null | sed 's/\"/\\\\\"/g')\"}")
    fi

    # 결과 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="r 계열 서비스 또는 인증 파일 발견"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        STATUS="SAFE"
        CURRENT_VALUE="모든 r 계열 서비스 비활성화"
        DETAILS_ARRAY+=("{\"점검항목\":\"불필요한\",\"상태\":\"양호\",\"세부내용\":\"양호: 불필요한 r 계열 서비스가 비활성화되어 있습니다.\",\"점검명령어\":\"systemctl list-units | grep -E 'rlogin|rsh|rexec' || echo 'none'\",\"전체내용\":\"none\"}")
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)

    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}


##########################################################################################################
# 함수명: U-37
# 설명: crontab 및 at 서비스 권한 설정 점검
# ----------------------------------------------------------
function U-37() {
    local CHECK_ID="U-37"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="crontab 설정파일 권한 설정 미흡"
    local EXPECTED_VAL="cron/at 관련 파일 및 명령어의 소유자가 root이고 권한이 적절하게 설정된 경우 (명령어 750 이하, 파일 640 이하)"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local VULNERABLE_COUNT=0
    local SECURE_COUNT=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 점검 대상 파일 목록
    local CRON_FILES=(
        "/etc/cron.allow"
        "/etc/cron.deny"
        "/etc/crontab"
        "/etc/cron.d"
        "/etc/cron.daily"
        "/etc/cron.hourly"
        "/etc/cron.monthly"
        "/etc/cron.weekly"
        "/var/spool/cron"
    )

    local AT_FILES=(
        "/etc/at.allow"
        "/etc/at.deny"
        "/var/spool/at"
        "/var/spool/cron/atjobs"
    )

    local CRON_COMMANDS=(
        "/usr/bin/crontab"
        "/bin/crontab"
    )

    local AT_COMMANDS=(
        "/usr/bin/at"
        "/bin/at"
    )

    # 권한 검증 (640 또는 750 이하인지 확인)
    validate_permission() {
        local perm=$1
        local limit=$2

        local owner=${perm:0:1}
        local group=${perm:1:1}
        local other=${perm:2:1}

        local limit_owner=${limit:0:1}
        local limit_group=${limit:1:1}
        local limit_other=${limit:2:1}

        [ $owner -gt $limit_owner ] && return 1
        [ $group -gt $limit_group ] && return 1
        [ $other -gt $limit_other ] && return 1

        return 0
    }

    # [점검 1] crontab 명령어 권한 확인
    local found=0
    for cmd in "${CRON_COMMANDS[@]}"; do
        if [ -f "$cmd" ]; then
            found=1
            ((TOTAL_CHECKED++))

            local perm=$(stat -c '%a' "$cmd" 2>/dev/null)
            local owner=$(stat -c '%U:%G' "$cmd" 2>/dev/null)
            local symbolic=$(stat -c '%A' "$cmd" 2>/dev/null)

            if validate_permission "$perm" "750"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$cmd\",\"상태\":\"양호\",\"세부내용\":\"양호: $cmd (권한: $perm, 소유자: $owner)\",\"점검명령어\":\"stat -c '%U %a' $cmd; ls -ld $cmd\",\"전체내용\":\"$cmd:owner=$owner,perm=$perm\"}")
                ((SECURE_COUNT++))
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $cmd (권한: $perm, 소유자: $owner) - 750 초과\",\"점검명령어\":\"stat -c '%U %a' $cmd; ls -ld $cmd\",\"전체내용\":\"$cmd:owner=$owner,perm=$perm\"}")
                ((VULNERABLE_COUNT++))
                IS_VULN=1
            fi
        fi
    done

    # [점검 2] at 명령어 권한 확인
    found=0
    for cmd in "${AT_COMMANDS[@]}"; do
        if [ -f "$cmd" ]; then
            found=1
            ((TOTAL_CHECKED++))

            local perm=$(stat -c '%a' "$cmd" 2>/dev/null)
            local owner=$(stat -c '%U:%G' "$cmd" 2>/dev/null)
            local symbolic=$(stat -c '%A' "$cmd" 2>/dev/null)

            if validate_permission "$perm" "750"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$cmd\",\"상태\":\"양호\",\"세부내용\":\"양호: $cmd (권한: $perm, 소유자: $owner)\",\"점검명령어\":\"stat -c '%U %a' $cmd; ls -ld $cmd\",\"전체내용\":\"$cmd:owner=$owner,perm=$perm\"}")
                ((SECURE_COUNT++))
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $cmd (권한: $perm, 소유자: $owner) - 750 초과\",\"점검명령어\":\"stat -c '%U %a' $cmd; ls -ld $cmd\",\"전체내용\":\"$cmd:owner=$owner,perm=$perm\"}")
                ((VULNERABLE_COUNT++))
                IS_VULN=1
            fi
        fi
    done

    # [점검 3] cron 관련 파일 권한 확인
    for file in "${CRON_FILES[@]}"; do
        if [ -e "$file" ]; then
            ((TOTAL_CHECKED++))

            local perm=$(stat -c '%a' "$file" 2>/dev/null)
            local owner=$(stat -c '%U:%G' "$file" 2>/dev/null)

            if validate_permission "$perm" "640"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$file\",\"상태\":\"양호\",\"세부내용\":\"양호: $file (권한: $perm, 소유자: $owner)\",\"점검명령어\":\"stat -c '%U %a' $file; ls -ld $file\",\"전체내용\":\"$file:owner=$owner,perm=$perm\"}")
                ((SECURE_COUNT++))
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $file (권한: $perm, 소유자: $owner) - 640 초과\",\"점검명령어\":\"stat -c '%U %a' $file; ls -ld $file\",\"전체내용\":\"$file:owner=$owner,perm=$perm\"}")
                ((VULNERABLE_COUNT++))
                IS_VULN=1
            fi
        fi
    done

    # [점검 4] at 관련 파일 권한 확인
    found=0
    for file in "${AT_FILES[@]}"; do
        if [ -e "$file" ]; then
            found=1
            ((TOTAL_CHECKED++))

            local perm=$(stat -c '%a' "$file" 2>/dev/null)
            local owner=$(stat -c '%U:%G' "$file" 2>/dev/null)

            if validate_permission "$perm" "640"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$file\",\"상태\":\"양호\",\"세부내용\":\"양호: $file (권한: $perm, 소유자: $owner)\",\"점검명령어\":\"stat -c '%U %a' $file; ls -ld $file\",\"전체내용\":\"$file:owner=$owner,perm=$perm\"}")
                ((SECURE_COUNT++))
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $file (권한: $perm, 소유자: $owner) - 640 초과\",\"점검명령어\":\"stat -c '%U %a' $file; ls -ld $file\",\"전체내용\":\"$file:owner=$owner,perm=$perm\"}")
                ((VULNERABLE_COUNT++))
                IS_VULN=1
            fi
        fi
    done

    # [점검 5] allow/deny 파일 설정 확인
    if [ -f /etc/cron.allow ]; then
        local user_count=$(wc -l < /etc/cron.allow)
    else
        :
        #DETAILS_ARRAY+=("\"정보: cron.allow 없음\"")
    fi

    if [ -f /etc/cron.deny ]; then
        local deny_count=$(wc -l < /etc/cron.deny)
    fi

    if [ -f /etc/at.allow ]; then
        local user_count=$(wc -l < /etc/at.allow)
    else
        :
        #DETAILS_ARRAY+=("\"정보: at.allow 없음\"")
    fi

    if [ -f /etc/at.deny ]; then
        local deny_count=$(wc -l < /etc/at.deny)
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="점검 대상 파일 없음"
        DETAILS_ARRAY+=("{\"점검항목\":\"Cron 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: cron/at 관련 파일이 없습니다.\"}")
    elif [ $VULNERABLE_COUNT -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 모두 안전"
    else
        STATUS="VULNERABLE"
        IS_VULN=1

        CURRENT_VAL="총 ${TOTAL_CHECKED}개 중 취약 ${VULNERABLE_COUNT}개, 안전 ${SECURE_COUNT}개"
    fi
    
    if [ $IS_VULN -eq 1 ]; then
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
# ----------------------------------------------------------
# 함수명: U-38
# 설명: DoS 공격에 취약한 서비스 비활성화 점검
# ----------------------------------------------------------
function U-38() {
    local CHECK_ID="U-38"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="DoS 공격에 취약한 서비스 비활성화"
    local EXPECTED_VAL="echo, discard, daytime, chargen, time, tftp 등 DoS 취약 서비스가 비활성화된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local ACTIVE_VULNERABLE=0
    local INACTIVE_SERVICES=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # DoS 공격에 취약한 서비스 목록
    local VULNERABLE_SERVICES=(
        "echo:7:UDP Echo 프로토콜 (증폭 공격)"
        "discard:9:Discard 프로토콜 (증폭 공격)"
        "daytime:13:Daytime 프로토콜 (증폭 공격)"
        "chargen:19:Character Generator (증폭 공격)"
        "time:37:Time 프로토콜"
        "tftp:69:TFTP (인증 없는 파일 전송)"
    )

    # systemd 서비스 이름
    local SYSTEMD_SERVICES=(
        "echo.socket" "echo-dgram.socket"
        "discard.socket" "discard-dgram.socket"
        "daytime.socket" "daytime-dgram.socket"
        "chargen.socket" "chargen-dgram.socket"
        "time.socket" "time-dgram.socket"
        "tftp.socket" "tftp"
    )

    # [점검 1] xinetd 기반 취약 서비스 확인
    if ! command -v xinetd > /dev/null 2>&1; then
        DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: xinetd 미설치\",\"점검명령어\":\"command -v xinetd\",\"전체내용\":\"not installed\"}")
    elif ! systemctl is-active xinetd > /dev/null 2>&1; then
        DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: xinetd 비활성화\",\"점검명령어\":\"systemctl is-active xinetd\",\"전체내용\":\"inactive\"}")
    else
        if [ ! -d /etc/xinetd.d ]; then
            :
            #DETAILS_ARRAY+=("\"정보: /etc/xinetd.d 디렉토리 없음\"")
        else
            local vulnerable_found=0

            for service_info in "${VULNERABLE_SERVICES[@]}"; do
                local service_name=$(echo "$service_info" | cut -d':' -f1)
                local service_port=$(echo "$service_info" | cut -d':' -f2)
                local service_desc=$(echo "$service_info" | cut -d':' -f3)

                local config_file="/etc/xinetd.d/${service_name}"

                if [ -f "$config_file" ]; then
                    ((TOTAL_CHECKED++))

                    local disable_status=$(grep -i "disable" "$config_file" | grep -v "^#" | awk '{print $3}')

                    if [ "$disable_status" = "no" ]; then
                        DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $service_name (포트 $service_port) - xinetd 활성화 - $service_desc\",\"점검명령어\":\"grep -i 'disable' $config_file\",\"전체내용\":\"$(grep -i 'disable' \"$config_file\" 2>/dev/null | head -5 | sed 's/\"/\\\\\"/g')\"}")
                        ((ACTIVE_VULNERABLE++))
                        IS_VULN=1
                        vulnerable_found=1
                    else
                        DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $service_name - xinetd 비활성화\",\"점검명령어\":\"grep -i 'disable' $config_file\",\"전체내용\":\"$(grep -i 'disable' \"$config_file\" 2>/dev/null | head -5 | sed 's/\"/\\\\\"/g')\"}")
                        ((INACTIVE_SERVICES++))
                    fi
                fi
            done

            if [ $vulnerable_found -eq 0 ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: xinetd 취약 서비스 설정 없음\",\"점검명령어\":\"ls /etc/xinetd.d 2>/dev/null\",\"전체내용\":\"\"}")
            fi
        fi
    fi

    # [점검 2] systemd 기반 취약 서비스 확인
    for service in "${SYSTEMD_SERVICES[@]}"; do
        if systemctl list-unit-files "$service" > /dev/null 2>&1; then
            ((TOTAL_CHECKED++))

            local status=$(systemctl is-active "$service" 2>/dev/null)

            if [ "$status" = "active" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - 실행 중\"}")
                ((ACTIVE_VULNERABLE++))
                IS_VULN=1
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - 비활성화\"}")
                ((INACTIVE_SERVICES++))
            fi
        fi
    done

    # [점검 3] inetd.conf 파일 확인
    if [ ! -f /etc/inetd.conf ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/inetd.conf\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/inetd.conf 파일 없음\",\"점검명령어\":\"ls -l /etc/inetd.conf\",\"전체내용\":\"\"}")
    else
        local vulnerable_found=0

        for service_info in "${VULNERABLE_SERVICES[@]}"; do
            local service_name=$(echo "$service_info" | cut -d':' -f1)
            local service_desc=$(echo "$service_info" | cut -d':' -f3)

            if grep "^[^#]*${service_name}" /etc/inetd.conf > /dev/null 2>&1; then
                ((TOTAL_CHECKED++))
                DETAILS_ARRAY+=("{\"점검항목\":\"$service_name\",\"상태\":\"취약\",\"세부내용\":\"취약: $service_name - inetd.conf 활성화 - $service_desc\",\"점검명령어\":\"grep '^[^#]*${service_name}' /etc/inetd.conf\",\"전체내용\":\"$(grep '^[^#]*${service_name}' /etc/inetd.conf 2>/dev/null | head -3 | sed 's/\"/\\\\\"/g')\"}")
                ((ACTIVE_VULNERABLE++))
                IS_VULN=1
                vulnerable_found=1
            fi
        done

        if [ $vulnerable_found -eq 0 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"inetd.conf\",\"상태\":\"양호\",\"세부내용\":\"양호: inetd.conf 취약 서비스 설정 없음\",\"점검명령어\":\"cat /etc/inetd.conf 2>/dev/null\",\"전체내용\":\"\"}")
        fi
    fi

    # [점검 4] 취약 포트 리스닝 여부 확인
    local vulnerable_ports=(7 9 13 19 37 69)
    local found_listening=0

    for port in "${vulnerable_ports[@]}"; do
        if ss -tuln 2>/dev/null | grep -q ":${port} "; then
            ((TOTAL_CHECKED++))

            local protocol=$(ss -tuln 2>/dev/null | grep ":${port} " | awk '{print $1}' | head -1)
            local address=$(ss -tuln 2>/dev/null | grep ":${port} " | awk '{print $5}' | head -1)

            DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 포트 $port/$protocol 리스닝 중 ($address)\",\"점검명령어\":\"ss -tuln | grep ':${port} '\",\"전체내용\":\"$protocol $address\"}")
            ((ACTIVE_VULNERABLE++))
            IS_VULN=1
            found_listening=1
        fi
    done

    if [ $found_listening -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 취약 포트 리스닝 없음\",\"점검명령어\":\"ss -tuln\",\"전체내용\":\"\"}")
    fi

    # [점검 5] 추가 점검 서비스 확인 (NTP, SNMP)
    local OPTIONAL_SYSTEMD=("ntpd" "snmpd")

    for service in "${OPTIONAL_SYSTEMD[@]}"; do
        if systemctl list-unit-files "$service" > /dev/null 2>&1; then
            local status=$(systemctl is-active "$service" 2>/dev/null)

            if [ "$status" = "active" ]; then
                
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호 :(주의) $service - 실행 중 (보안 설정 확인 필요)\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - 비활성화\"}")
            fi
        fi
    done

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="점검 대상 서비스 없음"
        # DETAILS_ARRAY+=("{\"점검항목\":\"DoS\",\"상태\":\"양호\",\"세부내용\":\"양호: DoS 취약 서비스가 설치되지 않았습니다.\"}")
    elif [ $ACTIVE_VULNERABLE -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 서비스 모두 비활성화"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 중 활성화 ${ACTIVE_VULNERABLE}개, 비활성화 ${INACTIVE_SERVICES}개"
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


#####################################################################################################################
# 함수명: U-39
# 설명: 불필요한 NFS 서비스 비활성화 점검
# ----------------------------------------------------------
function U-39() {
    local CHECK_ID="U-39"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="불필요한 NFS 서비스 비활성화"
    local EXPECTED_VAL="불필요한 NFS 서비스가 비활성화된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local ACTIVE_SERVICES=0
    local INACTIVE_SERVICES=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # NFS 관련 서비스 목록
    local NFS_SERVICES=(
        "nfs-server:NFS 서버"
        "nfs-kernel-server:NFS 커널 서버 (Ubuntu)"
        "nfs:NFS 서비스"
        "rpcbind:RPC 바인드 (NFS 필수)"
        "nfs-idmap:NFS ID 매핑"
        "nfs-mountd:NFS 마운트 데몬"
    )

    # [점검 1] NFS 관련 서비스 상태 확인
    for service_info in "${NFS_SERVICES[@]}"; do
        local service=$(echo "$service_info" | cut -d':' -f1)
        local description=$(echo "$service_info" | cut -d':' -f2)

        if systemctl list-unit-files "$service" 2>/dev/null | grep -q "$service"; then
            ((TOTAL_CHECKED++))

            local active_status=$(systemctl is-active "$service" 2>/dev/null)
            local enabled_status=$(systemctl is-enabled "$service" 2>/dev/null)

            if [ "$active_status" = "active" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service ($description) - 실행 중 (Enabled: $enabled_status)\"}")
                ((ACTIVE_SERVICES++))
                IS_VULN=1
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - 비활성화\"}")
                ((INACTIVE_SERVICES++))
            fi
        fi
    done

    # [점검 2] NFS 마운트 상태 확인
    local nfs_mounts=$(mount | grep "type nfs")

    if [ -n "$nfs_mounts" ]; then
        ((TOTAL_CHECKED++))

        local mount_count=$(echo "$nfs_mounts" | wc -l)
        while IFS= read -r mount_line; do
            local mount_point=$(echo "$mount_line" | awk '{print $3}')
            local remote_path=$(echo "$mount_line" | awk '{print $1}')
        done <<< "$nfs_mounts"

        ((ACTIVE_SERVICES++))
        IS_VULN=1
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 마운트된 NFS 없음\"}")
    fi

    # [점검 3] /etc/fstab NFS 설정 확인
    if [ ! -f /etc/fstab ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/fstab\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/fstab 파일 없음\",\"점검명령어\":\"ls -l /etc/fstab\",\"전체내용\":\"\"}")
    else
        local nfs_entries=$(grep -v '^#' /etc/fstab | grep 'nfs')

        if [ -n "$nfs_entries" ]; then
            ((TOTAL_CHECKED++))

            local entry_count=$(echo "$nfs_entries" | wc -l)
            local escaped_entries=$(echo "$nfs_entries" | head -10 | sed 's/\"/\\\\\"/g')
            DETAILS_ARRAY+=("{\"점검항목\":\"etc/fstab\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): /etc/fstab에 NFS 설정 ${entry_count}개 발견\",\"점검명령어\":\"grep -v '^#' /etc/fstab | grep 'nfs'\",\"전체내용\":\"$escaped_entries\"}")

            ((ACTIVE_SERVICES++))
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/fstab에 NFS 설정 없음\",\"점검명령어\":\"grep -v '^#' /etc/fstab | grep 'nfs'\",\"전체내용\":\"\"}")
        fi
    fi

    # [점검 4] /etc/exports 공유 설정 확인
    if [ ! -f /etc/exports ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/exports\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/exports 파일 없음\",\"점검명령어\":\"ls -l /etc/exports\",\"전체내용\":\"\"}")
    else
        local export_entries=$(grep -v '^#' /etc/exports | grep -v '^$')

        if [ -n "$export_entries" ]; then
            ((TOTAL_CHECKED++))

            local escaped_exports=$(echo "$export_entries" | head -10 | sed 's/\"/\\\\\"/g')
            DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: NFS 공유 디렉토리 설정 발견\",\"점검명령어\":\"grep -v '^#' /etc/exports | grep -v '^$'\",\"전체내용\":\"$escaped_exports\"}")

            ((ACTIVE_SERVICES++))
            IS_VULN=1
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 공유 설정 없음\",\"점검명령어\":\"grep -v '^#' /etc/exports | grep -v '^$'\",\"전체내용\":\"\"}")
        fi
    fi

    # [점검 5] NFS 관련 프로세스 확인
    local nfs_procs=$(ps aux | grep -E 'nfs|rpc' | grep -v grep)

    if [ -n "$nfs_procs" ]; then
        local proc_count=$(echo "$nfs_procs" | wc -l)
        local escaped_procs=$(echo "$nfs_procs" | head -10 | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"NFS 프로세스\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): NFS 관련 프로세스 ${proc_count}개 실행 중\",\"점검명령어\":\"ps aux | grep -E 'nfs|rpc' | grep -v grep\",\"전체내용\":\"$escaped_procs\"}")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 관련 프로세스 없음\",\"점검명령어\":\"ps aux | grep -E 'nfs|rpc' | grep -v grep\",\"전체내용\":\"\"}")
    fi

    # [점검 6] NFS 포트 리스닝 확인
    local nfs_ports=(2049 111 20048)
    local listening_found=0

    for port in "${nfs_ports[@]}"; do
        if ss -tuln 2>/dev/null | grep -q ":${port} "; then
            listening_found=1

            local protocol=$(ss -tuln 2>/dev/null | grep ":${port} " | awk '{print $1}' | head -1)
            local address=$(ss -tuln 2>/dev/null | grep ":${port} " | awk '{print $5}' | head -1)

            DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 포트 $port/$protocol 리스닝 중 ($address)\"}")
        fi
    done

    if [ $listening_found -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 포트 리스닝 없음\"}")
    else
        ((TOTAL_CHECKED++))
        ((ACTIVE_SERVICES++))
        IS_VULN=1
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="NFS 서비스 및 관련 설정 없음"
        # DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 관련 서비스가 설치되지 않았습니다.\"}")
    elif [ $ACTIVE_SERVICES -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 항목 모두 비활성화"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 중 활성화 ${ACTIVE_SERVICES}개, 비활성화 ${INACTIVE_SERVICES}개"
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

###############################################################################
# U-40
# 설명: NFS 접근 제어 설정 파일의 권한 및 보안 옵션(와일드카드, root_squash) 점검
###############################################################################
function U-40() {

    local CHECK_ID="U-40"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="NFS 접근 통제"
    local EXPECTED_VALUE="NFS 서비스 미사용 또는 /etc/exports 파일의 권한 적절 및 접근 제한(와일드카드 금지, root_squash 설정) 준수"

    local STATUS="SAFE"
    local CURRENT_VALUE="NFS 접근 통제 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local NFS_CONF="/etc/exports"
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. NFS 서비스 실행 여부 확인
    local NFS_RUNNING=0
    if ps -ef | grep -E "nfsd|nfs-server|rpc.nfsd" | grep -v grep > /dev/null; then
        NFS_RUNNING=1
    fi

    if [ $NFS_RUNNING -eq 1 ]; then
        # 2. 설정 파일(/etc/exports) 존재 및 권한 점검
        if [ -f "$NFS_CONF" ]; then
            local FILE_OWNER=$(stat -c '%U' "$NFS_CONF")
            local FILE_PERM=$(stat -c '%a' "$NFS_CONF")

            # 소유자 root 및 권한 644 이하 검사
            if [ "$FILE_OWNER" != "root" ] || [ "$FILE_PERM" -gt 644 ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $NFS_CONF 파일의 소유자 또는 권한이 부적절합니다. (조치: chown root:644)\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 설정 파일 권한 및 소유자 설정이 적절합니다.\"}")
            fi

            # 3. 설정 내용 상세 점검
            if [ -s "$NFS_CONF" ]; then
                
                # 3-1. 와일드카드(*) 점검 (모든 사용자 허용)
                if grep -vE "^\s*#" "$NFS_CONF" | grep -q "\*"; then
                    IS_VULN=1
                    local wildcard_lines=$(grep -vE "^\s*#" "$NFS_CONF" | grep "\*" | head -10 | sed 's/\"/\\\\\"/g')
                    DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 공유 설정에 와일드카드(*)가 포함되어 전역 접근이 허용됨\",\"점검명령어\":\"grep -vE '^\\\\s*#' $NFS_CONF | grep '\\*'\",\"전체내용\":\"$wildcard_lines\"}")
                fi

                # 3-2. no_root_squash 옵션 점검 (root 권한 탈취 위험)
                if grep -vE "^\s*#" "$NFS_CONF" | grep -q "no_root_squash"; then
                    IS_VULN=1
                    local nrs_lines=$(grep -vE "^\s*#" "$NFS_CONF" | grep "no_root_squash" | head -10 | sed 's/\"/\\\\\"/g')
                    DETAILS_ARRAY+=("{\"점검항목\":\"no_root_squash\",\"상태\":\"취약\",\"세부내용\":\"취약: 'no_root_squash' 옵션이 사용되어 root 권한 탈취 위험이 있음\",\"점검명령어\":\"grep -vE '^\\\\s*#' $NFS_CONF | grep 'no_root_squash'\",\"전체내용\":\"$nrs_lines\"}")
                fi

                # 3-3. 설정 파일 원본 요약 기록
                local exports_preview
                exports_preview=$(grep -vE "^\s*#" "$NFS_CONF" | head -10 | sed 's/\"/\\\\\"/g')
                if [ -n "$exports_preview" ]; then
                    DETAILS_ARRAY+=("{\"점검항목\":\"etc/exports\",\"상태\":\"양호\",\"세부내용\":\"정보: /etc/exports 유효 설정 요약\",\"점검명령어\":\"grep -vE '^\\\\s*#' $NFS_CONF\",\"전체내용\":\"$exports_preview\"}")
                fi
                
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"etc/exports\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/exports 파일이 비어 있어 공유 중인 자원이 없습니다.\",\"점검명령어\":\"ls -l $NFS_CONF; cat $NFS_CONF\",\"전체내용\":\"empty\"}")
            fi
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: NFS 서비스가 구동 중이나 설정 파일($NFS_CONF)이 존재하지 않습니다.\",\"점검명령어\":\"ps -ef | grep -E 'nfsd|nfs-server|rpc.nfsd' | grep -v grep; ls -l $NFS_CONF\",\"전체내용\":\"missing $NFS_CONF\"}")
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 서비스를 사용하고 있지 않습니다.\",\"점검명령어\":\"ps -ef | grep -E 'nfsd|nfs-server|rpc.nfsd' | grep -v grep\",\"전체내용\":\"not running\"}")
    fi

    # 4. 최종 결과 판단
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="NFS 설정 파일 권한 부적절 또는 보안 옵션(와일드카드/root_squash) 미흡"
    else
        if [ $NFS_RUNNING -eq 0 ]; then
            CURRENT_VALUE="NFS 서비스 미사용"
        fi
    fi
    
    
     if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # DETAILS_ARRAY를 JSON 배열 문자열로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출을 통한 결과 기록
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
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
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service ($description) - 실행 중 (Active=$active_status, Enabled=$enabled_status)\",\"점검명령어\":\"systemctl status $service\",\"전체내용\":\"$active_status,$enabled_status\"}")
                ((VULNERABLE_COUNT++))
                IS_VULN=1
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - 비활성화\",\"점검명령어\":\"systemctl is-active $service; systemctl is-enabled $service\",\"전체내용\":\"$active_status,$enabled_status\"}")
                ((SECURE_COUNT++))
            fi
        fi
    done

    if [ $service_found -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: automount 서비스 없음\",\"점검명령어\":\"systemctl list-unit-files 'autofs*' 'automount*' 2>/dev/null\",\"전체내용\":\"\"}")
    fi

    # [점검 2] automount 프로세스 확인
    local auto_procs=$(ps aux | grep -E 'automount|autofs' | grep -v grep)

    if [ -n "$auto_procs" ]; then
        ((TOTAL_CHECKED++))

        local proc_count=$(echo "$auto_procs" | wc -l)
        local escaped_procs=$(echo "$auto_procs" | head -10 | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: automount 프로세스 ${proc_count}개 실행 중\",\"점검명령어\":\"ps aux | grep -E 'automount|autofs' | grep -v grep\",\"전체내용\":\"$escaped_procs\"}")

        echo "$auto_procs" | while IFS= read -r proc; do
            local proc_name=$(echo "$proc" | awk '{print $11}')
            local proc_pid=$(echo "$proc" | awk '{print $2}')
        done

        ((VULNERABLE_COUNT++))
        IS_VULN=1
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: automount 프로세스 없음\",\"점검명령어\":\"ps aux | grep -E 'automount|autofs' | grep -v grep\",\"전체내용\":\"\"}")
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
                local preview=$(grep -v '^#' "$config_file" | grep -v '^$' | head -10 | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"$config_file\",\"상태\":\"취약\",\"세부내용\":\"취약:  $config_file - 설정 ${config_lines}줄 존재\",\"점검명령어\":\"grep -v '^#' $config_file | grep -v '^$'\",\"전체내용\":\"$preview\"}")
                ##DETAILS_ARRAY+=("\"주의: $config_file - 설정 ${config_lines}줄 존재\"")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$config_file\",\"상태\":\"양호\",\"세부내용\":\"양호: $config_file - 설정 없음\",\"점검명령어\":\"grep -v '^#' $config_file | grep -v '^$'\",\"전체내용\":\"\"}")
            fi
        fi
    done

    # auto.* 패턴 파일 추가 검색
    local auto_files=$(find /etc -maxdepth 1 -name 'auto.*' -o -name 'auto_*' 2>/dev/null)

    if [ -n "$auto_files" ]; then
        local file_count=$(echo "$auto_files" | wc -l)
    fi

    if [ $config_found -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: automount 설정 파일 없음\",\"점검명령어\":\"ls /etc/auto.* /etc/auto_* 2>/dev/null\",\"전체내용\":\"\"}")
    fi

    # [점검 4] /etc/fstab autofs 설정 확인
    if [ ! -f /etc/fstab ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/fstab\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/fstab 파일 없음\",\"점검명령어\":\"ls -l /etc/fstab\",\"전체내용\":\"\"}")
    else
        local autofs_entries=$(grep -v '^#' /etc/fstab | grep 'autofs')

        if [ -n "$autofs_entries" ]; then
            ((TOTAL_CHECKED++))

            local entry_count=$(echo "$autofs_entries" | wc -l)
            local escaped_entries=$(echo "$autofs_entries" | head -10 | sed 's/\"/\\\\\"/g')
            #DETAILS_ARRAY+=("\"양호(주의): /etc/fstab에 autofs 설정 ${entry_count}개 발견\"")
            ## 이것도 위의 점검3과 동일하게 마찬가지임
            DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/fstab에 autofs 설정 ${entry_count}개 발견\",\"점검명령어\":\"grep -v '^#' /etc/fstab | grep 'autofs'\",\"전체내용\":\"$escaped_entries\"}")
        

            while IFS= read -r line; do
                :
            done <<< "$autofs_entries"
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/fstab에 autofs 설정 없음\",\"점검명령어\":\"grep -v '^#' /etc/fstab | grep 'autofs'\",\"전체내용\":\"\"}")
        fi
    fi

    # [점검 5] 현재 autofs 마운트 확인
    local autofs_mounts=$(mount | grep 'autofs')

    if [ -n "$autofs_mounts" ]; then
        ((TOTAL_CHECKED++))

        local mount_count=$(echo "$autofs_mounts" | wc -l)
        local escaped_mounts=$(echo "$autofs_mounts" | head -10 | sed 's/\"/\\\\\"/g')
        ## 이것도 위의 점검3,4랑 똑같음
        ## DETAILS_ARRAY+=("\"양호(주의): autofs 마운트 ${mount_count}개 발견\"")
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: autofs 마운트 ${mount_count}개 발견\",\"점검명령어\":\"mount | grep 'autofs'\",\"전체내용\":\"$escaped_mounts\"}")

        while IFS= read -r mount_line; do
            local mount_point=$(echo "$mount_line" | awk '{print $3}')
            ## DETAILS_ARRAY+=("\"  - $mount_point\"")
        done <<< "$autofs_mounts"
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"Automount 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: autofs 마운트 없음\",\"점검명령어\":\"mount | grep 'autofs'\",\"전체내용\":\"\"}")
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

#########################################################################################################################
# ----------------------------------------------------------
# 함수명: U-42
# 설명: 불필요한 RPC 서비스 비활성화 점검
# ----------------------------------------------------------
function U-42() {
    local CHECK_ID="U-42"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="불필요한 RPC 서비스 비활성화"
    local EXPECTED_VAL="rpc.cmsd, sadmind, rusersd, walld 등 취약한 RPC 서비스가 비활성화된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local VULNERABLE_COUNT=0
    local SECURE_COUNT=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 불필요한 RPC 서비스 목록 (취약점 존재)
    local VULNERABLE_RPC_SERVICES=(
        "rpc.cmsd:Calendar Manager (버퍼 오버플로우)"
        "rpc.ttdbserverd:ToolTalk Database Server (원격 실행)"
        "sadmind:Solstice AdminSuite Daemon (버퍼 오버플로우)"
        "rusersd:Remote Users Daemon (정보 노출)"
        "walld:Write All Daemon (DoS)"
        "sprayd:Spray Daemon (DoS)"
        "rstatd:Remote Status Daemon (정보 노출)"
        "rpc.nisd:NIS+ Daemon (인증 우회)"
        "rexd:Remote Execution Daemon (원격 실행)"
        "rpc.pcnfsd:PC-NFS Daemon (인증 우회)"
        "rpc.statd:Status Monitor Daemon (DoS)"
        "rpc.ypupdated:NIS Update Daemon (권한 상승)"
        "rpc.rquotad:Remote Quota Daemon (정보 노출)"
    )

    # [점검 1] 취약한 RPC 서비스 프로세스 확인
    local found_vulnerable=0

    for service_info in "${VULNERABLE_RPC_SERVICES[@]}"; do
        local service=$(echo "$service_info" | cut -d':' -f1)
        local description=$(echo "$service_info" | cut -d':' -f2)

        local proc=$(ps aux | grep "$service" | grep -v grep)

        if [ -n "$proc" ]; then
            ((TOTAL_CHECKED++))
            ((VULNERABLE_COUNT++))
            found_vulnerable=1
            IS_VULN=1

            local proc_pid=$(echo "$proc" | awk '{print $2}')
            local proc_user=$(echo "$proc" | awk '{print $1}')
            local escaped_proc=$(echo "$proc" | head -5 | sed 's/\"/\\\\\"/g')

            DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - 실행 중 (PID: $proc_pid, 사용자: $proc_user) - 위협: $description\",\"점검명령어\":\"ps aux | grep '$service' | grep -v grep\",\"전체내용\":\"$escaped_proc\"}")
        fi
    done

    if [ $found_vulnerable -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"RPC 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: 취약한 RPC 서비스 프로세스 없음\",\"점검명령어\":\"ps aux | grep -E 'rpc.cmsd|sadmind|rusersd|walld' | grep -v grep\",\"전체내용\":\"\"}")
    fi

    # [점검 2] rpcinfo 등록 취약 서비스 확인
    if ! command -v rpcinfo > /dev/null 2>&1; then
        DETAILS_ARRAY+=("{\"점검항목\":\"RPC 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: rpcinfo 명령어 없음\",\"점검명령어\":\"command -v rpcinfo\",\"전체내용\":\"not installed\"}")
    elif ! systemctl is-active rpcbind > /dev/null 2>&1 && ! pgrep rpcbind > /dev/null 2>&1; then
        DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: rpcbind 비활성화\",\"점검명령어\":\"systemctl is-active rpcbind || pgrep rpcbind\",\"전체내용\":\"inactive\"}")
    else
        local rpc_list=$(rpcinfo -p 2>/dev/null)

            if [ -z "$rpc_list" ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"RPC 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: 등록된 RPC 서비스 없음\",\"점검명령어\":\"rpcinfo -p\",\"전체내용\":\"\"}")
        else
            found_vulnerable=0

            for service_info in "${VULNERABLE_RPC_SERVICES[@]}"; do
                local service=$(echo "$service_info" | cut -d':' -f1)
                local description=$(echo "$service_info" | cut -d':' -f2)
                local service_name=$(echo "$service" | sed 's/rpc\.//')

                    if echo "$rpc_list" | grep -qi "$service_name"; then
                        ((TOTAL_CHECKED++))
                        ((VULNERABLE_COUNT++))
                        found_vulnerable=1
                        IS_VULN=1

                        local escaped_list=$(echo "$rpc_list" | grep -i "$service_name" | head -5 | sed 's/\"/\\\\\"/g')
                        DETAILS_ARRAY+=("{\"점검항목\":\"RPC 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - RPC 등록됨 - 위협: $description\",\"점검명령어\":\"rpcinfo -p | grep '$service_name'\",\"전체내용\":\"$escaped_list\"}")
                    fi
            done

            if [ $found_vulnerable -eq 0 ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"RPC 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: 취약한 RPC 서비스 등록 없음\",\"점검명령어\":\"rpcinfo -p\",\"전체내용\":\"\"}")
            fi
        fi
    fi

    # [점검 3] xinetd/inetd RPC 서비스 설정 확인
    local found_config=0

    # xinetd.d 디렉토리 확인
    if [ -d /etc/xinetd.d ]; then
        for service_info in "${VULNERABLE_RPC_SERVICES[@]}"; do
            local service=$(echo "$service_info" | cut -d':' -f1)
            local description=$(echo "$service_info" | cut -d':' -f2)
            local config_file="/etc/xinetd.d/$service"

            if [ -f "$config_file" ]; then
                ((TOTAL_CHECKED++))
                found_config=1

                local disable_status=$(grep -i "disable" "$config_file" | grep -v "^#" | awk '{print $3}')
                local escaped_cfg=$(grep -vi "^#" "$config_file" 2>/dev/null | head -10 | sed 's/\"/\\\\\"/g')

                if [ "$disable_status" = "no" ]; then
                    ((VULNERABLE_COUNT++))
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - xinetd 활성화 - 위협: $description\",\"점검명령어\":\"grep -i 'disable' $config_file | grep -v '^#'\",\"전체내용\":\"$escaped_cfg\"}")
                else
                    DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - xinetd 비활성화\",\"점검명령어\":\"grep -i 'disable' $config_file | grep -v '^#'\",\"전체내용\":\"$escaped_cfg\"}")
                fi
            fi
        done
    fi

    # inetd.conf 확인
    if [ -f /etc/inetd.conf ]; then
        for service_info in "${VULNERABLE_RPC_SERVICES[@]}"; do
            local service=$(echo "$service_info" | cut -d':' -f1)
            local description=$(echo "$service_info" | cut -d':' -f2)

            if grep "^[^#]*${service}" /etc/inetd.conf > /dev/null 2>&1; then
                ((TOTAL_CHECKED++))
                ((VULNERABLE_COUNT++))
                found_config=1
                IS_VULN=1

                local escaped_line=$(grep "^[^#]*${service}" /etc/inetd.conf 2>/dev/null | head -3 | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - inetd.conf 활성화 - 위협: $description\",\"점검명령어\":\"grep '^[^#]*${service}' /etc/inetd.conf\",\"전체내용\":\"$escaped_line\"}")
            fi
        done
    fi

    if [ $found_config -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: xinetd/inetd 설정에 취약 서비스 없음\",\"점검명령어\":\"ls /etc/xinetd.d 2>/dev/null; grep -v '^#' /etc/inetd.conf 2>/dev/null\",\"전체내용\":\"\"}")
    fi

    # [점검 4] systemd RPC 서비스 확인
    local found_service=0

    for service_info in "${VULNERABLE_RPC_SERVICES[@]}"; do
        local service=$(echo "$service_info" | cut -d':' -f1)
        local description=$(echo "$service_info" | cut -d':' -f2)

        if systemctl list-unit-files "$service" 2>/dev/null | grep -q "$service"; then
            ((TOTAL_CHECKED++))
            found_service=1

            local active_status=$(systemctl is-active "$service" 2>/dev/null)

            if [ "$active_status" = "active" ]; then
                ((VULNERABLE_COUNT++))
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - systemd 실행 중 - 위협: $description\",\"점검명령어\":\"systemctl status $service\",\"전체내용\":\"$active_status\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - systemd 비활성화\",\"점검명령어\":\"systemctl is-active $service\",\"전체내용\":\"$active_status\"}")
            fi
        fi
    done

    if [ $found_service -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"RPC 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: systemd에 취약 RPC 서비스 없음\",\"점검명령어\":\"systemctl list-unit-files | grep -E 'rpc.cmsd|sadmind|rusersd|walld'\",\"전체내용\":\"\"}")
    fi

    # [점검 5] rpcbind 서비스 상태 확인
    ((TOTAL_CHECKED++))

    if systemctl is-active rpcbind > /dev/null 2>&1 || pgrep rpcbind > /dev/null 2>&1; then
        :
        ## DETAILS_ARRAY+=("\"양호(주의): rpcbind - 실행 중 (RPC 서비스 사용 위해 필요하나 취약점 주의)\"")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: rpcbind - 비활성화\",\"점검명령어\":\"systemctl is-active rpcbind || pgrep rpcbind\",\"전체내용\":\"inactive\"}")
        ((SECURE_COUNT++))
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="RPC 관련 서비스 없음"
        ## DETAILS_ARRAY+=("\": RPC 관련 서비스가 설치되지 않았습니다.\"")
    elif [ $VULNERABLE_COUNT -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 항목 모두 안전"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 중 취약 ${VULNERABLE_COUNT}개, 안전 ${SECURE_COUNT}개"
    fi
    
    
    
    if [ $IS_VULN -eq 1 ]; then
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


#####################################################################################################################
# ----------------------------------------------------------
# 함수명: U-43
# 설명: NIS 서비스 비활성화 및 보안이 강화된 NIS+ 사용 여부 점검
# ----------------------------------------------------------
function U-43() {
    local CHECK_ID="U-43"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="NIS, NIS+ 점검"
    local EXPECTED_VAL="NIS 서비스가 비활성화되어 있거나, 보안이 강화된 NIS+를 사용하는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. NIS 관련 서비스 상태 점검 (ypserv, ypbind, yppasswdd, ypxfrd)
    local NIS_SVCS=("ypserv" "ypbind" "yppasswdd" "ypxfrd")
    local ACTIVE_SVCS=()

    for svc in "${NIS_SVCS[@]}"; do
        if systemctl is-active "$svc" > /dev/null 2>&1; then
            ACTIVE_SVCS+=("$svc")
            IS_VULN=1
        fi
    done

    if [ ${#ACTIVE_SVCS[@]} -gt 0 ]; then
        local active_joined="${ACTIVE_SVCS[*]}"
        DETAILS_ARRAY+=("{\"점검항목\":\"NIS 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: 활성화된 NIS 서비스 발견 - (${ACTIVE_SVCS[*]})\",\"점검명령어\":\"systemctl is-active ypserv ypbind yppasswdd ypxfrd\",\"전체내용\":\"$active_joined\"}")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NIS 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: NIS 관련 systemd 서비스가 비활성화 상태입니다.\",\"점검명령어\":\"systemctl is-active ypserv ypbind yppasswdd ypxfrd\",\"전체내용\":\"all inactive\"}")
    fi

    # 2. NIS 관련 프로세스 실행 여부 점검
    local NIS_PROCS=$(ps -ef | grep -E "ypserv|ypbind|yppasswdd|ypxfrd" | grep -v "grep")
    if [ -n "$NIS_PROCS" ]; then
        IS_VULN=1
        local escaped_nis_procs=$(echo "$NIS_PROCS" | head -10 | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"NIS 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: NIS 관련 프로세스가 현재 실행 중입니다.\",\"점검명령어\":\"ps -ef | grep -E 'ypserv|ypbind|yppasswdd|ypxfrd' | grep -v grep\",\"전체내용\":\"$escaped_nis_procs\"}")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NIS 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: 실행 중인 NIS 관련 프로세스가 없습니다.\",\"점검명령어\":\"ps -ef | grep -E 'ypserv|ypbind|yppasswdd|ypxfrd' | grep -v grep\",\"전체내용\":\"\"}")
    fi

    # 3. NIS 설정 파일 및 도메인 설정 확인
    # /etc/yp.conf (클라이언트 설정), /etc/defaultdomain 존재 여부
    if [ -f "/etc/yp.conf" ] && [ -s "/etc/yp.conf" ]; then
        # 주석 제외 실질적 설정 내용 확인
        if grep -v '^#' /etc/yp.conf | grep -q '[^[:space:]]'; then
            IS_VULN=1
            local yp_preview=$(grep -v '^#' /etc/yp.conf | head -10 | sed 's/\"/\\\\\"/g')
            DETAILS_ARRAY+=("{\"점검항목\":\"NIS 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/yp.conf 파일에 NIS 설정 내용이 존재합니다.\",\"점검명령어\":\"grep -v '^#' /etc/yp.conf\",\"전체내용\":\"$yp_preview\"}")
        fi
    fi

    if [ -f "/etc/defaultdomain" ]; then
        IS_VULN=1
        local dd_val=$(cat /etc/defaultdomain 2>/dev/null | tr '\n' ' ' | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"NIS 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/defaultdomain 파일이 존재하여 NIS 도메인이 설정되어 있을 가능성이 있습니다.\",\"점검명령어\":\"cat /etc/defaultdomain\",\"전체내용\":\"$dd_val\"}")
    fi

    # 4. NIS 맵 파일 디렉토리 확인 (/var/yp)
    if [ -d "/var/yp" ]; then
        local map_files=$(find /var/yp -type f 2>/dev/null | wc -l)
        if [ "$map_files" -gt 0 ]; then
           :
           ## DETAILS_ARRAY+=("\"주의: /var/yp 디렉토리에 $map_files 개의 NIS 맵 파일이 존재합니다. 미사용 시 삭제 권고.\"")
        fi
    fi

    # 5. NIS+ 사용 여부 확인 (NIS+는 현대 리눅스에서 거의 사용되지 않지만 예외 처리)
    local NISPLUS_PROCS=$(ps -ef | grep -E "rpc.nisd|nis_cachemgr" | grep -v "grep")
    if [ -n "$NISPLUS_PROCS" ]; then
        :
        # NIS+가 동작 중이면 NIS 취약 판정을 상쇄하거나 정보를 남김
        ## DETAILS_ARRAY+=("\"양호(주의): 보안이 강화된 NIS+ 서비스/프로세스가 감지되었습니다.\"")
        # NIS가 활성화되어 있지 않다면 SAFE로 유지, NIS도 활성화면 여전히 VULNERABLE
    fi

    # 최종 상태 결정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="NIS 서비스가 활성화되어 있거나 설정 파일이 존재함"
    else
        STATUS="SAFE"
        CURRENT_VAL="NIS 서비스가 비활성화되어 있으며 관련 프로세스가 없음"
    fi
    
    
     if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출하여 최종 출력
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}


######################################################################################################################
# ----------------------------------------------------------
# 함수명: U-44
# 설명: tftp, talk, ntalk 서비스 비활성화 점검
# ----------------------------------------------------------
function U-44() {
    local CHECK_ID="U-44"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="tftp, talk, 서비스 비활성화"
    local EXPECTED_VAL="tftp, talk, ntalk 서비스가 비활성화된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local VULNERABLE_COUNT=0
    local SECURE_COUNT=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # OS 감지
    local os_type=""
    if [ -f /etc/redhat-release ]; then
        os_type="rocky"
    elif [ -f /etc/lsb-release ] || [ -f /etc/debian_version ]; then
        os_type="ubuntu"
    else
        os_type="unknown"
    fi

    # TFTP 관련 서비스
    local TFTP_SERVICES_ROCKY=(
        "tftp.socket:TFTP 소켓"
        "tftp.service:TFTP 서비스"
        "tftp-server:TFTP 서버"
    )

    local TFTP_SERVICES_UBUNTU=(
        "tftpd-hpa:TFTP 서버 (HPA)"
        "atftpd:Advanced TFTP 서버"
        "tftp:TFTP 서비스"
    )

    # Talk 관련 서비스
    local TALK_SERVICES=(
        "talk:Talk 서비스"
        "ntalk:New Talk 서비스"
        "talkd:Talk 데몬"
    )

    # [점검 1] TFTP systemd 서비스 확인
    local services_to_check=()
    if [ "$os_type" = "rocky" ]; then
        services_to_check=("${TFTP_SERVICES_ROCKY[@]}")
    elif [ "$os_type" = "ubuntu" ]; then
        services_to_check=("${TFTP_SERVICES_UBUNTU[@]}")
    else
        services_to_check=("${TFTP_SERVICES_ROCKY[@]}" "${TFTP_SERVICES_UBUNTU[@]}")
    fi

    local tftp_found=0

    for service_info in "${services_to_check[@]}"; do
        local service=$(echo "$service_info" | cut -d':' -f1)
        local description=$(echo "$service_info" | cut -d':' -f2)

        if systemctl list-unit-files "$service" 2>/dev/null | grep -q "$service"; then
            ((TOTAL_CHECKED++))
            tftp_found=1

            local active_status=$(systemctl is-active "$service" 2>/dev/null)
            local enabled_status=$(systemctl is-enabled "$service" 2>/dev/null)

            if [ "$active_status" = "active" ]; then
                ((VULNERABLE_COUNT++))
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service ($description) - 실행 중 (Active=$active_status, Enabled=$enabled_status)\",\"점검명령어\":\"systemctl status $service\",\"전체내용\":\"$active_status,$enabled_status\"}")
            else
                ((SECURE_COUNT++))
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - 비활성화\",\"점검명령어\":\"systemctl is-active $service; systemctl is-enabled $service\",\"전체내용\":\"$active_status,$enabled_status\"}")
            fi
        fi
    done

    if [ $tftp_found -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: TFTP systemd 서비스 없음\",\"점검명령어\":\"systemctl list-unit-files | grep -i 'tftp'\",\"전체내용\":\"\"}")
    fi

    # [점검 2] Talk/ntalk systemd 서비스 확인
    local talk_found=0

    for service_info in "${TALK_SERVICES[@]}"; do
        local service=$(echo "$service_info" | cut -d':' -f1)
        local description=$(echo "$service_info" | cut -d':' -f2)

        if systemctl list-unit-files "$service" 2>/dev/null | grep -q "$service"; then
            ((TOTAL_CHECKED++))
            talk_found=1

            local active_status=$(systemctl is-active "$service" 2>/dev/null)
            local enabled_status=$(systemctl is-enabled "$service" 2>/dev/null)

            if [ "$active_status" = "active" ]; then
                ((VULNERABLE_COUNT++))
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service ($description) - 실행 중 (Active=$active_status, Enabled=$enabled_status)\",\"점검명령어\":\"systemctl status $service\",\"전체내용\":\"$active_status,$enabled_status\"}")
            else
                ((SECURE_COUNT++))
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - 비활성화\",\"점검명령어\":\"systemctl is-active $service; systemctl is-enabled $service\",\"전체내용\":\"$active_status,$enabled_status\"}")
            fi
        fi
    done

    if [ $talk_found -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"Talk/ntalk\",\"상태\":\"양호\",\"세부내용\":\"양호: Talk/ntalk systemd 서비스 없음\",\"점검명령어\":\"systemctl list-unit-files | grep -i 'talk'\",\"전체내용\":\"\"}")
    fi

    # [점검 3] TFTP 프로세스 확인
    local tftp_procs=$(ps aux | grep -E 'tftpd|tftp-server|in.tftpd' | grep -v grep)

    if [ -n "$tftp_procs" ]; then
        ((TOTAL_CHECKED++))
        ((VULNERABLE_COUNT++))
        IS_VULN=1

        local proc_count=$(echo "$tftp_procs" | wc -l)
        local escaped_tftp=$(echo "$tftp_procs" | head -10 | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: TFTP 프로세스 ${proc_count}개 실행 중\",\"점검명령어\":\"ps aux | grep -E 'tftpd|tftp-server|in.tftpd' | grep -v grep\",\"전체내용\":\"$escaped_tftp\"}")

        echo "$tftp_procs" | while IFS= read -r proc; do
            local proc_pid=$(echo "$proc" | awk '{print $2}')
            local proc_name=$(echo "$proc" | awk '{print $11}')
        done
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: TFTP 프로세스 없음\",\"점검명령어\":\"ps aux | grep -E 'tftpd|tftp-server|in.tftpd' | grep -v grep\",\"전체내용\":\"\"}")
    fi

    # [점검 4] Talk 프로세스 확인
    local talk_procs=$(ps aux | grep -E 'talkd|ntalkd|in.talkd|in.ntalkd' | grep -v grep)

    if [ -n "$talk_procs" ]; then
        ((TOTAL_CHECKED++))
        ((VULNERABLE_COUNT++))
        IS_VULN=1

        local proc_count=$(echo "$talk_procs" | wc -l)
        local escaped_talk=$(echo "$talk_procs" | head -10 | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"Talk/ntalk\",\"상태\":\"취약\",\"세부내용\":\"취약: Talk/ntalk 프로세스 ${proc_count}개 실행 중\",\"점검명령어\":\"ps aux | grep -E 'talkd|ntalkd|in.talkd|in.ntalkd' | grep -v grep\",\"전체내용\":\"$escaped_talk\"}")

        echo "$talk_procs" | while IFS= read -r proc; do
            local proc_pid=$(echo "$proc" | awk '{print $2}')
            local proc_name=$(echo "$proc" | awk '{print $11}')
        done
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"Talk/ntalk\",\"상태\":\"양호\",\"세부내용\":\"양호: Talk/ntalk 프로세스 없음\",\"점검명령어\":\"ps aux | grep -E 'talkd|ntalkd|in.talkd|in.ntalkd' | grep -v grep\",\"전체내용\":\"\"}")
    fi

    # [점검 5] xinetd 설정 확인
    if [ ! -d /etc/xinetd.d ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: xinetd 미설치\",\"점검명령어\":\"ls -ld /etc/xinetd.d 2>/dev/null\",\"전체내용\":\"\"}")
    else
        local services=("tftp" "talk" "ntalk")
        local found_config=0

        for service in "${services[@]}"; do
            if [ -f "/etc/xinetd.d/$service" ]; then
                ((TOTAL_CHECKED++))
                found_config=1

                local disable_status=$(grep -i "disable" "/etc/xinetd.d/$service" | grep -v "^#" | awk '{print $3}')
                local escaped_cfg=$(grep -vi "^#" "/etc/xinetd.d/$service" 2>/dev/null | head -10 | sed 's/\"/\\\\\"/g')

                if [ "$disable_status" = "no" ]; then
                    ((VULNERABLE_COUNT++))
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - xinetd 활성화 (disable = no)\",\"점검명령어\":\"grep -i 'disable' /etc/xinetd.d/$service | grep -v '^#'\",\"전체내용\":\"$escaped_cfg\"}")
                else
                    ((SECURE_COUNT++))
                    DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - xinetd 비활성화\",\"점검명령어\":\"grep -i 'disable' /etc/xinetd.d/$service | grep -v '^#'\",\"전체내용\":\"$escaped_cfg\"}")
                fi
            fi
        done

        if [ $found_config -eq 0 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: xinetd에 tftp/talk 설정 없음\",\"점검명령어\":\"ls /etc/xinetd.d 2>/dev/null | grep -E 'tftp|talk'\",\"전체내용\":\"\"}")
        fi
    fi

    # [점검 6] 포트 리스닝 확인
    local ports=("69:TFTP" "517:Talk" "518:ntalk")
    local found_listening=0

    for port_info in "${ports[@]}"; do
        local port=$(echo "$port_info" | cut -d':' -f1)
        local service=$(echo "$port_info" | cut -d':' -f2)

        if ss -tuln 2>/dev/null | grep -q ":${port} "; then
            ((TOTAL_CHECKED++))
            ((VULNERABLE_COUNT++))
            found_listening=1
            IS_VULN=1

            local protocol=$(ss -tuln 2>/dev/null | grep ":${port} " | awk '{print $1}' | head -1)
            local address=$(ss -tuln 2>/dev/null | grep ":${port} " | awk '{print $5}' | head -1)

            DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 포트 $port/$protocol - $service 리스닝 중 ($address)\",\"점검명령어\":\"ss -tuln | grep ':${port} '\",\"전체내용\":\"$protocol $address\"}")
        fi
    done

    if [ $found_listening -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: TFTP/Talk 포트 리스닝 없음\",\"점검명령어\":\"ss -tuln\",\"전체내용\":\"\"}")
    fi

    # [점검 7] 패키지 설치 여부 확인
    local packages=()
    if [ "$os_type" = "rocky" ]; then
        packages=("tftp-server" "tftp" "talk" "talk-server")
    elif [ "$os_type" = "ubuntu" ]; then
        packages=("tftpd-hpa" "atftpd" "tftp" "talk" "talkd")
    fi

    for pkg in "${packages[@]}"; do
        local installed=""

        if [ "$os_type" = "rocky" ]; then
            installed=$(rpm -qa | grep "^${pkg}-")
        elif [ "$os_type" = "ubuntu" ]; then
            installed=$(dpkg -l | grep "^ii" | grep "$pkg" | awk '{print $2}')
        fi

        if [ -n "$installed" ]; then
           :
           ## DETAILS_ARRAY+=("\"양호(주의): $pkg 패키지 설치됨\"")
        fi
    done

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="tftp/talk/ntalk 관련 서비스 및 설정 없음"
        ## DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: tftp/talk/ntalk 관련 항목이 없습니다.\"}")
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


########################################################################################################################
# ----------------------------------------------------------
# 함수명: U-45
# 설명: 메일 서비스(Sendmail, Postfix, Exim, Dovecot) 버전 및 취약점 점검
# ----------------------------------------------------------
function U-45() {
    local CHECK_ID="U-45"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="메일 서비스 버전 점검"
    local EXPECTED_VAL="메일 서비스를 사용하지 않거나, 사용 시 취약점이 없는 최신 버전 패치가 적용된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local WARNING_FLAG=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 알려진 취약한 버전 목록 (가이드 기준 예시)
    declare -A VULN_VERSIONS=(
        ["sendmail"]="8.14.4 8.14.5 8.14.7"
        ["postfix"]="2.10 2.11 3.1"
        ["exim"]="4.87 4.88 4.89 4.90 4.91 4.92 4.93"
        ["dovecot"]="2.2.0 2.2.1 2.2.2"
    )

    # 점검 대상 메일 서비스 및 실행/버전 확인 로직
    local SERVICES=("sendmail" "postfix" "exim" "exim4" "dovecot")
    local ACTIVE_MAIL_COUNT=0

    for svc in "${SERVICES[@]}"; do
        # 1. 서비스 설치 여부 및 상태 확인
        if systemctl list-unit-files "$svc" 2>/dev/null | grep -q "$svc"; then
            local active_status=$(systemctl is-active "$svc" 2>/dev/null)

            if [ "$active_status" = "active" ]; then
                ((ACTIVE_MAIL_COUNT++))
                local version="unknown"

                # 2. 서비스별 버전 추출
                case $svc in
                    "sendmail")
                        version=$(sendmail -d0.1 -bv root 2>&1 | grep "Version" | head -1 | awk '{print $2}')
                        ;;
                    "postfix")
                        version=$(postconf -d 2>/dev/null | grep "^mail_version" | awk '{print $3}')
                        ;;
                    "exim"|"exim4")
                        version=$($svc -bV 2>/dev/null | head -1 | awk '{print $3}')
                        ;;
                    "dovecot")
                        version=$(dovecot --version 2>/dev/null | awk '{print $1}')
                        ;;
                esac

                # 3. 취약 버전 비교 및 결과 기록
                if [ "$version" != "unknown" ] && [ -n "$version" ]; then
                    local is_svc_vuln=0
                    for v_ver in ${VULN_VERSIONS[$svc]}; do
                        if [[ "$version" == "$v_ver"* ]]; then
                            is_svc_vuln=1
                            break
                        fi
                    done

                    if [ $is_svc_vuln -eq 1 ]; then
                        IS_VULN=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"$svc\",\"상태\":\"취약\",\"세부내용\":\"취약: $svc 실행 중 - 취약 버전 발견 ($version)\",\"점검명령어\":\"systemctl status $svc; $svc --version (또는 대응 명령)\",\"전체내용\":\"$version\"}")
                    else
                        WARNING_FLAG=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"$svc\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): $svc 실행 중 - 현재 버전($version) 최신 패치 여부 확인 필요\",\"점검명령어\":\"systemctl status $svc; 버전 확인 명령\",\"전체내용\":\"$version\"}")
                        ## DETAILS_ARRAY+=("\"양호(주의): $svc 실행 중 - 현재 버전($version) 최신 패치 여부 확인 필요\"")
                    fi
                else
                    WARNING_FLAG=1
                    ## DETAILS_ARRAY+=("\"양호(주의): $svc 실행 중 - 버전 정보를 확인할 수 없음\"")
                    DETAILS_ARRAY+=("{\"점검항목\":\"$svc\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): $svc 실행 중 - 버전 정보를 확인할 수 없음\",\"점검명령어\":\"systemctl status $svc; 버전 확인 명령\",\"전체내용\":\"unknown\"}")
                fi
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$svc\",\"상태\":\"양호\",\"세부내용\":\"양호: $svc 서비스 설치되어 있으나 비활성 상태\",\"점검명령어\":\"systemctl is-active $svc\",\"전체내용\":\"inactive\"}")
            fi
        fi
    done

    # 4. 리스닝 포트 추가 확인 (SMTP, IMAP, POP3)
    local LISTEN_PORTS=$(ss -tuln 2>/dev/null | grep -E ":(25|465|587|110|995|143|993) " | awk '{print $5}' | tr '\n' ' ')
    if [ -n "$LISTEN_PORTS" ]; then
        :
        #DETAILS_ARRAY+=("\"정보: 리스닝 중인 메일 관련 포트 - $LISTEN_PORTS\"")
    fi

    # 최종 상태 및 현재 값 설정
    if [ $ACTIVE_MAIL_COUNT -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="활성화된 메일 서비스 없음"
        DETAILS_ARRAY+=("{\"점검항목\":\"메일 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: 설치된 메일 서비스가 없습니다.\",\"점검명령어\":\"systemctl list-unit-files | grep -E 'sendmail|postfix|exim|dovecot'\",\"전체내용\":\"\"}")
    elif [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="취약한 버전의 메일 서비스 실행 중"
    elif [ $WARNING_FLAG -eq 1 ]; then
        STATUS="SAFE"
        CURRENT_VAL="메일 서비스 실행 중 (버전 업데이트 확인 권고)"
    else
        STATUS="SAFE"
        CURRENT_VAL="메일 서비스 실행 중이나 알려진 취약 버전 아님"
    fi
    
    
     if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # 배열을 JSON 형식으로 변환 (빈 배열 방지)
    local DETAILS_JSON="[]"
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}

###########################################################################################################################
#################################################
#  U-46
#################################################
function U-46() {
    local CHECK_ID="U-46"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="일반 사용자의 메일 서비스 실행 방지"
    local EXPECTED_VAL="Sendmail restrictqrun 옵션 설정 또는 SMTP 제어 명령어(postsuper, exiqgrep 등)의 일반 사용자 실행 권한 제한"
    
    local STATUS="SAFE"
    local CURRENT_VAL="메일 서비스 실행 권한 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local SMTP_FOUND=0

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. Sendmail 점검
    if ps -ef | grep "sendmail" | grep -v "grep" > /dev/null || [ -f "/etc/mail/sendmail.cf" ]; then
        SMTP_FOUND=1
        local CONF_FILE="/etc/mail/sendmail.cf"
        
        if [ -f "$CONF_FILE" ]; then
            # PrivacyOptions 내 restrictqrun 옵션 포함 여부 확인
            if grep -v '^ *#' "$CONF_FILE" | grep -i "PrivacyOptions" | grep -q "restrictqrun"; then
                local escaped_priv=$(grep -v '^ *#' "$CONF_FILE" | grep -i "PrivacyOptions" | head -5 | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"PrivacyOptions에\",\"상태\":\"양호\",\"세부내용\":\"양호: PrivacyOptions에 restrictqrun 옵션이 설정되어 있습니다.\",\"점검명령어\":\"grep -i 'PrivacyOptions' $CONF_FILE | grep -v '^ *#'\",\"전체내용\":\"$escaped_priv\"}")
            else
                IS_VULN=1
                local escaped_priv_all=$(grep -i 'PrivacyOptions' "$CONF_FILE" 2>/dev/null | head -5 | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"restrictqrun\",\"상태\":\"취약\",\"세부내용\":\"취약: restrictqrun 옵션이 설정되어 있지 않습니다.\",\"점검명령어\":\"grep -i 'PrivacyOptions' $CONF_FILE\",\"전체내용\":\"$escaped_priv_all\"}")
            fi
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: [Sendmail] 서비스 감지되었으나 설정파일($CONF_FILE)이 없습니다.\",\"점검명령어\":\"ls -l $CONF_FILE\",\"전체내용\":\"missing\"}")
        fi
    fi

    # 2. Postfix 점검
    if [ -f "/usr/sbin/postsuper" ]; then
        SMTP_FOUND=1
        local POST_FILE="/usr/sbin/postsuper"
        # Other 실행 권한(x) 확인
        local PERM_OTHER=$(ls -l "$POST_FILE" | awk '{print $1}' | cut -c 10)
        local ls_line_post=$(ls -l "$POST_FILE" 2>/dev/null | sed 's/\"/\\\\\"/g')

        if [ "$PERM_OTHER" == "x" ]; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"$POST_FILE\",\"상태\":\"취약\",\"세부내용\":\"취약: $POST_FILE 파일에 일반 사용자 실행 권한이 부여되어 있습니다.\",\"점검명령어\":\"ls -l $POST_FILE\",\"전체내용\":\"$ls_line_post\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"$POST_FILE\",\"상태\":\"양호\",\"세부내용\":\"양호: $POST_FILE 파일의 일반 사용자 실행 권한이 제한되어 있습니다.\",\"점검명령어\":\"ls -l $POST_FILE\",\"전체내용\":\"$ls_line_post\"}")
        fi
    fi

    # 3. Exim 점검
    if [ -f "/usr/sbin/exiqgrep" ]; then
        SMTP_FOUND=1
        local EXIM_FILE="/usr/sbin/exiqgrep"
        local PERM_OTHER=$(ls -l "$EXIM_FILE" | awk '{print $1}' | cut -c 10)
        local ls_line_exim=$(ls -l "$EXIM_FILE" 2>/dev/null | sed 's/\"/\\\\\"/g')

        if [ "$PERM_OTHER" == "x" ]; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $EXIM_FILE 파일에 일반 사용자 실행 권한이 부여되어 있습니다.\",\"점검명령어\":\"ls -l $EXIM_FILE\",\"전체내용\":\"$ls_line_exim\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $EXIM_FILE 파일의 일반 사용자 실행 권한이 제한되어 있습니다.\",\"점검명령어\":\"ls -l $EXIM_FILE\",\"전체내용\":\"$ls_line_exim\"}")
        fi
    fi

    # 4. 결과 종합 처리
    if [ $SMTP_FOUND -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 시스템에서 주요 SMTP 서비스(Sendmail, Postfix, Exim)가 발견되지 않았습니다.\",\"점검명령어\":\"ps -ef | grep -E 'sendmail|postfix|exim' | grep -v grep\",\"전체내용\":\"\"}")
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    else 
        STATUS="VULNERABLE"
        CURRENT_VAL="일부 메일 서비스 제어 권한 미흡"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}

##################################################################################################################33
# ----------------------------------------------------------
# 함수명: U-47
# 설명: SMTP 서비스(Sendmail, Postfix)의 릴레이 제한 설정 점검
# ----------------------------------------------------------
function U-47() {
    local CHECK_ID="U-47"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="스팸 메일 릴레이 제한"
    local EXPECTED_VAL="SMTP 서비스를 사용하지 않거나, 릴레이 제한(허용 목록 외 차단)이 설정된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. Sendmail 점검
    if systemctl is-active sendmail > /dev/null 2>&1 || pgrep sendmail > /dev/null 2>&1; then
        local sendmail_cf="/etc/mail/sendmail.cf"
        if [ -f "$sendmail_cf" ]; then
            # R$* 릴레이 규칙 및 PrivacyOptions 확인
            local privacy_opt=$(grep "^O PrivacyOptions" "$sendmail_cf")
            if [[ ! "$privacy_opt" =~ "goaway" && ! "$privacy_opt" =~ "restrictmailq" ]]; then
                # PrivacyOptions가 부실하더라도 access 파일이 중요함
                local escaped_priv=$(echo "$privacy_opt" | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): Sendmail 실행 중 - PrivacyOptions 설정이 권장사항보다 느슨함\",\"점검명령어\":\"grep '^O PrivacyOptions' $sendmail_cf\",\"전체내용\":\"$escaped_priv\"}")
                ## DETAILS_ARRAY+=("\"양호(주의): Sendmail 실행 중 - PrivacyOptions 설정이 권장사항보다 느슨함\"")
            fi

            # relay-domains 파일 존재 및 내용 확인 (도메인이 등록되어 있으면 릴레이 허용임)
            if [ -f "/etc/mail/relay-domains" ] && [ -s "/etc/mail/relay-domains" ]; then
                IS_VULN=1
                local relay_preview
                relay_preview=$(head -10 /etc/mail/relay-domains 2>/dev/null | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Sendmail - /etc/mail/relay-domains에 허용 도메인이 설정되어 있음\",\"점검명령어\":\"cat /etc/mail/relay-domains\",\"전체내용\":\"$relay_preview\"}")
            fi
        else
            ## DETAILS_ARRAY+=("\"양호(주의): Sendmail 실행 중이나 설정파일(/etc/mail/sendmail.cf)을 찾을 수 없음\"")
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): Sendmail 실행 중이나 설정파일(/etc/mail/sendmail.cf)을 찾을 수 없음\",\"점검명령어\":\"ls -l $sendmail_cf\",\"전체내용\":\"missing\"}")
        fi
    fi

    # 2. Postfix 점검 (현대 리눅스 표준)
    if systemctl is-active postfix > /dev/null 2>&1 || pgrep master > /dev/null 2>&1; then
        if command -v postconf > /dev/null 2>&1; then
            # smtpd_recipient_restrictions 내 reject_unauth_destination 존재 여부 확인
            local recipient_restrictions=$(postconf smtpd_recipient_restrictions 2>/dev/null)
            if [[ ! "$recipient_restrictions" =~ "reject_unauth_destination" ]]; then
 
               IS_VULN=1
                local escaped_rec=$(echo "$recipient_restrictions" | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Postfix - smtpd_recipient_restrictions에 reject_unauth_destination 설정 누락\",\"점검명령어\":\"postconf smtpd_recipient_restrictions\",\"전체내용\":\"$escaped_rec\"}")
            fi

            # mynetworks에 모든 대역(0.0.0.0/0)이 포함되어 있는지 확인
            local mynetworks=$(postconf mynetworks 2>/dev/null)
            if [[ "$mynetworks" =~ "0.0.0.0/0" ]]; then
                IS_VULN=1
                local escaped_nw=$(echo "$mynetworks" | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Postfix - mynetworks에 모든 대역(0.0.0.0/0) 릴레이 허용 설정 발견\",\"점검명령어\":\"postconf mynetworks\",\"전체내용\":\"$escaped_nw\"}")
            fi
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): Postfix 실행 중이나 postconf 명령어를 사용할 수 없음\",\"점검명령어\":\"postconf -h 2>/dev/null\",\"전체내용\":\"unavailable\"}")
            ## DETAILS_ARRAY+=("\"양호(주의): Postfix 실행 중이나 postconf 명령어를 사용할 수 없음\"")
        fi
    fi

    # 3. SMTP 포트 리스닝 확인 (서비스명과 별개로 포트가 열려있는지 확인)
    local smtp_listen=$(ss -tuln | grep -E ":25 |:465 |:587 ")
    if [ -n "$smtp_listen" ]; then
        local escaped_smtp=$(echo "$smtp_listen" | head -10 | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"정보: SMTP 관련 포트(25, 465, 587)가 현재 리스닝 상태입니다.\",\"점검명령어\":\"ss -tuln | grep -E ':25 |:465 |:587 '\",\"전체내용\":\"$escaped_smtp\"}")
        #DETAILS_ARRAY+=("\"정보: SMTP 관련 포트(25, 465, 587)가 현재 리스닝 상태입니다.\"")
    else
        # 서비스가 떠있지 않고 포트도 닫혀있다면 SAFE
        if [ $IS_VULN -eq 0 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SMTP 서비스가 비활성화되어 있거나 포트가 닫혀 있습니다.\",\"점검명령어\":\"ss -tuln | grep -E ':25 |:465 |:587 '\",\"전체내용\":\"\"}")
        fi
    fi

    # 최종 상태 결정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="SMTP 릴레이가 제한되지 않았거나 모든 대역에 대해 허용됨"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        # 서비스가 아예 없거나 설정이 양호한 경우
        STATUS="SAFE"
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
        if [ -z "$smtp_listen" ]; then
            CURRENT_VAL="SMTP 서비스 미사용"
        else
            CURRENT_VAL="SMTP 서비스 사용 중이나 릴레이 제한 설정이 적절함"
        fi
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}


##########################################################################################################################
# ----------------------------------------------------------
# 함수명: U-48
# 설명: SMTP의 EXPN, VRFY 명령어 비활성화 여부 점검
# ----------------------------------------------------------
function U-48() {
    local CHECK_ID="U-48"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="expn, vrfy 명령어 제한"
    local EXPECTED_VAL="SMTP 서비스를 사용하지 않거나, EXPN/VRFY 명령어가 차단된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. Sendmail 점검
    if systemctl is-active sendmail > /dev/null 2>&1 || pgrep sendmail > /dev/null 2>&1; then
        local sendmail_cf="/etc/mail/sendmail.cf"
        if [ -f "$sendmail_cf" ]; then
            local privacy_opt=$(grep "^O PrivacyOptions" "$sendmail_cf")

            # goaway(종합 제한) 또는 noexpn/novrfy 개별 존재 확인
            if [[ "$privacy_opt" =~ "goaway" ]]; then
                local escaped_priv=$(echo "$privacy_opt" | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Sendmail - goaway 옵션으로 모든 정보 노출 명령이 제한됨\",\"점검명령어\":\"grep '^O PrivacyOptions' $sendmail_cf\",\"전체내용\":\"$escaped_priv\"}")
            elif [[ "$privacy_opt" =~ "noexpn" && "$privacy_opt" =~ "novrfy" ]]; then
                local escaped_priv=$(echo "$privacy_opt" | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Sendmail - noexpn 및 novrfy 옵션이 설정됨\",\"점검명령어\":\"grep '^O PrivacyOptions' $sendmail_cf\",\"전체내용\":\"$escaped_priv\"}")
            else
                IS_VULN=1
                local escaped_priv=$(echo "$privacy_opt" | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Sendmail - PrivacyOptions에 noexpn 또는 novrfy 설정 누락\",\"점검명령어\":\"grep '^O PrivacyOptions' $sendmail_cf\",\"전체내용\":\"$escaped_priv\"}")
            fi
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): Sendmail 실행 중이나 설정 파일(/etc/mail/sendmail.cf)이 없음\",\"점검명령어\":\"ls -l $sendmail_cf\",\"전체내용\":\"missing\"}")
            ## DETAILS_ARRAY+=("\"양호(주의): Sendmail 실행 중이나 설정 파일(/etc/mail/sendmail.cf)이 없음\"")
        fi
    fi

    # 2. Postfix 점검
    if systemctl is-active postfix > /dev/null 2>&1 || pgrep master > /dev/null 2>&1; then
        if command -v postconf > /dev/null 2>&1; then
            local disable_vrfy=$(postconf -h disable_vrfy_command 2>/dev/null)

            # Postfix는 기본적으로 EXPN을 지원하지 않으며, VRFY만 제어함
            if [ "$disable_vrfy" == "yes" ]; then
                local escaped_vrfy=$(echo "$disable_vrfy" | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Postfix - disable_vrfy_command = yes 로 설정됨\",\"점검명령어\":\"postconf -h disable_vrfy_command\",\"전체내용\":\"$escaped_vrfy\"}")
            else
                IS_VULN=1
                local escaped_vrfy=$(echo "$disable_vrfy" | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Postfix - disable_vrfy_command 가 no이거나 기본값(활성)임\",\"점검명령어\":\"postconf -h disable_vrfy_command\",\"전체내용\":\"$escaped_vrfy\"}")
            fi
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): Postfix 실행 중이나 postconf 명령을 사용할 수 없음\",\"점검명령어\":\"postconf -h 2>/dev/null\",\"전체내용\":\"unavailable\"}")
            ## DETAILS_ARRAY+=("\"양호(주의): Postfix 실행 중이나 postconf 명령을 사용할 수 없음\"")
        fi
    fi

    # 3. 실제 포트 오픈 여부 및 수동 확인 정보 추가
    if ss -tuln | grep -q ":25 "; then
        local smtp25=$(ss -tuln | grep ":25 " | head -10 | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"정보: 현재 SMTP(25번 포트)가 리스닝 상태입니다. EXPN/VRFY 수동 테스트 권장\",\"점검명령어\":\"ss -tuln | grep ':25 '\",\"전체내용\":\"$smtp25\"}")
        #DETAILS_ARRAY+=("\"정보: 현재 SMTP(25번 포트)가 리스닝 상태입니다. 명령어 수동 테스트 권장\"")
    fi

    # 최종 상태 결정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="일부 SMTP 서비스에서 EXPN/VRFY 명령어가 활성화되어 있음"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        # 서비스가 없거나 설정이 완벽한 경우
        STATUS="SAFE"
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
        if [ ${#DETAILS_ARRAY[@]} -eq 0 ]; then
            CURRENT_VAL="SMTP 서비스 미사용"
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 점검 대상 SMTP 서비스(Sendmail, Postfix)가 감지되지 않음\",\"점검명령어\":\"systemctl list-unit-files | grep -E 'sendmail|postfix'\",\"전체내용\":\"\"}")
        else
            CURRENT_VAL="모든 SMTP 서비스에서 EXPN/VRFY 명령어가 적절히 제한됨"
        fi
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}

#######################################################################################################################
# ----------------------------------------------------------
# 함수명: U-49
# 설명: BIND(DNS) 서비스의 버전 확인 및 보안 취약점 점검
# ----------------------------------------------------------
function U-49() {
    local CHECK_ID="U-49"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="DNS 보안 버전 패치"
    local EXPECTED_VAL="DNS 서비스를 사용하지 않거나, 최신 보안 패치가 적용된 버전을 사용하는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. BIND 서비스 실행 여부 확인
    local SERVICE_ACTIVE=0
    if systemctl is-active named > /dev/null 2>&1 || systemctl is-active bind9 > /dev/null 2>&1; then
        SERVICE_ACTIVE=1
    fi

    if [ $SERVICE_ACTIVE -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="BIND 서비스 미사용 또는 비활성화"
        DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: DNS 서비스(named/bind9)가 실행 중이지 않습니다.\",\"점검명령어\":\"systemctl is-active named; systemctl is-active bind9\",\"전체내용\":\"inactive\"}")
    else
        # 2. BIND 버전 추출
        local BIND_VER=""
        if command -v named > /dev/null 2>&1; then
            BIND_VER=$(named -v | awk '{print $2}')
        fi

        if [ -z "$BIND_VER" ]; then
            # 패키지 매니저를 통한 버전 확인 (OS별)
            if [ -f /etc/redhat-release ]; then
                BIND_VER=$(rpm -q bind --queryformat '%{VERSION}')
            else
                BIND_VER=$(dpkg-l bind9 | grep ^ii | awk '{print $3}' | cut -d'-' -f1)
            fi
        fi

        # 3. 취약 버전 범위 체크 (예시: 9.16.23 미만 등 주요 취약점 기준)
        # 실제 점검 시에는 보안 공고에 따른 최신 기준 적용 필요
        # 여기서는 구체적인 버전 비교 로직 대신 '업데이트 필요 여부' 확인으로 대체

        # 4. 보안 설정 확인 (버전 숨김 설정 여부)
        local CONFIG_PATH=""
        [ -f /etc/named.conf ] && CONFIG_PATH="/etc/named.conf"
        [ -f /etc/bind/named.conf ] && CONFIG_PATH="/etc/bind/named.conf"

        if [ -n "$CONFIG_PATH" ]; then
            local version_lines
            version_lines=$(grep -vE '^[[:space:]]*(//|#)' "$CONFIG_PATH" | grep -i "version" 2>/dev/null | head -5 | sed 's/\"/\\\\\"/g')
            if echo "$version_lines" | grep -qi "version"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 설정 파일($CONFIG_PATH)에 version 옵션(버전 숨김)이 존재합니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*(//|#)' $CONFIG_PATH | grep -i 'version'\",\"전체내용\":\"$version_lines\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): version 옵션이 설정되지 않아 DNS 쿼리를 통해 버전 정보가 유출될 수 있습니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*(//|#)' $CONFIG_PATH | grep -i 'version'\",\"전체내용\":\"\"}")
                ## DETAILS_ARRAY+=("\"양호(주의): version 옵션이 설정되지 않아 DNS 쿼리를 통해 버전 정보가 유출될 수 있습니다.\"")
            fi
        fi

        # 5. OS별 업데이트 가능 여부 체크 (실제 패치 필요성 확인)
        local UPDATE_AVAIL=""
        if [ -f /etc/redhat-release ]; then
            UPDATE_AVAIL=$(dnf check-update bind 2>/dev/null | grep -i "^bind")
        else
            apt update > /dev/null 2>&1
            UPDATE_AVAIL=$(apt list --upgradable bind9 2>/dev/null | grep -i "upgradable")
        fi

        if [ -n "$UPDATE_AVAIL" ]; then
            IS_VULN=1
            STATUS="VULNERABLE"
            CURRENT_VAL="보안 패치가 포함된 상위 버전의 업데이트가 존재함"
            local escaped_update=$(echo "$UPDATE_AVAIL" | head -5 | sed 's/\"/\\\\\"/g')
            DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 현재 버전에 대한 최신 보안 패치(업데이트)가 발견되었습니다.\",\"점검명령어\":\"dnf check-update bind || apt list --upgradable bind9\",\"전체내용\":\"$escaped_update\"}")
            
        else
            CURRENT_VAL="BIND 최신 패치 적용 상태 (버전: $BIND_VER)"
            

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
    

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}

#################################################################################################################
# ----------------------------------------------------------
# 함수명: U-50
# 설명: DNS Zone Transfer를 특정 서버로 제한했는지 점검
# ----------------------------------------------------------
function U-50() {
    local CHECK_ID="U-50"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="DNS Zone Transfer 설정"
    local EXPECTED_VAL="DNS 서비스를 사용하지 않거나, Zone Transfer를 특정 IP 또는 none으로 제한한 경우"
    
    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. BIND 서비스 실행 여부 확인
    local SERVICE_ACTIVE=0
    if systemctl is-active named > /dev/null 2>&1 || systemctl is-active bind9 > /dev/null 2>&1; then
        SERVICE_ACTIVE=1
    fi

    if [ $SERVICE_ACTIVE -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="DNS 서비스 미사용 또는 비활성화"
        DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: DNS 서비스(named/bind9)가 실행 중이지 않아 점검이 불필요합니다.\",\"점검명령어\":\"systemctl is-active named; systemctl is-active bind9\",\"전체내용\":\"inactive\"}")
    else
        # 2. BIND 설정 파일 경로 탐색
        local CONF_PATH=""
        local SEARCH_PATHS=("/etc/named.conf" "/etc/bind/named.conf" "/var/named/chroot/etc/named.conf")
        for path in "${SEARCH_PATHS[@]}"; do
            [ -f "$path" ] && CONF_PATH="$path" && break
        done

        if [ -z "$CONF_PATH" ]; then
            STATUS="SAFE"
            CURRENT_VAL="설정 파일을 찾을 수 없음"
            DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): BIND 서비스는 실행 중이나 표준 경로에서 named.conf를 찾을 수 없습니다.\",\"점검명령어\":\"ls -l /etc/named.conf /etc/bind/named.conf /var/named/chroot/etc/named.conf\",\"전체내용\":\"missing\"}")
            ## DETAILS_ARRAY+=("\"양호(주의): BIND 서비스는 실행 중이나 표준 경로에서 named.conf를 찾을 수 없습니다.\"")
        else
            # 3. options 블록 내 전역 allow-transfer 확인
            # 주석(//, #)을 제외하고 allow-transfer 행 추출
            local global_transfer=$(grep -vE '^[[:space:]]*(//|#)' "$CONF_PATH" | grep "allow-transfer")

            if [ -z "$global_transfer" ]; then
                # 설정이 아예 없으면 기본값이 'any'이므로 취약
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 전역 allow-transfer 설정이 누락되었습니다 (기본값 any로 작동).\",\"점검명령어\":\"grep -vE '^[[:space:]]*(//|#)' $CONF_PATH | grep 'allow-transfer'\",\"전체내용\":\"\"}")
            elif echo "$global_transfer" | grep -qiE "any|0\.0\.0\.0/0"; then
                IS_VULN=1
                local escaped_gt=$(echo "$global_transfer" | head -5 | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 전역 allow-transfer가 'any' 또는 전체 대역(0.0.0.0/0)으로 허용되어 있습니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*(//|#)' $CONF_PATH | grep 'allow-transfer'\",\"전체내용\":\"$escaped_gt\"}")
            else
                local escaped_gt=$(echo "$global_transfer" | head -5 | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 전역 allow-transfer가 설정되어 있습니다: $(echo $global_transfer | xargs)\",\"점검명령어\":\"grep -vE '^[[:space:]]*(//|#)' $CONF_PATH | grep 'allow-transfer'\",\"전체내용\":\"$escaped_gt\"}")
            fi

            # 4. 개별 Zone 블록 내 allow-transfer 확인 (추가 점검)
            # 전역 설정이 양호하더라도 개별 Zone에서 any로 풀려있을 수 있음
            local zone_any_count=$(grep -vE '^[[:space:]]*(//|#)' "$CONF_PATH" | sed -n '/zone/,/}/p' | grep "allow-transfer" | grep -ci "any")
            if [ "$zone_any_count" -gt 0 ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"$zone_any_count\",\"상태\":\"취약\",\"세부내용\":\"취약: $zone_any_count 개의 개별 Zone 설정에서 allow-transfer { any; }가 발견되었습니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*(//|#)' $CONF_PATH | sed -n '/zone/,/}/p' | grep 'allow-transfer'\",\"전체내용\":\"count=$zone_any_count\"}")
            fi
        fi
    fi

    # 최종 상태 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="Zone Transfer 설정이 'any'이거나 설정이 누락되어 전체 유출 위험이 있음"
         echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        STATUS="SAFE"
        [ "$SERVICE_ACTIVE" -eq 1 ] && CURRENT_VAL="Zone Transfer가 특정 호스트 또는 none으로 제한됨"
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"

    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}


#####################################################################################################################
# ----------------------------------------------------------
# 함수명: U-51
# 설명: DNS 서비스의 취약한 동적 업데이트 설정 여부 점검
# ----------------------------------------------------------
function U-51() {
    local CHECK_ID="U-51"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="DNS 서비스의 취약한 동적 업데이트 설정 금지"
    local EXPECTED_VAL="DNS 서비스를 사용하지 않거나, 동적 업데이트가 특정 호스트로 제한(또는 none)된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. BIND 서비스 실행 여부 확인
    local SERVICE_ACTIVE=0
    if systemctl is-active named > /dev/null 2>&1 || systemctl is-active bind9 > /dev/null 2>&1; then
        SERVICE_ACTIVE=1
    fi

    if [ $SERVICE_ACTIVE -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="DNS 서비스 미사용 또는 비활성화"
        DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: DNS 서비스(named/bind9)가 실행 중이지 않아 보안 위협이 없습니다.\",\"점검명령어\":\"systemctl is-active named; systemctl is-active bind9\",\"전체내용\":\"inactive\"}")
    else
        # 2. BIND 설정 파일 경로 탐색
        local CONF_PATH=""
        local SEARCH_PATHS=("/etc/named.conf" "/etc/bind/named.conf" "/var/named/chroot/etc/named.conf")
        for path in "${SEARCH_PATHS[@]}"; do
            [ -f "$path" ] && CONF_PATH="$path" && break
        done

        if [ -z "$CONF_PATH" ]; then
            STATUS="SAFE"
            CURRENT_VAL="설정 파일을 찾을 수 없음"
            DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): 서비스는 실행 중이나 설정 파일(named.conf)을 찾을 수 없습니다. 수동 확인이 필요합니다.\",\"점검명령어\":\"ls -l /etc/named.conf /etc/bind/named.conf /var/named/chroot/etc/named.conf\",\"전체내용\":\"missing\"}")
            ## DETAILS_ARRAY+=("\"양호(주의): 서비스는 실행 중이나 설정 파일(named.conf)을 찾을 수 없습니다. 수동 확인이 필요합니다.\"")
        else
            # 3. 전역(options) 및 구역(zone) 내 allow-update 설정 확인
            # 주석 제외 후 allow-update 라인 추출
            local update_configs=$(grep -vE '^[[:space:]]*(//|#)' "$CONF_PATH" | grep "allow-update")

            if [ -z "$update_configs" ]; then
                # BIND 기본값은 allow-update { none; }; 이므로 설정이 없으면 양호로 간주함
                # 단, 명시적인 설정을 권장하므로 정보성 메시지 출력
                STATUS="SAFE"
                CURRENT_VAL="명시적인 동적 업데이트 설정 없음 (기본값 none 적용)"
                DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 설정 파일에 allow-update 설정이 없으며, BIND 기본값인 'none'으로 동작합니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*(//|#)' $CONF_PATH | grep 'allow-update'\",\"전체내용\":\"\"}")
            else
                # allow-update 설정이 존재하는 경우 분석
                while read -r line; do
                    local escaped_line=$(echo "$line" | sed 's/\"/\\\\\"/g')
                    if echo "$line" | grep -qiE "any|0\.0\.0\.0/0"; then
                        IS_VULN=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"취약한\",\"상태\":\"취약\",\"세부내용\":\"취약: 취약한 동적 업데이트 설정 발견: $line\",\"점검명령어\":\"grep -vE '^[[:space:]]*(//|#)' $CONF_PATH | grep 'allow-update'\",\"전체내용\":\"$escaped_line\"}")
                    else
                        DETAILS_ARRAY+=("{\"점검항목\":\"제한된\",\"상태\":\"양호\",\"세부내용\":\"양호: 제한된 업데이트 설정 확인: $line\",\"점검명령어\":\"grep -vE '^[[:space:]]*(//|#)' $CONF_PATH | grep 'allow-update'\",\"전체내용\":\"$escaped_line\"}")
                    fi
                done <<< "$update_configs"
            fi
        fi
    fi

    # 최종 상태 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="DNS 동적 업데이트가 모든 호스트(any)에 대해 허용되어 있음"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        [ -z "$CURRENT_VAL" ] && CURRENT_VAL="동적 업데이트가 적절히 제한되어 있음"
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}


#####################################################################################################################
# ----------------------------------------------------------
# 함수명: U-52
# 설명: 원격 접속 시 취약한 Telnet 프로토콜 사용 여부 점검
# ----------------------------------------------------------
function U-52() {
    local CHECK_ID="U-52"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="Telnet 서비스 비활성화"
    local EXPECTED_VAL="Telnet 서비스를 비활성화하고 SSH 등 안전한 프로토콜을 사용하는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. Telnet 서비스 유닛 상태 확인 (systemd 방식)
    # telnet.socket 또는 telnet.service 확인
    local TELNET_UNIT_STATUS=$(systemctl is-active telnet.socket 2>/dev/null)
    local TELNET_SVC_STATUS=$(systemctl is-active telnet.service 2>/dev/null)

    if [ "$TELNET_UNIT_STATUS" == "active" ] || [ "$TELNET_SVC_STATUS" == "active" ]; then
        IS_VULN=1
        local unit_status="${TELNET_UNIT_STATUS:-none},${TELNET_SVC_STATUS:-none}"
        DETAILS_ARRAY+=("{\"점검항목\":\"Telnet 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: Telnet 서비스(Unit)가 현재 실행 중입니다.\",\"점검명령어\":\"systemctl is-active telnet.socket; systemctl is-active telnet.service\",\"전체내용\":\"$unit_status\"}")
    fi

    # 2. xinetd 기반 Telnet 확인 (과거 방식 및 일부 환경)
    if [ -d /etc/xinetd.d ]; then
        if [ -f /etc/xinetd.d/telnet ]; then
            local DISABLE_CHECK=$(grep -i "disable" /etc/xinetd.d/telnet | grep -i "no")
            if [ -n "$DISABLE_CHECK" ]; then
                IS_VULN=1
                local escaped_dis=$(echo "$DISABLE_CHECK" | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"Telnet 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: xinetd 설정에 의해 Telnet 서비스가 활성화되어 있습니다.\",\"점검명령어\":\"grep -i 'disable' /etc/xinetd.d/telnet\",\"전체내용\":\"$escaped_dis\"}")
            fi
        fi
    fi

    # 3. 포트 리스닝 확인 (23번 포트)
    if ss -tuln | grep -q ":23 "; then
        IS_VULN=1
        local TELNET_LISTEN=$(ss -tuln | grep ":23 " | head -10 | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"Telnet 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: 23번 포트(Telnet)가 리스닝 상태입니다.\",\"점검명령어\":\"ss -tuln | grep ':23 '\",\"전체내용\":\"$TELNET_LISTEN\"}")
    fi

    # 최종 상태 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="Telnet 서비스가 활성화되어 있어 보안상 취약함"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        STATUS="SAFE"
        CURRENT_VAL="Telnet 서비스가 비활성화되어 있음"
        DETAILS_ARRAY+=("{\"점검항목\":\"Telnet 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: Telnet 서비스가 중지되어 있으며 포트가 닫혀 있습니다.\",\"점검명령어\":\"systemctl is-active telnet.socket; systemctl is-active telnet.service; ss -tuln | grep ':23 '\",\"전체내용\":\"inactive, no-listen\"}")
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}


#########################################################################################################################
# ----------------------------------------------------------
# 함수명: U-53
# 설명: FTP 서비스 접속 시 버전 및 시스템 정보 노출 여부 점검
# ----------------------------------------------------------
function U-53() {
    local CHECK_ID="U-53"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="FTP 서비스 정보 노출 제한"
    local EXPECTED_VAL="FTP 서비스를 사용하지 않거나, 접속 배너에서 버전/시스템 정보가 노출되지 않는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. FTP 서비스 실행 여부 확인 (vsftpd, proftpd 등)
    local FTP_ACTIVE=0
    if systemctl is-active vsftpd > /dev/null 2>&1 || systemctl is-active proftpd > /dev/null 2>&1; then
        FTP_ACTIVE=1
    fi

    # 21번 포트 리스닝 확인
    if ss -tuln | grep -q ":21 "; then
        FTP_ACTIVE=1
    fi

    if [ $FTP_ACTIVE -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="FTP 서비스 미사용 또는 비활성화"
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 서비스가 실행 중이지 않아 정보 노출 위험이 없습니다.\",\"점검명령어\":\"systemctl is-active vsftpd; systemctl is-active proftpd; ss -tuln | grep ':21 '\",\"전체내용\":\"inactive\"}")
    else
        # 2. vsftpd 설정 점검
        if [ -f /etc/vsftpd/vsftpd.conf ] || [ -f /etc/vsftpd.conf ]; then
            local VSF_CONF=$( [ -f /etc/vsftpd/vsftpd.conf ] && echo "/etc/vsftpd/vsftpd.conf" || echo "/etc/vsftpd.conf" )

            # ftpd_banner 또는 banner_file 설정 확인
            local BANNER_SETTING=$(grep -vE '^[[:space:]]*#' "$VSF_CONF" | grep -E "ftpd_banner|banner_file")

            if [ -z "$BANNER_SETTING" ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: vsftpd 설정에 ftpd_banner 설정이 없어 기본 버전 정보가 노출될 수 있습니다. ($VSF_CONF)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $VSF_CONF | grep -E 'ftpd_banner|banner_file'\",\"전체내용\":\"\"}")
            else
                local escaped_banner=$(echo "$BANNER_SETTING" | head -5 | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: vsftpd 접속 배너가 설정되어 있습니다. ($BANNER_SETTING)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $VSF_CONF | grep -E 'ftpd_banner|banner_file'\",\"전체내용\":\"$escaped_banner\"}")
            fi
        fi

        # 3. proftpd 설정 점검
        if [ -f /etc/proftpd.conf ] || [ -f /etc/proftpd/proftpd.conf ]; then
            local PRO_CONF=$( [ -f /etc/proftpd.conf ] && echo "/etc/proftpd.conf" || echo "/etc/proftpd/proftpd.conf" )

            # ServerIdent 설정 확인 (Off 여부)
            local IDENT_SETTING=$(grep -vE '^[[:space:]]*#' "$PRO_CONF" | grep -i "ServerIdent")

            if echo "$IDENT_SETTING" | grep -qi "Off"; then
                local escaped_ident=$(echo "$IDENT_SETTING" | head -3 | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: proftpd ServerIdent 설정이 Off로 되어 있어 정보가 숨겨집니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $PRO_CONF | grep -i 'ServerIdent'\",\"전체내용\":\"$escaped_ident\"}")
            else
                local escaped_ident=$(echo "$IDENT_SETTING" | head -3 | sed 's/\"/\\\\\"/g')
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: proftpd ServerIdent 설정이 없거나 On으로 되어 있어 정보가 노출될 수 있습니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $PRO_CONF | grep -i 'ServerIdent'\",\"전체내용\":\"$escaped_ident\"}")
            fi
        fi
    fi

    # 최종 상태 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="FTP 서비스 접속 시 버전 및 시스템 정보가 노출될 위험이 있음"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        [ "$FTP_ACTIVE" -eq 1 ] && CURRENT_VAL="FTP 접속 배너 정보 노출이 차단되어 있음"
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}

###########################################################################################################################
# ----------------------------------------------------------
# 함수명: U-54
# 설명: 암호화되지 않은 FTP 서비스 비활성화 여부 점검
# ----------------------------------------------------------
function U-54() {
    local CHECK_ID="U-54"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="암호화되지 않은 FTP 서비스 비활성화"
    local EXPECTED_VAL="일반 FTP 서비스를 비활성화하고 SFTP 또는 FTPS를 사용하는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. FTP 관련 서비스 유닛 상태 확인 (vsftpd, proftpd, pure-ftpd 등)
    local FTP_SERVICES=("vsftpd" "proftpd" "pure-ftpd")
    local ACTIVE_SERVICES=()

    for svc in "${FTP_SERVICES[@]}"; do
        if systemctl is-active "$svc" > /dev/null 2>&1; then
            ACTIVE_SERVICES+=("$svc")
            IS_VULN=1
        fi
    done

    # 2. 포트 리스닝 확인 (표준 FTP 포트: 21)
    if ss -tuln | grep -q ":21 "; then
        IS_VULN=1
        local PORT_DETAIL=$(ss -tuln | grep ":21 " | awk '{print $5}')
        local PORT_LINES=$(ss -tuln | grep ":21 " | head -10 | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 21번 포트(FTP)가 현재 리스닝 상태입니다. ($PORT_DETAIL)\",\"점검명령어\":\"ss -tuln | grep ':21 '\",\"전체내용\":\"$PORT_LINES\"}")
    fi

    # 3. xinetd 기반 FTP 서비스 확인 (일부 레거시 환경)
    if [ -d /etc/xinetd.d ]; then
        local XINETD_FTP=$(grep -lE "service[[:space:]]+ftp" /etc/xinetd.d/* 2>/dev/null)
        for conf in $XINETD_FTP; do
            if ! grep -q "disable[[:space:]]*=[[:space:]]*yes" "$conf"; then
                IS_VULN=1
                local X_CONF_LINES=$(grep -vE '^[[:space:]]*#' "$conf" 2>/dev/null | head -10 | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: xinetd 설정에 의해 FTP 서비스가 활성화되어 있습니다. ($conf)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $conf\",\"전체내용\":\"$X_CONF_LINES\"}")
            fi
        done
    fi

    # 최종 상태 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
        # 실행 중인 서비스 이름이 있으면 포함
        if [ ${#ACTIVE_SERVICES[@]} -gt 0 ]; then
            CURRENT_VAL="암호화되지 않은 FTP 서비스(${ACTIVE_SERVICES[*]})가 활성화됨"
            local active_joined="${ACTIVE_SERVICES[*]}"
            DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 현재 실행 중인 서비스: ${ACTIVE_SERVICES[*]}\",\"점검명령어\":\"systemctl is-active vsftpd proftpd pure-ftpd\",\"전체내용\":\"$active_joined\"}")
        else
            CURRENT_VAL="암호화되지 않은 FTP 서비스(21번 포트)가 활성화되어 있음"
        fi
    else
        STATUS="SAFE"
        CURRENT_VAL="암호화되지 않은 FTP 서비스가 비활성화됨"
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 일반 FTP 서비스 유닛이 중지되어 있으며 21번 포트가 닫혀 있습니다.\",\"점검명령어\":\"systemctl is-active vsftpd proftpd pure-ftpd; ss -tuln | grep ':21 '\",\"전체내용\":\"inactive, no-listen\"}")
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}


########################################################################################################################
# ----------------------------------------------------------
# 함수명: U-55
# 설명: FTP 기본 계정에 로그인이 불가능한 쉘 부여 여부 점검
# ----------------------------------------------------------
function U-55() {
    local CHECK_ID="U-55"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="FTP 계정 Shell 제한"
    local EXPECTED_VAL="FTP 계정에 /bin/false 또는 /sbin/nologin 쉘이 부여된 경우"
    
    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. 시스템 내 FTP 관련 계정 확인 (일반적으로 'ftp')
    local FTP_USER_INFO=$(grep "^ftp:" /etc/passwd)

    if [ -z "$FTP_USER_INFO" ]; then
        STATUS="SAFE"
        CURRENT_VAL="시스템에 FTP 기본 계정이 존재하지 않음"
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 시스템에 'ftp' 기본 계정이 존재하지 않아 보안 위협이 없습니다.\",\"점검명령어\":\"grep '^ftp:' /etc/passwd\",\"전체내용\":\"\"}")
    else
        # 2. 부여된 쉘 확인
        local USER_SHELL=$(echo "$FTP_USER_INFO" | awk -F: '{print $7}')
        local escaped_info=$(echo "$FTP_USER_INFO" | sed 's/\"/\\\\\"/g')
        
        # 3. 판단 기준 적용 (/bin/false 또는 /sbin/nologin 인지 확인)
        case "$USER_SHELL" in
            *"/sbin/nologin" | *"/bin/false")
                STATUS="SAFE"
                CURRENT_VAL="FTP 계정에 로그인 불가능한 쉘($USER_SHELL)이 적절히 부여됨"
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 계정의 쉘이 $USER_SHELL 로 설정되어 시스템 접근이 차단되어 있습니다.\",\"점검명령어\":\"grep '^ftp:' /etc/passwd\",\"전체내용\":\"$escaped_info\"}")
                ;;
            *)
                IS_VULN=1
                STATUS="VULNERABLE"
                CURRENT_VAL="FTP 계정에 취약한 쉘($USER_SHELL)이 부여되어 있음"
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: FTP 계정('ftp')에 시스템 접근이 가능한 쉘($USER_SHELL)이 부여되어 있습니다.\",\"점검명령어\":\"grep '^ftp:' /etc/passwd\",\"전체내용\":\"$escaped_info\"}")
                ;;
        esac
    fi

    # 4. 추가 점검: FTP 서비스 실행 여부와 관계없이 계정 설정 위주로 판단
    if systemctl is-active vsftpd > /dev/null 2>&1 || systemctl is-active proftpd > /dev/null 2>&1; then
        ## DETAILS_ARRAY+=("\"정보: 현재 FTP 서비스가 활성화 상태입니다. 계정 보안 설정이 더욱 중요합니다.\"")
        :
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


###################################################################################################################################
function U-56() {
    local CHECK_ID="U-56"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="FTP 서비스 접근 제어 설정"
    local EXPECTED_VAL="FTP 접근 제어 파일의 소유자가 root이고 권한이 640 이하이며, 올바른 접근 제어 설정 적용"
    
    local STATUS="SAFE"
    local CURRENT_VAL="FTP 접근 제어 파일 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. FTP 서비스 구동 확인
    local FTP_RUNNING=0
    local DAEMON=""
    
    if pgrep -x "vsftpd" >/dev/null; then
        FTP_RUNNING=1; DAEMON="vsftpd"
    elif pgrep -x "proftpd" >/dev/null; then
        FTP_RUNNING=1; DAEMON="proftpd"
    elif pgrep -x "ftpd" >/dev/null || pgrep -x "in.ftpd" >/dev/null; then
        FTP_RUNNING=1; DAEMON="ftpd"
    fi

    if [ $FTP_RUNNING -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 서비스가 구동 중이지 않습니다. (점검 제외)\",\"점검명령어\":\"pgrep -x vsftpd; pgrep -x proftpd; pgrep -x ftpd; pgrep -x in.ftpd\",\"전체내용\":\"not running\"}")
    else
        # 공통 함수: 파일 권한 및 소유자 점검 (기준: root 소유, 640 이하)
        check_file_perm() {
            local FPATH=$1
            local DESC=$2
            if [ -f "$FPATH" ]; then
                local F_OWNER=$(stat -c "%U" "$FPATH")
                local F_PERM=$(stat -c "%a" "$FPATH")
                local LS_LINE=$(ls -ld "$FPATH" 2>/dev/null | sed 's/\"/\\\\\"/g')
                
                # 소유자 root, 권한 640 이하(600, 400 등 허용, 644는 취약)
                if [ "$F_OWNER" != "root" ] || [ "$F_PERM" -gt 640 ]; then
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $FPATH (소유자: $F_OWNER, 권한: $F_PERM) -> root, 640 이하 필요\",\"점검명령어\":\"stat -c '%U %a' $FPATH; ls -ld $FPATH\",\"전체내용\":\"$LS_LINE\"}")
                else
                    DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $FPATH (소유자: root, 권한: $F_PERM)\",\"점검명령어\":\"stat -c '%U %a' $FPATH; ls -ld $FPATH\",\"전체내용\":\"$LS_LINE\"}")
                fi
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$FPATH\",\"상태\":\"양호\",\"세부내용\":\"양호: $FPATH 파일이 존재하지 않습니다.\",\"점검명령어\":\"ls -ld $FPATH\",\"전체내용\":\"missing\"}")
            fi
        }

        # ---------------------------------------------------------
        # [Case 1] vsFTPd 점검
        # ---------------------------------------------------------
        if [ "$DAEMON" == "vsftpd" ]; then
            # 설정 파일 찾기
            local VSFTP_CONF="/etc/vsftpd/vsftpd.conf"
            [ ! -f "$VSFTP_CONF" ] && VSFTP_CONF="/etc/vsftpd.conf"

            if [ -f "$VSFTP_CONF" ]; then
                # userlist_enable 확인
                local USERLIST_ENABLE=$(grep -vE "^\s*#" "$VSFTP_CONF" | grep "userlist_enable" | cut -d= -f2 | tr -d ' ' | tr '[:lower:]' '[:upper:]')
                
                if [ "$USERLIST_ENABLE" == "YES" ]; then
                    #DETAILS_ARRAY+=("\"[vsFTP] 설정: userlist_enable=YES 확인\"")
                    # user_list 파일 점검
                    local USER_LIST_FILE="/etc/vsftpd/user_list"
                    [ ! -f "$USER_LIST_FILE" ] && USER_LIST_FILE="/etc/vsftpd.user_list"
                    check_file_perm "$USER_LIST_FILE" "vsFTP-user_list"
                    
                    # userlist_deny 확인 (추가 점검)
                    local USERLIST_DENY=$(grep -vE "^\s*#" "$VSFTP_CONF" | grep "userlist_deny" | cut -d= -f2 | tr -d ' ')
                    #DETAILS_ARRAY+=("\"[vsFTP] 설정: userlist_deny=${USERLIST_DENY:-YES(기본)}\"")
                else
                    #DETAILS_ARRAY+=("\"[vsFTP] 설정: userlist_enable=${USERLIST_ENABLE:-NO(기본)}\"")
                    # ftpusers 파일 점검
                    local FTPUSERS_FILE="/etc/vsftpd/ftpusers"
                    [ ! -f "$FTPUSERS_FILE" ] && FTPUSERS_FILE="/etc/vsftpd.ftpusers"
                    check_file_perm "$FTPUSERS_FILE" "vsFTP-ftpusers"
                fi
            else
                DETAILS_ARRAY+=("\"양호(경고): 설정 파일($VSFTP_CONF)을 찾을 수 없습니다.\"")
            fi

        # ---------------------------------------------------------
        # [Case 2] ProFTPd 점검
        # ---------------------------------------------------------
        elif [ "$DAEMON" == "proftpd" ]; then
            local PROFTP_CONF="/etc/proftpd/proftpd.conf"
            [ ! -f "$PROFTP_CONF" ] && PROFTP_CONF="/etc/proftpd.conf"

            if [ -f "$PROFTP_CONF" ]; then
                # UseFtpUsers 확인 (기본 on)
                local USE_FTPUSERS=$(grep -vE "^\s*#" "$PROFTP_CONF" | grep "UseFtpUsers" | awk '{print $2}' | tr '[:lower:]' '[:upper:]')
                
                if [ "$USE_FTPUSERS" == "OFF" ]; then
                    #DETAILS_ARRAY+=("\"[ProFTP] 설정: UseFtpUsers=OFF\"")
                    # proftpd.conf 자체 권한 점검
                    check_file_perm "$PROFTP_CONF" "ProFTP-Config"
                    
                    # <Limit LOGIN> 설정 확인
                    if grep -q "<Limit LOGIN>" "$PROFTP_CONF"; then
                         local LIMIT_LINE=$(grep "<Limit LOGIN>" -n "$PROFTP_CONF" 2>/dev/null | head -3 | sed 's/\"/\\\\\"/g')
                         DETAILS_ARRAY+=("{\"점검항목\":\"<Limit\",\"상태\":\"양호\",\"세부내용\":\"양호: <Limit LOGIN> 설정이 존재합니다.\",\"점검명령어\":\"grep -n '<Limit LOGIN>' $PROFTP_CONF\",\"전체내용\":\"$LIMIT_LINE\"}")
                    else
                         IS_VULN=1
                         DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: UseFtpUsers=OFF 이나 <Limit LOGIN> 설정이 없습니다.\",\"점검명령어\":\"grep -n '<Limit LOGIN>' $PROFTP_CONF\",\"전체내용\":\"\"}")
                    fi
                else
                    #DETAILS_ARRAY+=("\"[ProFTP] 설정: UseFtpUsers=${USE_FTPUSERS:-ON(기본)}\"")
                    # ftpusers 파일 점검
                    local FTPUSERS_FILE="/etc/ftpusers"
                    [ ! -f "$FTPUSERS_FILE" ] && FTPUSERS_FILE="/etc/ftpd/ftpusers"
                    check_file_perm "$FTPUSERS_FILE" "ProFTP-ftpusers"
                fi
            fi

        # ---------------------------------------------------------
        # [Case 3] General FTP 점검
        # ---------------------------------------------------------
        else
            local FTPUSERS_FILE="/etc/ftpusers"
            [ ! -f "$FTPUSERS_FILE" ] && FTPUSERS_FILE="/etc/ftpd/ftpusers"
            check_file_perm "$FTPUSERS_FILE" "FTP-ftpusers"
        fi
    fi

    # [4] 결과 종합 판단
        if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="FTP 접근 제어 파일 권한 또는 설정 미흡"
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: ftpusers/user_list 파일의 권한(640 초과) 또는 소유자(비 root) 설정이 발견되었습니다.\",\"점검명령어\":\"stat -c '%U %a' /etc/vsftpd/ftpusers /etc/vsftpd/user_list /etc/ftpusers 2>/dev/null; ls -ld /etc/vsftpd/ftpusers /etc/vsftpd/user_list /etc/ftpusers 2>/dev/null\",\"전체내용\":\"see individual entries\"}")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 접근 제어 파일 및 설정이 적절합니다.\",\"점검명령어\":\"stat -c '%U %a' /etc/vsftpd/ftpusers /etc/vsftpd/user_list /etc/ftpusers 2>/dev/null; ls -ld /etc/vsftpd/ftpusers /etc/vsftpd/user_list /etc/ftpusers 2>/dev/null\",\"전체내용\":\"see individual entries\"}")
        
    fi
    
    if [ "$STATUS" == "VULNERABLE" ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}


################################################################################################################################
function U-57() {
    local CHECK_ID="U-57"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="Ftpusers 파일 설정"
    local EXPECTED_VAL="FTP 서비스 사용 시 root 계정 접속이 차단되어 있어야 함"
    
    local STATUS="SAFE"
    local CURRENT_VAL="FTP root 접근 제한 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. FTP 서비스 실행 여부 확인
    local FTP_RUNNING=0
    if pgrep -x "vsftpd" >/dev/null || pgrep -x "proftpd" >/dev/null || pgrep -x "ftpd" >/dev/null; then
        FTP_RUNNING=1
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 서비스가 실행 중이지 않습니다.\",\"점검명령어\":\"pgrep -x vsftpd; pgrep -x proftpd; pgrep -x ftpd\",\"전체내용\":\"not running\"}")
    fi

    # 2. 서비스별 상세 점검 (실행 중일 때만)
    if [ $FTP_RUNNING -eq 1 ]; then
        
        # --- A. vsFTPd 점검 ---
        if pgrep -x "vsftpd" >/dev/null; then
            local VSFTP_CONF="/etc/vsftpd/vsftpd.conf"
            [ ! -f "$VSFTP_CONF" ] && VSFTP_CONF="/etc/vsftpd.conf"

            if [ -f "$VSFTP_CONF" ]; then
                local USERLIST_EN=$(grep -vE "^\s*#" "$VSFTP_CONF" | grep -i "userlist_enable" | awk -F= '{print $2}' | tr -d ' ')
                [ -z "$USERLIST_EN" ] && USERLIST_EN="NO" # 기본값 NO

                if [[ "${USERLIST_EN^^}" == "YES" ]]; then
                    # Case: userlist_enable=YES (user_list 파일 점검)
                    local USER_LIST="/etc/vsftpd/user_list"
                    [ ! -f "$USER_LIST" ] && USER_LIST="/etc/vsftpd.user_list"
                    
                    #DETAILS_ARRAY+=("\"[vsFTP] userlist_enable=YES 확인됨. $USER_LIST 파일을 점검합니다.\"")
                    if [ -f "$USER_LIST" ] && grep -E "^root" "$USER_LIST" >/dev/null; then
                        local sample_root=$(grep -E "^root" "$USER_LIST" 2>/dev/null | head -3 | sed 's/\"/\\\\\"/g')
                        DETAILS_ARRAY+=("{\"점검항목\":\"$USER_LIST\",\"상태\":\"양호\",\"세부내용\":\"양호: $USER_LIST 파일에 root 가 등록되어 차단 중입니다.\",\"점검명령어\":\"grep '^root' $USER_LIST\",\"전체내용\":\"$sample_root\"}")
                    else
                        IS_VULN=1
                        local sample_file=$( [ -f "$USER_LIST" ] && grep -vE '^[[:space:]]*#' "$USER_LIST" 2>/dev/null | head -5 | sed 's/\"/\\\\\"/g' )
                        DETAILS_ARRAY+=("{\"점검항목\":\"$USER_LIST\",\"상태\":\"취약\",\"세부내용\":\"취약: $USER_LIST 파일에 root 가 없거나 주석 처리되어 있습니다.\",\"점검명령어\":\"grep '^root' $USER_LIST\",\"전체내용\":\"$sample_file\"}")
                    fi
                else
                    # Case: userlist_enable=NO (ftpusers 파일 점검)
                    local FTP_USERS="/etc/vsftpd/ftpusers"
                    [ ! -f "$FTP_USERS" ] && FTP_USERS="/etc/ftpusers"

                    #DETAILS_ARRAY+=("\"[vsFTP] userlist_enable=NO(기본) 확인됨. $FTP_USERS 파일을 점검합니다.\"")
                    if [ -f "$FTP_USERS" ] && grep -E "^root" "$FTP_USERS" >/dev/null; then
                        local sample_root=$(grep -E "^root" "$FTP_USERS" 2>/dev/null | head -3 | sed 's/\"/\\\\\"/g')
                        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $FTP_USERS 파일에 root 가 등록되어 차단 중입니다.\",\"점검명령어\":\"grep '^root' $FTP_USERS\",\"전체내용\":\"$sample_root\"}")
                    else
                        IS_VULN=1
                        local sample_file=$( [ -f "$FTP_USERS" ] && grep -vE '^[[:space:]]*#' "$FTP_USERS" 2>/dev/null | head -5 | sed 's/\"/\\\\\"/g' )
                        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $FTP_USERS 파일에 root 가 없거나 주석 처리되어 있습니다.\",\"점검명령어\":\"grep '^root' $FTP_USERS\",\"전체내용\":\"$sample_file\"}")
                    fi
                fi
            fi

        # --- B. ProFTPd 점검 ---
        elif pgrep -x "proftpd" >/dev/null; then
            local PROFTP_CONF="/etc/proftpd/proftpd.conf"
            [ ! -f "$PROFTP_CONF" ] && PROFTP_CONF="/etc/proftpd.conf"

            if [ -f "$PROFTP_CONF" ]; then
                local USE_FTPU=$(grep -vE "^\s*#" "$PROFTP_CONF" | grep -i "UseFtpUsers" | awk '{print $2}')
                [ -z "$USE_FTPU" ] && USE_FTPU="on" # 기본값 on

                if [[ "${USE_FTPU,,}" == "on" ]]; then
                    local FTP_USERS="/etc/ftpusers"
                    [ ! -f "$FTP_USERS" ] && FTP_USERS="/etc/ftpd/ftpusers"
                    
                    #DETAILS_ARRAY+=("\"[ProFTP] UseFtpUsers=on 확인됨. $FTP_USERS 파일을 점검합니다.\"")
                    if [ -f "$FTP_USERS" ] && grep -E "^root" "$FTP_USERS" >/dev/null; then
                        local sample_root=$(grep -E "^root" "$FTP_USERS" 2>/dev/null | head -3 | sed 's/\"/\\\\\"/g')
                        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $FTP_USERS 파일에 root 가 등록되어 있습니다.\",\"점검명령어\":\"grep '^root' $FTP_USERS\",\"전체내용\":\"$sample_root\"}")
                    else
                        IS_VULN=1
                        local sample_file=$( [ -f "$FTP_USERS" ] && grep -vE '^[[:space:]]*#' "$FTP_USERS" 2>/dev/null | head -5 | sed 's/\"/\\\\\"/g' )
                        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $FTP_USERS 파일에 root 가 없거나 주석 처리되어 있습니다.\",\"점검명령어\":\"grep '^root' $FTP_USERS\",\"전체내용\":\"$sample_file\"}")
                    fi
                else
                    # UseFtpUsers off 인 경우 RootLogin off 설정을 확인해야 함
                    local ROOT_LOG=$(grep -vE "^\s*#" "$PROFTP_CONF" | grep -i "RootLogin" | awk '{print $2}')
                    #DETAILS_ARRAY+=("\"[ProFTP] UseFtpUsers=off 확인됨. RootLogin 설정을 점검합니다.\"")
                    if [[ "${ROOT_LOG,,}" == "off" ]]; then
                        DETAILS_ARRAY+=("{\"점검항목\":\"RootLogin\",\"상태\":\"양호\",\"세부내용\":\"양호: RootLogin off 설정이 확인되었습니다.\",\"점검명령어\":\"grep -i 'RootLogin' $PROFTP_CONF\",\"전체내용\":\"RootLogin $ROOT_LOG\"}")
                    else
                        IS_VULN=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"RootLogin이\",\"상태\":\"취약\",\"세부내용\":\"취약: RootLogin이 off로 설정되어 있지 않습니다.\",\"점검명령어\":\"grep -i 'RootLogin' $PROFTP_CONF\",\"전체내용\":\"RootLogin ${ROOT_LOG:-unset}\"}")
                    fi
                fi
            fi

        # --- C. 기타/기본 FTP 점검 ---
        else
            #DETAILS_ARRAY+=("\"[기타] 일반 FTP 서비스가 감지되었습니다. 기본 ftpusers 파일을 점검합니다.\"")
            local BASIC_FTPU="/etc/ftpusers"
            [ ! -f "$BASIC_FTPU" ] && BASIC_FTPU="/etc/ftpd/ftpusers"

            if [ -f "$BASIC_FTPU" ] && grep -E "^root" "$BASIC_FTPU" >/dev/null; then
                local sample_root=$(grep -E "^root" "$BASIC_FTPU" 2>/dev/null | head -3 | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $BASIC_FTPU 파일에 root 가 등록되어 있습니다.\",\"점검명령어\":\"grep '^root' $BASIC_FTPU\",\"전체내용\":\"$sample_root\"}")
            else
                IS_VULN=1
                local sample_file=$( [ -f "$BASIC_FTPU" ] && grep -vE '^[[:space:]]*#' "$BASIC_FTPU" 2>/dev/null | head -5 | sed 's/\"/\\\\\"/g' )
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $BASIC_FTPU 파일에 root 가 없거나 주석 처리되어 있습니다.\",\"점검명령어\":\"grep '^root' $BASIC_FTPU\",\"전체내용\":\"$sample_file\"}")
            fi
        fi
    fi

    # 3. 최종 결과 판단
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="FTP root 계정 접속 제한 미흡"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}


#############################################################################################################################
function U-58() {
    local CHECK_ID="U-58"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="불필요한 SNMP 서비스 구동 점검"
    local EXPECTED_VAL="SNMP 서비스를 사용하지 않거나 비활성화된 경우"
    
    local STATUS="SAFE"
    local CURRENT_VAL="SNMP 서비스 비활성화 상태"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local SERVICE_NAME="snmpd"

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. 서비스 활성화 여부 확인
    if command -v systemctl &> /dev/null; then
        # systemctl이 존재하는 현대적인 OS 환경
        if systemctl is-active --quiet "$SERVICE_NAME"; then
            # 서비스가 실행 중인 경우
            IS_VULN=1
            # systemctl list-units 결과에서 상태 정보 추출 (좌우 공백 제거)
            local SERVICE_STATUS=$(systemctl list-units --type=service | grep "$SERVICE_NAME" | xargs | sed 's/\"/\\\\\"/g')
            
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SNMP 서비스가 활성화(Active) 상태입니다.\",\"점검명령어\":\"systemctl is-active $SERVICE_NAME; systemctl list-units --type=service | grep $SERVICE_NAME\",\"전체내용\":\"$SERVICE_STATUS\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SNMP 서비스가 비활성화(Inactive/Dead) 상태입니다.\",\"점검명령어\":\"systemctl is-active $SERVICE_NAME\",\"전체내용\":\"inactive\"}")
        fi
    else
        # systemctl이 없는 구형 OS 환경 (pgrep 활용)
        if pgrep -x "$SERVICE_NAME" >/dev/null; then
            IS_VULN=1
            local P_OUT=$(pgrep -ax "$SERVICE_NAME" 2>/dev/null | sed 's/\"/\\\\\"/g')
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SNMP 프로세스($SERVICE_NAME)가 실행 중입니다.\",\"점검명령어\":\"pgrep -ax $SERVICE_NAME\",\"전체내용\":\"$P_OUT\"}")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SNMP 프로세스가 실행 중이지 않습니다.\",\"점검명령어\":\"pgrep -x $SERVICE_NAME\",\"전체내용\":\"not running\"}")
        fi
    fi

    # 2. 예외 처리 가이드 및 최종 결과 판단
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="SNMP 서비스 활성화 확인됨"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}


######################################################################################################################
function U-59() {
    local CHECK_ID="U-59"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="안전한 SNMP 버전 사용"
    local EXPECTED_VAL="SNMP v3 사용 및 v1/v2c 비활성화(설정 제거)"
    
    local STATUS="SAFE"
    local CURRENT_VAL="안전한 SNMP v3 사용 중"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local SNMP_CONF="/etc/snmp/snmpd.conf"

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # [1] SNMP 서비스 활성화 여부 확인
    if ! pgrep -x "snmpd" >/dev/null; then
        DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SNMP 서비스(snmpd)가 실행 중이지 않습니다.\",\"점검명령어\":\"pgrep -x snmpd\",\"전체내용\":\"not running\"}")
        #DETAILS_ARRAY+=("\"[참고] 서비스를 사용하지 않는 환경이 가장 안전합니다.\"")
    else
        #DETAILS_ARRAY+=("\"정보: SNMP 서비스(snmpd)가 실행 중입니다. 설정을 점검합니다.\"")

        if [ -f "$SNMP_CONF" ]; then
            local V1_V2_FOUND=0
            local V3_FOUND=0

            # [2] v1 / v2c (취약한 버전) 설정 존재 여부 확인
            # 주석 제외하고 rocommunity, rwcommunity, com2sec 키워드 검색
            local V2_LINES=$(grep -vE "^\s*#" "$SNMP_CONF" | grep -E "rocommunity|rwcommunity|com2sec")
            if [ -n "$V2_LINES" ]; then
                V1_V2_FOUND=1
                local SAMPLE_V2_ESC=$(echo "$V2_LINES" | head -n 3 | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"v1/v2c\",\"상태\":\"취약\",\"세부내용\":\"취약: v1/v2c 설정이 발견되었습니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $SNMP_CONF | grep -E 'rocommunity|rwcommunity|com2sec'\",\"전체내용\":\"$SAMPLE_V2_ESC\"}")
                # 발견된 첫 번째 설정을 예시로 기록
                local SAMPLE_V2=$(echo "$V2_LINES" | head -n 1 | xargs)
                #DETAILS_ARRAY+=("\"   >> 발견된 설정 예시: $SAMPLE_V2\"")
            fi

            # [3] v3 (안전한 버전) 설정 존재 여부 확인
            if grep -vE "^\s*#" "$SNMP_CONF" | grep -E "rouser|rwuser|createUser|defVersion\s+3" >/dev/null; then
                V3_FOUND=1
                local V3_LINES_ESC=$(grep -vE "^\s*#" "$SNMP_CONF" | grep -E "rouser|rwuser|createUser|defVersion\s+3" 2>/dev/null | head -5 | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"정보: SNMP v3 설정(rouser, createUser 등)이 확인되었습니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $SNMP_CONF | grep -E 'rouser|rwuser|createUser|defVersion\\\\s+3'\",\"전체내용\":\"$V3_LINES_ESC\"}")
            fi

            # [4] 최종 판단 로직
            if [ $V1_V2_FOUND -eq 1 ]; then
                IS_VULN=1
                STATUS="VULNERABLE"
                CURRENT_VAL="취약한 SNMP 버전(v1/v2c) 설정 잔존"
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: v3 설정 여부와 관계없이 v1/v2c 설정이 활성화되어 있어 위험.\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $SNMP_CONF | grep -E 'rocommunity|rwcommunity|com2sec'\",\"전체내용\":\"see v1/v2c 항목\"}")
                #DETAILS_ARRAY+=("\"[조치] 1. $SNMP_CONF 내 com2sec, rocommunity, rwcommunity 항목 주석 처리\"")
                #DETAILS_ARRAY+=("\"[조치] 2. v3 사용자(createUser) 및 권한(rouser) 설정만 유지 후 서비스 재시작\"")
            elif [ $V3_FOUND -eq 1 ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: v1/v2c 설정이 없으며 SNMP v3 정책이 적용되어 있습니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $SNMP_CONF | grep -E 'rouser|rwuser|createUser|defVersion\\\\s+3'\",\"전체내용\":\"see v3 info\"}")
            else
                IS_VULN=1
                STATUS="VULNERABLE"
                CURRENT_VAL="SNMP v3 미설정"
                DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 명확한 SNMP v3 설정(rouser/createUser)을 찾을 수 없습니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $SNMP_CONF | grep -E 'rouser|rwuser|createUser'\",\"전체내용\":\"\"}")
                #DETAILS_ARRAY+=("\"[조치] net-snmp-create-v3-user 명령어를 사용하여 v3 사용자를 생성하십시오.\"")
            fi
        else
            IS_VULN=1
            STATUS="VULNERABLE"
            CURRENT_VAL="SNMP 설정 파일 미존재"
            ## 흐음 흐음 
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SNMP 설정 파일($SNMP_CONF)을 찾을 수 없습니다.\",\"점검명령어\":\"ls -l $SNMP_CONF\",\"전체내용\":\"missing\"}")
        fi
    fi

    # [5] 최종 결과 출력 (화면)
    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}


###############################################################################################################################
function U-60() {
    local CHECK_ID="U-60"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="SNMP Community String 복잡성 설정"
    local EXPECTED_VAL="영문/숫자 10자 이상 또는 특수문자 포함 8자 이상 (public/private 사용 금지)"
    
    local STATUS="SAFE"
    local CURRENT_VAL="Community String 복잡성 기준 만족"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local SNMP_CONF="/etc/snmp/snmpd.conf"

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. SNMP 서비스 활성화 여부 확인
    if ! pgrep -x "snmpd" >/dev/null; then
        DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SNMP 서비스(snmpd)가 실행 중이지 않습니다.\",\"점검명령어\":\"pgrep -x snmpd\",\"전체내용\":\"not running\"}")
        #DETAILS_ARRAY+=("\"[참고] 서비스를 사용하지 않는 환경이 보안상 가장 안전합니다.\"")
    else
        #DETAILS_ARRAY+=("\"[서비스] 정보: SNMP 서비스(snmpd)가 실행 중입니다. 설정을 점검합니다.\"")

        if [ -f "$SNMP_CONF" ]; then
            # Community String 추출 (RedHat/Debian 스타일 통합 추출)
            local STRINGS_RHEL=$(grep -vE "^\s*#" "$SNMP_CONF" | grep "com2sec" | awk '{print $4}')
            local STRINGS_DEB=$(grep -vE "^\s*#" "$SNMP_CONF" | grep -E "rocommunity|rwcommunity" | awk '{print $2}')
            local ALL_STRINGS="$STRINGS_RHEL $STRINGS_DEB"

            if [ -z "$(echo $ALL_STRINGS | xargs)" ]; then
                :
                #DETAILS_ARRAY+=("\"[설정] 정보: 설정 파일 내 Community String 설정이 발견되지 않았습니다. (v3 전용 가능성)\"")
            else
                local WEAK_FOUND=0
                for COM_STR in $ALL_STRINGS; do
                    local LEN=${#COM_STR}
                    local IS_WEAK=0
                    local REASON=""

                    # [검사 1] 기본값 사용 여부
                    if [[ "$COM_STR" == "public" || "$COM_STR" == "private" ]]; then
                        IS_WEAK=1
                        REASON="기본값($COM_STR) 사용"
                    # [검사 2] 복잡도 및 길이 검사
                    else
                        # 특수문자 포함 여부 확인
                        if [[ "$COM_STR" =~ [^a-zA-Z0-9] ]]; then
                            if [ $LEN -lt 8 ]; then
                                IS_WEAK=1
                                REASON="특수문자 포함 8자 미만(현재: ${LEN}자)"
                            fi
                        else
                            if [ $LEN -lt 10 ]; then
                                IS_WEAK=1
                                REASON="영문/숫자 구성 10자 미만(현재: ${LEN}자)"
                            fi
                        fi
                    fi

                    # 결과 기록
                    if [ $IS_WEAK -eq 1 ]; then
                        WEAK_FOUND=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"발견된\",\"상태\":\"취약\",\"세부내용\":\"취약: 발견된 String: $COM_STR (사유: $REASON)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $SNMP_CONF | grep -E 'com2sec|rocommunity|rwcommunity' | grep '$COM_STR'\",\"전체내용\":\"$COM_STR\"}")
                    else
                        DETAILS_ARRAY+=("{\"점검항목\":\"발견된\",\"상태\":\"양호\",\"세부내용\":\"양호: 발견된 String: $COM_STR (복잡도 기준 만족)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $SNMP_CONF | grep -E 'com2sec|rocommunity|rwcommunity' | grep '$COM_STR'\",\"전체내용\":\"$COM_STR\"}")
                    fi
                done

                # 최종 판정
                if [ $WEAK_FOUND -eq 1 ]; then
                    IS_VULN=1
                    STATUS="VULNERABLE"
                    CURRENT_VAL="취약한 Community String 발견"
                    #DETAILS_ARRAY+=("\"[조치] vi $SNMP_CONF 수정 후 'systemctl restart snmpd'로 적용하십시오.\"")
                fi
            fi
        else
            IS_VULN=1
            STATUS="VULNERABLE"
            CURRENT_VAL="SNMP 설정 파일 미존재"
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SNMP 설정 파일($SNMP_CONF)을 찾을 수 없습니다.\"}")
        fi
    fi

    # 2. 최종 결과 출력 (화면)
    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}



##################################################################################################################################
function U-61() {
    local CHECK_ID="U-61"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="SNMP Access Control 설정"
    local EXPECTED_VAL="SNMP 서비스에 특정 IP/네트워크 접근 제어(ACL) 설정"
    
    local STATUS="SAFE"
    local CURRENT_VAL="SNMP 접근 제어 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local SNMP_CONF="/etc/snmp/snmpd.conf"

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. SNMP 서비스 활성화 여부 확인
    if ! pgrep -x "snmpd" >/dev/null; then
        DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SNMP 서비스(snmpd)가 실행 중이지 않습니다.\",\"점검명령어\":\"pgrep -x snmpd\",\"전체내용\":\"not running\"}")
        #DETAILS_ARRAY+=("\"[참고] 서비스를 사용하지 않는 환경이 보안상 가장 안전합니다.\"")
    else
        #DETAILS_ARRAY+=("\"[서비스] 정보: SNMP 서비스(snmpd)가 실행 중입니다. ACL 설정을 점검합니다.\"")

        if [ -f "$SNMP_CONF" ]; then
            local ACCESS_CONTROL_FOUND=0
            
            # 2. RedHat 계열 점검 (com2sec 설정 확인)
            # com2sec <NAME> <SOURCE> <COMMUNITY>
            local RHEL_CHECK=$(grep -vE "^\s*#" "$SNMP_CONF" | grep "com2sec")
            
            if [ -n "$RHEL_CHECK" ]; then
                # SOURCE 필드가 default나 0.0.0.0이 아닌 특정 IP/대역 설정 여부 확인
                if echo "$RHEL_CHECK" | grep -vE "default|0.0.0.0" >/dev/null; then
                    ACCESS_CONTROL_FOUND=1
                    local RHEL_SAMPLE=$(echo "$RHEL_CHECK" | grep -vE "default|0.0.0.0" | head -n 3 | sed 's/\"/\\\\\"/g')
                    DETAILS_ARRAY+=("{\"점검항목\":\"RedHat\",\"상태\":\"양호\",\"세부내용\":\"양호: RedHat 계열(com2sec) 접근 제어 확인\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $SNMP_CONF | grep 'com2sec'\",\"전체내용\":\"$RHEL_SAMPLE\"}")
                fi
            fi

            # 3. Debian 계열 점검 (rocommunity / rwcommunity 설정 확인)
            # rocommunity <COMMUNITY> [SOURCE IP] -> 컬럼 수가 3개 이상이어야 IP 지정됨
            local DEB_CHECK=$(grep -vE "^\s*#" "$SNMP_CONF" | grep -E "rocommunity|rwcommunity")
            
            if [ -n "$DEB_CHECK" ]; then
                while read -r LINE; do
                    local COL_CNT=$(echo "$LINE" | awk '{print NF}')
                    if [ "$COL_CNT" -ge 3 ]; then
                        ACCESS_CONTROL_FOUND=1
                        local LINE_ESC=$(echo "$LINE" | sed 's/\"/\\\\\"/g')
                        DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Debian 계열(ro/rwcommunity) 접근 제어 확인\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $SNMP_CONF | grep -E 'rocommunity|rwcommunity'\",\"전체내용\":\"$LINE_ESC\"}")
                    fi
                done <<< "$DEB_CHECK"
            fi

            # 4. 결과 판단
            if [ $ACCESS_CONTROL_FOUND -eq 1 ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 모든 SNMP 커뮤니티 설정에 IP 기반 접근 제어가 적용되어 있습니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $SNMP_CONF | grep -E 'com2sec|rocommunity|rwcommunity'\",\"전체내용\":\"see entries above\"}")
            else
                IS_VULN=1
                STATUS="VULNERABLE"
                CURRENT_VAL="SNMP 접근 제어(IP 제한) 설정 미흡"
                DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SNMP 서비스가 구동 중이나 모든 호스트(default)에 개방되어 있습니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $SNMP_CONF | grep -E 'com2sec|rocommunity|rwcommunity'\",\"전체내용\":\"\"}")
                #DETAILS_ARRAY+=("\"[조치] $SNMP_CONF 파일에서 com2sec 또는 rocommunity 뒤에 허용할 특정 IP/대역을 명시하십시오.\"")
                #DETAILS_ARRAY+=("\"[적용] 설정 변경 후 'systemctl restart snmpd' 명령으로 재시작이 필요합니다.\"")
            fi

        else
            IS_VULN=1
            STATUS="VULNERABLE"
            CURRENT_VAL="SNMP 설정 파일 미존재"
            DETAILS_ARRAY+=("{\"점검항목\":\"SNMP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SNMP 설정 파일($SNMP_CONF)을 찾을 수 없습니다.\",\"점검명령어\":\"ls -l $SNMP_CONF\",\"전체내용\":\"missing\"}")
        fi
    fi

    # 5. 최종 결과 출력 (화면)
    if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}



#####################################################################################################################################
function U-62() {
    local CHECK_ID="U-62"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="로그인 시 경고 메시지 설정"
    local EXPECTED_VAL="서버 및 주요 서비스(SSH, FTP, SMTP 등) 로그인 배너 설정 양호"
    
    local STATUS="SAFE"
    local CURRENT_VAL="주요 서비스 배너 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. OS 기본 배너 점검 (/etc/motd, /etc/issue)
    local MOTD_FILE="/etc/motd"
    local ISSUE_FILE="/etc/issue"
    
    if [ -s "$MOTD_FILE" ]; then
        local motd_preview=$(head -10 "$MOTD_FILE" 2>/dev/null | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/motd\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/motd 파일에 내용이 존재합니다.\",\"점검명령어\":\"cat $MOTD_FILE\",\"전체내용\":\"$motd_preview\"}")
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/motd\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/motd 파일이 비어있거나 없습니다.\",\"점검명령어\":\"ls -l $MOTD_FILE; cat $MOTD_FILE\",\"전체내용\":\"missing or empty\"}")
    fi

    if [ -s "$ISSUE_FILE" ]; then
        local issue_preview=$(head -10 "$ISSUE_FILE" 2>/dev/null | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/issue\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/issue 파일에 내용이 존재합니다.\",\"점검명령어\":\"cat $ISSUE_FILE\",\"전체내용\":\"$issue_preview\"}")
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/issue\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/issue 파일이 비어있거나 없습니다.\",\"점검명령어\":\"ls -l $ISSUE_FILE; cat $ISSUE_FILE\",\"전체내용\":\"missing or empty\"}")
    fi

    # 2. Telnet 배너 점검 (/etc/issue.net)
    if [ -s "/etc/issue.net" ]; then
        local issue_net_preview=$(head -10 /etc/issue.net 2>/dev/null | sed 's/\"/\\\\\"/g')
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/issue.net\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/issue.net 파일에 내용이 존재합니다.\",\"점검명령어\":\"cat /etc/issue.net\",\"전체내용\":\"$issue_net_preview\"}")
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/issue.net\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/issue.net 파일이 비어있거나 없습니다.\",\"점검명령어\":\"ls -l /etc/issue.net; cat /etc/issue.net\",\"전체내용\":\"missing or empty\"}")
    fi

    # 3. SSH 배너 점검 (/etc/ssh/sshd_config)
    local SSH_CONF="/etc/ssh/sshd_config"
    if [ -f "$SSH_CONF" ]; then
        local BANNER_LINE=$(grep -vE "^\s*#" "$SSH_CONF" | grep -i "^Banner" | head -n 1)
        if [ -n "$BANNER_LINE" ]; then
            local BANNER_FILE=$(echo "$BANNER_LINE" | awk '{print $2}')
            local banner_line_esc=$(echo "$BANNER_LINE" | sed 's/\"/\\\\\"/g')
            if [ -s "$BANNER_FILE" ]; then
                local banner_content=$(head -10 "$BANNER_FILE" 2>/dev/null | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"Banner\",\"상태\":\"양호\",\"세부내용\":\"양호: Banner 설정($BANNER_FILE) 및 내용 확인됨\",\"점검명령어\":\"grep -i '^Banner' $SSH_CONF | grep -vE '^[[:space:]]*#'; cat $BANNER_FILE\",\"전체내용\":\"$banner_line_esc\\n$banner_content\"}")
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"설정된\",\"상태\":\"취약\",\"세부내용\":\"취약: 설정된 배너 파일($BANNER_FILE)이 없거나 비어있습니다.\",\"점검명령어\":\"grep -i '^Banner' $SSH_CONF | grep -vE '^[[:space:]]*#'; ls -l $BANNER_FILE\",\"전체내용\":\"$banner_line_esc\"}")
            fi
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"SSH 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: sshd_config 내 Banner 설정이 누락되었습니다.\",\"점검명령어\":\"grep -i '^Banner' $SSH_CONF | grep -vE '^[[:space:]]*#'\",\"전체내용\":\"\"}")
        fi
    fi

    # 4. SMTP 배너 점검 (Sendmail, Postfix, Exim)
    # Sendmail
    if [ -f "/etc/mail/sendmail.cf" ]; then
        local smtp_greet=$(grep -vE "^\s*#" "/etc/mail/sendmail.cf" | grep "SmtpGreetingMessage" | head -3 | sed 's/\"/\\\\\"/g')
        if [ -n "$smtp_greet" ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SmtpGreetingMessage 설정됨\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' /etc/mail/sendmail.cf | grep 'SmtpGreetingMessage'\",\"전체내용\":\"$smtp_greet\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SmtpGreetingMessage 설정 누락\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' /etc/mail/sendmail.cf | grep 'SmtpGreetingMessage'\",\"전체내용\":\"\"}")
        fi
    fi
    # Postfix
    if [ -f "/etc/postfix/main.cf" ]; then
        local smtpd_banner=$(grep -vE "^\s*#" "/etc/postfix/main.cf" | grep "smtpd_banner" | head -3 | sed 's/\"/\\\\\"/g')
        if [ -n "$smtpd_banner" ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: smtpd_banner 설정됨\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' /etc/postfix/main.cf | grep 'smtpd_banner'\",\"전체내용\":\"$smtpd_banner\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: smtpd_banner 설정 누락\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' /etc/postfix/main.cf | grep 'smtpd_banner'\",\"전체내용\":\"\"}")
        fi
    fi

    # 5. FTP 배너 점검 (vsFTPd, ProFTPd)
    # vsFTPd
    local VSFTP_CONFS=("/etc/vsftpd.conf" "/etc/vsftpd/vsftpd.conf")
    for CONF in "${VSFTP_CONFS[@]}"; do
        if [ -f "$CONF" ]; then
            local ftpd_banner_line=$(grep -vE "^\s*#" "$CONF" | grep "ftpd_banner" | head -3 | sed 's/\"/\\\\\"/g')
            if [ -n "$ftpd_banner_line" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: ftpd_banner 설정됨\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $CONF | grep 'ftpd_banner'\",\"전체내용\":\"$ftpd_banner_line\"}")
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: ftpd_banner 설정 누락\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $CONF | grep 'ftpd_banner'\",\"전체내용\":\"\"}")
            fi
        fi
    done
    # ProFTPd
    local PROFTP_CONF="/etc/proftpd/proftpd.conf"
    [ ! -f "$PROFTP_CONF" ] && PROFTP_CONF="/etc/proftpd.conf"
    if [ -f "$PROFTP_CONF" ]; then
        local display_login=$(grep -vE "^\s*#" "$PROFTP_CONF" | grep -E "DisplayLogin|ServerIdent" | head -5 | sed 's/\"/\\\\\"/g')
        if [ -n "$display_login" ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 경고 메시지 설정 확인됨\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $PROFTP_CONF | grep -E 'DisplayLogin|ServerIdent'\",\"전체내용\":\"$display_login\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"DisplayLogin\",\"상태\":\"취약\",\"세부내용\":\"취약: DisplayLogin 또는 ServerIdent 설정 누락\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $PROFTP_CONF | grep -E 'DisplayLogin|ServerIdent'\",\"전체내용\":\"\"}")
        fi
    fi

    # 6. DNS 배너 점검 (BIND)
    local DNS_CONFS=("/etc/named.conf" "/etc/bind/named.conf.options")
    for CONF in "${DNS_CONFS[@]}"; do
        if [ -f "$CONF" ]; then
            local version_line=$(grep -vE "^\s*#" "$CONF" | grep -i "version" | head -3 | sed 's/\"/\\\\\"/g')
            if [ -n "$version_line" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"version(배너)\",\"상태\":\"양호\",\"세부내용\":\"양호: version(배너) 설정됨\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $CONF | grep -i 'version'\",\"전체내용\":\"$version_line\"}")
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"version\",\"상태\":\"취약\",\"세부내용\":\"취약: version 설정 누락\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $CONF | grep -i 'version'\",\"전체내용\":\"\"}")
            fi
        fi
    done

    # 7. 최종 결과 판정
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="일부 서비스 로그인 배너 설정 미흡"
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}



###########################################################################################################################
function U-63() {
    local CHECK_ID="U-63"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="sudo 명령어 접근 관리"
    local EXPECTED_VAL="/etc/sudoers 파일 소유자가 root이고, 권한이 640 이하(권장 440)"
    
    local STATUS="SAFE"
    local CURRENT_VAL="sudoers 파일 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local TARGET_FILE="/etc/sudoers"

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. 파일 존재 여부 확인
    if [ ! -f "$TARGET_FILE" ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"$TARGET_FILE\",\"상태\":\"양호\",\"세부내용\":\"양호: $TARGET_FILE 파일이 존재하지 않습니다. (sudo 패키지 미설치 추정)\",\"점검명령어\":\"ls -l $TARGET_FILE\",\"전체내용\":\"missing\"}")
    else
        # 2. 파일 정보 수집 (소유자 %U, 권한 %a)
        local FILE_OWNER=$(stat -c '%U' "$TARGET_FILE")
        local FILE_PERM=$(stat -c '%a' "$TARGET_FILE")
        local ls_line=$(ls -ld "$TARGET_FILE" 2>/dev/null | sed 's/\"/\\\\\"/g')

        #DETAILS_ARRAY+=("\"[정보] 대상 파일: $TARGET_FILE\"")
        #DETAILS_ARRAY+=("\"[정보] 현재 소유자: $FILE_OWNER / 현재 권한: $FILE_PERM\"")

        # 3. 상세 점검
        # [Check 1] 소유자 점검 (root 여부)
        if [ "$FILE_OWNER" != "root" ]; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 소유자가 root가 아닙니다.\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$ls_line\"}")
            #DETAILS_ARRAY+=("\"   >> 조치: chown root $TARGET_FILE\"")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 소유자가 root입니다.\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$ls_line\"}")
        fi

        # [Check 2] 권한 점검 (640 초과 여부)
        # 보안 가이드에 따라 440 또는 640 이하를 양호로 판단
        if [ "$FILE_PERM" -gt 640 ]; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 권한이 640을 초과합니다.\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$ls_line\"}")
            #DETAILS_ARRAY+=("\"   >> 조치: chmod 640 $TARGET_FILE (또는 440)\"")
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 권한이 640 이하입니다.\",\"점검명령어\":\"stat -c '%U %a' $TARGET_FILE; ls -ld $TARGET_FILE\",\"전체내용\":\"$ls_line\"}")
        fi

        # 4. 결과 종합
        if [ $IS_VULN -eq 0 ]; then
            :
            #DETAILS_ARRAY+=("\"[결과] 모든 설정이 기준을 만족합니다.\"")
        fi
    fi

    if [ $IS_VULN -eq 1 ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

   

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}



#######################################################################################################################
function U-64() {
    local CHECK_ID="U-64"
    local CATEGORY="패치 관리"
    local DESCRIPTION="주기적 보안 패치 및 벤더 권고사항 적용"
    local EXPECTED_VAL="최신 보안 패치 적용 및 시스템 업데이트 상태 유지"
    
    local STATUS="SAFE"
    local CURRENT_VAL="보안 패치 상태 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. OS 및 커널 버전 확인
    local OS_INFO=""
    local KERNEL_INFO=$(uname -sr)

    if command -v hostnamectl >/dev/null 2>&1; then
        OS_INFO=$(hostnamectl | grep "Operating System" | cut -d ':' -f 2 | xargs)
    elif [ -f "/etc/os-release" ]; then
        OS_INFO=$(grep PRETTY_NAME /etc/os-release | cut -d '"' -f 2)
    else
        OS_INFO="확인 불가"
    fi

    #DETAILS_ARRAY+=("\"[정보] OS Version: $OS_INFO\"")
    #DETAILS_ARRAY+=("\"[정보] Kernel Version: $KERNEL_INFO\"")

    # 2. 패키지 매니저를 통한 보안 패치 상태 점검
    local NEED_UPDATE=0
    
    if command -v dnf >/dev/null 2>&1; then
        # RHEL 8+, Rocky, Alma 등
        #DETAILS_ARRAY+=("\"[상태] dnf를 통한 보안 업데이트 확인 중...\"")
        local dnf_check=$(dnf check-update --security 2>&1 | head -20 | sed 's/\"/\\\\\"/g')
        dnf check-update --security >/dev/null 2>&1
        [ $? -eq 100 ] && NEED_UPDATE=1
        if [ $NEED_UPDATE -eq 1 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"보안패치 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 적용되지 않은 최신 보안 패치가 존재합니다.\",\"점검명령어\":\"dnf check-update --security\",\"전체내용\":\"$dnf_check\"}")
        fi
    elif command -v yum >/dev/null 2>&1; then
        # RHEL 7, CentOS 7 등
        #DETAILS_ARRAY+=("\"[상태] yum을 통한 보안 업데이트 확인 중...\"")
        local yum_check=$(yum check-update --security 2>&1 | head -20 | sed 's/\"/\\\\\"/g')
        yum check-update --security >/dev/null 2>&1
        [ $? -eq 100 ] && NEED_UPDATE=1
        if [ $NEED_UPDATE -eq 1 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"보안패치 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 적용되지 않은 최신 보안 패치가 존재합니다.\",\"점검명령어\":\"yum check-update --security\",\"전체내용\":\"$yum_check\"}")
        fi
    elif command -v apt-get >/dev/null 2>&1; then
        # Ubuntu, Debian 등
        #DETAILS_ARRAY+=("\"[상태] apt를 통한 보안 업데이트 확인 중...\"")
        local apt_check=$(apt-get -s upgrade 2>/dev/null | grep -i "security" | head -20 | sed 's/\"/\\\\\"/g')
        if apt-get -s upgrade 2>/dev/null | grep -qi "security"; then
            NEED_UPDATE=1
            DETAILS_ARRAY+=("{\"점검항목\":\"보안패치 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 적용되지 않은 최신 보안 패치가 존재합니다.\",\"점검명령어\":\"apt-get -s upgrade | grep -i 'security'\",\"전체내용\":\"$apt_check\"}")
        fi
    else
        IS_VULN=1
        ## DETAILS_ARRAY+=("\"취약(경고) : 패키지 매니저(dnf, yum, apt)를 찾을 수 없어 자동 점검이 불가능합니다.\"")
        DETAILS_ARRAY+=("{\"점검항목\":\"패키지 매니저를 통한 보안패치상태 점검\",\"상태\":\"취약\",\"세부내용\":\"취약(경고) : 패키지 매니저(dnf, yum, apt)를 찾을 수 없어 자동 점검이 불가능합니다.\",\"점검명령어\":\"command -v dnf; command -v yum; command -v apt-get\",\"전체내용\":\"not found\"}")
    fi

    # 3. 결과 판정
    if [ $NEED_UPDATE -eq 1 ]; then
        IS_VULN=1
        STATUS="VULNERABLE"
        CURRENT_VAL="미적용 보안 패치 존재"
        #DETAILS_ARRAY+=("\"[조치] 패키지 업데이트 수행 (예: dnf update --security 또는 apt upgrade)\"")
    elif [ $IS_VULN -eq 0 ]; then
        local pkg_mgr_cmd="dnf check-update --security || yum check-update --security || apt-get -s upgrade"
        DETAILS_ARRAY+=("{\"점검항목\":\"보안패치 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 시스템이 최신 보안 패치 상태를 유지하고 있습니다.\",\"점검명령어\":\"$pkg_mgr_cmd\",\"전체내용\":\"up to date\"}")
    fi

    # 4. 관리적 보안 사항 안내
    #DETAILS_ARRAY+=("\"[관리] 1. 사용 중인 OS가 기술지원 종료(EOL) 상태인지 확인하십시오.\"")
    #DETAILS_ARRAY+=("\"[관리] 2. 정기적인 패치 관리 절차 수립 및 이행 여부를 점검하십시오.\"")

    # [5] 최종 결과 출력 (화면)
    if [ "$STATUS" == "VULNERABLE" ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi
    

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}


############################################################################################################################
function U-65() {
    local CHECK_ID="U-65"
    local CATEGORY="로그 관리"
    local DESCRIPTION="NTP 및 시각 동기화 설정"
    local EXPECTED_VAL="Chrony 또는 NTP 서비스가 활성화되어 있고 동기화 서버가 설정되어 있음"
    
    local STATUS="SAFE"
    local CURRENT_VAL="시각 동기화 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local SYNC_FOUND=0

    echo "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # [1] Chrony 서비스 점검 (현대적인 Linux 표준)
    if command -v systemctl >/dev/null 2>&1; then
        if systemctl is-active chronyd 2>/dev/null | grep -q "active"; then
            SYNC_FOUND=1
            #DETAILS_ARRAY+=("\"[서비스] Chrony 서비스(chronyd)가 활성화되어 있습니다.\"")
            
            # 설정 파일 경로 탐색
            local CHRONY_CONF=""
            [ -f "/etc/chrony.conf" ] && CHRONY_CONF="/etc/chrony.conf"
            [ -f "/etc/chrony/chrony.conf" ] && CHRONY_CONF="/etc/chrony/chrony.conf"

            if [ -n "$CHRONY_CONF" ] && grep -vE "^\s*#" "$CHRONY_CONF" | grep -E "^server|^pool" >/dev/null; then
                #DETAILS_ARRAY+=("\"[설정] $CHRONY_CONF 내 동기화 서버(server/pool) 설정 확인\"")
                local chrony_servers=$(grep -vE "^\s*#" "$CHRONY_CONF" | grep -E "^server|^pool" | head -10 | sed 's/\"/\\\\\"/g')
                # 동기화 상태 정보 수집
                if command -v chronyc >/dev/null 2>&1; then
                    local CHRONY_STATUS=$(chronyc sources 2>/dev/null | tail -n +3 | head -n 3 | sed 's/\"/\\\\\"/g')
                    DETAILS_ARRAY+=("{\"점검항목\":\"NTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Chrony 서비스 구동 및 서버 설정 확인됨\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $CHRONY_CONF | grep -E '^server|^pool'; chronyc sources\",\"전체내용\":\"$chrony_servers\\n$CHRONY_STATUS\"}")
                else
                    DETAILS_ARRAY+=("{\"점검항목\":\"NTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Chrony 서비스 구동 및 서버 설정 확인됨\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $CHRONY_CONF | grep -E '^server|^pool'\",\"전체내용\":\"$chrony_servers\"}")
                fi
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"NTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Chrony 서비스는 구동 중이나 동기화 서버 설정이 누락되었습니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' ${CHRONY_CONF:-/etc/chrony.conf} | grep -E '^server|^pool'\",\"전체내용\":\"\"}")
            fi
        fi
    fi

    # [2] NTP 서비스 점검 (Chrony가 없거나 비활성인 경우)
    if [ $SYNC_FOUND -eq 0 ]; then
        if command -v systemctl >/dev/null 2>&1; then
            if systemctl is-active ntp 2>/dev/null | grep -q "active" || systemctl is-active ntpd 2>/dev/null | grep -q "active"; then
                SYNC_FOUND=1
                #DETAILS_ARRAY+=("\"[서비스] NTP 서비스(ntp/ntpd)가 활성화되어 있습니다.\"")

                if [ -f "/etc/ntp.conf" ] && grep -vE "^\s*#" "/etc/ntp.conf" | grep -E "^server|^pool" >/dev/null; then
                    #DETAILS_ARRAY+=("\"[설정] /etc/ntp.conf 내 동기화 서버 설정 확인\"")
                    local ntp_servers=$(grep -vE "^\s*#" "/etc/ntp.conf" | grep -E "^server|^pool" | head -10 | sed 's/\"/\\\\\"/g')
                    # 동기화 상태 정보 수집
                    if command -v ntpq >/dev/null 2>&1; then
                        local NTP_STATUS=$(ntpq -pn 2>/dev/null | tail -n +3 | head -n 3 | sed 's/\"/\\\\\"/g')
                        DETAILS_ARRAY+=("{\"점검항목\":\"NTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NTP 서비스 구동 및 서버 설정 확인됨\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' /etc/ntp.conf | grep -E '^server|^pool'; ntpq -pn\",\"전체내용\":\"$ntp_servers\\n$NTP_STATUS\"}")
                    else
                        DETAILS_ARRAY+=("{\"점검항목\":\"NTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NTP 서비스 구동 및 서버 설정 확인됨\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' /etc/ntp.conf | grep -E '^server|^pool'\",\"전체내용\":\"$ntp_servers\"}")
                    fi
                else
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"NTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: NTP 서비스는 구동 중이나 설정 파일에 서버 설정이 누락되었습니다.\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' /etc/ntp.conf | grep -E '^server|^pool'\",\"전체내용\":\"\"}")
                fi
            fi
        fi
    fi

    # [3] 서비스 미구동 시 최종 판단
    if [ $SYNC_FOUND -eq 0 ]; then
        IS_VULN=1
        STATUS="VULNERABLE"
        CURRENT_VAL="시각 동기화 서비스 미구동"
        DETAILS_ARRAY+=("{\"점검항목\":\"NTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Chrony 또는 NTP 서비스가 실행되고 있지 않습니다.\",\"점검명령어\":\"systemctl is-active chronyd; systemctl is-active ntp; systemctl is-active ntpd\",\"전체내용\":\"all inactive\"}")
        #DETAILS_ARRAY+=("\"[조치] chrony 또는 ntp 패키지를 설치하고 서비스를 활성화(systemctl enable --now) 하십시오.\"")
    elif [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="시각 동기화 서버 설정 미흡"
        # echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: chrony 또는 ntp 서비스의 서버설정이 잘되어있습니다.\",\"점검명령어\":\"systemctl is-active chronyd ntp ntpd; grep -vE '^[[:space:]]*#' /etc/chrony.conf /etc/ntp.conf | grep -E '^server|^pool'\",\"전체내용\":\"see entries above\"}")
        # echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    if [ "$STATUS" == "VULNERABLE" ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VAL="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi



    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}


###########################################################################################################################################
function U-66() {
    local CHECK_ID="U-66"
    local CATEGORY="로그 관리"
    local DESCRIPTION="정책에 따른 시스템 로깅 설정"
    local EXPECTED_VAL="*.info, authpriv, mail, cron, alert, emerg 등 주요 로그 설정이 가이드라인에 맞게 적용됨"
    
    local STATUS="SAFE"
    local CURRENT_VAL="시스템 로깅 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. 설정 파일 탐색
    local LOG_FILES="/etc/rsyslog.conf /etc/syslog.conf"
    [ -d "/etc/rsyslog.d" ] && LOG_FILES="$LOG_FILES /etc/rsyslog.d/*.conf"
    
    local TARGET_FILES=""
    for f in $LOG_FILES; do
        [ -f "$f" ] && TARGET_FILES="$TARGET_FILES $f"
    done

    if [ -z "$TARGET_FILES" ]; then
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"syslog/rsyslog\",\"상태\":\"취약\",\"세부내용\":\"취약: syslog/rsyslog 설정 파일을 찾을 수 없습니다.\",\"점검명령어\":\"ls -l /etc/rsyslog.conf /etc/syslog.conf; ls -ld /etc/rsyslog.d\",\"전체내용\":\"missing\"}")
    else
        #DETAILS_ARRAY+=("\"[정보] 점검 대상 파일: $TARGET_FILES\"")

        # 2. 주요 로깅 설정 점검 (rsyslog/syslog 설정 파일 분석)

        # 2-1) 전체 시스템 로그 (*.info) 및 중복 제외 설정 (Ubuntu/Debian은 /var/log/syslog도 양호)
        local INFO_OK=0
        local INFO_LINE=$(grep -vE "^\s*#" $TARGET_FILES | grep "\*\.info" | grep "/var/log/messages" | head -n 1)
        if [ -n "$INFO_LINE" ]; then
            if echo "$INFO_LINE" | grep -q "mail.none" && \
               echo "$INFO_LINE" | grep -q "authpriv.none" && \
               echo "$INFO_LINE" | grep -q "cron.none"; then
                INFO_OK=1
                local info_line_esc=$(echo "$INFO_LINE" | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"log/messages\",\"상태\":\"양호\",\"세부내용\":\"양호: (/var/log/messages 및 중복 제외 옵션 설정됨)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep '\\\\*\\\\.info' | grep '/var/log/messages'\",\"전체내용\":\"$info_line_esc\"}")
            fi
        fi
        if [ $INFO_OK -eq 0 ] && [[ "$OS_TYPE" =~ ^(debian|ubuntu)$ ]]; then
            local SYSLOG_LINE=$(grep -vE "^\s*#" $TARGET_FILES | grep -E "\*\.info|\*\.\*" | grep "/var/log/syslog" | head -n 1)
            if [ -n "$SYSLOG_LINE" ]; then
                INFO_OK=1
                local syslog_line_esc=$(echo "$SYSLOG_LINE" | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"log/syslog\",\"상태\":\"양호\",\"세부내용\":\"양호: (Ubuntu/Debian /var/log/syslog 설정됨)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep -E '\\\\*\\\\.info|\\\\*\\\\.\\\\*' | grep '/var/log/syslog'\",\"전체내용\":\"$syslog_line_esc\"}")
            fi
        fi
        if [ $INFO_OK -eq 0 ]; then
            IS_VULN=1
            if [ -z "$INFO_LINE" ] && [ -z "$SYSLOG_LINE" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"(설정\",\"상태\":\"취약\",\"세부내용\":\"취약: (설정 누락 또는 저장 경로 부적절)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep '\\\\*\\\\.info' | grep '/var/log/messages'; grep -vE '^[[:space:]]*#' $TARGET_FILES | grep -E '\\\\*\\\\.info|\\\\*\\\\.\\\\*' | grep '/var/log/syslog'\",\"전체내용\":\"\"}")
            elif [ -n "$INFO_LINE" ]; then
                local info_line_esc=$(echo "$INFO_LINE" | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"Cron 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: (mail/authpriv/cron 중복 제외 옵션 누락)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep '\\\\*\\\\.info' | grep '/var/log/messages'\",\"전체내용\":\"$info_line_esc\"}")
            fi
        fi

        # 2-2) 보안 로그 (authpriv) - Ubuntu/Debian은 /var/log/auth.log도 양호
        local AUTH_OK=0
        local auth_secure_line=$(grep -vE "^\s*#" $TARGET_FILES | grep "/var/log/secure" | grep -E "auth\.|authpriv\." | head -3 | sed 's/\"/\\\\\"/g')
        if [ -n "$auth_secure_line" ]; then
            AUTH_OK=1
            DETAILS_ARRAY+=("{\"점검항목\":\"log/secure\",\"상태\":\"양호\",\"세부내용\":\"양호: (/var/log/secure)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep '/var/log/secure' | grep -E 'auth\\\\.|authpriv\\\\.'\",\"전체내용\":\"$auth_secure_line\"}")
        fi
        if [ $AUTH_OK -eq 0 ] && [[ "$OS_TYPE" =~ ^(debian|ubuntu)$ ]]; then
            local auth_log_line=$(grep -vE "^\s*#" $TARGET_FILES | grep "/var/log/auth.log" | grep -E "auth\.|authpriv\." | head -3 | sed 's/\"/\\\\\"/g')
            if [ -n "$auth_log_line" ]; then
                AUTH_OK=1
                DETAILS_ARRAY+=("{\"점검항목\":\"log/auth.log\",\"상태\":\"양호\",\"세부내용\":\"양호: (Ubuntu/Debian /var/log/auth.log)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep '/var/log/auth.log' | grep -E 'auth\\\\.|authpriv\\\\.'\",\"전체내용\":\"$auth_log_line\"}")
            fi
        fi
        if [ $AUTH_OK -eq 0 ]; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"log/secure\",\"상태\":\"취약\",\"세부내용\":\"취약: (/var/log/secure 또는 auth.log 설정 누락)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep -E '/var/log/secure|/var/log/auth.log' | grep -E 'auth\\\\.|authpriv\\\\.'\",\"전체내용\":\"\"}")
        fi

        # 2-3) 메일 로그 (mail)
        local maillog_line=$(grep -vE "^\s*#" $TARGET_FILES | grep "/var/log/maillog" | grep "mail\." | head -3 | sed 's/\"/\\\\\"/g')
        if [ -n "$maillog_line" ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"log/maillog\",\"상태\":\"양호\",\"세부내용\":\"양호: (/var/log/maillog)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep '/var/log/maillog' | grep 'mail\\\\.'\",\"전체내용\":\"$maillog_line\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"log/maillog\",\"상태\":\"취약\",\"세부내용\":\"취약: (/var/log/maillog 설정 누락)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep '/var/log/maillog' | grep 'mail\\\\.'\",\"전체내용\":\"\"}")
        fi

        # 2-4) 크론 로그 (cron)
        local cron_line=$(grep -vE "^\s*#" $TARGET_FILES | grep "/var/log/cron" | grep "cron\." | head -3 | sed 's/\"/\\\\\"/g')
        if [ -n "$cron_line" ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"Cron 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: (/var/log/cron)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep '/var/log/cron' | grep 'cron\\\\.'\",\"전체내용\":\"$cron_line\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"Cron 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: (/var/log/cron 설정 누락)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep '/var/log/cron' | grep 'cron\\\\.'\",\"전체내용\":\"\"}")
        fi

        # 2-5) 비상 로그 (alert, emerg)
        local ALERT_OK=0
        local EMERG_OK=0
        local alert_line=$(grep -vE "^\s*#" $TARGET_FILES | grep "\*\.alert" | grep "/dev/console" | head -3 | sed 's/\"/\\\\\"/g')
        local emerg_line=$(grep -vE "^\s*#" $TARGET_FILES | grep "\*\.emerg" | awk '{print $2}' | grep "^\*$" | head -3 | sed 's/\"/\\\\\"/g')
        [ -n "$alert_line" ] && ALERT_OK=1
        [ -n "$emerg_line" ] && EMERG_OK=1

        if [ $ALERT_OK -eq 1 ] && [ $EMERG_OK -eq 1 ]; then
            local combined_lines="${alert_line}\n${emerg_line}"
            DETAILS_ARRAY+=("{\"점검항목\":\"(*.alert)\",\"상태\":\"양호\",\"세부내용\":\"양호: (*.alert /dev/console 및 *.emerg * 설정 확인)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep '\\\\*\\\\.alert' | grep '/dev/console'; grep -vE '^[[:space:]]*#' $TARGET_FILES | grep '\\\\*\\\\.emerg'\",\"전체내용\":\"$combined_lines\"}")
        else
            IS_VULN=1
            local alert_check=$(grep -vE "^\s*#" $TARGET_FILES | grep "\*\.alert" | head -3 | sed 's/\"/\\\\\"/g')
            local emerg_check=$(grep -vE "^\s*#" $TARGET_FILES | grep "\*\.emerg" | head -3 | sed 's/\"/\\\\\"/g')
            DETAILS_ARRAY+=("{\"점검항목\":\"(설정값)\",\"상태\":\"취약\",\"세부내용\":\"취약: (설정값 부적절)\",\"점검명령어\":\"grep -vE '^[[:space:]]*#' $TARGET_FILES | grep -E '\\\\*\\\\.alert|\\\\*\\\\.emerg'\",\"전체내용\":\"alert:$alert_check\\nemerg:$emerg_check\"}")
        fi
    fi

    # 3. 결과 판정 및 최종 상태 업데이트
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VAL="일부 로깅 설정 누락 또는 부적절"
        #DETAILS_ARRAY+=("\"[조치] 설정을 수정한 후 'systemctl restart rsyslog' 명령어로 서비스를 재시작하십시오.\"")
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    local DETAILS_JSON=$(Build_Details_JSON)
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
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
                local ls_log_line=$(ls -ld "$LOG_FILE" 2>/dev/null | sed 's/\"/\\\\\"/g')
                DETAILS_ARRAY+=("{\"점검항목\":\"$LOG_FILE\",\"상태\":\"취약\",\"세부내용\":\"취약: $LOG_FILE : $FILE_REASON\",\"점검명령어\":\"stat -c '%U %a' $LOG_FILE; ls -ld $LOG_FILE\",\"전체내용\":\"$ls_log_line\"}")
            fi
        done

        # 3. 결과 요약 기록
        if [ $IS_VULN -eq 0 ]; then
            local total_files=$(echo "$FIND_FILES" | wc -l)
            DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 모든 로그 파일의 소유자(root) 및 권한(644 이하) 설정이 적절합니다.\",\"점검명령어\":\"find $LOG_DIR -maxdepth 2 -type f -not -path '*/journal/*' -exec stat -c '%U %a %n' {} \\;\",\"전체내용\":\"checked $total_files files\"}")
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

# ----------------------------------------------------------
# 메인 실행부
# ----------------------------------------------------------

echo "점검 시작..."

# 점검 함수 실행
U-01
U-02
U-03
U-04
U-05
U-06
U-07
U-08
U-09
U-10
U-11
U-12
U-13
U-14
U-15
U-16
U-17
U-18
U-19
U-20
U-21
U-22
U-23
U-24
U-25
U-26
U-27
U-28
U-29
U-30
U-31
U-32
U-33
U-34
U-35
U-36
U-37
U-38
U-39
U-40
U-41
U-42
U-43
U-44
U-45
U-46
U-47
U-48
U-49
U-50
U-51
U-52
U-53
U-54
U-55
U-56
U-57
U-58
U-59
U-60
U-61
U-62
U-63
U-64
U-65
U-66
U-67

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0