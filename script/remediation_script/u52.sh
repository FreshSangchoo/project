#!/bin/bash
###############################################################################
# [U-52] Telnet 서비스 비활성화 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u52() {
    local CHECK_ID="U-52"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="Telnet 서비스 비활성화 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 포트 23(Telnet) 미사용"
    local telnet_units=("telnet.socket" "telnet.service")

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."
    local BEFORE="" AFTER="" REMEDY_CMD=""
    BEFORE="ss -tuln :23:"$'\n'"$(ss -tuln 2>/dev/null | grep ':23 ' || echo '(없음)')"

    for unit in "${telnet_units[@]}"; do
        systemctl list-unit-files 2>/dev/null | grep -q "^${unit}" || continue
        (systemctl is-active --quiet "$unit" 2>/dev/null || systemctl is-enabled "$unit" 2>/dev/null) || continue
        systemctl stop "$unit" 2>/dev/null
        systemctl disable "$unit" 2>/dev/null
        systemctl mask "$unit" 2>/dev/null
        REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}systemctl stop $unit; systemctl mask $unit"
        ACTIONS_TAKEN+=("$unit 마스킹")
    done
    [ -f /etc/xinetd.d/telnet ] && grep -qi "disable\s*=\s*no" /etc/xinetd.d/telnet && {
        sed -i 's/disable\s*=\s*no/disable = yes/gi' /etc/xinetd.d/telnet
        REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}xinetd.d/telnet disable=yes"
        ACTIONS_TAKEN+=("xinetd telnet 비활성화")
        systemctl is-active --quiet xinetd 2>/dev/null && systemctl restart xinetd 2>/dev/null
    }

    AFTER="ss -tuln :23:"$'\n'"$(ss -tuln 2>/dev/null | grep ':23 ' || echo '(없음)')"
    ss -tuln 2>/dev/null | grep -q ":23 " && STATUS="VULNERABLE"

    if [ -n "$REMEDY_CMD" ]; then
        if [ "$STATUS" = "VULNERABLE" ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후에도 포트 23 열림" "$CRITERIA")")
            DETAILS+=("취약: 포트 23 여전히 열림")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: Telnet 차단")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: Telnet 없음")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "Telnet" "포트 23 차단" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u52
echo "]" >> "$RESULT_JSON"