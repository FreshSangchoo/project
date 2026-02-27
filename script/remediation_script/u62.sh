#!/bin/bash
###############################################################################
# [U-62] 로그인 시 경고 메시지 설정 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u62() {
    local CHECK_ID="U-62"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="로그인 시 경고 메시지 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local SSHD_CONFIG="/etc/ssh/sshd_config"
    local CRITERIA="양호는 /etc/motd, /etc/issue, /etc/issue.net 및 SSH Banner 설정"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."
    local BEFORE="" AFTER="" REMEDY_CMD=""
    local BANNER_MESSAGE
    BANNER_MESSAGE=$(cat <<'BANNER_EOF'
#########################################################################
#  [WARNING] Authorized access only.                                    #
#  All activities on this system are logged and monitored.              #
#  Unauthorized access or use is strictly prohibited.                   #
#########################################################################
BANNER_EOF
)

    if [ ! -f "$SSHD_CONFIG" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "점검 파일 없음" " " "파일 없음" "sshd_config 없음" "$CRITERIA")")
        STATUS="VULNERABLE"
        DETAILS+=("취약: sshd_config 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "설정 없음" "해당없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    BEFORE="grep -E '^Banner|^#Banner' $SSHD_CONFIG:"$'\n'"$(grep -E '^Banner|^#Banner' "$SSHD_CONFIG" 2>/dev/null || echo '(없음)')"
    BEFORE="${BEFORE}"$'\n'"head -5 /etc/issue.net 2>/dev/null:"$'\n'"$(head -5 /etc/issue.net 2>/dev/null || echo '(없음)')"

    local banner_files=("/etc/motd" "/etc/issue" "/etc/issue.net")
    for file in "${banner_files[@]}"; do
        echo "$BANNER_MESSAGE" > "$file"
        chmod 644 "$file"
        REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}echo ... > $file"
        ACTIONS_TAKEN+=("$file 보안 문구 적용")
    done
    mkdir -p /tmp/security_audit/backup/U-62
    cp -p "$SSHD_CONFIG" "/tmp/security_audit/backup/U-62/sshd_config.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
    if grep -q "^Banner" "$SSHD_CONFIG"; then
        sed -i "s|^Banner.*|Banner /etc/issue.net|" "$SSHD_CONFIG"
    elif grep -q "^#Banner" "$SSHD_CONFIG"; then
        sed -i "s|^#Banner.*|Banner /etc/issue.net|" "$SSHD_CONFIG"
    else
        echo "Banner /etc/issue.net" >> "$SSHD_CONFIG"
    fi
    REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}Banner /etc/issue.net"
    ACTIONS_TAKEN+=("SSHD Banner /etc/issue.net")
    if ! sshd -t 2>/dev/null; then
        STATUS="VULNERABLE"
        DETAILS+=("SSHD 문법 에러로 재시작 생략")
    else
        systemctl restart sshd 2>/dev/null || systemctl restart ssh 2>/dev/null
        ACTIONS_TAKEN+=("SSHD 재시작")
    fi

    AFTER="grep -E '^Banner|^#Banner' $SSHD_CONFIG:"$'\n'"$(grep -E '^Banner|^#Banner' "$SSHD_CONFIG" 2>/dev/null || echo '(없음)')"
    AFTER="${AFTER}"$'\n'"head -5 /etc/issue.net 2>/dev/null:"$'\n'"$(head -5 /etc/issue.net 2>/dev/null || echo '(없음)')"

    DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
    DETAILS+=("조치 완료: 로그인 경고 메시지 및 Banner 적용")
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "Banner" "Banner 적용" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u62
echo "]" >> "$RESULT_JSON"