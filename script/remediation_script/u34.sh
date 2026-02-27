#!/bin/bash
###############################################################################
# [U-34] Finger 서비스 비활성화 - 개별 조치
# 점검: 포트 79 미사용 / 조치: systemctl mask, xinetd/inetd 설정
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u34() {
    local CHECK_ID="U-34"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="Finger 서비스 비활성화 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 Finger(포트 79) 서비스 비활성화"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local BEFORE="" AFTER="" REMEDY_CMD=""
    BEFORE="ss -tuln | grep ':79 '"$'\n'"$(ss -tuln 2>/dev/null | grep -E ':79 |:79$' || true)"
    BEFORE="${BEFORE}"$'\n'"systemctl list-unit-files '*finger*' (활성 여부):"$'\n'"$(systemctl list-unit-files 'finger*' '*finger*' 2>/dev/null || true)"
    [ -f /etc/xinetd.d/finger ] && BEFORE="${BEFORE}"$'\n'"grep disable /etc/xinetd.d/finger:"$'\n'"$(grep -i disable /etc/xinetd.d/finger 2>/dev/null || true)"
    [ -f /etc/inetd.conf ] && BEFORE="${BEFORE}"$'\n'"grep finger /etc/inetd.conf:"$'\n'"$(grep -v '^#' /etc/inetd.conf | grep -i finger 2>/dev/null || true)"

    local finger_services=("finger" "finger-server" "cfingerd" "finger.socket")
    for svc in "${finger_services[@]}"; do
        if systemctl list-unit-files "$svc" 2>/dev/null | grep -q .; then
            systemctl stop "$svc" 2>/dev/null
            systemctl disable "$svc" 2>/dev/null
            systemctl mask "$svc" 2>/dev/null
            REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}systemctl stop $svc; systemctl disable $svc; systemctl mask $svc"
            ACTIONS_TAKEN+=("$svc 서비스 중지 및 마스킹")
        fi
    done
    [ -f /etc/xinetd.d/finger ] && {
        sed -i 's/disable[[:space:]]*=[[:space:]]*no/disable = yes/g' /etc/xinetd.d/finger 2>/dev/null
        REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}sed -i 's/disable.*no/disable = yes/g' /etc/xinetd.d/finger"
        ACTIONS_TAKEN+=("xinetd: finger disable=yes")
        systemctl restart xinetd 2>/dev/null
    }
    [ -f /etc/inetd.conf ] && grep -v '^#' /etc/inetd.conf | grep -qi finger && {
        sed -i 's/^\(finger\)/#\1/g' /etc/inetd.conf 2>/dev/null
        REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}inetd.conf finger 주석"
        ACTIONS_TAKEN+=("inetd: finger 주석 처리")
        pkill -HUP inetd 2>/dev/null
    }

    AFTER="ss -tuln | grep ':79 '"$'\n'"$(ss -tuln 2>/dev/null | grep -E ':79 |:79$' || echo '(없음)')"
    AFTER="${AFTER}"$'\n'"systemctl list-unit-files '*finger*':"$'\n'"$(systemctl list-unit-files 'finger*' '*finger*' 2>/dev/null || true)"

    ss -tuln 2>/dev/null | grep -qE ':79 |:79$' && STATUS="VULNERABLE"

    if [ -n "$REMEDY_CMD" ]; then
        if [ "$STATUS" = "VULNERABLE" ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후에도 포트 79 열림" "$CRITERIA")")
            DETAILS+=("취약: 포트 79 여전히 열림")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: Finger 서비스 비활성화")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: Finger 서비스 비활성화됨")
    fi

    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local PRE_VAL="Finger(79)"; local POST_VAL="비활성화"
    [ "$STATUS" = "VULNERABLE" ] && POST_VAL="취약 상태 유지"
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$PRE_VAL" "$POST_VAL" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u34
echo "]" >> "$RESULT_JSON"