#!/bin/bash
###############################################################################
# [U-47] 스팸 메일 릴레이 제한 (/etc/mail/access) - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u47() {
    local CHECK_ID="U-47"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="스팸 메일 릴레이 제한 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local ACCESS_FILE="/etc/mail/access"
    local CRITERIA="양호는 Open Relay(Connect: RELAY) 없음, localhost만 RELAY"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local BEFORE="" AFTER="" REMEDY_CMD=""

    if [ ! -f "$ACCESS_FILE" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "Sendmail access 없음(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: /etc/mail/access 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "점검 파일 없음" "파일 없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    BEFORE="grep Connect $ACCESS_FILE:"$'\n'"$(grep -E '^\s*Connect:' "$ACCESS_FILE" 2>/dev/null || echo '(없음)')"

    mkdir -p /tmp/security_audit/backup/U-47
    cp -p "$ACCESS_FILE" "/tmp/security_audit/backup/U-47/access.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
    if grep -Ei "^\s*Connect:\s*RELAY" "$ACCESS_FILE" >/dev/null 2>&1; then
        sed -i 's/^\s*\(Connect:.*RELAY\)/# [U-47_Vulnerable] \1/gi' "$ACCESS_FILE"
        REMEDY_CMD="sed -i 's/^\\s*Connect:.*RELAY/# [U-47_Vulnerable] .../gi' $ACCESS_FILE"
        ACTIONS_TAKEN+=("Open Relay 설정 주석 처리")
    fi
    grep -q "127.0.0.1" "$ACCESS_FILE" || { echo -e "Connect:127.0.0.1\t\tRELAY" >> "$ACCESS_FILE"; echo -e "Connect:localhost\t\tRELAY" >> "$ACCESS_FILE"; REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}echo Connect:127.0.0.1 RELAY >> $ACCESS_FILE"; ACTIONS_TAKEN+=("localhost RELAY 추가"); }
    if [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        command -v makemap >/dev/null 2>&1 && makemap hash "$ACCESS_FILE" < "$ACCESS_FILE" 2>/dev/null && ACTIONS_TAKEN+=("makemap 갱신")
        systemctl is-active --quiet sendmail 2>/dev/null && systemctl restart sendmail 2>/dev/null && ACTIONS_TAKEN+=("sendmail 재시작")
    fi

    AFTER="grep Connect $ACCESS_FILE:"$'\n'"$(grep -E '^\s*Connect:' "$ACCESS_FILE" 2>/dev/null || echo '(없음)')"

    if [ -n "$REMEDY_CMD" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
        DETAILS+=("조치 완료: 릴레이 제한 적용")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: 이미 localhost만 RELAY")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "Sendmail access" "Localhost-only Relay" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u47
echo "]" >> "$RESULT_JSON"