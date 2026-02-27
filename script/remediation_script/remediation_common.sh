#!/bin/bash
# UTF-8 display for Korean
export LANG=ko_KR.UTF-8 2>/dev/null || export LANG=en_US.UTF-8 2>/dev/null || true
export TZ=Asia/Seoul

###############################################################################
# 공통 헤더: 개별/통합 조치 스크립트 공유 (환경, OS, JSON 헬퍼, generate_json_output)
# Target OS: Rocky Linux 9.7/10.1, Ubuntu 22.04/24.04/25.04
###############################################################################

RESULT_JSON="${RESULT_JSON:-remediation_result.json}"
# root가 아니면 /tmp 사용 (mkdir /root 시 Permission denied 방지)
if [ "$(id -u)" -eq 0 ] 2>/dev/null; then
    BACKUP_BASE="${BACKUP_BASE:-/root/security_backup/$(date +%Y%m%d)}"
else
    BACKUP_BASE="${BACKUP_BASE:-/tmp/security_backup/$(date +%Y%m%d)}"
fi
HOSTNAME="${HOSTNAME:-$(hostname)}"
mkdir -p "$BACKUP_BASE"

# OS 감지 + 로그용 표기(타입+버전)
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_TYPE=$ID
    OS_VERSION=$VERSION_ID
    [ -n "$OS_VERSION" ] && OS_DISPLAY="$OS_TYPE $OS_VERSION" || OS_DISPLAY="$OS_TYPE"
else
    OS_DISPLAY="${OS_TYPE:-unknown}"
fi

# ----------------------------------------------------------
# JSON 문자열 이스케이프 (따옴표, 백슬래시, 줄바꿈)
# ----------------------------------------------------------
json_escape() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g'
}

# ----------------------------------------------------------
# pre/post 값 가독성 향상(정규화)
# ----------------------------------------------------------
normalize_prepost_value() {
    local v="$1"
    v="$(printf '%s' "$v" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    case "$v" in
        "Vulnerable State") echo "취약(가이드 미준수)"; return 0 ;;
        "Vulnerable") echo "취약"; return 0 ;;
        "Policy Applied") echo "정책 적용(가이드 준수)"; return 0 ;;
        "Safe"|"SAFE") echo "양호"; return 0 ;;
        "Remediated") echo "조치 완료"; return 0 ;;
        "Standard Applied") echo "표준 적용 완료"; return 0 ;;
        "File Not Found") echo "파일 없음(해당없음)"; return 0 ;;
        "Directory Not Found") echo "디렉터리 없음(해당없음)"; return 0 ;;
        "N/A") echo "해당없음"; return 0 ;;
    esac
    if [[ "$v" =~ ^Owner:[[:space:]]*([^,]+),[[:space:]]*Perm:[[:space:]]*([0-9]{3,4}) ]]; then
        echo "소유자 ${BASH_REMATCH[1]}, 권한 ${BASH_REMATCH[2]}"
        return 0
    fi
    if [[ "$v" =~ ^root[[:space:]]*/[[:space:]]*([0-9]{3,4})$ ]]; then
        echo "소유자 root, 권한 ${BASH_REMATCH[1]}"
        return 0
    fi
    echo "$v"
}

# ----------------------------------------------------------
# 항목 하나에 대한 details 객체 JSON (한글 키)
# ----------------------------------------------------------
build_detail_obj() {
    local bf=$(json_escape "$1")
    local rc=$(json_escape "$2")
    local af=$(json_escape "$3")
    local st=$(json_escape "$4")
    local log=$(json_escape "$5")
    echo "{\"조치 전 상태\":\"$bf\",\"조치 명령어\":\"$rc\",\"조치 후 상태\":\"$af\",\"조치 결과\":\"$st\",\"세부 내역\":\"$log\"}"
}

# ----------------------------------------------------------
# 항목 하나에 대한 상세 로그 JSON (양호/취약 구분, 실제 코드 표시)
# $1: 초기 상태 판정 (양호|취약|해당없음)
# $2: 조치 전 상태 (실제 코드/설정 내용, cat·grep 등으로 확인한 값)
# $3: 조치 명령어 (양호면 " ", 취약이면 실제 실행한 명령어)
# $4: 조치 후 상태 (실제 코드/설정 내용)
# $5: 상세정보 (예: "기존 양호여서 조치 없음", "조치후 양호 전환", "조치 후 계속 취약")
# $6: 판정 기준 (선택, 있으면 "초기 상태 판정" 값에 " (기준: ...)" 형태로 붙임)
# ----------------------------------------------------------
build_detail_obj_full() {
    local judge="$1"
    local criteria="${6:-}"
    if [ -n "$criteria" ]; then
        judge="${judge} (기준: ${criteria})"
    fi
    judge=$(json_escape "$judge")
    local before=$(json_escape "$2")
    local cmd=$(json_escape "$3")
    local after=$(json_escape "$4")
    local info=$(json_escape "$5")
    echo "{\"초기 상태 판정\":\"$judge\",\"조치 전 상태\":\"$before\",\"조치 명령어\":\"$cmd\",\"조치 후 상태\":\"$after\",\"상세정보\":\"$info\"}"
}
# 서브쉘(예: $(build_detail_obj_full ...))에서 사용하려면 export 필요
export -f json_escape build_detail_obj_full 2>/dev/null || true

