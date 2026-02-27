#!/bin/bash
###############################################################################
# [U-24] 사용자·시스템 환경변수 파일 소유자 및 권한 - 개별 조치
# 점검: 소유자 본인, 타인 쓰기(o-w) 없음 / 조치: chown 사용자, chmod o-w
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u24() {
    local CHECK_ID="U-24"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="환경변수 파일의 일반 사용자 쓰기 권한 제거 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local ENV_FILES=(".profile" ".kshrc" ".cshrc" ".bashrc" ".bash_profile" ".login" ".exrc" ".netrc")
    local CRITERIA="양호는 소유자 본인, 타인 쓰기(o-w) 없음"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local users_to_check
    users_to_check=$(awk -F: '$3 >= 1000 && $3 != 65534 {print $1 ":" $6}' /etc/passwd 2>/dev/null)
    local BEFORE="" AFTER="" REMEDY_CMD=""

    if [ -z "$users_to_check" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "점검 대상 일반 사용자 없음(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: 점검 대상 일반 사용자 없음")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "점검 파일 없음" "파일 없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    while IFS=":" read -r username user_home; do
        [ ! -d "$user_home" ] && continue
        for env_file in "${ENV_FILES[@]}"; do
            local target_path="$user_home/$env_file"
            [ ! -f "$target_path" ] && continue
            local line
            line=$(ls -l "$target_path" 2>/dev/null)
            local p o
            p=$(stat -c "%a" "$target_path" 2>/dev/null)
            o=$(stat -c "%U" "$target_path" 2>/dev/null)
            [ -n "$p" ] && [ -n "$o" ] && line="${line} (권한: ${p}, 소유자: ${o})"
            BEFORE="${BEFORE}${BEFORE:+$'\n'}${line}"
        done
    done <<< "$users_to_check"

    while IFS=":" read -r username user_home; do
        [ ! -d "$user_home" ] && continue
        for env_file in "${ENV_FILES[@]}"; do
            local target_path="$user_home/$env_file"
            [ ! -f "$target_path" ] && continue
            local current_owner other_write
            current_owner=$(stat -c '%U' "$target_path" 2>/dev/null)
            other_write=$(stat -c '%A' "$target_path" 2>/dev/null | cut -c 9)
            if [ "$current_owner" != "$username" ] || [ "$other_write" = "w" ]; then
                cp -p "$target_path" "${target_path}.bak_$(date +%Y%m%d)" 2>/dev/null
                chown "$username" "$target_path" 2>/dev/null
                chmod o-w "$target_path" 2>/dev/null
                REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}chown $username \"$target_path\"; chmod o-w \"$target_path\""
                ACTIONS_TAKEN+=("${username}: ${env_file} (소유자:$current_owner→$username, o-w 제거)")
            fi
        done
    done <<< "$users_to_check"

    while IFS=":" read -r username user_home; do
        [ ! -d "$user_home" ] && continue
        for env_file in "${ENV_FILES[@]}"; do
            local target_path="$user_home/$env_file"
            [ ! -f "$target_path" ] && continue
            local line
            line=$(ls -l "$target_path" 2>/dev/null)
            local p o
            p=$(stat -c "%a" "$target_path" 2>/dev/null)
            o=$(stat -c "%U" "$target_path" 2>/dev/null)
            [ -n "$p" ] && [ -n "$o" ] && line="${line} (권한: ${p}, 소유자: ${o})"
            AFTER="${AFTER}${AFTER:+$'\n'}${line}"
        done
    done <<< "$users_to_check"

    local STILL_VULN=0
    while IFS=":" read -r username user_home; do
        [ ! -d "$user_home" ] && continue
        for env_file in "${ENV_FILES[@]}"; do
            [ ! -f "$user_home/$env_file" ] && continue
            local final_owner final_ow
            final_owner=$(stat -c '%U' "$user_home/$env_file" 2>/dev/null)
            final_ow=$(stat -c '%A' "$user_home/$env_file" 2>/dev/null | cut -c 9)
            [ "$final_ow" = "w" ] || [ "$final_owner" != "$username" ] && STILL_VULN=1
        done
    done <<< "$users_to_check"
    [ "$STILL_VULN" -eq 1 ] && STATUS="VULNERABLE"

    if [ -n "$REMEDY_CMD" ]; then
        if [ "$STILL_VULN" -eq 1 ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후 계속 취약(일부)" "$CRITERIA")")
            DETAILS+=("취약: 조치 후에도 일부 환경변수 파일 부적절")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: 환경변수 파일 소유자 및 o-w 제거")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: 모든 사용자 환경변수 파일 적절")
    fi

    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local PRE_VAL="환경변수 파일"; local POST_VAL="소유자 본인, o-w 없음"
    [ "$STATUS" = "VULNERABLE" ] && POST_VAL="취약 상태 유지"
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$PRE_VAL" "$POST_VAL" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u24
echo "]" >> "$RESULT_JSON"