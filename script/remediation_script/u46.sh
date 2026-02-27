#!/bin/bash
###############################################################################
# [U-46] 일반 사용자 메일 서비스 실행 방지 (sendmail PrivacyOptions) - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u46() {
    local CHECK_ID="U-46"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="일반 사용자의 메일 서비스 실행 방지 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local SENDMAIL_CF="/etc/mail/sendmail.cf"
    local CRITERIA="양호는 PrivacyOptions에 restrictmailq, restrictqrun 포함"
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

    mkdir -p /tmp/security_audit/backup/U-46
    cp -p "$SENDMAIL_CF" "/tmp/security_audit/backup/U-46/sendmail.cf.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
    if grep -q "^O PrivacyOptions=" "$SENDMAIL_CF"; then
        current_options=$(grep "^O PrivacyOptions=" "$SENDMAIL_CF" | cut -d= -f2)
        new_options="$current_options"
        [[ "$new_options" != *"restrictmailq"* ]] && new_options="${new_options},restrictmailq"
        [[ "$new_options" != *"restrictqrun"* ]] && new_options="${new_options},restrictqrun"
        if [ "$new_options" != "$current_options" ]; then
            sed -i "s/^O PrivacyOptions=.*/O PrivacyOptions=$new_options/" "$SENDMAIL_CF"
            sed -i 's/,,/,/g; s/O PrivacyOptions=,/O PrivacyOptions=/g' "$SENDMAIL_CF"
            REMEDY_CMD="sed -i 's/^O PrivacyOptions=.*/O PrivacyOptions=...restrictmailq,restrictqrun/' $SENDMAIL_CF"
            ACTIONS_TAKEN+=("PrivacyOptions에 restrictmailq, restrictqrun 추가")
        fi
    else
        echo "O PrivacyOptions=authwarnings,restrictmailq,restrictqrun" >> "$SENDMAIL_CF"
        REMEDY_CMD="echo 'O PrivacyOptions=...' >> $SENDMAIL_CF"
        ACTIONS_TAKEN+=("PrivacyOptions 신규 추가")
    fi
    [ ${#ACTIONS_TAKEN[@]} -gt 0 ] && systemctl is-active --quiet sendmail 2>/dev/null && systemctl restart sendmail 2>/dev/null && ACTIONS_TAKEN+=("sendmail 재시작")

    AFTER="grep PrivacyOptions $SENDMAIL_CF:"$'\n'"$(grep '^O PrivacyOptions=' "$SENDMAIL_CF" 2>/dev/null || echo '(없음)')"

    if [ -n "$REMEDY_CMD" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
        DETAILS+=("조치 완료: PrivacyOptions 적용")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: restrictmailq, restrictqrun 이미 적용")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "Sendmail PrivacyOptions" "restrictmailq, restrictqrun" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u46
echo "]" >> "$RESULT_JSON"