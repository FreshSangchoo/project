
폴더 하이라이트
보안 감사 대응을 위해 시스템 설정 파일의 소유자/권한 수정 및 불필요한 서비스 비활성화를 위한 다양한 쉘 스크립트들을 포함하고 있습니다.

#!/bin/bash
###############################################################################
# [U-60] SNMP Community String 복잡성 설정 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u_60() {
    local CHECK_ID="U-60"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="SNMP Community String 복잡성 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local SNMP_CONF="/etc/snmp/snmpd.conf"
    local CRITERIA="양호는 public/private 대신 복잡한 Community String 사용"
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

    BEFORE="grep -v '^#' $SNMP_CONF | grep -Ei 'public|private':"$'\n'"$(grep -v '^#' "$SNMP_CONF" 2>/dev/null | grep -Ei 'public|private' || echo '(없음)')"

    if grep -v '^#' "$SNMP_CONF" | grep -Ei "public|private" >/dev/null 2>&1; then
        mkdir -p /tmp/security_audit/backup/U-60
        cp -p "$SNMP_CONF" "/tmp/security_audit/backup/U-60/snmpd.conf.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
        new_comm="SecComm_$(openssl rand -hex 4)!"
        sed -i "s/\bpublic\b/$new_comm/g" "$SNMP_CONF"
        sed -i "s/\bprivate\b/$new_comm/g" "$SNMP_CONF"
        REMEDY_CMD="sed -i 's/\\bpublic\\b/.../g' $SNMP_CONF 등"
        ACTIONS_TAKEN+=("public/private -> $new_comm")
        systemctl restart snmpd 2>/dev/null && ACTIONS_TAKEN+=("snmpd 재시작")
    fi

    AFTER="grep -v '^#' $SNMP_CONF | grep -Ei 'public|private':"$'\n'"$(grep -v '^#' "$SNMP_CONF" 2>/dev/null | grep -Ei 'public|private' || echo '(없음)')"

    if [ -n "$REMEDY_CMD" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
        DETAILS+=("조치 완료: Community String 복잡화")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: public/private 없음")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "SNMP Community" "복잡 문자열 적용" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u_60
echo "]" >> "$RESULT_JSON"