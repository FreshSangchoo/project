#!/bin/bash
###############################################################################
# [U-61] SNMP Access Control 설정 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u61() {
    local CHECK_ID="U-61"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="SNMP Access Control 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local SNMP_CONF="/etc/snmp/snmpd.conf"
    local TRUSTED_IP="127.0.0.1"
    local CRITERIA="양호는 default/any 대신 특정 IP(ACL) 제한"
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
        STATUS="VULNERABLE"
        DETAILS+=("취약: snmpd.conf 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "설정 없음" "해당없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    BEFORE="grep -v '^#' $SNMP_CONF | grep -Ei 'default|any|0\\.0\\.0\\.0':"$'\n'"$(grep -v '^#' "$SNMP_CONF" 2>/dev/null | grep -Ei 'default|any|0\.0\.0\.0' || echo '(없음)')"

    if grep -v '^#' "$SNMP_CONF" | grep -Ei "default|any|0\.0\.0\.0" >/dev/null 2>&1; then
        mkdir -p /tmp/security_audit/backup/U-61
        cp -p "$SNMP_CONF" "/tmp/security_audit/backup/U-61/snmpd.conf.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
        sed -i "/^com2sec/s/default/$TRUSTED_IP/g" "$SNMP_CONF"
        sed -i "/^com2sec/s/any/$TRUSTED_IP/g" "$SNMP_CONF"
        sed -i -E "/^(ro|rw)community\s+[^\s]+$/s/$/ $TRUSTED_IP/" "$SNMP_CONF"
        REMEDY_CMD="sed com2sec default/any -> $TRUSTED_IP; rocommunity/rwcommunity IP 추가"
        ACTIONS_TAKEN+=("ACL $TRUSTED_IP 제한")
        systemctl restart snmpd 2>/dev/null && ACTIONS_TAKEN+=("snmpd 재시작")
    fi

    AFTER="grep -v '^#' $SNMP_CONF | grep -E 'com2sec|rocommunity|rwcommunity':"$'\n'"$(grep -v '^#' "$SNMP_CONF" 2>/dev/null | grep -E 'com2sec|rocommunity|rwcommunity' || echo '(없음)')"

    if [ -n "$REMEDY_CMD" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
        DETAILS+=("조치 완료: SNMP ACL $TRUSTED_IP 제한")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: 이미 ACL 제한됨")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "SNMP ACL" "Restricted to $TRUSTED_IP" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u61
echo "]" >> "$RESULT_JSON"