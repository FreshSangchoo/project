#!/bin/bash
###############################################################################
# [U-26] /dev 내 비정상(일반) 파일 점검 및 제거 - 개별 조치
# 점검: /dev 내 type f 파일 없어야 함 / 조치: 백업 후 삭제
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u26() {
    local CHECK_ID="U-26"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="/dev 내 비정상 파일 점검 및 제거 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="양호는 /dev 내 일반 파일(regular file)이 없어야 함"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    # 조치 전: find /dev -type f 실제 출력 (ls -l)
    local BEFORE
    BEFORE=$(find /dev -type f -exec ls -l {} \; 2>/dev/null)
    [ -z "$BEFORE" ] && BEFORE=""

    local REMEDY_CMD=""
    if [ -n "$BEFORE" ]; then
        local backup_dir="/tmp/security_audit/backup/U-26"
        mkdir -p "$backup_dir"
        while IFS= read -r file; do
            [ -z "$file" ] || [ ! -f "$file" ] && continue
            local fname=$(basename "$file") ts=$(date +%H%M%S)
            if cp -p "$file" "$backup_dir/${fname}.bak_$ts" 2>/dev/null; then
                if rm -f "$file" 2>/dev/null; then
                    REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}rm -f \"$file\" (백업: $backup_dir/${fname}.bak_$ts)"
                    ACTIONS_TAKEN+=("삭제 완료: $file")
                else
                    REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}rm -f \"$file\" (실패)"
                    STATUS="VULNERABLE"
                    ACTIONS_TAKEN+=("삭제 실패: $file")
                fi
            else
                ACTIONS_TAKEN+=("백업 실패 건너뜀: $file")
            fi
        done < <(find /dev -type f 2>/dev/null)
    fi

    local AFTER
    AFTER=$(find /dev -type f -exec ls -l {} \; 2>/dev/null)
    [ -z "$AFTER" ] && AFTER=""
    [ -n "$AFTER" ] && STATUS="VULNERABLE"

    if [ -n "$BEFORE" ]; then
        if [ -n "$AFTER" ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후 계속 취약(일부)" "$CRITERIA")")
            DETAILS+=("취약: 조치 후에도 /dev 내 일반 파일 존재")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: /dev 내 비정상 파일 제거")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "" " " "" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: /dev 내 일반 파일 없음")
    fi

    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local PRE_VAL="비정상 파일"; local POST_VAL="비정상 파일 없음"
    [ "$STATUS" = "VULNERABLE" ] && POST_VAL="취약 상태 유지"
    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$PRE_VAL" "$POST_VAL" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u26
echo "]" >> "$RESULT_JSON"