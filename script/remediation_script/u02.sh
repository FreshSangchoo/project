#!/bin/bash
###############################################################################
# [U-02] 비밀번호 관리정책 설정 - 개별 조치 (통합조치와 동일 로직)
# 대상 OS: Rocky Linux 9.7/10.1, Ubuntu 22.04/24.04/25.04
#
# [로그인/비밀번호 영향]
# - 기존 비밀번호로의 로그인·기존 세션에는 영향 없음.
# - 아래 정책은 "비밀번호를 변경할 때"만 적용됩니다.
# - 비밀번호 변경 시: 8자 이상, 4종류(대/소문자·숫자·특수문자) 이상 필요.
#   정책 미달 비밀번호로 변경 시도 시 변경이 거부될 수 있음.
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u02() {
    local CHECK_ID="U-02"
    local CATEGORY="계정 관리"
    local DESCRIPTION="비밀번호 관리정책 설정 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local LOGIN_DEFS="/etc/login.defs"
    local PW_CONF="/etc/security/pwquality.conf"
    local PAM_FILE=""
    if [[ "$OS_TYPE" =~ ^(rocky|rhel|centos)$ ]]; then
        PAM_FILE="/etc/pam.d/system-auth"
    elif [[ "$OS_TYPE" =~ ^(debian|ubuntu)$ ]]; then
        PAM_FILE="/etc/pam.d/common-password"
    else
        [ -f "/etc/pam.d/system-auth" ] && PAM_FILE="/etc/pam.d/system-auth"
        [ -z "$PAM_FILE" ] && [ -f "/etc/pam.d/common-password" ] && PAM_FILE="/etc/pam.d/common-password"
    fi
    [ -n "$PAM_FILE" ] && [ -L "$PAM_FILE" ] && PAM_FILE=$(readlink -f "$PAM_FILE" 2>/dev/null) || true

    # 점검 항목별 판정 기준 (진단 스크립트 기준)
    local CRITERIA_LOGIN="양호는 PASS_MAX_DAYS 90일 이하, PASS_MIN_DAYS 1일 이상이어야 함"
    local CRITERIA_PWQ="양호는 minlen 8 이상, 4종류(credit -1) 이상, enforce_for_root 설정이어야 함"
    local CRITERIA_REMEMBER="양호는 이전 비밀번호 기억(remember) 4회 이상이어야 함"
    local CRITERIA_FILE_OK="설정 파일 존재 시에만 점검, 없을시에는 양호"

    # ---------- 조치 전 상태 일괄 수집 (진단과 동일한 기준) ----------
    local LOGIN_BEFORE=""
    if [ -f "$LOGIN_DEFS" ]; then
        LOGIN_BEFORE=$(grep -E '^PASS_MAX_DAYS|^PASS_MIN_DAYS' "$LOGIN_DEFS" 2>/dev/null || echo "미설정")
    else
        LOGIN_BEFORE="파일 없음"
    fi

    local PWQ_BEFORE=""
    if [ -f "$PW_CONF" ]; then
        PWQ_BEFORE=$(grep -v "^#" "$PW_CONF" 2>/dev/null | grep -E "minlen|lcredit|ucredit|dcredit|ocredit|enforce_for_root" || echo "미설정")
    else
        PWQ_BEFORE="파일 없음"
    fi
    if [ -n "$PAM_FILE" ] && [ -f "$PAM_FILE" ]; then
        local PAM_PWQ=$(grep -E "pam_pwquality\.so|pam_cracklib\.so" "$PAM_FILE" 2>/dev/null | grep -v "^#" | head -n 1)
        [ -n "$PAM_PWQ" ] && PWQ_BEFORE="${PWQ_BEFORE}${PWQ_BEFORE:+ }[PAM] $PAM_PWQ"
    fi

    local REMEMBER_BEFORE=""
    if [ -n "$PAM_FILE" ] && [ -f "$PAM_FILE" ]; then
        REMEMBER_BEFORE=$(grep -E "pam_pwhistory\.so|remember=" "$PAM_FILE" 2>/dev/null | grep -v "^#" | grep "remember=" | head -n 1 || echo "미설정")
    else
        REMEMBER_BEFORE="PAM 파일 없음"
    fi

    # ---------- 점검 항목 1: 비밀번호 사용 기간 (login.defs) ----------
    local LOGIN_REMEDY=""
    if [ -f "$LOGIN_DEFS" ]; then
        local MAX_DAYS=$(echo "$LOGIN_BEFORE" | grep "^PASS_MAX_DAYS" | awk '{print $2}' | head -n 1)
        local MIN_DAYS=$(echo "$LOGIN_BEFORE" | grep "^PASS_MIN_DAYS" | awk '{print $2}' | head -n 1)
        local NEED_FIX=0
        [[ ! "$MAX_DAYS" =~ ^[0-9]+$ ]] || [ "$MAX_DAYS" -gt 90 ] && NEED_FIX=1
        [[ ! "$MIN_DAYS" =~ ^[0-9]+$ ]] || [ "$MIN_DAYS" -lt 1 ] && NEED_FIX=1

        if [ "$NEED_FIX" -eq 1 ]; then
            cp -p "$LOGIN_DEFS" "${BACKUP_BASE}/login.defs.bak"
            if grep -qE '^PASS_MAX_DAYS' "$LOGIN_DEFS"; then
                sed -i 's/^PASS_MAX_DAYS[[:space:]]*=*[[:space:]]*.*/PASS_MAX_DAYS\t90/' "$LOGIN_DEFS"
            else
                echo -e "PASS_MAX_DAYS\t90" >> "$LOGIN_DEFS"
            fi
            if grep -qE '^PASS_MIN_DAYS' "$LOGIN_DEFS"; then
                sed -i 's/^PASS_MIN_DAYS[[:space:]]*=*[[:space:]]*.*/PASS_MIN_DAYS\t1/' "$LOGIN_DEFS"
            else
                echo -e "PASS_MIN_DAYS\t1" >> "$LOGIN_DEFS"
            fi
            LOGIN_REMEDY="sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS\t90/' $LOGIN_DEFS"$'\n'"sed -i 's/^PASS_MIN_DAYS.*/PASS_MIN_DAYS\t1/' $LOGIN_DEFS"
            ACTIONS_TAKEN+=("login.defs: 최대 사용기간(90), 최소 사용기간(1) 설정 (공백/등호 형식 공통)")
            local LOGIN_AFTER=$(grep -E '^PASS_MAX_DAYS|^PASS_MIN_DAYS' "$LOGIN_DEFS" 2>/dev/null)
            local MAX_AFTER=$(echo "$LOGIN_AFTER" | grep "^PASS_MAX_DAYS" | awk '{print $2}' | head -n 1)
            local MIN_AFTER=$(echo "$LOGIN_AFTER" | grep "^PASS_MIN_DAYS" | awk '{print $2}' | head -n 1)
            local INFO_LOGIN="조치 후 계속 취약"
            if [[ "$MAX_AFTER" =~ ^[0-9]+$ ]] && [ "$MAX_AFTER" -le 90 ] && [[ "$MIN_AFTER" =~ ^[0-9]+$ ]] && [ "$MIN_AFTER" -ge 1 ]; then
                INFO_LOGIN="조치후 양호 전환"
            fi
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$LOGIN_BEFORE" "$LOGIN_REMEDY" "$LOGIN_AFTER" "$INFO_LOGIN" "$CRITERIA_LOGIN")")
        else
            local LOGIN_AFTER="$LOGIN_BEFORE"
            DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$LOGIN_BEFORE" " " "$LOGIN_AFTER" "기존 양호여서 조치 없음" "$CRITERIA_LOGIN")")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "" " " "파일 없음" "설정 파일 없음(양호)" "$CRITERIA_FILE_OK")")
    fi

    # ---------- 점검 항목 2: 비밀번호 복잡도 (pwquality.conf + PAM) ----------
    local NEED_PWQ_FIX=0
    if [ -f "$PW_CONF" ]; then
        local V_MINLEN=0 V_LCREDIT=0 V_UCREDIT=0 V_DCREDIT=0 V_OCREDIT=0 V_ENFORCE=""
        V_MINLEN=$(grep -v "^#" "$PW_CONF" 2>/dev/null | grep "minlen" | cut -d= -f2 | tr -d ' ')
        V_LCREDIT=$(grep -v "^#" "$PW_CONF" 2>/dev/null | grep "lcredit" | cut -d= -f2 | tr -d ' ')
        V_UCREDIT=$(grep -v "^#" "$PW_CONF" 2>/dev/null | grep "ucredit" | cut -d= -f2 | tr -d ' ')
        V_DCREDIT=$(grep -v "^#" "$PW_CONF" 2>/dev/null | grep "dcredit" | cut -d= -f2 | tr -d ' ')
        V_OCREDIT=$(grep -v "^#" "$PW_CONF" 2>/dev/null | grep "ocredit" | cut -d= -f2 | tr -d ' ')
        grep -v "^#" "$PW_CONF" 2>/dev/null | grep -q "enforce_for_root" && V_ENFORCE="Y"
        if [ -n "$PAM_FILE" ] && [ -f "$PAM_FILE" ]; then
            local PAM_PWQ_LINE=$(grep -E "pam_pwquality\.so|pam_cracklib\.so" "$PAM_FILE" 2>/dev/null | grep -v "^#" | head -n 1)
            [[ "$PAM_PWQ_LINE" =~ minlen=([-0-9]+) ]] && V_MINLEN=${BASH_REMATCH[1]}
            [[ "$PAM_PWQ_LINE" =~ lcredit=([-0-9]+) ]] && V_LCREDIT=${BASH_REMATCH[1]}
            [[ "$PAM_PWQ_LINE" =~ ucredit=([-0-9]+) ]] && V_UCREDIT=${BASH_REMATCH[1]}
            [[ "$PAM_PWQ_LINE" =~ dcredit=([-0-9]+) ]] && V_DCREDIT=${BASH_REMATCH[1]}
            [[ "$PAM_PWQ_LINE" =~ ocredit=([-0-9]+) ]] && V_OCREDIT=${BASH_REMATCH[1]}
            [[ "$PAM_PWQ_LINE" == *"enforce_for_root"* ]] && V_ENFORCE="Y"
        fi
        [ "${V_MINLEN:-0}" -lt 8 ] && NEED_PWQ_FIX=1
        [ "${V_LCREDIT:-0}" -gt -1 ] && NEED_PWQ_FIX=1
        [ "${V_UCREDIT:-0}" -gt -1 ] && NEED_PWQ_FIX=1
        [ "${V_DCREDIT:-0}" -gt -1 ] && NEED_PWQ_FIX=1
        [ "${V_OCREDIT:-0}" -gt -1 ] && NEED_PWQ_FIX=1
        [ "$V_ENFORCE" != "Y" ] && NEED_PWQ_FIX=1
    else
        NEED_PWQ_FIX=1
    fi

    local PWQ_REMEDY=""
    if [ -f "$PW_CONF" ]; then
        cp -p "$PW_CONF" "${BACKUP_BASE}/pwquality.conf.bak"
        local SETTINGS=(
            "minlen = 8"
            "dcredit = -1"
            "ucredit = -1"
            "lcredit = -1"
            "ocredit = -1"
            "enforce_for_root"
        )
        for SETTING in "${SETTINGS[@]}"; do
            local KEY=$(echo "$SETTING" | cut -d' ' -f1)
            if grep -qi "^#\?$KEY" "$PW_CONF"; then
                sed -i "s/^#\?$KEY.*/$SETTING/gi" "$PW_CONF"
            else
                echo "$SETTING" >> "$PW_CONF"
            fi
        done
        if [ "$NEED_PWQ_FIX" -eq 1 ]; then
            PWQ_REMEDY="sed -i minlen=8 dcredit=-1 ucredit=-1 lcredit=-1 ocredit=-1 enforce_for_root $PW_CONF"
            ACTIONS_TAKEN+=("pwquality.conf: 복잡성 설정 및 enforce_for_root 추가")
        fi
    else
        mkdir -p "$(dirname "$PW_CONF")"
        cat > "$PW_CONF" << 'PWQEOF'
