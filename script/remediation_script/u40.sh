#!/bin/bash
###############################################################################
# [U-40] NFS 접근 통제 (/etc/exports 와일드카드·no_root_squash) - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u40() {
    local CHECK_ID="U-40"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="NFS 접근 통제 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local EXPORTS_FILE="/etc/exports"
    local CRITERIA="양호는 와일드카드(*) 미사용, root_squash 사용"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local BEFORE="" AFTER="" REMEDY_CMD=""

    if [ ! -f "$EXPORTS_FILE" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "NFS exports 없음(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: /etc/exports 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "점검 파일 없음" "파일 없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    BEFORE="cat /etc/exports (주석 제외):"$'\n'"$(grep -v '^#' "$EXPORTS_FILE" 2>/dev/null | grep -v '^[[:space:]]*$' || echo '(비어있음)')"

    mkdir -p /tmp/security_audit/backup/U-40
    cp -p "$EXPORTS_FILE" "/tmp/security_audit/backup/U-40/exports.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
    grep -qE "^\s*[^#].*\*" "$EXPORTS_FILE" && {
        sed -i 's/^\([^#].*\)\*/# [U-40] \1\*/g' "$EXPORTS_FILE"
        REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}와일드카드(*) 라인 주석 처리"
        ACTIONS_TAKEN+=("와일드카드(*) 허용 설정 주석 처리")
    }
    grep -q "no_root_squash" "$EXPORTS_FILE" && {
        sed -i 's/no_root_squash/root_squash/g' "$EXPORTS_FILE"
        REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}no_root_squash → root_squash"
        ACTIONS_TAKEN+=("no_root_squash → root_squash")
    }
    [ ${#ACTIONS_TAKEN[@]} -gt 0 ] && (systemctl is-active --quiet nfs-server 2>/dev/null || systemctl is-active --quiet nfs 2>/dev/null) && exportfs -ra 2>/dev/null && ACTIONS_TAKEN+=("exportfs -ra 적용")

    AFTER="cat /etc/exports (주석 제외):"$'\n'"$(grep -v '^#' "$EXPORTS_FILE" 2>/dev/null | grep -v '^[[:space:]]*$' || echo '(비어있음)')"

    if [ -n "$REMEDY_CMD" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
        DETAILS+=("조치 완료: NFS 접근 통제 적용")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: NFS 설정 적절")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "NFS exports" "와일드카드 없음, root_squash" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u40
echo "]" >> "$RESULT_JSON"