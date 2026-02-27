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
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): Sendmail 실행 중 - PrivacyOptions 설정이 권장사항보다 느슨함\"}")
                ## DETAILS_ARRAY+=("\"양호(주의): Sendmail 실행 중 - PrivacyOptions 설정이 권장사항보다 느슨함\"")
            fi

            # relay-domains 파일 존재 및 내용 확인 (도메인이 등록되어 있으면 릴레이 허용임)
            if [ -f "/etc/mail/relay-domains" ] && [ -s "/etc/mail/relay-domains" ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Sendmail - /etc/mail/relay-domains에 허용 도메인이 설정되어 있음\"}")
            fi
        else
            ## DETAILS_ARRAY+=("\"양호(주의): Sendmail 실행 중이나 설정파일(/etc/mail/sendmail.cf)을 찾을 수 없음\"")
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): Sendmail 실행 중이나 설정파일(/etc/mail/sendmail.cf)을 찾을 수 없음\"}")
        fi
    fi

    # 2. Postfix 점검 (현대 리눅스 표준)
    if systemctl is-active postfix > /dev/null 2>&1 || pgrep master > /dev/null 2>&1; then
        if command -v postconf > /dev/null 2>&1; then
            # smtpd_recipient_restrictions 내 reject_unauth_destination 존재 여부 확인
            local recipient_restrictions=$(postconf smtpd_recipient_restrictions 2>/dev/null)
            if [[ ! "$recipient_restrictions" =~ "reject_unauth_destination" ]]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Postfix - smtpd_recipient_restrictions에 reject_unauth_destination 설정 누락\"}")
            fi

            # mynetworks에 모든 대역(0.0.0.0/0)이 포함되어 있는지 확인
            local mynetworks=$(postconf mynetworks 2>/dev/null)
            if [[ "$mynetworks" =~ "0.0.0.0/0" ]]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Postfix - mynetworks에 모든 대역(0.0.0.0/0) 릴레이 허용 설정 발견\"}")
            fi
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): Postfix 실행 중이나 postconf 명령어를 사용할 수 없음\"}")
            ## DETAILS_ARRAY+=("\"양호(주의): Postfix 실행 중이나 postconf 명령어를 사용할 수 없음\"")
        fi
    fi

    # 3. SMTP 포트 리스닝 확인 (서비스명과 별개로 포트가 열려있는지 확인)
    local smtp_listen=$(ss -tuln | grep -E ":25 |:465 |:587 ")
    if [ -n "$smtp_listen" ]; then
        :
        #DETAILS_ARRAY+=("\"정보: SMTP 관련 포트(25, 465, 587)가 현재 리스닝 상태입니다.\"")
    else
        # 서비스가 떠있지 않고 포트도 닫혀있다면 SAFE
        if [ $IS_VULN -eq 0 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: SMTP 서비스가 비활성화되어 있거나 포트가 닫혀 있습니다.\"}")
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
echo "점검 시작 (단일 항목: U-47)..."
U-47

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
