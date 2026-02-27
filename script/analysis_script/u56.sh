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
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 서비스가 구동 중이지 않습니다. (점검 제외)\"}")
    else
        # 공통 함수: 파일 권한 및 소유자 점검 (기준: root 소유, 640 이하)
        check_file_perm() {
            local FPATH=$1
            local DESC=$2
            if [ -f "$FPATH" ]; then
                local F_OWNER=$(stat -c "%U" "$FPATH")
                local F_PERM=$(stat -c "%a" "$FPATH")
                
                # 소유자 root, 권한 640 이하(600, 400 등 허용, 644는 취약)
                if [ "$F_OWNER" != "root" ] || [ "$F_PERM" -gt 640 ]; then
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $FPATH (소유자: $F_OWNER, 권한: $F_PERM) -> root, 640 이하 필요\"}")
                else
                    DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $FPATH (소유자: root, 권한: $F_PERM)\"}")
                fi
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$FPATH\",\"상태\":\"양호\",\"세부내용\":\"양호: $FPATH 파일이 존재하지 않습니다.\"}")
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
                         DETAILS_ARRAY+=("{\"점검항목\":\"<Limit\",\"상태\":\"양호\",\"세부내용\":\"양호: <Limit LOGIN> 설정이 존재합니다.\"}")
                    else
                         IS_VULN=1
                         DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: UseFtpUsers=OFF 이나 <Limit LOGIN> 설정이 없습니다.\"}")
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
        # -------------------------------------
--------------------
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
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: ftpusers/user_list 파일의 권한(640 초과) 또는 소유자(비 root) 설정이 발견되었습니다.\"}")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 접근 제어 파일 및 설정이 적절합니다.\"}")
        
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
echo "점검 시작 (단일 항목: U-56)..."
U-56

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
