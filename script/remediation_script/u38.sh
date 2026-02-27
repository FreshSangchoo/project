#!/bin/bash
###############################################################################
# [U-38] DoS 취약 서비스 비활성화 (echo, discard, daytime, chargen) - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u38() {
    local CHECK_ID="U-38"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="DoS 공격에 취약한 서비스 비활성화 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 echo/discard/daytime/chargen(7,9,13,19) 포트 미사용"
    local dos_services=("echo" "discard" "daytime" "chargen")

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local BEFORE="" AFTER="" REMEDY_CMD=""
    BEFORE="ss -tuln (포트 7,9,13,19):"$'\n'"$(ss -tuln 2>/dev/null | grep -E ':7 |:9 |:13 |:19 ' || echo '(없음)')"
    [ -d /etc/xinetd.d ] && for svc in "${dos_services[@]}"; do
        for conf in /etc/xinetd.d/${svc}*; do
            [ -f "$conf" ] && BEFORE="${BEFORE}"$'\n'"grep disable $conf:"$'\n'"$(grep -i disable "$conf" 2>/dev/null || true)"
        done
    done

    local xinetd_needs_restart=false
    [ -d /etc/xinetd.d ] && for svc in "${dos_services[@]}"; do
        for conf in /etc/xinetd.d/${svc}*; do
            [ -f "$conf" ] && grep -qi "disable\s*=\s*no" "$conf" 2>/dev/null && {
                sed -i 's/disable\s*=\s*no/disable = yes/gi' "$conf"
                REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}sed -i 's/disable.*no/disable = yes/g' $conf"
                ACTIONS_TAKEN+=("xinetd: $(basename "$conf") 비활성화")
                xinetd_needs_restart=true
            }
        done
    done
    [ "$xinetd_needs_restart" = true ] && systemctl is-active --quiet xinetd 2>/dev/null && systemctl restart xinetd 2>/dev/null
    for svc in "${dos_services[@]}"; do
        systemctl is-active --quiet "$svc" 2>/dev/null || systemctl is-enabled "$svc" 2>/dev/null || true
        if systemctl list-unit-files "$svc.service" 2>/dev/null | grep -q .; then
            systemctl stop "$svc" 2>/dev/null
            systemctl disable "$svc" 2>/dev/null
            systemctl mask "$svc" 2>/dev/null
            REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}systemctl stop $svc; systemctl mask $svc"
            ACTIONS_TAKEN+=("systemd: $svc 마스킹")
        fi
    done

    AFTER="ss -tuln (포트 7,9,13,19):"$'\n'"$(ss -tuln 2>/dev/null | grep -E ':7 |:9 |:13 |:19 ' || echo '(없음)')"
    ss -tuln 2>/dev/null | grep -qE ':7 |:9 |:13 |:19 ' && STATUS="VULNERABLE"

    if [ -n "$REMEDY_CMD" ]; then
        if [ "$STATUS" = "VULNERABLE" ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후에도 포트 열림" "$CRITERIA")")
            DETAILS+=("취약: 포트 7,9,13,19 여전히 열림")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: DoS 취약 서비스 차단")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: DoS 취약 서비스 없음")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "DoS 서비스" "포트 7,9,13,19 차단" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u38
echo "]" >> "$RESULT_JSON"