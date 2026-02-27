#!/bin/bash
###############################################################################
# [U-31] 홈 디렉터리 소유자 및 권한 설정 - 개별 조치
# 점검: 소유자 본인, 권한 700 이하 / 조치: chown 사용자, chmod 700
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u31() {
    local CHECK_ID="U-31"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="홈 디렉터리 소유자 및 권한 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 소유자 본인, 권한 700 이하"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local users_info
    users_info=$(awk -F: '$3 >= 1000 && $1 != "nobody" {print $1":"$6}' /etc/passwd 2>/dev/null)
    local BEFORE="" AFTER="" REMEDY_CMD=""

    if [ -z "$users_info" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "점검 대상 일반 사용자 없음(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: 점검 대상 일반 사용자 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "점검 파일 없음" "파일 없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    while IFS= read -r line; do
        [ -z "$line" ] && continue
        local user_name user_home
        user_name=$(echo "$line" | cut -d: -f1)
        user_home=$(echo "$line" | cut -d: -f2)
        [ ! -d "$user_home" ] && continue
        local l
        l=$(ls -ld "$user_home" 2>/dev/null)
        local p o
        p=$(stat -c '%a' "$user_home" 2>/dev/null)
        o=$(stat -c '%U' "$user_home" 2>/dev/null)
        [ -n "$p" ] && [ -n "$o" ] && l="${l} (권한: ${p}, 소유자: ${o})"
        BEFORE="${BEFORE}${BEFORE:+$'\n'}${l}"
    done <<< "$users_info"

    while IFS= read -r line; do
        [ -z "$line" ] && continue
        user_name=$(echo "$line" | cut -d: -f1)
        user_home=$(echo "$line" | cut -d: -f2)
        [ ! -d "$user_home" ] && continue
        local curr_owner curr_perm
        curr_owner=$(stat -c '%U' "$user_home" 2>/dev/null)
        curr_perm=$(stat -c '%a' "$user_home" 2>/dev/null)
        [ "$curr_owner" != "$user_name" ] && { chown "$user_name" "$user_home" 2>/dev/null; REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}chown $user_name \"$user_home\""; ACTIONS_TAKEN+=("[$user_name] 소유자 $curr_owner → $user_name"); }
        [ -n "$curr_perm" ] && [ "$curr_perm" -gt 700 ] && { chmod 700 "$user_home" 2>/dev/null; REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}chmod 700 \"$user_home\""; ACTIONS_TAKEN+=("[$user_name] 권한 $curr_perm → 700"); }
    done <<< "$users_info"

    while IFS= read -r line; do
        [ -z "$line" ] && continue
        user_home=$(echo "$line" | cut -d: -f2)
        [ ! -d "$user_home" ] && continue
        local l
        l=$(ls -ld "$user_home" 2>/dev/null)
        local p o
        p=$(stat -c '%a' "$user_home" 2>/dev/null)
        o=$(stat -c '%U' "$user_home" 2>/dev/null)
        [ -n "$p" ] && [ -n "$o" ] && l="${l} (권한: ${p}, 소유자: ${o})"
        AFTER="${AFTER}${AFTER:+$'\n'}${l}"
    done <<< "$users_info"

    local STILL_VULN=0
    while IFS= read -r line; do
        [ -z "$line" ] && continue
        user_name=$(echo "$line" | cut -d: -f1)
        user_home=$(echo "$line" | cut -d: -f2)
        [ ! -d "$user_home" ] && continue
        local fo fp
        fo=$(stat -c '%U' "$user_home" 2>/dev/null)
        fp=$(stat -c '%a' "$user_home" 2>/dev/null)
        [ "$fo" != "$user_name" ] && STILL_VULN=1
        [ -n "$fp" ] && [ "$fp" -gt 700 ] && STILL_VULN=1
    done <<< "$users_info"
    [ "$STILL_VULN" -eq 1 ] && STATUS="VULNERABLE"

    if [ -n "$REMEDY_CMD" ]; then
        if [ "$STILL_VULN" -eq 1 ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후 계속 취약(일부)" "$CRITERIA")")
            DETAILS+=("취약: 조치 후에도 일부 홈 디렉터리 부적절")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: 홈 디렉터리 소유자 및 권한 조치")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: 모든 홈 디렉터리 적절")
    fi

    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local PRE_VAL="홈 디렉터리"; local POST_VAL="소유자 본인, 권한 700"
    [ "$STATUS" = "VULNERABLE" ] && POST_VAL="취약 상태 유지"
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$PRE_VAL" "$POST_VAL" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u31
echo "]" >> "$RESULT_JSON"