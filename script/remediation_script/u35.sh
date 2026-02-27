#!/bin/bash
###############################################################################
# [U-35] 공유 서비스 익명 접근 제한 (vsftpd anonymous_enable=NO) - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u35() {
    local CHECK_ID="U-35"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="공유 서비스에 대한 익명 접근 제한 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local FTP_CONF="/etc/vsftpd/vsftpd.conf"
    local CRITERIA="양호는 anonymous_enable=NO"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local BEFORE="" AFTER="" REMEDY_CMD=""

    if [ ! -f "$FTP_CONF" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "vsftpd 설정 없음(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: vsftpd 설정 파일 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "점검 파일 없음" "파일 없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    BEFORE="grep -i anonymous $FTP_CONF:"$'\n'"$(grep -i anonymous_enable "$FTP_CONF" 2>/dev/null || echo '(없음)')"

    mkdir -p /tmp/security_audit/backup/U-35
    cp -p "$FTP_CONF" "/tmp/security_audit/backup/U-35/vsftpd.conf.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
    if grep -qi "anonymous_enable=YES" "$FTP_CONF"; then
        sed -i 's/anonymous_enable=YES/anonymous_enable=NO/gi' "$FTP_CONF"
        REMEDY_CMD="sed -i 's/anonymous_enable=YES/anonymous_enable=NO/gi' $FTP_CONF"
        ACTIONS_TAKEN+=("anonymous_enable: YES -> NO")
    elif ! grep -qi "anonymous_enable" "$FTP_CONF"; then
        echo "anonymous_enable=NO" >> "$FTP_CONF"
        REMEDY_CMD="echo 'anonymous_enable=NO' >> $FTP_CONF"
        ACTIONS_TAKEN+=("anonymous_enable=NO 추가")
    fi
    [ ${#ACTIONS_TAKEN[@]} -gt 0 ] && systemctl is-active --quiet vsftpd 2>/dev/null && systemctl restart vsftpd 2>/dev/null && ACTIONS_TAKEN+=("vsftpd 재시작")

    AFTER="grep -i anonymous $FTP_CONF:"$'\n'"$(grep -i anonymous_enable "$FTP_CONF" 2>/dev/null || echo '(없음)')"

    local STILL_VULN=0
    grep -v '^#' "$FTP_CONF" 2>/dev/null | grep -qi "anonymous_enable=YES" && STILL_VULN=1
    [ "$STILL_VULN" -eq 1 ] && STATUS="VULNERABLE"

    if [ -n "$REMEDY_CMD" ]; then
        if [ "$STILL_VULN" -eq 1 ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후에도 익명 허용" "$CRITERIA")")
            DETAILS+=("취약: anonymous_enable 여전히 YES")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: 익명 FTP 차단")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: 이미 anonymous_enable=NO")
    fi

    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local PRE_VAL="vsftpd anonymous"; local POST_VAL="anonymous_enable=NO"
    [ "$STATUS" = "VULNERABLE" ] && POST_VAL="취약 상태 유지"
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$PRE_VAL" "$POST_VAL" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u35
echo "]" >> "$RESULT_JSON"