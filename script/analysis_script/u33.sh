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
# 함수명: U-33
# 설명: 숨겨진 파일 및 디렉토리 점검
# ----------------------------------------------------------
function U-33() {
    local CHECK_ID="U-33"
    local CATEGORY="파일 및 디렉토리 관리"
    local DESCRIPTION="숨겨진 파일 및 디렉토리 검색 및 제거"
    local EXPECTED_VAL="의심스러운 숨김 파일이 존재하지 않는 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_HIDDEN=0
    local SUSPICIOUS_FILES=0
    local NORMAL_FILES=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 정상적인 숨김 파일/디렉토리 (화이트리스트)
    local WHITELIST_FILES=(
        ".bash_logout" ".bash_profile" ".bashrc" ".profile" ".cshrc"
        ".login" ".logout" ".zshrc" ".vimrc" ".vim" ".ssh" ".gnupg"
        ".cache" ".config" ".local" ".mozilla" ".thunderbird"
        ".ICEauthority" ".Xauthority" ".lesshst" ".bash_history"
        ".viminfo" ".mysql_history" ".python_history" ".wget-hsts"
        ".gitconfig" ".git" ".subversion" ".docker" ".npm" ".gem"
        ".cargo" ".rustup" ".gradle" ".m2" ".ansible" ".kube"
    )

    # 의심스러운 파일명 패턴
    local SUSPICIOUS_PATTERNS=(
        "\.\.\..*" ".*\.bak$" ".*~$" ".*\.tmp$" ".*\.swp$"
        ".*backdoor.*" ".*hack.*" ".*exploit.*" ".*shell.*"
        ".*payload.*" ".*rootkit.*"
    )

    # 화이트리스트 파일인지 확인
    is_whitelisted() {
        local filename=$1
        for white in "${WHITELIST_FILES[@]}"; do
            [ "$filename" = "$white" ] && return 0
        done
        return 1
    }

    # 의심스러운 패턴인지 확인
    is_suspicious_pattern() {
        local filename=$1
        for pattern in "${SUSPICIOUS_PATTERNS[@]}"; do
            if [[ "$filename" =~ $pattern ]]; then
                return 0
            fi
        done
        return 1
    }

    # [점검 1] 사용자 홈 디렉토리 내 숨김 파일 점검
    local home_dirs=$(find /home -maxdepth 1 -mindepth 1 -type d 2>/dev/null)

    while IFS= read -r homedir; do
        [ -z "$homedir" ] && continue

        local username=$(basename "$homedir")

        while IFS= read -r filepath; do
            [ -z "$filepath" ] && continue

            local filename=$(basename "$filepath")
            ((TOTAL_HIDDEN++))

            local file_perm=$(stat -c '%a' "$filepath" 2>/dev/null)
            local file_owner=$(stat -c '%U:%G' "$filepath" 2>/dev/null)
            local file_size=$(stat -c '%s' "$filepath" 2>/dev/null)

            # 화이트리스트 확인
            if is_whitelisted "$filename"; then
                ((NORMAL_FILES++))
                continue
            fi

            # 의심스러운 패턴 확인
            if is_suspicious_pattern "$filename"; then
                ((SUSPICIOUS_FILES++))
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"$username/$file\",\"상태\":\"취약\",\"세부내용\":\"취약: $username/$filename (크기: $file_size bytes, 권한: $file_perm, 소유자: $file_owner) - 의심 패턴\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$username/$file\",\"상태\":\"양호\",\"세부내용\":\"양호: (주의) $username/$filename (크기: $file_size bytes, 권한: $file_perm, 소유자: $file_owner)\"}")
            fi
 
        done < <(find "$homedir" -maxdepth 1 -name ".*" ! -name "." ! -name ".." 2>/dev/null)

    done <<< "$home_dirs"

    # [점검 2] 시스템 임시 디렉토리 내 숨김 파일 점검
    local check_dirs=("/tmp" "/var/tmp")

    for dir in "${check_dirs[@]}"; do
        local found_hidden=0

        while IFS= read -r filepath; do
            [ -z "$filepath" ] && continue

            found_hidden=1
            local filename=$(basename "$filepath")
            ((TOTAL_HIDDEN++))

            local file_perm=$(stat -c '%a' "$filepath" 2>/dev/null)
            local file_owner=$(stat -c '%U:%G' "$filepath" 2>/dev/null)
            local file_size=$(stat -c '%s' "$filepath" 2>/dev/null)

            if is_suspicious_pattern "$filename"; then
                ((SUSPICIOUS_FILES++))
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"$dir/$filename\",\"상태\":\"취약\",\"세부내용\":\"취약: $dir/$filename (소유자: $file_owner, 권한: $file_perm)\"}")
            else
                :
                DETAILS_ARRAY+=("{\"점검항목\":\"$dir/$filename\",\"상태\":\"양호\",\"세부내용\":\"양호: (주의) $dir/$filename (소유자: $file_owner, 권한: $file_perm)\"}")
            
            fi

        done < <(find "$dir" -maxdepth 1 -name ".*" ! -name "." ! -name ".." 2>/dev/null)

        if [ $found_hidden -eq 0 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"$dir\",\"상태\":\"양호\",\"세부내용\":\"양호: $dir - 숨김 파일 없음\"}")
        fi
    done

    # [점검 3] 루트(/) 디렉토리 내 숨김 파일 점검
    local root_hidden=0

    while IFS= read -r filepath; do
        [ -z "$filepath" ] && continue

        local filename=$(basename "$filepath")
        ((TOTAL_HIDDEN++))
        ((SUSPICIOUS_FILES++))
        IS_VULN=1
        root_hidden=1

        local file_perm=$(stat -c '%a' "$filepath" 2>/dev/null)
        local file_owner=$(stat -c '%U:%G' "$filepath" 2>/dev/null)

        DETAILS_ARRAY+=("{\"점검항목\":\"/$filename\",\"상태\":\"취약\",\"세부내용\":\"취약: /$filename (권한: $file_perm, 소유자: $file_owner) - 루트 디렉토리에 숨김 파일 존재\"}")

    done < <(find / -maxdepth 1 -name ".*" ! -name "." ! -name ".." -type f 2>/dev/null)

    if [ $root_hidden -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"양호\",\"세부내용\":\"양호: 루트 디렉토리에 숨김 파일 없음\"}")
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_HIDDEN -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="숨김 파일 없음"
    elif [ $SUSPICIOUS_FILES -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_HIDDEN}개 발견 (모두 정상, 의심 파일 없음)"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_HIDDEN}개 발견 (의심: ${SUSPICIOUS_FILES}개, 정상: ${NORMAL_FILES}개)"
    fi

    if [ $IS_VULN -eq 1 ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi
    
    
    
    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-33)..."
U-33

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
