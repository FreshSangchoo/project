#!/bin/bash
###############################################################################
# [U-12] 세션 종료 시간 설정 - 개별 조치 (진단 스크립트와 점검 항목 동일)
# 점검: TMOUT(또는 autologout) 600초 이하 설정
# 조치: /etc/profile 등에 TMOUT=600, csh에 autologout=10 설정
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u12() {
    local CHECK_ID="U-12"
    local CATEGORY="계정 관리"
    local DESCRIPTION="세션 종료 시간 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local BASH_FILES=("/etc/profile" "/etc/bashrc" "/root/.bashrc")
    local CSH_FILES=("/etc/csh.cshrc" "/etc/csh.login")
    local TARGET_TMOUT=600
    local TARGET_AUTOLOGOUT=10

    local CRITERIA_TMOUT="양호는 TMOUT 600초 이하 설정이어야 함"
    local CRITERIA_CSH="양호는 csh autologout 10분 이하 설정이어야 함"
    local CRITERIA_FILE_OK="설정 파일 존재 시에만 점검, 없을시에는 양호"

    # ---------- 조치 전 상태 수집 (진단과 동일 기준) ----------
    local TMOUT_BEFORE=""
    local FOUND_TMOUT=false
    local MIN_TMOUT=999999
    for file in "${BASH_FILES[@]}"; do
        if [ -f "$file" ]; then
            local TMOUT_VAL
            TMOUT_VAL=$(grep -E '^[[:space:]]*TMOUT=' "$file" 2>/dev/null | grep -v '^#' | sed 's/.*TMOUT=//' | sed 's/[^0-9]//g' | head -1)
            local line
            line=$(grep -E '^[[:space:]]*TMOUT=' "$file" 2>/dev/null | grep -v '^#' | head -1)
            [ -n "$line" ] && TMOUT_BEFORE="${TMOUT_BEFORE}${TMOUT_BEFORE:+$'\n'}[$file] $line"
            if [ -n "$TMOUT_VAL" ]; then
                FOUND_TMOUT=true
                [ "$TMOUT_VAL" -lt "$MIN_TMOUT" ] && MIN_TMOUT=$TMOUT_VAL
            fi
        fi
    done
    local CSH_BEFORE=""
    local CSH_VULN=0
    for file in "${CSH_FILES[@]}"; do
        if [ -f "$file" ]; then
            local AUTO_VAL
            AUTO_VAL=$(grep -E '^[[:space:]]*set[[:space:]]+autologout=' "$file" 2>/dev/null | grep -v '^#' | sed 's/.*autologout=//' | sed 's/[^0-9]//g' | head -1)
            local line
            line=$(grep -E '^[[:space:]]*set[[:space:]]+autologout=' "$file" 2>/dev/null | grep -v '^#' | head -1)
            [ -n "$line" ] && CSH_BEFORE="${CSH_BEFORE}${CSH_BEFORE:+$'\n'}[$file] $line"
            if [ -n "$AUTO_VAL" ] && [ "$AUTO_VAL" -gt "$TARGET_AUTOLOGOUT" ]; then
                CSH_VULN=1
            fi
        fi
    done

    # ---------- 점검 항목 1: bash TMOUT ----------
    local PROFILE_FILE="/etc/profile"
    local NEED_TMOUT_FIX=0
    if [ "$FOUND_TMOUT" = false ] || [ "$MIN_TMOUT" -gt "$TARGET_TMOUT" ]; then
        NEED_TMOUT_FIX=1
    fi

    local TMOUT_REMEDY=""
    local TMOUT_AFTER=""
    if [ -f "$PROFILE_FILE" ]; then
        if [ "$NEED_TMOUT_FIX" -eq 1 ]; then
            cp -p "$PROFILE_FILE" "${PROFILE_FILE}.bak_$(date +%Y%m%d)"
            sed -i '/TMOUT=/d' "$PROFILE_FILE"
            sed -i '/readonly TMOUT/d' "$PROFILE_FILE"
            sed -i '/export TMOUT/d' "$PROFILE_FILE"
            echo -e "\n# Session Timeout Setting (KISA Guide)\nTMOUT=$TARGET_TMOUT\nexport TMOUT\nreadonly TMOUT" >> "$PROFILE_FILE"
            TMOUT_REMEDY="sed -i TMOUT 제거 후 /etc/profile 에 TMOUT=$TARGET_TMOUT export readonly 추가"
            ACTIONS_TAKEN+=("TMOUT=$TARGET_TMOUT, export, readonly 설정 완료")
        fi
        TMOUT_AFTER=$(grep -E '^[[:space:]]*TMOUT=' "$PROFILE_FILE" 2>/dev/null | grep -v '^#' | head -5)
    else
        TMOUT_AFTER="파일 없음"
    fi

    # 이후 최종 DETAIL_OBJ 하나로 합치기 위해 값만 유지

    # ---------- 점검 항목 2: csh autologout ----------
    local CSH_REMEDY=""
    local CSH_AFTER=""
    if [ -f "/etc/csh.cshrc" ]; then
        if [ "$CSH_VULN" -eq 1 ]; then
            sed -i '/autologout=/d' /etc/csh.cshrc
            echo "set autologout=$TARGET_AUTOLOGOUT" >> /etc/csh.cshrc
            CSH_REMEDY="sed -i autologout 제거 후 /etc/csh.cshrc 에 set autologout=$TARGET_AUTOLOGOUT 추가"
            ACTIONS_TAKEN+=("/etc/csh.cshrc: autologout=$TARGET_AUTOLOGOUT 설정")
        fi
        CSH_AFTER=$(grep -E '^[[:space:]]*set[[:space:]]+autologout=' /etc/csh.cshrc 2>/dev/null | grep -v '^#' | head -3)
    else
        CSH_AFTER="파일 없음"
    fi

    # 이후 최종 DETAIL_OBJ 하나로 합치기 위해 값만 유지

    # ---------- 최종 상태 및 출력 ----------
    if [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        echo -e "조치 완료: 세션 종료 시간(TMOUT ${TARGET_TMOUT}초)을 설정하였습니다."
        DETAILS+=("조치 완료: TMOUT/autologout 설정")
    else
        echo -e "양호: 이미 세션 종료 시간이 기준에 맞게 설정되어 있습니다."
        DETAILS+=("양호: TMOUT 600초 이내, autologout 10분 이내")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done

    # ---------- TMOUT + csh 결과를 단일 DETAIL_OBJ로 합치기 ----------
    local BEFORE_ALL="" AFTER_ALL="" REMEDY_ALL=""
    local CRITERIA_ALL="TMOUT 600초 이하 및 csh autologout 10분 이하"

    # bash TMOUT 부분
    if [ -n "$TMOUT_BEFORE" ]; then
        BEFORE_ALL="$TMOUT_BEFORE"
    fi
    if [ -n "$TMOUT_AFTER" ]; then
        AFTER_ALL="$TMOUT_AFTER"
    fi
    if [ -n "$TMOUT_REMEDY" ]; then
        REMEDY_ALL="$TMOUT_REMEDY"
    fi

    # csh autologout 부분 합치기
    if [ -n "$CSH_BEFORE" ]; then
        BEFORE_ALL="${BEFORE_ALL}${BEFORE_ALL:+$'\n'}${CSH_BEFORE}"
    fi
    if [ -n "$CSH_AFTER" ]; then
        AFTER_ALL="${AFTER_ALL}${AFTER_ALL:+$'\n'}${CSH_AFTER}"
    fi
    if [ -n "$CSH_REMEDY" ]; then
        REMEDY_ALL="${REMEDY_ALL}${REMEDY_ALL:+$'\n'}${CSH_REMEDY}"
    fi

    local JUDGE_INIT="양호"
    [ ${#ACTIONS_TAKEN[@]} -gt 0 ] && JUDGE_INIT="취약"
    local DETAIL_INFO
    if [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        DETAIL_INFO="조치후 양호 전환"
    else
        DETAIL_INFO="기존 양호여서 조치 없음"
    fi

    DETAIL_OBJS=()
    DETAIL_OBJS+=("$(build_detail_obj_full "$JUDGE_INIT" "$BEFORE_ALL" "${REMEDY_ALL:- }" "$AFTER_ALL" "$DETAIL_INFO" "$CRITERIA_ALL")")

    local PRE_VAL="세션 타임아웃"
    local POST_VAL="TMOUT 600s, autologout 10분"
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

remediate_u12

echo "]" >> "$RESULT_JSON"