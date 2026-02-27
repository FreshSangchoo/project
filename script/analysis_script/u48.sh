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
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Sendmail - goaway 옵션으로 모든 정보 노출 명령이 제한됨\"}")
            elif [[ "$privacy_opt" =~ "noexpn" && "$privacy_opt" =~ "novrfy" ]]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Sendmail - noexpn 및 novrfy 옵션이 설정됨\"}")
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Sendmail - PrivacyOptions에 noexpn 또는 novrfy 설정 누락\"}")
            fi
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): Sendmail 실행 중이나 설정 파일(/etc/mail/sendmail.cf)이 없음\"}")
            ## DETAILS_ARRAY+=("\"양호(주의): Sendmail 실행 중이나 설정 파일(/etc/mail/sendmail.cf)이 없음\"")
        fi
    fi

    # 2. Postfix 점검
    if systemctl is-active postfix > /dev/null 2>&1 || pgrep master > /dev/null 2>&1; then
        if command -v postconf > /dev/null 2>&1; then
            local disable_vrfy=$(postconf -h disable_vrfy_command 2>/dev/null)

            # Postfix는 기본적으로 EXPN을 지원하지 않으며, VRFY만 제어함
            if [ "$disable_vrfy" == "yes" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Postfix - disable_vrfy_command = yes 로 설정됨\"}")
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Postfix - disable_vrfy_command 가 no이거나 기본값(활성)임\"}")
            fi
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): Postfix 실행 중이나 postconf 명령을 사용할 수 없음\"}")
            ## DETAILS_ARRAY+=("\"양호(주의): Postfix 실행 중이나 postconf 명령을 사용할 수 없음\"")
        fi
    fi

    # 3. 실제 포트 오픈 여부 및 수동 확인 정보 추가
    if ss -tuln | grep -q ":25 "; then
        :
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
            DETAILS_ARRAY+=("{\"점검항목\":\"SMTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 점검 대상 SMTP 서비스(Sendmail, Postfix)가 감지되지 않음\"}")
        else
            CURRENT_VAL="모든 SMTP 서비스에서 EXPN/VRFY 명령어가 적절히 제한됨"
        fi
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-48)..."
U-48

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
