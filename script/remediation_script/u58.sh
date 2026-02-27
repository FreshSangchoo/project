#!/bin/bash
###############################################################################
# [U-58] 불필요한 SNMP 서비스 구동 점검 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u58() {
    local CHECK_ID="U-58"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="불필요한 SNMP 서비스 구동 점검 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 SNMP(161) 포트 미사용"
    local SNMP_SERVICE="snmpd"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."
    local BEFORE="" AFTER="" REMEDY_CMD=""
    BEFORE="ss -tuln :161:"$'\n'"$(ss -tuln 2>/dev/null | grep ':161 ' || echo '(없음)')"
    BEFORE="${BEFORE}"$'\n'"systemctl list-unit-files snmpd:"$'\n'"$(systemctl list-unit-files 2>/dev/null | grep snmpd || true)"

    if systemctl list-unit-files 2>/dev/null | grep -q "^${SNMP_SERVICE}\.service"; then
        (systemctl is-active --quiet "$SNMP_SERVICE" 2>/dev/null || systemctl is-enabled "$SNMP_SERVICE" 2>/dev/null) && {
            systemctl stop "$SNMP_SERVICE" 2>/dev/null
            systemctl disable "$SNMP_SERVICE" 2>/dev/null
            systemctl mask "$SNMP_SERVICE" 2>/dev/null
            REMEDY_CMD="systemctl stop $SNMP_SERVICE; systemctl mask $SNMP_SERVICE"
            ACTIONS_TAKEN+=("snmpd 중지 및 mask")
        }
    fi

    AFTER="ss -tuln :161:"$'\n'"$(ss -tuln 2>/dev/null | grep ':161 ' || echo '(없음)')"
    ss -tuln 2>/dev/null | grep -q ":161 " && STATUS="VULNERABLE"

    if [ -n "$REMEDY_CMD" ]; then
        if [ "$STATUS" = "VULNERABLE" ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후에도 포트 161 열림" "$CRITERIA")")
            DETAILS+=("취약: SNMP 포트 161 여전히 열림")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: SNMP 차단")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: SNMP 없음")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "SNMP" "포트 161 차단" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u58
echo "]" >> "$RESULT_JSON"