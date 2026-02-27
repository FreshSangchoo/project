#!/bin/bash
###############################################################################
# [U-43] NIS, NIS+ 서비스 비활성화 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u43() {
    local CHECK_ID="U-43"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="NIS, NIS+ 서비스 비활성화 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 ypserv/ypbind 등 NIS 서비스 비활성화"
    local nis_services=("ypserv" "ypbind" "ypxfrd" "yppasswdd" "yppush")

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local BEFORE="" AFTER="" REMEDY_CMD=""
    BEFORE="systemctl list-unit-files (nis):"$'\n'"$(systemctl list-unit-files 2>/dev/null | grep -E 'ypserv|ypbind|ypxfrd|yppasswdd|yppush' || true)"

    for svc in "${nis_services[@]}"; do
        systemctl list-unit-files 2>/dev/null | grep -qE "^${svc}\.(service|socket)" || continue
        systemctl stop "$svc" 2>/dev/null
        systemctl disable "$svc" 2>/dev/null
        systemctl mask "$svc" 2>/dev/null
        REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}systemctl stop $svc; systemctl mask $svc"
        ACTIONS_TAKEN+=("$svc 중지 및 mask")
    done

    AFTER="systemctl list-unit-files (nis):"$'\n'"$(systemctl list-unit-files 2>/dev/null | grep -E 'ypserv|ypbind|ypxfrd|yppasswdd|yppush' || true)"

    if [ -n "$REMEDY_CMD" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
        DETAILS+=("조치 완료: NIS 서비스 차단")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: NIS 서비스 없음")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "NIS 서비스" "NIS mask" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u43
echo "]" >> "$RESULT_JSON"