# ----------------------------------------------------------
# generate_json_output (통합조치와 동일)
# ----------------------------------------------------------
function generate_json_output() {
    local CHECK_ID=$1
    local CATEGORY=$2
    local DESCRIPTION=$3
    local STATUS=$4
    local PRE_VALUE=$5
    local POST_VALUE=$6
    local BACKUP=$7
    local DETAILS=$8
    local DETAILS_OR_ARRAY="${9:-}"

    local DETAILS_ESCAPED
    DETAILS_ESCAPED=$(echo "$DETAILS" | sed ':a;N;$!ba;s/\n/\\n/g' | sed 's/"/\\"/g')
    local REMEDY_ESCAPED
    REMEDY_ESCAPED=$(echo "$DETAILS_OR_ARRAY" | sed ':a;N;$!ba;s/\n/\\n/g' | sed 's/"/\\"/g' 2>/dev/null)
    local PRE_NORM; PRE_NORM="$(normalize_prepost_value "$PRE_VALUE")"
    local POST_NORM; POST_NORM="$(normalize_prepost_value "$POST_VALUE")"
    local PRE_ESC=$(json_escape "$PRE_NORM")
    local POST_ESC=$(json_escape "$POST_NORM")

    local DETAIL_LOG="$DETAILS_ESCAPED"
    if [ "$STATUS" = "VULNERABLE" ] || [ "$STATUS" = "ERROR" ] || [ "$STATUS" = "FAILED" ]; then
        DETAIL_LOG="조치에 실패했습니다."
    elif [ "$STATUS" = "SAFE" ] || [ "$STATUS" = "SUCCESS" ]; then
        if ! echo "$DETAILS" | grep -qE "조치 완료|조치:|적용하였|적용했습니다|변경 완료|설정 완료|✓"; then
            DETAIL_LOG="원래부터 양호였습니다."
        fi
    fi

    if [[ "$DETAILS_OR_ARRAY" != "["* ]]; then
        local _lines=()
        while IFS= read -r _ln; do
            [ -z "$(printf '%s' "$_ln" | tr -d '[:space:]')" ] && continue
            echo "$_ln" | grep -qE '^-{2,}$|^---' && continue
            _lines+=("$_ln")
        done <<< "$DETAILS"
        if [ "${#_lines[@]}" -ge 2 ]; then
            local _auto="["
            local _i=0
            for _ln in "${_lines[@]}"; do
                [ $_i -gt 0 ] && _auto+=","
                _auto+="$(build_detail_obj "$PRE_NORM" "" "$POST_NORM" "$STATUS" "$_ln")"
                _i=$((_i+1))
            done
            _auto+="]"
            DETAILS_OR_ARRAY="$_auto"
        fi
    fi

    if [ "$(wc -l < "$RESULT_JSON")" -gt 1 ]; then
        sed -i '$s/$/,/' "$RESULT_JSON"
    fi

    if [[ "$DETAILS_OR_ARRAY" == "["* ]]; then
        cat <<EOF >> "$RESULT_JSON"
{
  "check_id": "$CHECK_ID",
  "category": "$CATEGORY",
  "description": "$DESCRIPTION",
  "hostname": "$HOSTNAME",
  "os_type": "$OS_DISPLAY",
  "timestamp": "$(date '+%Y-%m-%d %H:%M:%S')",
  "status": "$STATUS",
  "pre_value": "$PRE_ESC",
  "post_value": "$POST_ESC",
  "backup_path": "$BACKUP",
  "details": $DETAILS_OR_ARRAY
}
EOF
    else
        cat <<EOF >> "$RESULT_JSON"
{
  "check_id": "$CHECK_ID",
  "category": "$CATEGORY",
  "description": "$DESCRIPTION",
  "hostname": "$HOSTNAME",
  "os_type": "$OS_DISPLAY",
  "timestamp": "$(date '+%Y-%m-%d %H:%M:%S')",
  "status": "$STATUS",
  "pre_value": "$PRE_ESC",
  "post_value": "$POST_ESC",
  "backup_path": "$BACKUP",
  "details": {
    "조치 전 상태": "$PRE_ESC",
    "조치 명령어": "$REMEDY_ESCAPED",
    "조치 후 상태": "$POST_ESC",
    "조치 결과": "$STATUS",
    "세부 내역": "$DETAIL_LOG"
  }
}
EOF
    fi

    if [ "$STATUS" = "VULNERABLE" ] || [ "$STATUS" = "ERROR" ] || [ "$STATUS" = "FAILED" ]; then
        echo -e "${RED}[조치 실패] ${CHECK_ID} : 점검 기준 미달 (취약 상태 유지)${NC}"
        return 0
    fi
    if [ "$STATUS" = "SAFE" ] || [ "$STATUS" = "SUCCESS" ]; then
        if echo "$DETAILS" | grep -qE "조치 완료|조치:|적용하였|적용했습니다|변경 완료|설정 완료|✓"; then
            echo -e "${GREEN}[조치 완료] ${CHECK_ID} : 점검 기준에 맞게 조치${NC}"
        else
            echo -e "${GREEN}[양호] ${CHECK_ID} : 점검 기준 통과${NC}"
        fi
    else
        echo -e "${GREEN}[양호] ${CHECK_ID} : 점검 기준 통과${NC}"
    fi
}