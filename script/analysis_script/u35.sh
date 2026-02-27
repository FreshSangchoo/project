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
                DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: NFS 공유 설정 중 익명 접근 제한 옵션(all_squash) 누락 또는 no_root_squash 발견\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 서비스 실행 중이나 익명 접근 제한 설정됨\"}")
            fi
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 서비스 비활성화 상태\"}")
    fi

    # 2. Samba 서비스 점검
    if systemctl is-active smbd > /dev/null 2>&1 || systemctl is-active smb > /dev/null 2>&1; then
        local smb_conf="/etc/samba/smb.conf"
        [ ! -f "$smb_conf" ] && smb_conf="/etc/smb.conf"

        if [ -f "$smb_conf" ]; then
            if grep -qiE "guest ok.*=.*yes|map to guest.*=.*bad user|public.*=.*yes" "$smb_conf"; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"Samba 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: Samba 설정 중 guest ok 또는 public 등 익명 접근 허용 옵션 발견\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"Samba 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Samba 서비스 실행 중이나 익명 접근 제한 설정됨\"}")
            fi
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"Samba 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: Samba 서비스 비활성화 상태\"}")
    fi

    # 3. FTP(vsftpd) 서비스 점검
    if systemctl is-active vsftpd > /dev/null 2>&1; then
        local ftp_conf="/etc/vsftpd/vsftpd.conf"
        [ ! -f "$ftp_conf" ] && ftp_conf="/etc/vsftpd.conf"

        if [ -f "$ftp_conf" ]; then
            local anon_enable=$(grep -i "^anonymous_enable" "$ftp_conf" | cut -d'=' -f2 | tr -d ' ' | tail -1)
            if [[ "${anon_enable^^}" == "YES" ]]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: FTP 서비스(vsftpd)에서 익명 접근(anonymous_enable=YES) 허용됨\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 서비스 실행 중이나 익명 접근 차단됨\"}")
            fi
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"FTP 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: FTP 서비스 비활성화 상태\"}")
    fi

    # 4. TFTP 서비스 점검
    if systemctl is-active tftp > /dev/null 2>&1 || systemctl is-active tftp.socket > /dev/null 2>&1; then
        IS_VULN=1
        DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: TFTP 서비스 활성화 상태 (TFTP는 기본적으로 인증을 지원하지 않음)\"}")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: TFTP 서비스 비활성화 상태\"}")
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
echo "점검 시작 (단일 항목: U-35)..."
U-35

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
