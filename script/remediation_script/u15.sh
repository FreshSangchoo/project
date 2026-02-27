
폴더 하이라이트
보안 조치 스크립트 모음으로, U-01부터 U-67까지 시스템 설정 및 서비스 비활성화 관련 개별 조치 내용을 포함합니다.

#!/bin/bash
###############################################################################
# [U-15] 파일 및 디렉터리 소유자 설정 - 개별 조치 (진단 스크립트와 점검 항목 동일)
# 점검: find / \( -nouser -o -nogroup \) -xdev
# 조치: 해당 항목 소유자를 root:root로 변경
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u15() {
    local CHECK_ID="U-15"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="파일 및 디렉터리 소유자 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local CRITERIA_OWNER="양호는 소유자(nouser) 또는 그룹(nogroup)이 없는 파일/디렉터리가 없어야 함"

    # ---------- 조치 전 상태 (실제 find -ls 출력만) ----------
    local ORPHANED_BEFORE
    ORPHANED_BEFORE=$(find / \( -nouser -o -nogroup \) -xdev -ls 2>/dev/null | head -100)

    local ORPHANED_PATHS
    ORPHANED_PATHS=$(find / \( -nouser -o -nogroup \) -xdev -printf '%p\n' 2>/dev/null | head -500)

    # ---------- 점검 항목 1: 소유자 없는 파일/디렉터리 ----------
    local OWNER_REMEDY=""
    if [ -n "$ORPHANED_PATHS" ]; then
        while IFS= read -r item; do
            [ -z "$item" ] && continue
            if chown root:root "$item" 2>/dev/null; then
                OWNER_REMEDY="${OWNER_REMEDY}chown root:root $item"$'\n'
                ACTIONS_TAKEN+=("소유권 변경: $item (-> root:root)")
            fi
        done <<< "$ORPHANED_PATHS"
        OWNER_REMEDY="${OWNER_REMEDY%$'\n'}"
    fi

    local ORPHANED_AFTER
    ORPHANED_AFTER=$(find / \( -nouser -o -nogroup \) -xdev -ls 2>/dev/null | head -100)

    if [ -n "$ORPHANED_BEFORE" ]; then
        local OWNER_INFO="조치후 양호 전환"
        [ -n "$ORPHANED_AFTER" ] && OWNER_INFO="조치 후 계속 취약"
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$ORPHANED_BEFORE" "$OWNER_REMEDY" "$ORPHANED_AFTER" "$OWNER_INFO" "$CRITERIA_OWNER")")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "" " " "" "기존 양호여서 조치 없음" "$CRITERIA_OWNER")")
    fi

    # ---------- 최종 상태 및 출력 ----------
    if [ -n "$ORPHANED_AFTER" ]; then
        STATUS="VULNERABLE"
        echo -e "취약: 일부 소유자/그룹 없는 항목이 남아 있습니다 (권한 부족 등)."
        DETAILS+=("취약: 조치 후에도 소유자 없는 파일 존재")
    elif [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        echo -e "조치 완료: ${#ACTIONS_TAKEN[@]}개 항목을 root 소유로 정상화하였습니다."
        DETAILS+=("조치 완료: 소유자 미설정 항목 root:root로 정상화")
    else
        echo -e "양호: 소유자 없는 파일이 발견되지 않았습니다."
        DETAILS+=("양호: nouser/nogroup 항목 없음")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done

    local PRE_VAL="nouser/nogroup 파일"
    local POST_VAL="No nouser/nogroup"
    [ "$STATUS" = "VULNERABLE" ] && POST_VAL="Vulnerable State"
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

remediate_u15

echo "]" >> "$RESULT_JSON"