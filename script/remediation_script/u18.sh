#!/bin/bash
###############################################################################
# [U-18] /etc/shadow 파일 소유자 및 권한 설정 - 개별 조치 (진단 스크립트와 점검 항목 동일)
# 점검: 소유자 root, 권한 400 이하
# 조치: chown root, chmod 400
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u18() {
    local CHECK_ID="U-18"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="/etc/shadow 파일 소유자 및 권한 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local TARGET_FILE="/etc/shadow"
    local CRITERIA_SHADOW="양호는 소유자 root, 권한 400 이하"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    # ---------- 조치 전 상태 (실제 출력만: ls -l + 권한/소유자) ----------
    local BEFORE=""
    local AFTER=""
    local REMEDY_CMD=""

    if [ ! -f "$TARGET_FILE" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "설정 파일 없음(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: 점검 대상 파일 없음(해당없음)")
        local DETAILS_STR
        DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["
        local i=0
        for obj in "${DETAIL_OBJS[@]}"; do
            [ $i -gt 0 ] && DETAILS_JSON+=","
            DETAILS_JSON+="$obj"
            ((i++)) || true
        done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "점검 파일 없음" "파일 없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    BEFORE=$(ls -l "$TARGET_FILE" 2>/dev/null)
    local P_NUM P_OWN
    P_NUM=$(stat -c "%a" "$TARGET_FILE" 2>/dev/null)
    P_OWN=$(stat -c "%U" "$TARGET_FILE" 2>/dev/null)
    [ -n "$P_NUM" ] && [ -n "$P_OWN" ] && BEFORE="${BEFORE} (권한: ${P_NUM}, 소유자: ${P_OWN})"

    # ---------- 조치 수행 ----------
    if [ "$P_OWN" != "root" ]; then
        local BACKUP_PATH="/tmp/security_audit/backup"
        mkdir -p "$BACKUP_PATH"
        cp -p "$TARGET_FILE" "$BACKUP_PATH/shadow.bak_$(date +%Y%m%d)" 2>/dev/null
        chown root:root "$TARGET_FILE" 2>/dev/null
        REMEDY_CMD="chown root:root $TARGET_FILE"
        ACTIONS_TAKEN+=("소유자 변경: $P_OWN → root")
    fi
    if [ -n "$P_NUM" ] && [ "$P_NUM" -gt 400 ]; then
        [ -z "$REMEDY_CMD" ] && { mkdir -p /tmp/security_audit/backup; cp -p "$TARGET_FILE" "/tmp/security_audit/backup/shadow.bak_$(date +%Y%m%d)" 2>/dev/null; }
        chmod 400 "$TARGET_FILE" 2>/dev/null
        REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+; }chmod 400 $TARGET_FILE"
        ACTIONS_TAKEN+=("권한 변경: $P_NUM → 400")
    fi

    # ---------- 조치 후 상태 (실제 출력만) ----------
    AFTER=$(ls -l "$TARGET_FILE" 2>/dev/null)
    local P_AFTER_NUM P_AFTER_OWN
    P_AFTER_NUM=$(stat -c "%a" "$TARGET_FILE" 2>/dev/null)
    P_AFTER_OWN=$(stat -c "%U" "$TARGET_FILE" 2>/dev/null)
    [ -n "$P_AFTER_NUM" ] && [ -n "$P_AFTER_OWN" ] && AFTER="${AFTER} (권한: ${P_AFTER_NUM}, 소유자: ${P_AFTER_OWN})"

    if [ -n "$REMEDY_CMD" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA_SHADOW")")
        STATUS="SAFE"
        DETAILS+=("조치 완료: /etc/shadow 소유자 및 권한 조치")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA_SHADOW")")
        DETAILS+=("양호: /etc/shadow 소유자 및 권한 기준 충족")
    fi

    if [ "$P_AFTER_OWN" != "root" ] || { [ -n "$P_AFTER_NUM" ] && [ "$P_AFTER_NUM" -gt 400 ]; }; then
        STATUS="VULNERABLE"
        DETAILS+=("취약: 조치 후에도 설정 부적절")
    fi

    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local PRE_VAL="소유자 $P_OWN, 권한 $P_NUM"
    local POST_VAL="소유자 $P_AFTER_OWN, 권한 $P_AFTER_NUM"
    [ "$STATUS" = "VULNERABLE" ] && POST_VAL="취약 상태 유지"
    local DETAILS_STR
    DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["
    local i=0
    for obj in "${DETAIL_OBJS[@]}"; do
        [ $i -gt 0 ] && DETAILS_JSON+=","
        DETAILS_JSON+="$obj"
        ((i++)) || true
    done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$PRE_VAL" "$POST_VAL" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u18

echo "]" >> "$RESULT_JSON"