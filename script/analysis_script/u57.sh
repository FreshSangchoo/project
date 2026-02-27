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
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 서비스가 실행 중이지 않습니다.\"}")
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
                        DETAILS_ARRAY+=("{\"점검항목\":\"$USER_LIST\",\"상태\":\"양호\",\"세부내용\":\"양호: $USER_LIST 파일에 root 가 등록되어 차단 중입니다.\"}")
                    else
                        IS_VULN=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"$USER_LIST\",\"상태\":\"취약\",\"세부내용\":\"취약: $USER_LIST 파일에 root 가 없거나 주석 처리되어 있습니다.\"}")
                    fi
                else
                    # Case: userlist_enable=NO (ftpusers 파일 점검)
                    local FTP_USERS="/etc/vsftpd/ftpusers"
                    [ ! -f "$FTP_USERS" ] && FTP_USERS="/etc/ftpusers"

                    #DETAILS_ARRAY+=("\"[vsFTP] userlist_enable=NO(기본) 확인됨. $FTP_USERS 파일을 점검합니다.\"")
                    if [ -f "$FTP_USERS" ] && grep -E "^root" "$FTP_USERS" >/dev/null; then
                        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $FTP_USERS 파일에 root 가 등록되어 차단 중입니다.\"}")
                    else
                        IS_VULN=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $FTP_USERS 파일에 root 가 없거나 주석 처리되어 있습니다.\"}")
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
                        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $FTP_USERS 파일에 root 가 등록되어 있습니다.\"}")
                    else
                        IS_VULN=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $FTP_USERS 파일에 root 가 없거나 주석 처리되어 있습니다.\"}")
                    fi
                else
                    # UseFtpUsers off 인 경우 RootLogin off 설정을 확인해야 함
                    local ROOT_LOG=$(grep -vE "^\s*#" "$PROFTP_CONF" | grep -i "RootLogin" | awk '{print $2}')
                    #DETAILS_ARRAY+=("\"[ProFTP] UseFtpUsers=off 확인됨. RootLogin 설정을 점검합니다.\"")
                    if [[ "${ROOT_LOG,,}" == "off" ]]; then
                        DETAILS_ARRAY+=("{\"점검항목\":\"RootLogin\",\"상태\":\"양호\",\"세부내용\":\"양호: RootLogin off 설정이 확인되었습니다.\"}")
                    else
                        IS_VULN=1
                        DETAILS_ARRAY+=("{\"점검항목\":\"RootLogin이\",\"상태\":\"취약\",\"세부내용\":\"취약: RootLogin이 off로 설정되어 있지 않습니다.\"}")
                    fi
                fi
            fi

        # --- C. 기타/기본 FTP 점검 ---
        else
            #DETAILS_ARRAY+=("\"[기타] 일반 FTP 서비스가 감지되었습니다. 기본 ftpusers 파일을 점검합니다.\"")
            local BASIC_FTPU="/etc/ftpusers"
            [ ! -f "$BASIC_FTPU" ] && BASIC_FTPU="/etc/ftpd/ftpusers"

            if [ -f "$BASIC_FTPU" ] && grep -E "^root" "$BASIC_FTPU" >/dev/null; then
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $BASIC_FTPU 파일에 root 가 등록되어 있습니다.\"}")
            else
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $BASIC_FTPU 파일에 root 가 없거나 주석 처리되어 있습니다.\"}")
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
echo "점검 시작 (단일 항목: U-57)..."
U-57

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
