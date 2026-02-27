#!/bin/bash
###############################################################################
# [U-17] 시스템 시작 스크립트 파일 소유자 및 권한 - 개별 조치 (진단 스크립트와 점검 항목 동일)
# 점검: 소유자 root, Other 쓰기 권한 없음
# 조치: chown root, chmod o-w
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u17() {
    local CHECK_ID="U-17"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="시스템 시작 스크립트 파일 소유자 및 권한 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local TARGET_PATHS=("/etc/rc.d" "/etc/init.d" "/etc/systemd/system" "/usr/lib/systemd/system")
    local CRITERIA="양호는 소유자 root, Other 쓰기 권한 없음"
    local CRITERIA_DIR_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    # ---------- 점검 대상 디렉터리 존재 여부 ----------
    local HAS_TARGET=0
    for dir in "${TARGET_PATHS[@]}"; do
        [ -d "$dir" ] && HAS_TARGET=1 && break
    done

    if [ "$HAS_TARGET" -eq 0 ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "설정 파일 없음(양호)" "$CRITERIA_DIR_OK")")
        DETAILS+=("양호: 점검 대상 디렉터리 없음(해당없음)")
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

    # ---------- 조치 전 상태: 취약한 파일들의 ls -l 출력 (실제 출력만) ----------
    local BEFORE=""
    local REMEDY_CMD=""
    for dir in "${TARGET_PATHS[@]}"; do
        [ ! -d "$dir" ] && continue
        local ORPHANED
        ORPHANED=$(find -L "$dir" -type f \( ! -user root -o -perm -002 \) 2>/dev/null)
        if [ -n "$ORPHANED" ]; then
            while IFS= read -r file; do
                [ -z "$file" ] && continue
                BEFORE="${BEFORE}${BEFORE:+$'\n'}$(ls -l "$file" 2>/dev/null)"
                local perm=$(stat -c "%a" "$file" 2>/dev/null)
                [ -n "$perm" ] && BEFORE="${BEFORE} (권한: ${perm})"
                chown root "$file" 2>/dev/null
                chmod o-w "$file" 2>/dev/null
                REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}chown root \"$file\"; chmod o-w \"$file\""
                ACTIONS_TAKEN+=("$file (조치 완료)")
            done <<< "$ORPHANED"
        fi
    done

    # ---------- 조치 후 상태: 여전히 취약한 파일이 있으면 ls -l 출력, 없으면 빈 문자열 ----------
    local AFTER=""
    for dir in "${TARGET_PATHS[@]}"; do
        [ ! -d "$dir" ] && continue
        local STILL_VULN
        STILL_VULN=$(find -L "$dir" -type f \( ! -user root -o -perm -002 \) 2>/dev/null)
        if [ -n "$STILL_VULN" ]; then
            while IFS= read -r file; do
                [ -z "$file" ] && continue
                AFTER="${AFTER}${AFTER:+$'\n'}$(ls -l "$file" 2>/dev/null)"
                local perm=$(stat -c "%a" "$file" 2>/dev/null)
                [ -n "$perm" ] && AFTER="${AFTER} (권한: ${perm})"
            done <<< "$STILL_VULN"
        fi
    done

    if [ -n "$BEFORE" ]; then
        if [ -n "$AFTER" ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후 계속 취약(일부)" "$CRITERIA")")
            STATUS="VULNERABLE"
            DETAILS+=("취약: 조치 후에도 일부 파일 부적절")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: 시작 스크립트 소유자 및 권한 조치")
        fi
    else
        # 조치 전부터 취약한 파일 없음 → 양호 (조치 전/후 모두 취약 파일 없음 = 빈 문자열)
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "" " " "" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: 모든 시작 스크립트 소유자 root, Other 쓰기 권한 없음")
    fi

    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local PRE_VAL="시작 스크립트 소유자/권한"
    local POST_VAL="root 소유, o-w 제거"
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

remediate_u17

echo "]" >> "$RESULT_JSON"