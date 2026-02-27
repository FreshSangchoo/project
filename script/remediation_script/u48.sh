#!/bin/bash
###############################################################################
# [U-48] expn, vrfy 명령어 제한 (sendmail PrivacyOptions) - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u48() {
    local CHECK_ID="U-48"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="expn, vrfy 명령어 제한 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local SENDMAIL_CF="/etc/mail/sendmail.cf"
    local CRITERIA="양호는 PrivacyOptions에 noexpn, novrfy 포함"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local BEFORE="" AFTER="" REMEDY_CMD=""

    if [ ! -f "$SENDMAIL_CF" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "Sendmail 미설치(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: Sendmail 설정 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "점검 파일 없음" "파일 없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    BEFORE="grep PrivacyOptions $SENDMAIL_CF:"$'\n'"$(grep '^O PrivacyOptions=' "$SENDMAIL_CF" 2>/dev/null || echo '(없음)')"

    mkdir -p /tmp/security_audit/backup/U-48
    cp -p "$SENDMAIL_CF" "/tmp/security_audit/backup/U-48/sendmail.cf.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
    if grep -q "^O PrivacyOptions=" "$SENDMAIL_CF"; then
        current_line=$(grep "^O PrivacyOptions=" "$SENDMAIL_CF")
        needs_update=false
        [[ "$current_line" != *"noexpn"* ]] && needs_update=true
        [[ "$current_line" != *"novrfy"* ]] && needs_update=true
        if [ "$needs_update" = true ]; then
            sed -i "/^O PrivacyOptions=/ s/$/,noexpn,novrfy/" "$SENDMAIL_CF"
            sed -i 's/O PrivacyOptions=,/O PrivacyOptions=/g; s/,,*/,/g' "$SENDMAIL_CF"
            REMEDY_CMD="sed -i '/^O PrivacyOptions=/ s/\$/,noexpn,novrfy/' $SENDMAIL_CF"
            ACTIONS_TAKEN+=("PrivacyOptions noexpn, novrfy 추가")
        fi
    else
        echo "O PrivacyOptions=noexpn,novrfy" >> "$SENDMAIL_CF"
        REMEDY_CMD="echo 'O PrivacyOptions=noexpn,novrfy' >> $SENDMAIL_CF"
        ACTIONS_TAKEN+=("PrivacyOptions 신규 추가")
    fi
    [ ${#ACTIONS_TAKEN[@]} -gt 0 ] && systemctl is-active --quiet sendmail 2>/dev/null && systemctl restart sendmail 2>/dev/null && ACTIONS_TAKEN+=("sendmail 재시작")

    AFTER="grep PrivacyOptions $SENDMAIL_CF:"$'\n'"$(grep '^O PrivacyOptions=' "$SENDMAIL_CF" 2>/dev/null || echo '(없음)')"

    if [ -n "$REMEDY_CMD" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
        DETAILS+=("조치 완료: EXPN/VRFY 차단")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: noexpn, novrfy 이미 적용")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "Sendmail PrivacyOptions" "noexpn, novrfy" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u48
echo "]" >> "$RESULT_JSON"