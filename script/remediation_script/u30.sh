#!/bin/bash
###############################################################################
# [U-30] UMASK 설정 적절성 - 개별 조치
# 점검: UMASK 022 이상 / 조치: 전역 설정 파일 umask 022 통일
###############################################################################
[ -z "${BASH_VERSION}" ] && exec /bin/bash "$0" "$@"

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export TZ=Asia/Seoul

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

GLOBAL_FILES=(
    "/etc/profile"
    "/etc/bashrc"
    "/etc/bash.bashrc"
    "/etc/csh.cshrc"
    "/etc/csh.login"
    "/etc/environment"
    "/etc/login.defs"
)

remediate_u30() {
    local CHECK_ID="U-30"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="UMASK 설정 관리 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local CRITERIA="UMASK 값이 022 이상으로 설정된 경우"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    # root 권한 없으면 조치 불가
    if [ "$(id -u)" -ne 0 ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "root 아님" " " " " "root로 실행해야 /etc 설정 파일 수정 가능" "$CRITERIA")")
        DETAILS+=("취약: root 권한 필요. /etc/profile, /etc/login.defs 등 수정 불가")
        local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
        local DETAILS_JSON="["; local i=0
        for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "VULNERABLE" "root 권한 없음" "root로 실행 필요" "" "$DETAILS_STR" "$DETAILS_JSON"
        return
    fi

    validate_umask() {
        local v=$1
        [ -z "$v" ] && return 1
        local dec=$((8#$v))
        [ "$dec" -ge 18 ] && return 0 || return 1
    }

    local PRE_VAL="" POST_VAL=""
    local file_before file_after cmd status_str short_desc

    for filepath in "${GLOBAL_FILES[@]}"; do
        if [ ! -f "$filepath" ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "양호" "파일 없음" " " "해당없음" "점검 대상 파일 없음" "$CRITERIA_FILE_OK")")
            DETAILS+=("양호: $filepath 없음(해당없음)")
            continue
        fi

        # 조치 전 값
        if [ "$filepath" = "/etc/environment" ]; then
            file_before=$(grep -E '^[^#]*(UMASK|umask)[[:space:]]*=' "$filepath" 2>/dev/null | head -1 || echo "umask 설정 없음")
        elif [ "$filepath" = "/etc/login.defs" ]; then
            file_before=$(grep -E '^[^#]*(UMASK|umask)' "$filepath" 2>/dev/null | head -1 || echo "UMASK 설정 없음")
        else
            # umask 022 등 실제 설정 라인 우선 (csh의 if ( `umask` == 0 ) then 제외)
            file_before=$(grep -n -E '^[^#]*[uU][mM][aA][sS][kK][[:space:]]+[0-9]{3,4}' "$filepath" 2>/dev/null | head -1 || grep -n '^[^#]*umask' "$filepath" 2>/dev/null | head -1 || echo "umask 설정 없음")
        fi

        cmd=""
        # 조치 수행
        if [ "$filepath" = "/etc/environment" ]; then
            if grep -qE '^[^#]*(UMASK|umask)[[:space:]]*=' "$filepath" 2>/dev/null; then
                sed -i -E 's/^([^#]*(UMASK|umask)[[:space:]]*=[[:space:]]*)[0-9]{3,4}/\1022/' "$filepath" 2>/dev/null && cmd="sed UMASK=022"
            else
                if ! grep -qE '^[^#]*UMASK=' "$filepath" 2>/dev/null; then
                    echo 'UMASK=022' >> "$filepath" 2>/dev/null && cmd="echo UMASK=022 >> $filepath"
                fi
            fi
        elif [ "$filepath" = "/etc/login.defs" ]; then
            if grep -qE '^[^#]*(UMASK|umask)' "$filepath" 2>/dev/null; then
                sed -i -E 's/^([^#]*(UMASK|umask)[[:space:]]+)[0-9]{3,4}/\1022/' "$filepath" 2>/dev/null
                cmd="sed UMASK 022"
            else
                echo '' >> "$filepath"
                echo 'UMASK 022' >> "$filepath" 2>/dev/null
                cmd="echo UMASK 022 >> $filepath"
            fi
        else
            if grep -qE '^[^#]*[uU][mM][aA][sS][kK][[:space:]]+[0-9]' "$filepath" 2>/dev/null; then
                sed -i -E 's/([uU][mM][aA][sS][kK][[:space:]]+)[0-9]{3,4}/\1022/g' "$filepath" 2>/dev/null
                cmd="sed umask 022"
            elif grep -qE 'if[[:space:]]*\([^)]*umask[^)]*==[^)]*0[^)]*\)[[:space:]]*then' "$filepath" 2>/dev/null; then
                # csh: if ( `umask` == 0 ) then 블록에 umask 022 추가 (아직 022+ 없을 때만)
                if ! grep -qE 'umask[[:space:]]+02[2-9]|umask[[:space:]]+0[3-9][0-9]' "$filepath" 2>/dev/null; then
                    sed -i '/if[[:space:]]*([^)]*umask[^)]*==[^)]*0[^)]*)[[:space:]]*then/a\    umask 022' "$filepath" 2>/dev/null && cmd="sed (csh) umask 022"
                fi
            else
                echo '' >> "$filepath"
                echo 'umask 022' >> "$filepath" 2>/dev/null
                cmd="echo umask 022 >> $filepath"
            fi
        fi
        [ -z "$cmd" ] && cmd=" "

        # 조치 후 값
        if [ "$filepath" = "/etc/environment" ]; then
            file_after=$(grep -E '^[^#]*(UMASK|umask)[[:space:]]*=' "$filepath" 2>/dev/null | head -1 || echo "없음")
        elif [ "$filepath" = "/etc/login.defs" ]; then
            file_after=$(grep -E '^[^#]*(UMASK|umask)' "$filepath" 2>/dev/null | head -1 || echo "없음")
        else
            # umask 022 등 실제 설정 라인 우선 (csh의 if ( `umask` == 0 ) then 제외)
            file_after=$(grep -n -E '^[^#]*[uU][mM][aA][sS][kK][[:space:]]+[0-9]{3,4}' "$filepath" 2>/dev/null | head -1 || grep -n '^[^#]*umask' "$filepath" 2>/dev/null | head -1 || echo "없음")
        fi

        # 022 이상인지 확인
        local val=""
        if [ "$filepath" = "/etc/environment" ]; then
            val=$(echo "$file_after" | grep -oP '(UMASK|umask)\s*=\s*\K[0-9]+' | head -1)
        elif [ "$filepath" = "/etc/login.defs" ]; then
            val=$(echo "$file_after" | grep -oP '(UMASK|umask)\s+\K[0-9]+' | head -1)
        else
            val=$(echo "$file_after" | grep -oP 'umask\s+\K[0-9]+' | head -1)
        fi

        if [ -n "$val" ] && validate_umask "$val"; then
            status_str="양호"
            short_desc="umask ${val} (022 이상) 적용"
            DETAILS+=("양호: $filepath - umask ${val}")
            [ -n "$cmd" ] && [ "$cmd" != " " ] && ACTIONS_TAKEN+=("$filepath → 022 적용")
        else
            status_str="취약"
            short_desc="조치 실패 또는 022 미적용"
            DETAILS+=("취약: $filepath - 조치 미반영 또는 umask 022 미만")
            STATUS="VULNERABLE"
        fi
        DETAIL_OBJS+=("$(build_detail_obj_full "$status_str" "$file_before" "$cmd" "$file_after" "$short_desc" "$CRITERIA")")
    done

    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done

    [ -z "$PRE_VAL" ] && PRE_VAL="전역 UMASK 설정 파일 점검"
    [ "$STATUS" = "VULNERABLE" ] && POST_VAL="일부 파일 UMASK 022 미적용" || POST_VAL="전역 설정 파일 UMASK 022 적용 완료"

    local DETAILS_STR; DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    local DETAILS_JSON="["; local i=0
    for obj in "${DETAIL_OBJS[@]}"; do [ $i -gt 0 ] && DETAILS_JSON+=","; DETAILS_JSON+="$obj"; ((i++)) || true; done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$PRE_VAL" "$POST_VAL" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u30
echo "]" >> "$RESULT_JSON"