# U-02 비밀번호 복잡성 (minlen 8, 4종류, root 강제)
minlen = 8
dcredit = -1
ucredit = -1
lcredit = -1
ocredit = -1
enforce_for_root
PWQEOF
        PWQ_REMEDY="cat > $PW_CONF (파일 생성 및 복잡성·enforce_for_root 설정)"
        ACTIONS_TAKEN+=("pwquality.conf: 파일 생성 및 복잡성·enforce_for_root 설정")
    fi

    if [ -n "$PAM_FILE" ] && [ -f "$PAM_FILE" ]; then
        cp -p "$PAM_FILE" "${BACKUP_BASE}/pam_password.bak"
        if grep -qE "pam_pwquality\.so|pam_cracklib\.so" "$PAM_FILE"; then
            sed -i '/pam_pwquality\.so\|pam_cracklib\.so/s/minlen=[0-9\-]*/minlen=8/g' "$PAM_FILE"
            sed -i '/pam_pwquality\.so\|pam_cracklib\.so/{ /minlen=/! s/$/ minlen=8/ }' "$PAM_FILE"
            sed -i '/pam_pwquality\.so\|pam_cracklib\.so/s/dcredit=[0-9\-]*/dcredit=-1/g' "$PAM_FILE"
            sed -i '/pam_pwquality\.so\|pam_cracklib\.so/{ /dcredit=/! s/$/ dcredit=-1/ }' "$PAM_FILE"
            sed -i '/pam_pwquality\.so\|pam_cracklib\.so/s/ucredit=[0-9\-]*/ucredit=-1/g' "$PAM_FILE"
            sed -i '/pam_pwquality\.so\|pam_cracklib\.so/{ /ucredit=/! s/$/ ucredit=-1/ }' "$PAM_FILE"
            sed -i '/pam_pwquality\.so\|pam_cracklib\.so/s/lcredit=[0-9\-]*/lcredit=-1/g' "$PAM_FILE"
            sed -i '/pam_pwquality\.so\|pam_cracklib\.so/{ /lcredit=/! s/$/ lcredit=-1/ }' "$PAM_FILE"
            sed -i '/pam_pwquality\.so\|pam_cracklib\.so/s/ocredit=[0-9\-]*/ocredit=-1/g' "$PAM_FILE"
            sed -i '/pam_pwquality\.so\|pam_cracklib\.so/{ /ocredit=/! s/$/ ocredit=-1/ }' "$PAM_FILE"
            sed -i '/pam_pwquality\.so\|pam_cracklib\.so/{ /enforce_for_root/! s/$/ enforce_for_root/ }' "$PAM_FILE"
            if [ "$NEED_PWQ_FIX" -eq 1 ]; then
                [ -n "$PWQ_REMEDY" ] && PWQ_REMEDY="${PWQ_REMEDY}"$'\n'"sed -i pam_pwquality/cracklib minlen=8 credit=-1 enforce_for_root $PAM_FILE"
                ACTIONS_TAKEN+=("PAM: pam_pwquality/pam_cracklib 라인에 minlen=8, credit=-1, enforce_for_root 반영")
            fi
        fi
    fi

    local PWQ_AFTER=""
    if [ -f "$PW_CONF" ]; then
        PWQ_AFTER=$(grep -v "^#" "$PW_CONF" 2>/dev/null | grep -E "minlen|lcredit|ucredit|dcredit|ocredit|enforce_for_root" || echo "미설정")
    else
        PWQ_AFTER="파일 없음"
    fi
    if [ -n "$PAM_FILE" ] && [ -f "$PAM_FILE" ]; then
        local PAM_PWQ_AFTER=$(grep -E "pam_pwquality\.so|pam_cracklib\.so" "$PAM_FILE" 2>/dev/null | grep -v "^#" | head -n 1)
        [ -n "$PAM_PWQ_AFTER" ] && PWQ_AFTER="${PWQ_AFTER}${PWQ_AFTER:+ }[PAM] $PAM_PWQ_AFTER"
    fi

    if [ -n "$PWQ_REMEDY" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$PWQ_BEFORE" "$PWQ_REMEDY" "$PWQ_AFTER" "조치후 양호 전환" "$CRITERIA_PWQ")")
    elif [ -f "$PW_CONF" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$PWQ_BEFORE" " " "$PWQ_AFTER" "기존 양호여서 조치 없음" "$CRITERIA_PWQ")")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "" " " "파일 없음" "설정 파일 없음(양호)" "$CRITERIA_FILE_OK")")
    fi

    # ---------- 점검 항목 3: 비밀번호 재사용 제한 (PAM remember) ----------
    local REMEMBER_REMEDY=""
    if [ -n "$PAM_FILE" ] && [ -f "$PAM_FILE" ]; then
        local REMEMBER_VAL=""
        local HIST_LINE=$(grep -E "pam_pwhistory\.so|remember=" "$PAM_FILE" 2>/dev/null | grep -v "^#" | grep "remember=" | head -n 1)
        [[ "$HIST_LINE" =~ remember=([0-9]+) ]] && REMEMBER_VAL="${BASH_REMATCH[1]}"
        local NEED_REM=0
        [[ ! "$REMEMBER_VAL" =~ ^[0-9]+$ ]] && NEED_REM=1
        [ -n "$REMEMBER_VAL" ] && [ "$REMEMBER_VAL" -lt 4 ] && NEED_REM=1

        if [ "$NEED_REM" -eq 1 ]; then
            if grep -q "pam_pwhistory.so" "$PAM_FILE"; then
                sed -i 's/remember=[0-9]*/remember=4/g' "$PAM_FILE"
                REMEMBER_REMEDY="sed -i 's/remember=[0-9]*/remember=4/g' $PAM_FILE"
            else
                sed -i '/pam_unix.so/i password    required    pam_pwhistory.so remember=4' "$PAM_FILE"
                REMEMBER_REMEDY="sed -i add pam_pwhistory.so remember=4 $PAM_FILE"
            fi
            ACTIONS_TAKEN+=("PAM: 이전 비밀번호 기억(remember=4) 설정 완료 (authselect 관리 파일 직접 수정 반영)")
            local REMEMBER_AFTER=$(grep -E "pam_pwhistory\.so|remember=" "$PAM_FILE" 2>/dev/null | grep -v "^#" | grep "remember=" | head -n 1)
            local REM_AFTER_VAL=""
            [[ "$REMEMBER_AFTER" =~ remember=([0-9]+) ]] && REM_AFTER_VAL="${BASH_REMATCH[1]}"
            local INFO_REM="조치 후 계속 취약"
            [ -n "$REM_AFTER_VAL" ] && [ "$REM_AFTER_VAL" -ge 4 ] && INFO_REM="조치후 양호 전환"
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$REMEMBER_BEFORE" "$REMEMBER_REMEDY" "$REMEMBER_AFTER" "$INFO_REM" "$CRITERIA_REMEMBER")")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$REMEMBER_BEFORE" " " "$REMEMBER_BEFORE" "기존 양호여서 조치 없음" "$CRITERIA_REMEMBER")")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "" " " "PAM 파일 없음" "설정 파일 없음(양호)" "$CRITERIA_FILE_OK")")
    fi

    # ---------- 최종 상태 및 출력 ----------
    if [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        echo -e "조치 완료: 비밀번호 관리정책(로그인 설정, pwquality, PAM)을 적용하였습니다."
        DETAILS+=("조치 완료: 비밀번호 관리정책 적용")
    else
        echo -e "양호: 이미 비밀번호 관리정책이 적용되어 있습니다."
        DETAILS+=("양호: 이미 비밀번호 관리정책이 적용되어 있습니다.")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done

    local PRE_VAL="비밀번호 정책"
    local POST_VAL="Policy Applied"
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
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$PRE_VAL" "$POST_VAL" "$BACKUP_BASE" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u02