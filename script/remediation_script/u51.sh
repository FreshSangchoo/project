#!/bin/bash
###############################################################################
# [U-51] DNS 동적 업데이트 설정 금지 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u51() {
    local CHECK_ID="U-51"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="DNS 동적 업데이트 설정 금지 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local NAMED_CONF="/etc/named.conf"
    local CRITERIA="양호는 allow-update { none; }"
    local CRITERIA_FILE_OK="BIND 미설치 시 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."
    local BEFORE="" AFTER="" REMEDY_CMD=""

    if ! command -v named >/dev/null 2>&1; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "BIND 미설치" " " "BIND 미설치" "DNS 서비스 없음(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: named 미설치")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "BIND 미설치" "해당없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi
    if [ ! -f "$NAMED_CONF" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "점검 파일 없음" " " "파일 없음" "named 설치됐으나 설정 없음" "$CRITERIA")")
        STATUS="VULNERABLE"
        DETAILS+=("취약: named.conf 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "Config 없음" "해당없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    BEFORE="grep allow-update $NAMED_CONF:"$'\n'"$(grep 'allow-update' "$NAMED_CONF" 2>/dev/null || echo '(없음)')"

    local backup_dir="/tmp/security_audit/backup/U-51"
    mkdir -p "$backup_dir"
    local backup_file="$backup_dir/named.conf.bak_$(date +%Y%m%d_%H%M%S)"
    cp -p "$NAMED_CONF" "$backup_file"
    if grep -qiE "allow-update\s*\{\s*any\s*;\s*\}" "$NAMED_CONF"; then
        sed -i 's/allow-update\s*{\s*any\s*;\s*}/allow-update { none; }/gI' "$NAMED_CONF"
        REMEDY_CMD="sed -i 's/allow-update.*any.*/allow-update { none; }/gI' $NAMED_CONF"
        ACTIONS_TAKEN+=("allow-update any -> none")
    fi
    if ! grep -q "allow-update" "$NAMED_CONF"; then
        grep -q "directory" "$NAMED_CONF" && sed -i '/directory/a \        allow-update { none; };' "$NAMED_CONF" || sed -i '/options\s*{/a \        allow-update { none; };' "$NAMED_CONF"
        REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}allow-update { none; } 추가"
        ACTIONS_TAKEN+=("allow-update { none; } 추가")
    fi
    if [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        if ! named-checkconf "$NAMED_CONF" >/dev/null 2>&1; then
            cp -f "$backup_file" "$NAMED_CONF"
            STATUS="ERROR"
            DETAILS+=("문법 에러로 원복")
        else
            systemctl is-active --quiet named 2>/dev/null && systemctl restart named 2>/dev/null && ACTIONS_TAKEN+=("named 재시작")
        fi
    fi

    AFTER="grep allow-update $NAMED_CONF:"$'\n'"$(grep 'allow-update' "$NAMED_CONF" 2>/dev/null || echo '(없음)')"

    if [ -n "$REMEDY_CMD" ] && [ "$STATUS" != "ERROR" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
        DETAILS+=("조치 완료: allow-update none")
    elif [ "$STATUS" = "ERROR" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "문법 에러로 원복" "$CRITERIA")")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: allow-update 이미 none")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "named allow-update" "allow-update { none; }" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u51
echo "]" >> "$RESULT_JSON"