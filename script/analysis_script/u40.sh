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


###############################################################################
# U-40
# 설명: NFS 접근 제어 설정 파일의 권한 및 보안 옵션(와일드카드, root_squash) 점검
###############################################################################
function U-40() {

    local CHECK_ID="U-40"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="NFS 접근 통제"
    local EXPECTED_VALUE="NFS 서비스 미사용 또는 /etc/exports 파일의 권한 적절 및 접근 제한(와일드카드 금지, root_squash 설정) 준수"

    local STATUS="SAFE"
    local CURRENT_VALUE="NFS 접근 통제 설정 양호"
    local DETAILS_ARRAY=()
    local IS_VULN=0
    local NFS_CONF="/etc/exports"
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 1. NFS 서비스 실행 여부 확인
    local NFS_RUNNING=0
    if ps -ef | grep -E "nfsd|nfs-server|rpc.nfsd" | grep -v grep > /dev/null; then
        NFS_RUNNING=1
    fi

    if [ $NFS_RUNNING -eq 1 ]; then
        # 2. 설정 파일(/etc/exports) 존재 및 권한 점검
        if [ -f "$NFS_CONF" ]; then
            local FILE_OWNER=$(stat -c '%U' "$NFS_CONF")
            local FILE_PERM=$(stat -c '%a' "$NFS_CONF")

            # 소유자 root 및 권한 644 이하 검사
            if [ "$FILE_OWNER" != "root" ] || [ "$FILE_PERM" -gt 644 ]; then
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $NFS_CONF 파일의 소유자 또는 권한이 부적절합니다. (조치: chown root:644)\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 설정 파일 권한 및 소유자 설정이 적절합니다.\"}")
            fi

            # 3. 설정 내용 상세 점검
            if [ -s "$NFS_CONF" ]; then
                
                # 3-1. 와일드카드(*) 점검 (모든 사용자 허용)
                if grep -vE "^\s*#" "$NFS_CONF" | grep -q "\*"; then
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 공유 설정에 와일드카드(*)가 포함되어 전역 접근이 허용됨\"}")
                fi

                # 3-2. no_root_squash 옵션 점검 (root 권한 탈취 위험)
                if grep -vE "^\s*#" "$NFS_CONF" | grep -q "no_root_squash"; then
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"'no_root_squash\",\"상태\":\"취약\",\"세부내용\":\"취약: 'no_root_squash' 옵션이 사용되어 root 권한 탈취 위험이 있음\"}")
                fi

                # 설정 파일 원본 내용을 상세 리스트에 기록
                while IFS= read -r line; do
                    if [ -n "$line" ]; then
                        local ESCAPED_LINE=$(echo "$line" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
                    fi
                done < "$NFS_CONF"
                
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"etc/exports\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/exports 파일이 비어 있어 공유 중인 자원이 없습니다.\"}")
            fi
        else
            IS_VULN=1
            DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: NFS 서비스가 구동 중이나 설정 파일($NFS_CONF)이 존재하지 않습니다.\"}")
        fi
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 서비스를 사용하고 있지 않습니다.\"}")
    fi

    # 4. 최종 결과 판단
    if [ $IS_VULN -eq 1 ]; then
        STATUS="VULNERABLE"
        CURRENT_VALUE="NFS 설정 파일 권한 부적절 또는 보안 옵션(와일드카드/root_squash) 미흡"
    else
        if [ $NFS_RUNNING -eq 0 ]; then
            CURRENT_VALUE="NFS 서비스 미사용"
        fi
    fi
    
    
     if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # DETAILS_ARRAY를 JSON 배열 문자열로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출을 통한 결과 기록
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" \
    "$STATUS" "$CURRENT_VALUE" "$EXPECTED_VALUE" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-40)..."
U-40

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
