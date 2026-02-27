#!/bin/bash
###############################################################################
# [U-39] 불필요한 NFS 서비스 비활성화 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u39() {
    local CHECK_ID="U-39"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="불필요한 NFS 서비스 비활성화 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 NFS/RPC(2049,111) 포트 미사용"
    local nfs_services=("nfs" "nfs-server" "rpcbind" "mountd" "nfs-idmapd" "nfs-mountd")

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local BEFORE="" AFTER="" REMEDY_CMD=""
    BEFORE="ss -tuln (2049,111):"$'\n'"$(ss -tuln 2>/dev/null | grep -E ':2049 |:111 ' || echo '(없음)')"
    BEFORE="${BEFORE}"$'\n'"systemctl list-unit-files nfs* rpcbind:"$'\n'"$(systemctl list-unit-files 2>/dev/null | grep -E 'nfs|rpcbind' || true)"

    for svc in "${nfs_services[@]}"; do
        systemctl list-unit-files 2>/dev/null | grep -q "^${svc}\." || continue
        systemctl is-active --quiet "$svc" 2>/dev/null || systemctl is-enabled "$svc" 2>/dev/null || true
        if systemctl list-unit-files "${svc}.service" 2>/dev/null | grep -q .; then
            systemctl stop "$svc" 2>/dev/null
            systemctl disable "$svc" 2>/dev/null
            systemctl mask "$svc" 2>/dev/null
            REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}systemctl stop $svc; systemctl mask $svc"
            ACTIONS_TAKEN+=("$svc 중지 및 mask")
        fi
    done

    AFTER="ss -tuln (2049,111):"$'\n'"$(ss -tuln 2>/dev/null | grep -E ':2049 |:111 ' || echo '(없음)')"
    ss -tuln 2>/dev/null | grep -qE ':2049 |:111 ' && STATUS="VULNERABLE"

    if [ -n "$REMEDY_CMD" ]; then
        if [ "$STATUS" = "VULNERABLE" ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후에도 NFS/RPC 포트 열림" "$CRITERIA")")
            DETAILS+=("취약: NFS(2049) 또는 RPC(111) 포트 열림")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: NFS 서비스 차단")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: NFS 서비스 없음 또는 이미 차단")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "NFS 서비스" "NFS/RPC 차단" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u39
echo "]" >> "$RESULT_JSON"