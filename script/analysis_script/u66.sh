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
        DETAILS_ARRAY+=("{\"점검항목\":\"syslog/rsyslog\",\"상태\":\"취약\",\"세부내용\":\"취약: syslog/rsyslog 설정 파일을 찾을 수 없습니다.\"}")
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
                DETAILS_ARRAY+=("{\"점검항목\":\"log/messages\",\"상태\":\"양호\",\"세부내용\":\"양호: (/var/log/messages 및 중복 제외 옵션 설정됨)\"}")
            fi
        fi
        if [ $INFO_OK -eq 0 ] && [[ "$OS_TYPE" =~ ^(debian|ubuntu)$ ]]; then
            local SYSLOG_LINE=$(grep -vE "^\s*#" $TARGET_FILES | grep -E "\*\.info|\*\.\*" | grep "/var/log/syslog" | head -n 1)
            if [ -n "$SYSLOG_LINE" ]; then
                INFO_OK=1
                DETAILS_ARRAY+=("{\"점검항목\":\"log/syslog\",\"상태\":\"양호\",\"세부내용\":\"양호: (Ubuntu/Debian /var/log/syslog 설정됨)\"}")
            fi
        fi
        if [ $INFO_OK -eq 0 ]; then
            IS_VULN=1
            if [ -z "$INFO_LINE" ] && [ -z "$SYSLOG_LINE" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"(설정\",\"상태\":\"취약\",\"세부내용\":\"취약: (설정 누락 또는 저장 경로 부적절)\"}")
            elif [ -n "$INFO_LINE" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"Cron 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: (mail/authpriv/cron 중복 제외 옵션 누락)\"}")
            fi
        fi

        # 2-2) 보안 로그 (authpriv) - Ubuntu/Debian은 /var/log/auth.log도 양호
        local AUTH_OK=0
        if grep -vE "^\s*#" $TARGET_FILES | grep "/var/log/secure" | grep -E "auth\.|authpriv\." >/dev/null; then
            AUTH_OK=1
            DETAILS_ARRAY+=("{\"점검항목\":\"log/secure\",\"상태\":\"양호\",\"세부내용\":\"양호: (/var/log/secure)\"}")
        fi
        if [ $AUTH_OK -eq 0 ] && [[ "$OS_TYPE" =~ ^(debian|ubuntu)$ ]]; then
            if grep -vE "^\s*#" $TARGET_FILES | grep "/var/log/auth.log" | grep -E "auth\.|authpriv\." >/dev/null; then
                AUTH_OK=1
                DETAILS_ARRAY+=("{\"점검항목\":\"log/auth.log\",\"상태\":\"양호\",\"세부내용\":\"양호: (Ubuntu/Debian /var/log/auth.log)\"}")
            fi
        fi
        if [ $AUTH_OK -eq 0 ]; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"log/secure\",\"상태\":\"취약\",\"세부내용\":\"취약: (/var/log/secure 또는 auth.log 설정 누락)\"}")
        fi

        # 2-3) 메일 로그 (mail)
        if grep -vE "^\s*#" $TARGET_FILES | grep "/var/log/maillog" | grep "mail\." >/dev/null; then
            DETAILS_ARRAY+=("{\"점검항목\":\"log/maillog\",\"상태\":\"양호\",\"세부내용\":\"양호: (/var/log/maillog)\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"log/maillog\",\"상태\":\"취약\",\"세부내용\":\"취약: (/var/log/maillog 설정 누락)\"}")
        fi

        # 2-4) 크론 로그 (cron)
        if grep -vE "^\s*#" $TARGET_FILES | grep "/var/log/cron" | grep "cron\." >/dev/null; then
            DETAILS_ARRAY+=("{\"점검항목\":\"Cron 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: (/var/log/cron)\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"Cron 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: (/var/log/cron 설정 누락)\"}")
        fi

        # 2-5) 비상 로그 (alert, emerg)
        local ALERT_OK=0
        local EMERG_OK=0
        grep -vE "^\s*#" $TARGET_FILES | grep "\*\.alert" | grep -q "/dev/console" && ALERT_OK=1
        grep -vE "^\s*#" $TARGET_FILES | grep "\*\.emerg" | awk '{print $2}' | grep -q "^\*$" && EMERG_OK=1

        if [ $ALERT_OK -eq 1 ] && [ $EMERG_OK -eq 1 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"(*.alert)\",\"상태\":\"양호\",\"세부내용\":\"양호: (*.alert /dev/console 및 *.emerg * 설정 확인)\"}")
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"(설정값)\",\"상태\":\"취약\",\"세부내용\":\"취약: (설정값 부적절)\"}")
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
echo "점검 시작 (단일 항목: U-66)..."
U-66

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
