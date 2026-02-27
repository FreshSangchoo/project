#!/bin/bash
###############################################################################
# [U-59] 안전한 SNMP 버전 사용 (v1/v2c 비활성화) - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u59() {
    local CHECK_ID="U-59"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="안전한 SNMP 버전 사용 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local SNMP_CONF="/etc/snmp/snmpd.conf"
    local CRITERIA="양호는 SNMP v1/v2c(rocommunity/rwcommunity) 비활성화"
    local CRITERIA_FILE_OK="snmpd 미설치 또는 미구동 시 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."
    local BEFORE="" AFTER="" REMEDY_CMD=""

    if ! command -v snmpd >/dev/null 2>&1; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "snmpd 미설치" " " "snmpd 미설치" "SNMP 미설치(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: SNMP 미설치")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "snmpd 미설치" "해당없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi
    if ! systemctl is-active --quiet snmpd 2>/dev/null; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "snmpd 미구동" " " "snmpd 미구동" "SNMP 미구동(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: SNMP 미구동")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "snmpd 미구동" "해당없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi
    if [ ! -f "$SNMP_CONF" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "설정 파일 없음" " " "설정 파일 없음" "snmpd 구동 중이나 설정 없음" "$CRITERIA")")
        STATUS="ERROR"
        DETAILS+=("오류: snmpd.conf 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "설정 없음" "해당없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    BEFORE="grep -E 'rocommunity|rwcommunity|com2sec' $SNMP_CONF (주석제외):"$'\n'"$(grep -v '^#' "$SNMP_CONF" 2>/dev/null | grep -E 'rocommunity|rwcommunity|com2sec' || echo '(없음)')"

    mkdir -p /tmp/security_audit/backup/U-59
    cp -p "$SNMP_CONF" "/tmp/security_audit/backup/U-59/snmpd.conf.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
    if grep -Ei "^\s*(rocommunity|rwcommunity|com2sec).*(v1|v2c)" "$SNMP_CONF" >/dev/null 2>&1; then
        sed -i '/v1/s/^\([^#]\)/#\1/' "$SNMP_CONF"
        sed -i '/v2c/s/^\([^#]\)/#\1/' "$SNMP_CONF"
        sed -i 's/^\(rocommunity\)/#\1/gi' "$SNMP_CONF"
        sed -i 's/^\(rwcommunity\)/#\1/gi' "$SNMP_CONF"
        REMEDY_CMD="sed -i 's/^rocommunity/#rocommunity/gi' $SNMP_CONF 등"
        ACTIONS_TAKEN+=("v1/v2c 주석 처리")
        systemctl restart snmpd 2>/dev/null && ACTIONS_TAKEN+=("snmpd 재시작")
    fi

    AFTER="grep -E 'rocommunity|rwcommunity|com2sec' $SNMP_CONF (주석제외):"$'\n'"$(grep -v '^#' "$SNMP_CONF" 2>/dev/null | grep -E 'rocommunity|rwcommunity|com2sec' || echo '(없음)')"

    if [ -n "$REMEDY_CMD" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
        DETAILS+=("조치 완료: SNMP v1/v2c 비활성화")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: v1/v2c 설정 없음")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "snmpd v1/v2c" "v1/v2c 제한" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u59
echo "]" >> "$RESULT_JSON"