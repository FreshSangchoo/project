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
        DETAILS_ARRAY+=("{\"점검항목\":\"NIS 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: 활성화된 NIS 서비스 발견 - (${ACTIVE_SVCS[*]})\"}")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NIS 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: NIS 관련 systemd 서비스가 비활성화 상태입니다.\"}")
    fi

    # 2. NIS 관련 프로세스 실행 여부 점검
    local NIS_PROCS=$(ps -ef | grep -E "ypserv|ypbind|yppasswdd|ypxfrd" | grep -v "grep")
    if [ -n "$NIS_PROCS" ]; then
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"NIS 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: NIS 관련 프로세스가 현재 실행 중입니다.\"}")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NIS 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: 실행 중인 NIS 관련 프로세스가 없습니다.\"}")
    fi

    # 3. NIS 설정 파일 및 도메인 설정 확인
    # /etc/yp.conf (클라이언트 설정), /etc/defaultdomain 존재 여부
    if [ -f "/etc/yp.conf" ] && [ -s "/etc/yp.conf" ]; then
        # 주석 제외 실질적 설정 내용 확인
        if grep -v '^#' /etc/yp.conf | grep -q '[^[:space:]]'; then
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"NIS 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/yp.conf 파일에 NIS 설정 내용이 존재합니다.\"}")
        fi
    fi

    if [ -f "/etc/defaultdomain" ]; then
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"NIS 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: /etc/defaultdomain 파일이 존재하여 NIS 도메인이 설정되어 있을 가능성이 있습니다.\"}")
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
echo "점검 시작 (단일 항목: U-43)..."
U-43

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
