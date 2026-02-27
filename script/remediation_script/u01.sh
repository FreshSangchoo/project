#!/bin/bash
###############################################################################
# [U-01] root 계정 원격 접속 제한 - 개별 조치 (통합조치와 동일 로직)
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u01() {
    local CHECK_ID="U-01"
    local CATEGORY="계정관리"
    local DESCRIPTION="root 계정 원격 접속 제한 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local SSH_CONFIG="/etc/ssh/sshd_config"
    local SECURETTY="/etc/securetty"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    # 점검 항목별 판정 기준 (상세 로그용)
    local SSH_CRITERIA="양호는 PermitRootLogin no 형태여야 함"
    local SECURETTY_CRITERIA="양호는 /etc/securetty에 pts 항목이 주석 처리되어 있거나 없어야 함"

    # ---------- 점검 항목 1: SSH PermitRootLogin ----------
    local SSH_BEFORE_RAW=""
    if [ -f "$SSH_CONFIG" ]; then
        SSH_BEFORE_RAW=$(grep -i "^PermitRootLogin" "$SSH_CONFIG" 2>/dev/null || echo "PermitRootLogin 미설정")
    else
        SSH_BEFORE_RAW="설정 파일 없음"
    fi

    local SSH_CHECK=""
    local SSH_REMEDY=""
    if [ -f "$SSH_CONFIG" ]; then
        SSH_CHECK=$(echo "$SSH_BEFORE_RAW" | awk '{print $2}' | head -n 1)
        if [[ ! "$SSH_CHECK" =~ ^(no|No|NO)$ ]]; then
            # 취약 -> 조치
            cp -p "$SSH_CONFIG" "${SSH_CONFIG}.bak_$(date +%Y%m%d)"
            if grep -qi "^PermitRootLogin" "$SSH_CONFIG"; then
                sed -i 's/^PermitRootLogin.*/PermitRootLogin no/gi' "$SSH_CONFIG"
                SSH_REMEDY="sed -i 's/^PermitRootLogin.*/PermitRootLogin no/gi' $SSH_CONFIG"
            else
                echo "PermitRootLogin no" >> "$SSH_CONFIG"
                SSH_REMEDY="echo 'PermitRootLogin no' >> $SSH_CONFIG"
            fi
            if systemctl is-active --quiet sshd; then systemctl restart sshd;
            elif systemctl is-active --quiet ssh; then systemctl restart ssh; fi
            SSH_REMEDY="${SSH_REMEDY}"$'\n'"systemctl restart sshd || systemctl restart ssh"
            ACTIONS_TAKEN+=("SSH: PermitRootLogin 설정을 'no'로 변경 및 서비스 재시작")
            local SSH_AFTER_RAW=$(grep -i "^PermitRootLogin" "$SSH_CONFIG" 2>/dev/null)
            local FINAL_SSH_VAL=$(echo "$SSH_AFTER_RAW" | awk '{print $2}' | head -n 1)
            local SSH_INFO="조치 후 계속 취약"
            [[ "$FINAL_SSH_VAL" =~ ^(no|No|NO)$ ]] && SSH_INFO="조치후 양호 전환"
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$SSH_BEFORE_RAW" "$SSH_REMEDY" "$SSH_AFTER_RAW" "$SSH_INFO" "$SSH_CRITERIA")")
        else
            # 양호
            DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$SSH_BEFORE_RAW" " " "$SSH_BEFORE_RAW" "기존 양호여서 조치 없음" "$SSH_CRITERIA")")
            echo -e "SSH: 이미 root 접속이 차단되어 있습니다."
            DETAILS+=("SSH: 이미 root 접속이 차단되어 있습니다.")
        fi
    else
        # 설정 파일 없음 → 점검 기준상 양호(없을시에는 양호)
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "" " " "파일 없음" "설정 파일 없음(양호)" "설정 파일 존재 시에만 점검, 없을시에는 양호")")
    fi

    local FINAL_SSH=$(grep -i "^PermitRootLogin" "$SSH_CONFIG" 2>/dev/null | awk '{print $2}' | head -n 1)
    FINAL_SSH="${FINAL_SSH:-no}"

    # ---------- 점검 항목 2: Securetty pts ----------
    local SECURETTY_BEFORE_RAW=""
    if [ -f "$SECURETTY" ]; then
        SECURETTY_BEFORE_RAW=$(grep -vE "^#|^[[:space:]]*#" "$SECURETTY" 2>/dev/null | grep "^pts" || echo "pts 없음")
    else
        SECURETTY_BEFORE_RAW="파일 없음"
    fi

    local SECURETTY_REMEDY=""
    if [ -f "$SECURETTY" ]; then
        if grep -vE "^#|^[[:space:]]*#" "$SECURETTY" 2>/dev/null | grep -q "^pts"; then
            # 취약 -> 조치
            cp -p "$SECURETTY" "${SECURETTY}.bak_$(date +%Y%m%d)"
            sed -i 's/^pts/#pts/g' "$SECURETTY"
            SECURETTY_REMEDY="sed -i 's/^pts/#pts/g' $SECURETTY"
            ACTIONS_TAKEN+=("Securetty: 가상 터미널(pts)을 통한 root 접속 차단")
            local SECURETTY_AFTER_RAW=$(grep -E "^#?pts" "$SECURETTY" 2>/dev/null || echo "pts 없음")
            local PTS_STILL_ACTIVE=$(grep -vE "^#|^[[:space:]]*#" "$SECURETTY" 2>/dev/null | grep "^pts" || true)
            local SECURETTY_INFO="조치 후 계속 취약"
            [ -z "$PTS_STILL_ACTIVE" ] && SECURETTY_INFO="조치후 양호 전환"
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$SECURETTY_BEFORE_RAW" "$SECURETTY_REMEDY" "$SECURETTY_AFTER_RAW" "$SECURETTY_INFO" "$SECURETTY_CRITERIA")")
        else
            # 양호
            DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$SECURETTY_BEFORE_RAW" " " "$SECURETTY_BEFORE_RAW" "기존 양호여서 조치 없음" "$SECURETTY_CRITERIA")")
            DETAILS+=("Securetty: 이미 가상 터미널 접속이 제한되어 있습니다.")
        fi
    else
        # 설정 파일 없음 → 점검 기준상 양호(없을시에는 양호)
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "" " " "파일 없음" "설정 파일 없음(양호)" "설정 파일 존재 시에만 점검, 없을시에는 양호")")
    fi

    local FINAL_SECURETTY=$(grep -vE "^#|^[[:space:]]*#" "$SECURETTY" 2>/dev/null | grep "^pts" || true)

    if [[ "$FINAL_SSH" =~ ^(no|No|NO)$ ]] && [ -z "$FINAL_SECURETTY" ]; then
        STATUS="SAFE"
        echo -e "양호: 모든 원격 경로에서 root 접속이 차단되었습니다."
        DETAILS+=("양호: 모든 원격 경로에서 root 접속이 차단되었습니다.")
    else
        STATUS="VULNERABLE"
        echo -e "취약: 조치 후에도 일부 설정이 미비합니다."
        DETAILS+=("취약: 조치 후에도 일부 설정이 미비합니다.")
    fi

    if [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        DETAILS+=("--- 세부 조치 내역 ---")
        for action in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $action"); done
    fi

    local PRE_VAL="PermitRootLogin ${SSH_CHECK:-미설정}"
    local POST_VAL="PermitRootLogin ${FINAL_SSH:-no}"
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

remediate_u01