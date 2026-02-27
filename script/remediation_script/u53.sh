#!/bin/bash
###############################################################################
# [U-53] FTP 서비스 정보 노출 제한 (ftpd_banner) - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u53() {
    local CHECK_ID="U-53"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="FTP 서비스 정보 노출 제한 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local BANNER_MSG="WARNING: Authorized access only. All activities are logged."
    local vsftpd_conf=""
    for path in /etc/vsftpd/vsftpd.conf /etc/vsftpd.conf; do [ -f "$path" ] && vsftpd_conf="$path" && break; done

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."
    local BEFORE="" AFTER="" REMEDY_CMD=""

    if ! command -v vsftpd >/dev/null 2>&1 && [ -z "$vsftpd_conf" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "vsftpd 미설치" " " "vsftpd 미설치" "설치 없음(양호)" "점검 대상 없을 시 양호")")
        DETAILS+=("양호: vsftpd 미설치")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "vsftpd 미설치" "해당없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi
    if [ -z "$vsftpd_conf" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "설정 파일 없음" " " "설정 파일 없음" "설정 파일 미발견" "양호는 ftpd_banner 설정")")
        STATUS="VULNERABLE"
        DETAILS+=("취약: vsftpd 설정 파일 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "설정 없음" "해당없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    local CRITERIA="양호는 ftpd_banner에 버전 노출 없이 경고 문구"
    BEFORE="grep ftpd_banner $vsftpd_conf:"$'\n'"$(grep '^ftpd_banner=' "$vsftpd_conf" 2>/dev/null || echo '(없음)')"

    mkdir -p /tmp/security_audit/backup/U-53
    cp -p "$vsftpd_conf" "/tmp/security_audit/backup/U-53/vsftpd.conf.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
    if grep -q "^ftpd_banner=" "$vsftpd_conf"; then
        sed -i "s/^ftpd_banner=.*/ftpd_banner=$BANNER_MSG/" "$vsftpd_conf"
        REMEDY_CMD="sed -i 's/^ftpd_banner=.*/ftpd_banner=.../' $vsftpd_conf"
        ACTIONS_TAKEN+=("ftpd_banner 교체")
    else
        echo "ftpd_banner=$BANNER_MSG" >> "$vsftpd_conf"
        REMEDY_CMD="echo 'ftpd_banner=...' >> $vsftpd_conf"
        ACTIONS_TAKEN+=("ftpd_banner 추가")
    fi
    systemctl is-active --quiet vsftpd 2>/dev/null && systemctl restart vsftpd 2>/dev/null && ACTIONS_TAKEN+=("vsftpd 재시작")

    AFTER="grep ftpd_banner $vsftpd_conf:"$'\n'"$(grep '^ftpd_banner=' "$vsftpd_conf" 2>/dev/null || echo '(없음)')"

    DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
    DETAILS+=("조치 완료: FTP 배너 제한")
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "vsftpd 배너" "ftpd_banner 적용" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u53
echo "]" >> "$RESULT_JSON"