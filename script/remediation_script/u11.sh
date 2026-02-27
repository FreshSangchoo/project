#!/bin/bash
###############################################################################
# [U-11] 사용자 shell 점검 - 개별 조치 (진단 스크립트와 점검 항목 동일)
# 점검: 로그인이 불필요한 시스템 계정에 /bin/false 또는 /sbin/nologin 설정 여부
# 조치: 취약 계정의 쉘을 nologin/false로 변경
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u11() {
    local CHECK_ID="U-11"
    local CATEGORY="계정 관리"
    local DESCRIPTION="사용자 shell 점검 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    # 진단과 동일: 점검 대상 시스템 계정 목록
    local SYSTEM_ACCOUNTS=("daemon" "bin" "sys" "adm" "listen" "nobody" "nobody4" \
                          "noaccess" "diag" "operator" "gopher" "games" "ftp" "lp" \
                          "sync" "shutdown" "halt" "mail" "news" "uucp")

    local CRITERIA_SHELL="양호는 로그인 불필요 계정에 /bin/false 또는 /sbin/nologin(nologin|false|sync|shutdown|halt) 설정이어야 함"

    local NOLOGIN_SHELL=""
    if [ -f "/sbin/nologin" ]; then
        NOLOGIN_SHELL="/sbin/nologin"
    elif [ -f "/usr/sbin/nologin" ]; then
        NOLOGIN_SHELL="/usr/sbin/nologin"
    else
        NOLOGIN_SHELL="/bin/false"
    fi

    # ---------- 조치 전 상태 수집 (진단과 동일 기준, 실제 passwd 라인만) ----------
    local SHELL_BEFORE=""
    local VULN_ACCOUNTS=()
    for account in "${SYSTEM_ACCOUNTS[@]}"; do
        if getent passwd "$account" >/dev/null 2>&1; then
            local current_shell
            current_shell=$(getent passwd "$account" | cut -d: -f7)
            local line
            line=$(grep "^${account}:" /etc/passwd 2>/dev/null)
            if [[ ! "$current_shell" =~ (nologin|false|sync|shutdown|halt)$ ]]; then
                VULN_ACCOUNTS+=("${account}:${current_shell}")
                SHELL_BEFORE="${SHELL_BEFORE}${SHELL_BEFORE:+$'\n'}${line}"
            fi
        fi
    done
    if [ -z "$SHELL_BEFORE" ]; then
        for account in "${SYSTEM_ACCOUNTS[@]}"; do
            [ -f /etc/passwd ] && line=$(grep "^${account}:" /etc/passwd 2>/dev/null) && [ -n "$line" ] && SHELL_BEFORE="${SHELL_BEFORE}${SHELL_BEFORE:+$'\n'}${line}"
        done
    fi

    # ---------- 점검 항목 1: 시스템 계정 Shell ----------
    local SHELL_REMEDY=""
    if [ ${#VULN_ACCOUNTS[@]} -gt 0 ]; then
        for entry in "${VULN_ACCOUNTS[@]}"; do
            local account="${entry%%:*}"
            local current_shell="${entry#*:}"
            if command -v usermod >/dev/null 2>&1; then
                usermod -s "$NOLOGIN_SHELL" "$account" 2>/dev/null
                SHELL_REMEDY="${SHELL_REMEDY}usermod -s $NOLOGIN_SHELL $account"$'\n'
                ACTIONS_TAKEN+=("${account}: ${current_shell} → ${NOLOGIN_SHELL}")
            else
                sed -i "s|^${account}:\([^:]*:[^:]*:[^:]*:[^:]*:[^:]*:\).*|${account}:\1${NOLOGIN_SHELL}|" /etc/passwd
                SHELL_REMEDY="${SHELL_REMEDY}sed -i ${account} 쉘 → ${NOLOGIN_SHELL}"$'\n'
                ACTIONS_TAKEN+=("${account}: ${current_shell} → ${NOLOGIN_SHELL} (직접 수정)")
            fi
        done
        SHELL_REMEDY="${SHELL_REMEDY%$'\n'}"
    fi

    local SHELL_AFTER=""
    local VULN_AFTER=0
    for account in "${SYSTEM_ACCOUNTS[@]}"; do
        if getent passwd "$account" >/dev/null 2>&1; then
            local final_shell
            final_shell=$(getent passwd "$account" | cut -d: -f7)
            local line
            line=$(grep "^${account}:" /etc/passwd 2>/dev/null)
            if [[ ! "$final_shell" =~ (nologin|false|sync|shutdown|halt)$ ]]; then
                ((VULN_AFTER++)) || true
                SHELL_AFTER="${SHELL_AFTER}${SHELL_AFTER:+$'\n'}${line}"
            fi
        fi
    done
    if [ ${#VULN_ACCOUNTS[@]} -gt 0 ] && [ "$VULN_AFTER" -eq 0 ]; then
        for entry in "${VULN_ACCOUNTS[@]}"; do
            local acc="${entry%%:*}"
            local line_after
            line_after=$(grep "^${acc}:" /etc/passwd 2>/dev/null)
            [ -n "$line_after" ] && SHELL_AFTER="${SHELL_AFTER}${SHELL_AFTER:+$'\n'}${line_after}"
        done
    fi
    if [ -z "$SHELL_AFTER" ] && [ ${#VULN_ACCOUNTS[@]} -eq 0 ]; then
        SHELL_AFTER="$SHELL_BEFORE"
    fi

    if [ ${#VULN_ACCOUNTS[@]} -gt 0 ]; then
        local SHELL_INFO="조치후 양호 전환"
        [ "$VULN_AFTER" -gt 0 ] && SHELL_INFO="조치 후 계속 취약"
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$SHELL_BEFORE" "$SHELL_REMEDY" "$SHELL_AFTER" "$SHELL_INFO" "$CRITERIA_SHELL")")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$SHELL_BEFORE" " " "$SHELL_AFTER" "기존 양호여서 조치 없음" "$CRITERIA_SHELL")")
    fi

    # ---------- 최종 상태 및 출력 ----------
    if [ "$VULN_AFTER" -gt 0 ]; then
        STATUS="VULNERABLE"
        echo -e "취약: 일부 시스템 계정에 여전히 로그인 가능한 쉘이 설정되어 있습니다."
        DETAILS+=("취약: ${VULN_AFTER}개 계정 미조치")
    elif [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        echo -e "조치 완료: 시스템 계정 쉘을 nologin/false로 변경하였습니다."
        DETAILS+=("양호: 모든 불필요한 시스템 계정에 거부 쉘이 설정되었습니다.")
    else
        echo -e "양호: 모든 불필요한 시스템 계정에 거부 쉘이 설정되어 있습니다."
        DETAILS+=("양호: 모든 시스템 계정 안전한 쉘 설정됨")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done

    local PRE_VAL="시스템 계정 Shell"
    local POST_VAL="nologin 또는 false"
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

remediate_u11

echo "]" >> "$RESULT_JSON"