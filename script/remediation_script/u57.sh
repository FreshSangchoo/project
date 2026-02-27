#!/bin/bash
###############################################################################
# [U-57] Ftpusers 파일 설정 - 개별 조치
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u57() {
    local CHECK_ID="U-57"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="Ftpusers 파일 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 root 등 시스템 계정이 ftpusers 등에 등록"
    local paths=("/etc/vsftpd/ftpusers" "/etc/vsftpd/user_list" "/etc/ftpusers")
    local check_accounts=("root" "bin" "daemon" "adm" "lp" "sync" "shutdown" "halt" "mail" "news" "uucp" "operator" "games" "nobody")
    local ftp_users_conf=""

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."
    local BEFORE="" AFTER="" REMEDY_CMD=""

    for p in "${paths[@]}"; do [ -f "$p" ] && ftp_users_conf="$p" && break; done
    if [ -z "$ftp_users_conf" ] && ! command -v vsftpd >/dev/null 2>&1; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "vsftpd 미설치, ftpusers 없음" " " "해당없음" "FTP 미사용(양호)" "점검 대상 없을 시 양호")")
        DETAILS+=("양호: vsftpd 미설치")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "ftpusers 없음" "해당없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    if [ -z "$ftp_users_conf" ] && command -v vsftpd >/dev/null 2>&1; then
        ftp_users_conf="/etc/vsftpd/ftpusers"
        mkdir -p "$(dirname "$ftp_users_conf")"
        BEFORE="(파일 없음 - 신규 생성)"
        for account in "${check_accounts[@]}"; do echo "$account" >> "$ftp_users_conf"; done
        REMEDY_CMD="echo root bin ... >> $ftp_users_conf"
        ACTIONS_TAKEN+=("$ftp_users_conf 신규 생성 및 시스템 계정 추가")
        AFTER="cat $ftp_users_conf:"$'\n'"$(cat "$ftp_users_conf" 2>/dev/null)"
    else
        BEFORE="cat $ftp_users_conf:"$'\n'"$(cat "$ftp_users_conf" 2>/dev/null)"
        mkdir -p /tmp/security_audit/backup/U-57
        cp -p "$ftp_users_conf" "/tmp/security_audit/backup/U-57/$(basename "$ftp_users_conf").bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
        for account in "${check_accounts[@]}"; do
            grep -qE "^\s*${account}\b" "$ftp_users_conf" || { echo "$account" >> "$ftp_users_conf"; REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}echo $account >> $ftp_users_conf"; ACTIONS_TAKEN+=("$account 추가"); }
        done
        AFTER="cat $ftp_users_conf:"$'\n'"$(cat "$ftp_users_conf" 2>/dev/null)"
    fi

    if [ -n "$REMEDY_CMD" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
        DETAILS+=("조치 완료: ftpusers에 시스템 계정 추가")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: 이미 주요 계정 등록됨")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "ftpusers" "시스템 계정 차단" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u57
echo "]" >> "$RESULT_JSON"