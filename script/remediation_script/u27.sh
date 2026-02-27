#!/bin/bash
###############################################################################
# [U-27] /etc/hosts.equiv 및 $HOME/.rhosts 소유자·권한·'+' 설정 - 개별 조치
# 점검: 권한 600 이하, '+' 미사용 / 조치: chown root, chmod 600, sed로 '+' 주석
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u27() {
    local CHECK_ID="U-27"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="/etc/hosts.equiv 및 \$HOME/.rhosts 파일 권한 및 설정 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local BACKUP_DIR="/tmp/security_audit/backup/U-27"
    local CRITERIA="양호는 권한 600 이하, '+' 미포함"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"
    mkdir -p "$BACKUP_DIR"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local target_files=("/etc/hosts.equiv")
    local users_info
    users_info=$(awk -F: '$3 >= 1000 && $3 != 65534 {print $1 ":" $6}' /etc/passwd 2>/dev/null)
    while IFS=":" read -r username user_home; do
        [ -f "$user_home/.rhosts" ] && target_files+=("$user_home/.rhosts")
    done <<< "$users_info"

    local BEFORE="" AFTER="" REMEDY_CMD=""
    for file in "${target_files[@]}"; do
        [ ! -f "$file" ] && continue
        local line
        line=$(ls -l "$file" 2>/dev/null)
        local p o
        p=$(stat -c "%a" "$file" 2>/dev/null)
        o=$(stat -c "%U" "$file" 2>/dev/null)
        [ -n "$p" ] && [ -n "$o" ] && line="${line} (권한: ${p}, 소유자: ${o})"
        local plus_content
        plus_content=$(grep -n "+" "$file" 2>/dev/null)
        [ -n "$plus_content" ] && line="${line}"$'\n'"grep '+' 결과:"$'\n'"${plus_content}"
        BEFORE="${BEFORE}${BEFORE:+$'\n---\n'}${line}"
    done

    if [ -z "$BEFORE" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "설정 파일 없음(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: hosts.equiv 및 .rhosts 없음(해당없음)")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "점검 파일 없음" "파일 없음" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    for file in "${target_files[@]}"; do
        [ ! -f "$file" ] && continue
        local curr_perm curr_owner has_plus
        curr_perm=$(stat -c "%a" "$file" 2>/dev/null)
        curr_owner=$(stat -c "%U" "$file" 2>/dev/null)
        # 주석은 제외하고, 라인 선두에 '+' 가 있는 경우만 취약 대상으로 인식 (점검 스크립트와 동일 기준)
        has_plus=$(grep -v '^#' "$file" 2>/dev/null | grep -qE '^\+|^[[:space:]]+\+' && echo "yes" || echo "")

        # 소유자(root)가 아니거나, 권한이 600 초과이거나, '+' 설정이 있으면 조치
        if [ "$curr_owner" != "root" ] || { [ -n "$curr_perm" ] && [ "$curr_perm" -gt 600 ]; } || [ -n "$has_plus" ]; then
            cp -p "$file" "$BACKUP_DIR/$(basename "$file")_$(date +%H%M%S).bak" 2>/dev/null
            chown root "$file" 2>/dev/null
            chmod 600 "$file" 2>/dev/null
            # '+'를 '#+' 형태로 치환하여 주석 처리
            sed -i 's/^\([[:space:]]*\)\+/\1#\+/g' "$file" 2>/dev/null
            REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}chown root \"$file\"; chmod 600 \"$file\"; sed -i 's/^\\([[:space:]]*\\)\\+/\\1#\\+/g' \"$file\""
            ACTIONS_TAKEN+=("$file: 소유자 root, 권한 600 및 '+' 주석 처리")
        fi
    done

    for file in "${target_files[@]}"; do
        [ ! -f "$file" ] && continue
        local line
        line=$(ls -l "$file" 2>/dev/null)
        local p o
        p=$(stat -c "%a" "$file" 2>/dev/null)
        o=$(stat -c "%U" "$file" 2>/dev/null)
        [ -n "$p" ] && [ -n "$o" ] && line="${line} (권한: ${p}, 소유자: ${o})"
        local plus_content
        plus_content=$(grep -v '^#' "$file" 2>/dev/null | grep -n "+" 2>/dev/null)
        [ -n "$plus_content" ] && line="${line}"$'\n'"grep '+' 결과:"$'\n'"${plus_content}"
        AFTER="${AFTER}${AFTER:+$'\n---\n'}${line}"
    done

    local STILL_VULN=0
    for file in "${target_files[@]}"; do
        [ ! -f "$file" ] && continue
        local final_perm final_plus
        final_perm=$(stat -c "%a" "$file" 2>/dev/null)
        final_plus=$(grep -v '^#' "$file" 2>/dev/null | grep "+" 2>/dev/null)
        [ -n "$final_perm" ] && [ "$final_perm" -gt 600 ] && STILL_VULN=1
        [ -n "$final_plus" ] && STILL_VULN=1
    done
    [ "$STILL_VULN" -eq 1 ] && STATUS="VULNERABLE"

    if [ -n "$REMEDY_CMD" ]; then
        if [ "$STILL_VULN" -eq 1 ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후 계속 취약(일부)" "$CRITERIA")")
            DETAILS+=("취약: 조치 후에도 일부 파일 부적절")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: hosts.equiv/.rhosts 권한 및 '+' 설정 조치")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: 모든 원격 접속 허용 설정 파일 적절")
    fi

    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local PRE_VAL="rhosts/hosts.equiv"; local POST_VAL="권한 600, '+' 없음"
    [ "$STATUS" = "VULNERABLE" ] && POST_VAL="취약 상태 유지"
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$PRE_VAL" "$POST_VAL" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u27
echo "]" >> "$RESULT_JSON"