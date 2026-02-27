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




#####################################################################################################################################
function U-62() {
    local CHECK_ID="U-62"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="로그인 시 경고 메시지 설정"
    local EXPECTED_VAL="서버 및 주요 서비스(SSH, FTP, SMTP 등) 로그인 배너 설정 양호"
    
    local STATUS="SAFE"
    local CURRENT_VAL="모든 서비스 배너 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0

    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. OS 기본 배너 점검 (/etc/motd, /etc/issue)
    local MOTD_FILE="/etc/motd"
    local ISSUE_FILE="/etc/issue"
    
    if [ -s "$MOTD_FILE" ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/motd\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/motd 파일에 내용이 존재합니다.\"}")
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/motd\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/motd 파일이 비어있거나 없습니다.\"}")
    fi

    if [ -s "$ISSUE_FILE" ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/issue\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/issue 파일에 내용이 존재합니다.\"}")
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/issue\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/issue 파일이 비어있거나 없습니다.\"}")
    fi

    # 2. Telnet 배너 점검 (/etc/issue.net)
    if [ -s "/etc/issue.net" ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/issue.net\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/issue.net 파일에 내용이 존재합니다.\"}")
    else
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/issue.net\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/issue.net 파일이 비어있거나 없습니다.\"}")
    fi

    # 3. SSH 배너 점검 (/etc/ssh/sshd_config)
    local SSH_CONF="/etc/ssh/sshd_config"
    if [ -f "$SSH_CONF" ]; then
        local BANNER_LINE=$(grep -vE "^\s*#" "$SSH_CONF" | grep -i "^Banner" | head -n 1)
        if [ -n "$BANNER_LINE" ]; then
            local BANNER_FILE=$(echo "$BANNER_LINE" | awk '{print $2}')
            if [ -s "$BANNER_FILE" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"Banner\",\"상태\":\"양호\",\"세부내용\":\"양호: Banner 설정($BANNER_FILE) 및 내용 확인됨\"}")
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"설정된\",\"상태\":\"취약\",\"세부내용\":\"취약: 설정된 배너 파일($BANNER_FILE)이 없거나 비어있습니다.\"}")
            fi
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"SSH 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: sshd_config 내 Banner 설정이 누락되었습니다.\"}")
        fi
    fi

    # 4. SMTP 배너 점검 (Sendmail, Postfix, Exim)
    # Sendmail
    if [ -f "/etc/mail/sendmail.cf" ]; then
        if grep -vE "^\s*#" "/etc/mail/sendmail.cf" | grep -q "SmtpGreetingMessage"; then
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SmtpGreetingMessage 설정됨\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: SmtpGreetingMessage 설정 누락\"}")
        fi
    fi
    # Postfix
    if [ -f "/etc/postfix/main.cf" ]; then
        if grep -vE "^\s*#" "/etc/postfix/main.cf" | grep -q "smtpd_banner"; then
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: smtpd_banner 설정됨\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: smtpd_banner 설정 누락\"}")
        fi
    fi

    # 5. FTP 배너 점검 (vsFTPd, ProFTPd)
    # vsFTPd
    local VSFTP_CONFS=("/etc/vsftpd.conf" "/etc/vsftpd/vsftpd.conf")
    for CONF in "${VSFTP_CONFS[@]}"; do
        if [ -f "$CONF" ]; then
            if grep -vE "^\s*#" "$CONF" | grep -q "ftpd_banner"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: ftpd_banner 설정됨\"}")
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: ftpd_banner 설정 누락\"}")
            fi
        fi
    done
    # ProFTPd
    local PROFTP_CONF="/etc/proftpd/proftpd.conf"
    [ ! -f "$PROFTP_CONF" ] && PROFTP_CONF="/etc/proftpd.conf"
    if [ -f "$PROFTP_CONF" ]; then
        if grep -vE "^\s*#" "$PROFTP_CONF" | grep -E "DisplayLogin|ServerIdent" >/dev/null; then
            DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 경고 메시지 설정 확인됨\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"DisplayLogin\",\"상태\":\"취약\",\"세부내용\":\"취약: DisplayLogin 또는 ServerIdent 설정 누락\"}")
        fi
    fi

    # 6. DNS 배너 점검 (BIND)
    local DNS_CONFS=("/etc/named.conf" "/etc/bind/named.conf.options")
    for CONF in "${DNS_CONFS[@]}"; do
        if [ -f "$CONF" ]; then
            if grep -vE "^\s*#" "$CONF" | grep -q "version"; then
                DETAILS_ARRAY+=("{\"점검항목\":\"version(배너)\",\"상태\":\"양호\",\"세부내용\":\"양호: version(배너) 설정됨\"}")
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"version\",\"상태\":\"취약\",\"세부내용\":\"취약: version 설정 누락\"}")
         
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
echo "점검 시작 (단일 항목: U-62)..."
U-62

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
