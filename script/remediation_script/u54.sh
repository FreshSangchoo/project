#!/bin/bash
###############################################################################
# [U-54] FTP 서비스 비활성화 및 보안 설정 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u54() {
    local CHECK_ID="U-54"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="FTP 서비스 비활성화 및 보안 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 vsftpd 중지 및 anonymous_enable=NO"
    local vsftpd_conf=""
    for path in /etc/vsftpd/vsftpd.conf /etc/vsftpd.conf; do [ -f "$path" ] && vsftpd_conf="$path" && break; done

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."
    local BEFORE="" AFTER="" REMEDY_CMD=""
    BEFORE="ss -tuln :21:"$'\n'"$(ss -tuln 2>/dev/null | grep ':21 ' || echo '(없음)')"
    [ -n "$vsftpd_conf" ] && BEFORE="${BEFORE}"$'\n'"grep anonymous_enable $vsftpd_conf:"$'\n'"$(grep -i '^anonymous_enable=' "$vsftpd_conf" 2>/dev/null || echo '(없음)')"

    if systemctl list-unit-files 2>/dev/null | grep -q "^vsftpd\.service"; then
        (systemctl is-active --quiet vsftpd 2>/dev/null || systemctl is-enabled vsftpd 2>/dev/null) && {
            systemctl stop vsftpd 2>/dev/null
            systemctl disable vsftpd 2>/dev/null
            systemctl mask vsftpd 2>/dev/null
            REMEDY_CMD="systemctl stop vsftpd; systemctl mask vsftpd"
            ACTIONS_TAKEN+=("vsftpd 중지 및 mask")
        }
    fi
    if [ -n "$vsftpd_conf" ]; then
        mkdir -p /tmp/security_audit/backup/U-54
        cp -p "$vsftpd_conf" "/tmp/security_audit/backup/U-54/vsftpd.conf.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
        if grep -qi "^anonymous_enable=YES" "$vsftpd_conf"; then
            sed -i 's/^anonymous_enable=YES/anonymous_enable=NO/gi' "$vsftpd_conf"
            REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}sed anonymous_enable=NO"
            ACTIONS_TAKEN+=("anonymous_enable NO")
        elif ! grep -qi "^anonymous_enable=" "$vsftpd_conf"; then
            echo "anonymous_enable=NO" >> "$vsftpd_conf"
            REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}echo anonymous_enable=NO >> $vsftpd_conf"
            ACTIONS_TAKEN+=("anonymous_enable=NO 추가")
        fi
    fi

    AFTER="ss -tuln :21:"$'\n'"$(ss -tuln 2>/dev/null | grep ':21 ' || echo '(없음)')"
    [ -n "$vsftpd_conf" ] && AFTER="${AFTER}"$'\n'"grep anonymous_enable $vsftpd_conf:"$'\n'"$(grep -i '^anonymous_enable=' "$vsftpd_conf" 2>/dev/null || echo '(없음)')"
    pgrep -x vsftpd >/dev/null 2>&1 && STATUS="VULNERABLE"

    if [ -n "$REMEDY_CMD" ]; then
        if [ "$STATUS" = "VULNERABLE" ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후에도 vsftpd 실행 중" "$CRITERIA")")
            DETAILS+=("취약: vsftpd 프로세스 여전히 실행")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: FTP 비활성화 및 익명 차단")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: vsftpd 없음 또는 이미 차단")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "vsftpd" "FTP 중지 및 anonymous_enable=NO" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u54
echo "]" >> "$RESULT_JSON"