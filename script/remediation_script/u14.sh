#!/bin/bash
###############################################################################
# [U-14] root 홈, 패스 디렉터리 권한 및 패스 설정 - 개별 조치 (진단 스크립트와 점검 항목 동일)
# 점검: PATH에 '.' 또는 빈 경로(::) 포함 여부, root 홈/ PATH 내 디렉터리 권한
# 조치: PATH 정제, /root 700, PATH 내 디렉터리 타인 쓰기 제거
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u14() {
    local CHECK_ID="U-14"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="root 홈, 패스 디렉터리 권한 및 패스 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local CRITERIA_PATH="양호는 PATH 맨 앞·중간에 '.' 또는 '::'가 포함되지 않아야 함"
    local CRITERIA_ROOT_HOME="양호는 /root 디렉터리 권한 700이어야 함"
    local CRITERIA_PATH_DIRS="양호는 PATH 내 디렉터리에 타인 쓰기(o-w)가 없어야 함"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    # ---------- 조치 전 상태 수집 (실제 출력만) ----------
    local PATH_BEFORE="$PATH"
    local ROOT_HOME="/root"
    local ROOT_BEFORE=""
    if [ -d "$ROOT_HOME" ]; then
        ROOT_BEFORE=$(ls -ld "$ROOT_HOME" 2>/dev/null)
        local P_NUM=$(stat -c "%a" "$ROOT_HOME" 2>/dev/null)
        local P_OWN=$(stat -c "%U" "$ROOT_HOME" 2>/dev/null)
        [ -n "$P_NUM" ] && ROOT_BEFORE="${ROOT_BEFORE} (권한: ${P_NUM}, 소유자: ${P_OWN})"
    fi

    local PATH_DIRS_BEFORE=""
    local IFS_BAK=$IFS
    IFS=':'
    for DIR in $PATH; do
        [ -z "$DIR" ] && continue
        if [ -d "$DIR" ]; then
            local PERM=$(stat -c '%a' "$DIR" 2>/dev/null)
            [ -n "$PERM" ] && [ "${PERM:2:1}" -ge 2 ] && PATH_DIRS_BEFORE="${PATH_DIRS_BEFORE}${PATH_DIRS_BEFORE:+$'\n'}$(ls -ld "$DIR" 2>/dev/null) (권한: ${PERM})"
        fi
    done
    IFS=$IFS_BAK

    # ---------- 점검 항목 1: PATH 환경변수 ----------
    local PATH_REMEDY=""
    local NEED_PATH_FIX=0
    echo "$PATH_BEFORE" | grep -qE '(^|:)(\.|:)(:|$)' && NEED_PATH_FIX=1

    if [ "$NEED_PATH_FIX" -eq 1 ]; then
        local NEW_PATH
        NEW_PATH=$(echo "$PATH_BEFORE" | sed -e 's/::/:/g' -e 's/:\./:/g' -e 's/\.:/:/g' -e 's/^://' -e 's/:$//')
        export PATH="$NEW_PATH"
        PATH_REMEDY="export PATH=\"\$NEW_PATH\" (sed -e 's/::/:/g' -e 's/:\./:/g' ...)"
        ACTIONS_TAKEN+=("현재 세션 PATH 정제 ('.' 및 빈 항목 제거)")
    fi

    local PATH_AFTER="$PATH"

    if [ -n "$PATH_REMEDY" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$PATH_BEFORE" "$PATH_REMEDY" "$PATH_AFTER" "조치후 양호 전환" "$CRITERIA_PATH")")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$PATH_BEFORE" " " "$PATH_AFTER" "기존 양호여서 조치 없음" "$CRITERIA_PATH")")
    fi

    # ---------- 점검 항목 2: root 홈 디렉터리 권한 ----------
    local ROOT_REMEDY=""
    local ROOT_AFTER=""
    if [ -d "$ROOT_HOME" ]; then
        local ROOT_PERM
        ROOT_PERM=$(stat -c '%a' "$ROOT_HOME" 2>/dev/null)
        local NEED_ROOT_FIX=0
        [ -n "$ROOT_PERM" ] && [ "${ROOT_PERM:2:1}" -ge 2 ] && NEED_ROOT_FIX=1
        if [ "$NEED_ROOT_FIX" -eq 1 ]; then
            chmod 700 "$ROOT_HOME"
            ROOT_REMEDY="chmod 700 $ROOT_HOME"
            ACTIONS_TAKEN+=("root 홈 디렉터리($ROOT_HOME) 권한 수정: $ROOT_PERM → 700")
        fi
        ROOT_AFTER=$(ls -ld "$ROOT_HOME" 2>/dev/null)
        local P_AFTER_NUM P_AFTER_OWN
        P_AFTER_NUM=$(stat -c "%a" "$ROOT_HOME" 2>/dev/null)
        P_AFTER_OWN=$(stat -c "%U" "$ROOT_HOME" 2>/dev/null)
        [ -n "$P_AFTER_NUM" ] && ROOT_AFTER="${ROOT_AFTER} (권한: ${P_AFTER_NUM}, 소유자: ${P_AFTER_OWN})"
    fi

    if [ -d "$ROOT_HOME" ]; then
        if [ -n "$ROOT_REMEDY" ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$ROOT_BEFORE" "$ROOT_REMEDY" "$ROOT_AFTER" "조치후 양호 전환" "$CRITERIA_ROOT_HOME")")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$ROOT_BEFORE" " " "$ROOT_AFTER" "기존 양호여서 조치 없음" "$CRITERIA_ROOT_HOME")")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "설정 파일 없음(양호)" "$CRITERIA_FILE_OK")")
    fi

    # ---------- 점검 항목 3: PATH 내 디렉터리 타인 쓰기 ----------
    local PATH_DIRS_REMEDY=""
    local PATH_DIRS_AFTER=""
    IFS=':'
    for DIR in $PATH; do
        [ -z "$DIR" ] && continue
        if [ -d "$DIR" ]; then
            local PERM
            PERM=$(stat -c '%a' "$DIR" 2>/dev/null)
            if [ -n "$PERM" ] && [ "${PERM:2:1}" -ge 2 ]; then
                chmod o-w "$DIR" 2>/dev/null
                PATH_DIRS_REMEDY="${PATH_DIRS_REMEDY}chmod o-w $DIR"$'\n'
                ACTIONS_TAKEN+=("$DIR 디렉터리 타인 쓰기 권한 제거")
            fi
        fi
    done
    IFS=$IFS_BAK
    PATH_DIRS_REMEDY="${PATH_DIRS_REMEDY%$'\n'}"

    IFS=':'
    for DIR in $PATH; do
        [ -z "$DIR" ] && continue
        if [ -d "$DIR" ]; then
            local PERM
            PERM=$(stat -c '%a' "$DIR" 2>/dev/null)
            [ -n "$PERM" ] && PATH_DIRS_AFTER="${PATH_DIRS_AFTER}${PATH_DIRS_AFTER:+$'\n'}$(ls -ld "$DIR" 2>/dev/null) (권한: ${PERM})"
        fi
    done
    IFS=$IFS_BAK

    if [ -n "$PATH_DIRS_REMEDY" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$PATH_DIRS_BEFORE" "$PATH_DIRS_REMEDY" "$PATH_DIRS_AFTER" "조치후 양호 전환" "$CRITERIA_PATH_DIRS")")
    else
        if [ -n "$PATH_DIRS_BEFORE" ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$PATH_DIRS_BEFORE" " " "$PATH_DIRS_BEFORE" "기존 양호여서 조치 없음" "$CRITERIA_PATH_DIRS")")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "양호" "" " " "$PATH_DIRS_AFTER" "기존 양호여서 조치 없음" "$CRITERIA_PATH_DIRS")")
        fi
    fi

    # ---------- 최종 상태 및 출력 ----------
    if [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        echo -e "조치 완료: PATH 정제 및 주요 디렉터리 타인 쓰기 권한을 제거하였습니다."
        DETAILS+=("조치 완료: PATH 및 디렉터리 권한 조치")
    else
        echo -e "양호: root의 PATH 및 주요 디렉터리 권한이 이미 보안 기준을 충족합니다."
        DETAILS+=("양호: PATH 및 디렉터리 권한 기준 충족")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done

    local PRE_VAL="PATH 및 디렉터리 권한"
    local POST_VAL="PATH 정제 및 권한 700/o-w"
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

remediate_u14

echo "]" >> "$RESULT_JSON"