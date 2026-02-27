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
        dnf check-update --security >/dev/null 2>&1
        [ $? -eq 100 ] && NEED_UPDATE=1
    elif command -v yum >/dev/null 2>&1; then
        # RHEL 7, CentOS 7 등
        #DETAILS_ARRAY+=("\"[상태] yum을 통한 보안 업데이트 확인 중...\"")
        yum check-update --security >/dev/null 2>&1
        [ $? -eq 100 ] && NEED_UPDATE=1
    elif command -v apt-get >/dev/null 2>&1; then
        # Ubuntu, Debian 등
        #DETAILS_ARRAY+=("\"[상태] apt를 통한 보안 업데이트 확인 중...\"")
        if apt-get -s upgrade 2>/dev/null | grep -qi "security"; then
            NEED_UPDATE=1
        fi
    else
        IS_VULN=1
        ## DETAILS_ARRAY+=("\"취약(경고) : 패키지 매니저(dnf, yum, apt)를 찾을 수 없어 자동 점검이 불가능합니다.\"")
        DETAILS_ARRAY+=("{\"점검항목\":\"패키지 매니저를 통한 보안패치상태 점검\",\"상태\":\"취약\",\"세부내용\":\"취약(경고) : 패키지 매니저(dnf, yum, apt)를 찾을 수 없어 자동 점검이 불가능합니다.\"}")
    fi

    # 3. 결과 판정
    if [ $NEED_UPDATE -eq 1 ]; then
        IS_VULN=1
        STATUS="VULNERABLE"
        CURRENT_VAL="미적용 보안 패치 존재"
        DETAILS_ARRAY+=("{\"점검항목\":\"보안패치 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 적용되지 않은 최신 보안 패치가 존재합니다.\"}")
        #DETAILS_ARRAY+=("\"[조치] 패키지 업데이트 수행 (예: dnf update --security 또는 apt upgrade)\"")
    elif [ $IS_VULN -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"보안패치 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 시스템이 최신 보안 패치 상태를 유지하고 있습니다.\"}")
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
echo "점검 시작 (단일 항목: U-64)..."
U-64

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
