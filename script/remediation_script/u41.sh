#!/bin/bash
###############################################################################
# [U-41] 불필요한 automountd(autofs) 제거 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u41() {
    local CHECK_ID="U-41"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="불필요한 automountd 제거 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 autofs 비활성화 또는 미설치"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local BEFORE="" AFTER="" REMEDY_CMD=""
    BEFORE="systemctl list-unit-files autofs:"$'\n'"$(systemctl list-unit-files autofs 2>/dev/null || true)"
    BEFORE="${BEFORE}"$'\n'"systemctl is-active autofs:"$'\n'"$(systemctl is-active autofs 2>/dev/null || true)"

    if systemctl list-unit-files 2>/dev/null | grep -q "^autofs\.service"; then
        systemctl is-active --quiet autofs 2>/dev/null && { systemctl stop autofs 2>/dev/null; REMEDY_CMD="systemctl stop autofs"; ACTIONS_TAKEN+=("autofs 중지"); }
        [ "$(systemctl is-enabled autofs 2>/dev/null)" != "masked" ] && {
            systemctl disable autofs 2>/dev/null
            systemctl mask autofs 2>/dev/null
            REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}systemctl disable autofs; systemctl mask autofs"
            ACTIONS_TAKEN+=("autofs 비활성화 및 mask")
        }
    fi

    AFTER="systemctl list-unit-files autofs:"$'\n'"$(systemctl list-unit-files autofs 2>/dev/null || true)"
    AFTER="${AFTER}"$'\n'"systemctl is-enabled autofs:"$'\n'"$(systemctl is-enabled autofs 2>/dev/null || true)"

    if [ -n "$REMEDY_CMD" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
        DETAILS+=("조치 완료: autofs 차단")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호 또는 미설치" "$CRITERIA")")
        DETAILS+=("양호: autofs 미설치 또는 이미 차단")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "autofs" "비활성/미설치" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u41
echo "]" >> "$RESULT_JSON"