#!/bin/bash
###############################################################################
# [U-22] /etc/services 파일 소유자 및 권한 설정 - 개별 조치
# 점검: 소유자 root, bin, sys 중 하나 / 권한 644 이하
# 조치: chown root, chmod 644
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u22() {
    local CHECK_ID="U-22"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="/etc/services 파일 소유자 및 권한 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local TARGET_FILE="/etc/services"
    local CRITERIA="양호는 소유자 root, bin, sys 중 하나 / 권한 644 이하"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

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

    local NEED_FIX=0
    [[ "$P_OWN" != "root" && "$P_OWN" != "bin" && "$P_OWN" != "sys" ]] && NEED_FIX=1
    [ -n "$P_NUM" ] && [ "$P_NUM" -gt 644 ] && NEED_FIX=1

    if [ "$NEED_FIX" -eq 1 ]; then
        mkdir -p /tmp/security_audit/backup/U-22
        cp -p "$TARGET_FILE" "/tmp/security_audit/backup/U-22/services.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
        if [[ "$P_OWN" != "root" && "$P_OWN" != "bin" && "$P_OWN" != "sys" ]]; then
            chown root "$TARGET_FILE" 2>/dev/null
            REMEDY_CMD="chown root $TARGET_FILE"
            ACTIONS_TAKEN+=("소유자 변경: $P_OWN → root")
        fi
        if [ -n "$P_NUM" ] && [ "$P_NUM" -gt 644 ]; then
            chmod 644 "$TARGET_FILE" 2>/dev/null
            REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+; }chmod 644 $TARGET_FILE"
            ACTIONS_TAKEN+=("권한 변경: $P_NUM → 644")
        fi
    fi

    AFTER=$(ls -l "$TARGET_FILE" 2>/dev/null)
    local P_AFTER_NUM P_AFTER_OWN
    P_AFTER_NUM=$(stat -c "%a" "$TARGET_FILE" 2>/dev/null)
    P_AFTER_OWN=$(stat -c "%U" "$TARGET_FILE" 2>/dev/null)
    [ -n "$P_AFTER_NUM" ] && [ -n "$P_AFTER_OWN" ] && AFTER="${AFTER} (권한: ${P_AFTER_NUM}, 소유자: ${P_AFTER_OWN})"

    if [ "$NEED_FIX" -eq 1 ]; then
        local STILL_VULN=0
        [[ "$P_AFTER_OWN" != "root" && "$P_AFTER_OWN" != "bin" && "$P_AFTER_OWN" != "sys" ]] && STILL_VULN=1
        [ -n "$P_AFTER_NUM" ] && [ "$P_AFTER_NUM" -gt 644 ] && STILL_VULN=1
        [ "$STILL_VULN" -eq 1 ] && STATUS="VULNERABLE"

        if [ "$STILL_VULN" -eq 1 ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후 계속 취약" "$CRITERIA")")
            DETAILS+=("취약: 조치 후에도 설정 부적절")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: /etc/services 소유자 및 권한 조치")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: /etc/services 소유자 및 권한 기준 충족")
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

remediate_u22

echo "]" >> "$RESULT_JSON"