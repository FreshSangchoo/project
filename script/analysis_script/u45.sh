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
                        DETAILS_ARRAY+=("{\"점검항목\":\"$svc\",\"상태\":\"취약\",\"세부내용\":\"취약: $svc 실행 중 - 취약 버전 발견 ($version)\"}")
                    else
                        WARNING_FLAG=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"$svc\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): $svc 실행 중 - 현재 버전($version) 최신 패치 여부 확인 필요\"}")
                        ## DETAILS_ARRAY+=("\"양호(주의): $svc 실행 중 - 현재 버전($version) 최신 패치 여부 확인 필요\"")
                    fi
                else
                    WARNING_FLAG=1
                    ## DETAILS_ARRAY+=("\"양호(주의): $svc 실행 중 - 버전 정보를 확인할 수 없음\"")
                    DETAILS_ARRAY+=("{\"점검항목\":\"$svc\",\"상태\":\"양호\",\"세부내용\":\"양호(주의): $svc 실행 중 - 버전 정보를 확인할 수 없음\"}")
                fi
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$svc\",\"상태\":\"양호\",\"세부내용\":\"양호: $svc 서비스 설치되어 있으나 비활성 상태\"}")
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
        DETAILS_ARRAY+=("{\"점검항목\":\"설치된\",\"상태\":\"양호\",\"세부내용\":\"양호: 설치된 메일 서비스가 없습니다.\"}")
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
echo "점검 시작 (단일 항목: U-45)..."
U-45

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
