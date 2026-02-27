#!/bin/bash
###############################################################################
# [U-55] FTP 계정 Shell 제한 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u55() {
    local CHECK_ID="U-55"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="FTP 계정 Shell 제한"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 ftp 계정 쉘이 nologin 또는 false"
    local CRITERIA_FILE_OK="ftp 계정 없을 시 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."
    local BEFORE="" AFTER="" REMEDY_CMD=""
    local FTP_USER_INFO=$(grep "^ftp:" /etc/passwd 2>/dev/null)

    if [ -z "$FTP_USER_INFO" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 대상 없음" " " "ftp 계정 없음" "ftp 계정 없음(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: ftp 계정 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "ftp 계정 없음" "해당없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    local CURRENT_SHELL=$(echo "$FTP_USER_INFO" | awk -F: '{print $7}')
    BEFORE="grep ^ftp: /etc/passwd:"$'\n'"$(grep '^ftp:' /etc/passwd 2>/dev/null)"

    case "$CURRENT_SHELL" in
        *"/sbin/nologin"|*"/bin/false")
            AFTER="$BEFORE"
            DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "이미 nologin/false 부여" "$CRITERIA")")
            DETAILS+=("양호: ftp 계정 쉘 이미 제한됨")
            ;;
        *)
            BACKUP_BASE="${BACKUP_BASE:-/root/security_backup/$(date +%Y%m%d)}"
            mkdir -p "$BACKUP_BASE"
            cp -p /etc/passwd "$BACKUP_BASE/passwd.bak" 2>/dev/null
            TARGET_SHELL="/sbin/nologin"
            [ ! -f /sbin/nologin ] && TARGET_SHELL="/bin/false"
            REMEDY_CMD="usermod -s $TARGET_SHELL ftp"
            if usermod -s "$TARGET_SHELL" ftp 2>/dev/null; then
                AFTER="grep ^ftp: /etc/passwd:"$'\n'"$(grep '^ftp:' /etc/passwd 2>/dev/null)"
                DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
                ACTIONS_TAKEN+=("ftp 쉘 -> $TARGET_SHELL")
                DETAILS+=("조치 완료: ftp 계정 쉘 제한")
            else
                AFTER="$BEFORE"
                STATUS="VULNERABLE"
                DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "usermod 실패" "$CRITERIA")")
                DETAILS+=("취약: ftp 쉘 변경 실패")
            fi
            ;;
    esac
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "ftp 계정 쉘" "nologin/false" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u55
echo "]" >> "$RESULT_JSON"