#!/bin/bash
###############################################################################
# [U-32] 홈 디렉터리 존재 관리 - 개별 조치
# 점검: passwd 홈 경로 존재 / 조치: mkdir, skel 복사, chown/chmod
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u32() {
    local CHECK_ID="U-32"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="홈 디렉터리 존재 관리 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 모든 점검 대상 계정의 홈 디렉터리가 존재"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local users_info
    users_info=$(awk -F: '$3 >= 1000 || $1 == "root" {print $1":"$3":"$6}' /etc/passwd 2>/dev/null)
    local BEFORE="" AFTER="" REMEDY_CMD=""

    BEFORE=$(awk -F: '$3 >= 1000 || $1 == "root" {print $1, $6}' /etc/passwd 2>/dev/null | while read -r u h; do
        [ -z "$h" ] && continue
        if [ ! -d "$h" ]; then echo "없음: $u -> $h"; else echo "존재: $u -> $h"; fi
    done)
    [ -z "$BEFORE" ] && BEFORE="(점검 대상 없음)"

    for info in $users_info; do
        user_name=$(echo "$info" | cut -d: -f1)
        user_home=$(echo "$info" | cut -d: -f3)
        [ -z "$user_home" ] && continue
        if [ ! -d "$user_home" ]; then
            mkdir -p "$user_home" 2>/dev/null
            [ -d "/etc/skel" ] && cp -r /etc/skel/. "$user_home/" 2>/dev/null
            chown -R "$user_name":"$user_name" "$user_home" 2>/dev/null
            chmod 700 "$user_home" 2>/dev/null
            REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}mkdir -p \"$user_home\"; chown -R $user_name \"$user_home\"; chmod 700 \"$user_home\""
            ACTIONS_TAKEN+=("[$user_name] 홈 디렉터리 $user_home 복구")
        fi
    done

    AFTER=$(awk -F: '$3 >= 1000 || $1 == "root" {print $1, $6}' /etc/passwd 2>/dev/null | while read -r u h; do
        [ -z "$h" ] && continue
        if [ ! -d "$h" ]; then echo "없음: $u -> $h"; else echo "존재: $u -> $h"; fi
    done)
    [ -z "$AFTER" ] && AFTER="(점검 대상 없음)"

    local STILL_MISSING=0
    for info in $users_info; do
        user_home=$(echo "$info" | cut -d: -f3)
        [ ! -d "$user_home" ] && STILL_MISSING=1
    done
    [ "$STILL_MISSING" -eq 1 ] && STATUS="VULNERABLE"

    if [ -n "$REMEDY_CMD" ]; then
        if [ "$STILL_MISSING" -eq 1 ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후에도 일부 홈 없음" "$CRITERIA")")
            DETAILS+=("취약: 조치 후에도 누락된 홈 디렉터리 있음")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: 누락된 홈 디렉터리 복구")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: 모든 계정 홈 디렉터리 존재")
    fi

    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local PRE_VAL="홈 디렉터리"; local POST_VAL="모든 홈 존재"
    [ "$STATUS" = "VULNERABLE" ] && POST_VAL="취약 상태 유지"
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$PRE_VAL" "$POST_VAL" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u32
echo "]" >> "$RESULT_JSON"