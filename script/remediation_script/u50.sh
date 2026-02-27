#!/bin/bash
###############################################################################
# [U-50] DNS Zone Transfer 설정 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u50() {
    local CHECK_ID="U-50"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="DNS Zone Transfer 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local NAMED_CONF="/etc/named.conf"
    local CRITERIA="양호는 allow-transfer { none; } 또는 허용 IP만 지정"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."
    local BEFORE="" AFTER="" REMEDY_CMD=""

    if [ ! -f "$NAMED_CONF" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "BIND 미설치(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: named.conf 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "점검 파일 없음" "파일 없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    BEFORE="grep allow-transfer $NAMED_CONF:"$'\n'"$(grep 'allow-transfer' "$NAMED_CONF" 2>/dev/null || echo '(없음)')"

    mkdir -p /tmp/security_audit/backup/U-50
    cp -p "$NAMED_CONF" "/tmp/security_audit/backup/U-50/named.conf.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
    if grep -q "allow-transfer" "$NAMED_CONF"; then
        if grep "allow-transfer" "$NAMED_CONF" | grep -q "any"; then
            sed -i 's/allow-transfer\s*{[^}]*};/allow-transfer { none; };/g' "$NAMED_CONF"
            REMEDY_CMD="sed -i 's/allow-transfer.*any.*/allow-transfer { none; };/g' $NAMED_CONF"
            ACTIONS_TAKEN+=("allow-transfer any -> none")
        fi
    else
        sed -i '/options\s*{/a \        allow-transfer { none; };' "$NAMED_CONF"
        REMEDY_CMD="sed -i '/options\\s*{/a allow-transfer { none; };' $NAMED_CONF"
        ACTIONS_TAKEN+=("allow-transfer { none; } 추가")
    fi
    if [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        named-checkconf "$NAMED_CONF" >/dev/null 2>&1 || { STATUS="VULNERABLE"; DETAILS+=("named-checkconf 실패"); }
        systemctl is-active --quiet named 2>/dev/null && systemctl restart named 2>/dev/null && ACTIONS_TAKEN+=("named 재시작")
    fi

    AFTER="grep allow-transfer $NAMED_CONF:"$'\n'"$(grep 'allow-transfer' "$NAMED_CONF" 2>/dev/null || echo '(없음)')"

    if [ -n "$REMEDY_CMD" ]; then
        if [ "$STATUS" = "VULNERABLE" ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "문법 검사 실패" "$CRITERIA")")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: Zone Transfer 제한")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: allow-transfer 이미 적절")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "named allow-transfer" "allow-transfer { none; }" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u50
echo "]" >> "$RESULT_JSON"