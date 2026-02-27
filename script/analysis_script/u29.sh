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



#########################여기까지 수정했음#############################################


# ----------------------------------------------------------
# 함수명: U-29
# 설명: /etc/hosts.lpd 파일 제거 및 권한 설정
# ----------------------------------------------------------
function U-29() {
    local CHECK_ID="U-29"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="hosts.lpd 파일 소유자 및 권한 설정"
    local EXPECTED_VAL="/etc/hosts.lpd 파일이 존재하지 않거나, 존재 시 소유자 root이고 권한 600 이하인 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    local TARGET_FILE="/etc/hosts.lpd"

    # [점검 1] 파일 존재 여부 확인
    if [ ! -f "$TARGET_FILE" ]; then
        STATUS="SAFE"
        CURRENT_VAL="/etc/hosts.lpd 파일 존재하지 않음"
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/hosts.lpd\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/hosts.lpd 파일이 존재하지 않습니다.\"}")

        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"

        # 배열을 JSON 형식으로 변환
        local DETAILS_JSON=$(Build_Details_JSON)

        # 공통 함수 호출
        Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
        return
    fi

    local owner_ok=0
    local perm_ok=0

    # [점검 2] 파일 소유자 확인
    local owner=$(stat -c '%U' "$TARGET_FILE" 2>/dev/null)
    local group=$(stat -c '%G' "$TARGET_FILE" 2>/dev/null)

    if [ "$owner" = "root" ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 소유자 root (${owner}:${group})\"}")
        owner_ok=1
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"소유자 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 소유자가 root가 아님 (${owner}:${group})\"}")
        IS_VULN=1
    fi

    # [점검 3] 파일 권한 확인 (600 이하)
    local perm=$(stat -c '%a' "$TARGET_FILE" 2>/dev/null)
    local symbolic=$(stat -c '%A' "$TARGET_FILE" 2>/dev/null)

    local owner_perm=${perm:0:1}
    local group_perm=${perm:1:1}
    local other_perm=${perm:2:1}

    # Owner는 6(rw-) 이하, Group과 Other는 0이어야 함
    if [ $owner_perm -le 6 ] && [ $group_perm -eq 0 ] && [ $other_perm -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 권한 ${perm} (${symbolic}) - 600 이하\"}")
        perm_ok=1
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"권한 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: 권한 ${perm} (${symbolic}) - 600 초과\"}")
        IS_VULN=1
    fi

    # [점검 4] 파일 내용 확인
    if [ -r "$TARGET_FILE" ]; then
        local line_count=$(wc -l < "$TARGET_FILE" 2>/dev/null)
        local content_lines=$(grep -v '^#' "$TARGET_FILE" | grep -v '^$' | wc -l)
        if [ $content_lines -gt 0 ]; then
            # 최대 5개 호스트만 표시
            local host_list=$(grep -v '^#' "$TARGET_FILE" | grep -v '^$' | head -5 | tr '\n' ', ' | sed 's/,$//')
        fi
    else
        :
        #DETAILS_ARRAY+=("\"양호(주의): 파일 읽기 권한 없음\"")
    fi

    # 최종 상태 및 현재 값 설정
    if [ $owner_ok -eq 1 ] && [ $perm_ok -eq 1 ]; then
        STATUS="SAFE"
        CURRENT_VAL="파일 존재, 소유자 root, 권한 ${perm}"
    else
        STATUS="VULNERABLE"
        if [ $owner_ok -eq 0 ] && [ $perm_ok -eq 0 ]; then
            CURRENT_VAL="파일 존재, 소유자: ${owner}, 권한: ${perm} (둘 다 부적합)"
        elif [ $owner_ok -eq 0 ]; then
            CURRENT_VAL="파일 존재, 소유자: ${owner} (부적합), 권한: ${perm} (적합)"
        else
            CURRENT_VAL="파일 존재, 소유자: root (적합), 권한: ${perm} (부적합)"
        fi
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
echo "점검 시작 (단일 항목: U-29)..."
U-29

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
