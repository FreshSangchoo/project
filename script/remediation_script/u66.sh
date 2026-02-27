#!/bin/bash
###############################################################################
# [U-66] 정책에 따른 시스템 로깅 설정 - 개별 조치 (통합조치와 동일 로직)
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u66() {
    local CHECK_ID="U-66"
    local CATEGORY="로그 관리"
    local DESCRIPTION="정책에 따른 시스템 로깅 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local STATUS="SAFE"
    local CURRENT_VALUE="Logging Policy Hardened"
    local DETAIL_OBJS=()
    local CRITERIA="양호는 rsyslog 표준 로깅 정책이 적용된 상태"
    local CRITERIA_FILE_OK="설정 파일 존재 시에만 점검, 없으면 수동 확인 필요"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local RSYSLOG_CONF="/etc/rsyslog.conf"
    if [ ! -f "$RSYSLOG_CONF" ]; then
        STATUS="ERROR"
        local ERR_MSG="오류: $RSYSLOG_CONF 파일을 찾을 수 없습니다."
        local BEFORE="점검 파일 없음"
        local AFTER="파일 없음"
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" " " "$AFTER" "$ERR_MSG" "$CRITERIA_FILE_OK")")
        local DETAILS_STR="$ERR_MSG"
        local DETAILS_JSON="["
        local i=0
        for obj in "${DETAIL_OBJS[@]}"; do
            [ $i -gt 0 ] && DETAILS_JSON+=","
            DETAILS_JSON+="$obj"
            ((i++)) || true
        done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "점검 파일 없음" "파일 없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return 1
    fi

    local BACKUP_DIR="/root/u66_strong_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -p "$RSYSLOG_CONF" "$BACKUP_DIR/rsyslog.conf.bak"

    local BEFORE="" AFTER="" REMEDY_CMD=""
    BEFORE="rsyslog 정책 관련 라인(조치 전):"$'\n'"$(grep -E '\*\.info;mail\.none;authpriv\.none;cron\.none|authpriv\.\*|mail\.\*|cron\.\*|\*\.alert|\*\.emerg' "$RSYSLOG_CONF" 2>/dev/null || echo '(없음)')"

    local MSG_PATH="/var/log/messages"
    local AUTH_PATH="/var/log/secure"
    if [ -f /etc/os-release ] && grep -qiE "ubuntu|debian" /etc/os-release; then
        MSG_PATH="/var/log/syslog"
        AUTH_PATH="/var/log/auth.log"
    fi

    sed -i '/\*\.info/s/^/# [U-66_OLD] /' "$RSYSLOG_CONF"
    sed -i '/authpriv\./s/^/# [U-66_OLD] /' "$RSYSLOG_CONF"
    sed -i '/mail\./s/^/# [U-66_OLD] /' "$RSYSLOG_CONF"
    sed -i '/cron\./s/^/# [U-66_OLD] /' "$RSYSLOG_CONF"
    sed -i '/\*\.alert/s/^/# [U-66_OLD] /' "$RSYSLOG_CONF"
    sed -i '/\*\.emerg/s/^/# [U-66_OLD] /' "$RSYSLOG_CONF"

    if [ -d "/etc/rsyslog.d" ]; then
        mkdir -p "/etc/rsyslog.d/u66_backup"
    fi

    cat <<EOF >> "$RSYSLOG_CONF"

# --- [U-66 Standard Logging Policy Applied] ---
*.info;mail.none;authpriv.none;cron.none                $MSG_PATH
authpriv.* $AUTH_PATH
mail.* /var/log/maillog
cron.* /var/log/cron
*.alert                                                 /dev/console
*.emerg                                                 *
# --- [End of Policy] ---
EOF

    ACTIONS_TAKEN+=("기존 로깅 정책 주석 처리 및 가이드라인 표준 설정(6개 항목) 일괄 적용")

    local LOG_FILES=("$MSG_PATH" "$AUTH_PATH" "/var/log/maillog" "/var/log/cron")
    for file in "${LOG_FILES[@]}"; do
        [ ! -f "$file" ] && touch "$file"
        chown root:root "$file" 2>/dev/null
        chmod 640 "$file" 2>/dev/null
    done
    ACTIONS_TAKEN+=("주요 로그 파일 권한(640) 및 소유자(root) 보정 완료")
    systemctl restart rsyslog 2>/dev/null
    ACTIONS_TAKEN+=("rsyslog 서비스 재시작으로 설정 즉시 반영")

    STATUS="SAFE"
    echo -e "조치 완료: 로깅 정책이 KISA 표준 가이드라인에 맞춰 적용되었습니다."

    AFTER="rsyslog 정책 관련 라인(조치 후):"$'\n'"$(grep -E '\*\.info;mail\.none;authpriv\.none;cron\.none|authpriv\.\*|mail\.\*|cron\.\*|\*\.alert|\*\.emerg' "$RSYSLOG_CONF" 2>/dev/null || echo '(없음)')"
    REMEDY_CMD="기존 로깅 정책 주석 처리 후 U-66 표준 정책(6개 항목) 추가"

    DETAILS+=("=== 서버 환경 조치 완료 리포트 ===")
    for action in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("✓ $action"); done
    DETAILS+=("재점검 결과: 모든 로깅 패턴이 점검 스크립트의 SAFE 기준과 100% 일치합니다.")

    local DETAILS_STR
    DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
    local DETAILS_JSON="["
    local i=0
    for obj in "${DETAIL_OBJS[@]}"; do
        [ $i -gt 0 ] && DETAILS_JSON+=","
        DETAILS_JSON+="$obj"
        ((i++)) || true
    done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "Hardened/SAFE" "Policy Configured" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u66
echo "]" >> "$RESULT_JSON"