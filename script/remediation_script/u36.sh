#!/bin/bash
###############################################################################
# [U-36] r 계열 서비스 비활성화 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u36() {
    local CHECK_ID="U-36"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="r 계열 서비스 비활성화 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 rsh, rlogin, rexec 등 r 계열 서비스 비활성화"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local BEFORE="" AFTER="" REMEDY_CMD=""
    BEFORE="systemctl list-unit-files rsh rlogin rexec *socket* (관련만):"$'\n'"$(systemctl list-unit-files 2>/dev/null | grep -E 'rsh|rlogin|rexec|shell\.socket|login\.socket|exec\.socket' || true)"
    [ -d /etc/xinetd.d ] && BEFORE="${BEFORE}"$'\n'"ls /etc/xinetd.d/rsh /etc/xinetd.d/rlogin 등:"$'\n'"$(ls -la /etc/xinetd.d/rsh /etc/xinetd.d/rlogin /etc/xinetd.d/rexec 2>/dev/null || true)"
    [ -f /etc/inetd.conf ] && BEFORE="${BEFORE}"$'\n'"grep -E 'rlogin|rsh|rexec' /etc/inetd.conf:"$'\n'"$(grep -E 'rlogin|rsh|rexec|^shell|^login|^exec' /etc/inetd.conf 2>/dev/null | grep -v '^#' || true)"

    local r_services=("rsh" "rlogin" "rexec" "rsh.socket" "rlogin.socket" "rexec.socket" "shell.socket" "login.socket" "exec.socket")
    for svc in "${r_services[@]}"; do
        if systemctl list-unit-files "$svc" 2>/dev/null | grep -q .; then
            systemctl stop "$svc" 2>/dev/null
            systemctl disable "$svc" 2>/dev/null
            systemctl mask "$svc" 2>/dev/null
            REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}systemctl stop $svc; systemctl disable $svc; systemctl mask $svc"
            ACTIONS_TAKEN+=("$svc 비활성화(mask)")
        fi
    done
    [ -d /etc/xinetd.d ] && for target in rsh rlogin rexec shell login exec; do
        [ -f "/etc/xinetd.d/$target" ] && {
            sed -i 's/disable[[:space:]]*=[[:space:]]*no/disable = yes/g' "/etc/xinetd.d/$target" 2>/dev/null
            REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}xinetd.d/$target disable=yes"
            ACTIONS_TAKEN+=("xinetd: $target 비활성화")
        }
    done
    systemctl restart xinetd 2>/dev/null
    [ -f /etc/inetd.conf ] && {
        sed -i 's/^\(rlogin\|rsh\|rexec\|shell\|login\|exec\)/#\1/g' /etc/inetd.conf 2>/dev/null
        REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}inetd.conf r계열 주석"
        ACTIONS_TAKEN+=("inetd.conf r계열 주석")
    }
    [ -f /etc/hosts.equiv ] && mv /etc/hosts.equiv /etc/hosts.equiv.bak 2>/dev/null && ACTIONS_TAKEN+=("hosts.equiv 백업 제거")
    [ -f /root/.rhosts ] && mv /root/.rhosts /root/.rhosts.bak 2>/dev/null && ACTIONS_TAKEN+=(".rhosts 백업 제거")

    AFTER="systemctl list-unit-files (r관련):"$'\n'"$(systemctl list-unit-files 2>/dev/null | grep -E 'rsh|rlogin|rexec|shell\.socket|login\.socket|exec\.socket' || true)"

    DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
    DETAILS+=("조치 완료: r 계열 서비스 비활성화")
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "r계열 서비스" "비활성화" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u36
echo "]" >> "$RESULT_JSON"