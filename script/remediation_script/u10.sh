
폴더 하이라이트
보안 조치 스크립트 모음으로, U-01부터 U-67까지 시스템 설정 및 서비스 비활성화 관련 개별 조치 내용을 포함합니다.

#!/bin/bash
###############################################################################
# [U-10] 동일한 UID 금지 - 개별 조치
# 점검: /etc/passwd 내 UID(3번째 필드) 중복 여부만 확인
# 조치: 중복 UID 해소(첫 계정 유지, 나머지 새 UID 부여) + /etc/passwd 권한 644
# 대상 OS: Rocky 9.7/10.1, Ubuntu 22.04/24.04/25.04 (root 실행 필요)
#
# [리스크 요약]
# - 로그인 차단: 없음. 기존 세션/로그인은 그대로 유지됨.
# - UID 변경 시(usermod 성공): 홈/메일 등 소유자 자동 갱신. 재로그인 시 새 UID로 접근.
# - UID 변경 시(usermod 실패 → sed만 적용): /etc/passwd만 바뀜. 해당 계정의
#   홈·파일 소유자는 예전 UID로 남아 있어, 재로그인 후 소유 파일 접근 불가 가능.
# - 해당 계정이 로그인 중이면 usermod가 실패할 수 있음 → sed만 적용되므로 위와 동일.
# - 시스템 계정 UID 변경 시: 해당 UID로 소유한 디렉터리/파일 접근 실패 가능(서비스 영향).
# - 반드시 root로 실행. 같은 날 여러 번 실행 시 당일 백업은 마지막 실행분으로 덮어씀.
# - 새 UID: "다음 빈 UID" 사용 → 기존 로직과 동일한 리스크, 65535 충돌만 제거.
# - sed 시 두 번째 필드(x, !x, * 등)는 변경하지 않고 UID만 변경(잠금 해제 방지).
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

# 현재 /etc/passwd 기준으로 사용 중인 UID에 없는 가장 작은 UID 반환 (1000 이상)
get_next_free_uid() {
    local passwd_file="${1:-/etc/passwd}"
    local existing
    existing=$(awk -F: '$3 ~ /^[0-9]+$/ {print $3}' "$passwd_file" 2>/dev/null | sort -n -u)
    local base=1000
    local max
    max=$(echo "$existing" | tail -1)
    if [ -n "$max" ] && [ "$max" -ge 1000 ]; then
        base=$((max + 1))
    fi
    local cand=$base
    while echo "$existing" | grep -q "^${cand}$"; do
        cand=$((cand + 1))
    done
    echo "$cand"
}

remediate_u10() {
    local CHECK_ID="U-10"
    local CATEGORY="계정 관리"
    local DESCRIPTION="동일한 UID 금지 - 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local TARGET_FILE="/etc/passwd"

    # 점검 항목별 판정 기준 (진단 스크립트 기준)
    local CRITERIA_PERM="양호는 소유자 root, 권한 644이어야 함"
    local CRITERIA_UID="모든 계정은 고유한 UID를 가져야 함"
    local CRITERIA_FILE_OK="설정 파일 존재 시에만 점검, 없을시에는 양호"

    if [ ! -f "$TARGET_FILE" ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "" " " "파일 없음" "설정 파일 없음(양호)" "$CRITERIA_FILE_OK")")
        local DETAILS_STR="해당 없음: $TARGET_FILE 없음."
        local DETAILS_JSON="["
        local i=0
        for obj in "${DETAIL_OBJS[@]}"; do
            [ $i -gt 0 ] && DETAILS_JSON+=","
            DETAILS_JSON+="$obj"
            ((i++)) || true
        done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "SAFE" "N/A" "N/A" "$BACKUP_BASE" "$DETAILS_STR" "$DETAILS_JSON"
        return 0
    fi

    # ---------- 조치 전 상태 일괄 수집 ----------
    local PERM_BEFORE=""
    PERM_BEFORE=$(ls -l "$TARGET_FILE" 2>/dev/null || stat -c "%U:%G %a %n" "$TARGET_FILE" 2>/dev/null || echo "확인 불가")
    local P_NUM P_OWN
    P_NUM=$(stat -c "%a" "$TARGET_FILE" 2>/dev/null)
    P_OWN=$(stat -c "%U" "$TARGET_FILE" 2>/dev/null)
    [ -z "$P_OWN" ] && P_OWN=$(echo "$PERM_BEFORE" | awk '{print $3}')
    [ -z "$P_NUM" ] && P_NUM="확인불가"
    PERM_BEFORE="${PERM_BEFORE} (권한: ${P_NUM}, 소유자: ${P_OWN})"

    local UID_BEFORE=""
    local DUPLICATE_UID_LIST
    DUPLICATE_UID_LIST=$(awk -F: '{print $3}' /etc/passwd 2>/dev/null | sort -n | uniq -d)
    if [ -n "$DUPLICATE_UID_LIST" ]; then
        while IFS= read -r uid; do
            [ -z "$uid" ] && continue
            local LINES
            LINES=$(awk -F: -v u="$uid" '$3 == u' /etc/passwd 2>/dev/null)
            UID_BEFORE="${UID_BEFORE}${UID_BEFORE:+$'\n'}${uid}"$'\n'"${LINES}"
        done <<< "$DUPLICATE_UID_LIST"
    fi

    # 백업 (조치 전)
    cp -p "$TARGET_FILE" "${BACKUP_BASE}/passwd.bak"
    ACTIONS_TAKEN+=("$TARGET_FILE 백업: ${BACKUP_BASE}/passwd.bak")

    # ---------- 점검 항목 1: /etc/passwd 권한 및 소유자 ----------
    local PERM_REMEDY=""
    local OWNER="" PERMS_NUM=""
    OWNER=$(stat -c "%U" "$TARGET_FILE" 2>/dev/null) || OWNER=$(ls -l "$TARGET_FILE" 2>/dev/null | awk '{print $3}')
    PERMS_NUM=$(stat -c "%a" "$TARGET_FILE" 2>/dev/null)
    [ -z "$PERMS_NUM" ] && PERMS_NUM=""
    local NEED_PERM_FIX=0
    [ "$OWNER" != "root" ] && NEED_PERM_FIX=1
    [ "$PERMS_NUM" != "644" ] && NEED_PERM_FIX=1
    if [ "$NEED_PERM_FIX" -eq 1 ]; then
        chown root:root "$TARGET_FILE" 2>/dev/null && ACTIONS_TAKEN+=("$TARGET_FILE 소유자 root 설정")
        chmod 644 "$TARGET_FILE" 2>/dev/null && ACTIONS_TAKEN+=("$TARGET_FILE 권한 644 설정")
        PERM_REMEDY="chown root:root $TARGET_FILE"$'\n'"chmod 644 $TARGET_FILE"
    fi

    local PERM_AFTER=""
    PERM_AFTER=$(ls -l "$TARGET_FILE" 2>/dev/null || stat -c "%U:%G %a %n" "$TARGET_FILE" 2>/dev/null || echo "확인 불가")
    local P_AFTER_NUM P_AFTER_OWN
    P_AFTER_NUM=$(stat -c "%a" "$TARGET_FILE" 2>/dev/null)
    P_AFTER_OWN=$(stat -c "%U" "$TARGET_FILE" 2>/dev/null)
    [ -z "$P_AFTER_OWN" ] && P_AFTER_OWN=$(echo "$PERM_AFTER" | awk '{print $3}')
    [ -z "$P_AFTER_NUM" ] && P_AFTER_NUM="확인불가"
    PERM_AFTER="${PERM_AFTER} (권한: ${P_AFTER_NUM}, 소유자: ${P_AFTER_OWN})"

    if [ -n "$PERM_REMEDY" ]; then
        local PERM_INFO="조치후 양호 전환"
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$PERM_BEFORE" "$PERM_REMEDY" "$PERM_AFTER" "$PERM_INFO" "$CRITERIA_PERM")")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$PERM_BEFORE" " " "$PERM_AFTER" "기존 양호여서 조치 없음" "$CRITERIA_PERM")")
    fi

    # ---------- 점검 항목 2: UID 중복 ----------
    local UID_REMEDY=""
    local AFFECTED_ACCOUNTS=()
    if [ -n "$DUPLICATE_UID_LIST" ]; then
        local REMEDY_LINES=""
        while IFS= read -r uid; do
            [ -z "$uid" ] && continue
            local ACCOUNTS=()
            read -ra ACCOUNTS <<< "$(awk -F: -v u="$uid" '$3 == u {print $1}' /etc/passwd)"
            if [ ${#ACCOUNTS[@]} -gt 1 ]; then
                for ((i=0; i<${#ACCOUNTS[@]}; i++)); do
                    AFFECTED_ACCOUNTS+=("${ACCOUNTS[$i]}")
                done
                for ((i=1; i<${#ACCOUNTS[@]}; i++)); do
                    local account=${ACCOUNTS[$i]}
                    local NEW_UID
                    NEW_UID=$(get_next_free_uid /etc/passwd)

                    if usermod -u "$NEW_UID" "$account" 2>/dev/null; then
                        REMEDY_LINES="${REMEDY_LINES}usermod -u $NEW_UID $account"$'\n'
                        ACTIONS_TAKEN+=("UID 변경: ${account} (${uid} -> ${NEW_UID})")
                    else
                        local account_escaped
                        account_escaped=$(printf '%s' "$account" | sed 's/\./\\./g; s/\\/\\\\/g')
                        sed -i "s/^\(${account_escaped}:[^:]*:\)${uid}:/\1${NEW_UID}:/" /etc/passwd
                        REMEDY_LINES="${REMEDY_LINES}sed -i UID ${uid}->${NEW_UID} for $account"$'\n'
                        ACTIONS_TAKEN+=("UID 수동 변경: ${account} (${uid} -> ${NEW_UID})")
                    fi
                done
            fi
        done <<< "$DUPLICATE_UID_LIST"
        UID_REMEDY="${REMEDY_LINES%$'\n'}"
    fi

    local UID_AFTER=""
    local FINAL_UID_DUPS
    FINAL_UID_DUPS=$(awk -F: '{print $3}' /etc/passwd 2>/dev/null | sort -n | uniq -d)
    if [ -n "$FINAL_UID_DUPS" ]; then
        while IFS= read -r uid; do
            [ -z "$uid" ] && continue
            local LINES
            LINES=$(awk -F: -v u="$uid" '$3 == u' /etc/passwd 2>/dev/null)
            UID_AFTER="${UID_AFTER}${UID_AFTER:+$'\n'}${uid}"$'\n'"${LINES}"
        done <<< "$FINAL_UID_DUPS"
    elif [ ${#AFFECTED_ACCOUNTS[@]} -gt 0 ]; then
        local seen=""
        for acc in "${AFFECTED_ACCOUNTS[@]}"; do
            [[ " $seen " == *" $acc "* ]] && continue
            seen="$seen $acc"
            local line
            line=$(grep "^${acc}:" /etc/passwd 2>/dev/null)
            [ -n "$line" ] && UID_AFTER="${UID_AFTER}${UID_AFTER:+$'\n'}${line}"
        done
    fi

    if [ -n "$DUPLICATE_UID_LIST" ]; then
        local UID_INFO="조치후 양호 전환"
        [ -n "$FINAL_UID_DUPS" ] && UID_INFO="조치 후 계속 취약"
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$UID_BEFORE" "$UID_REMEDY" "$UID_AFTER" "$UID_INFO" "$CRITERIA_UID")")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$UID_BEFORE" " " "$UID_AFTER" "기존 양호여서 조치 없음" "$CRITERIA_UID")")
    fi

    # ---------- 최종 상태 및 출력 ----------
    if [ -n "$FINAL_UID_DUPS" ]; then
        STATUS="VULNERABLE"
        echo -e "취약: 중복 UID가 남아 있습니다. root 권한 및 usermod 사용 가능 여부를 확인하세요."
        DETAILS+=("취약: 중복 UID가 여전히 존재합니다 (수동 조치 필요).")
    elif [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        echo -e "조치 완료: UID 중복 및 /etc/passwd 권한을 조치하였습니다."
        DETAILS+=("양호: 중복 UID 해소 및 권한 조치 완료.")
    else
        echo -e "양호: 중복 UID가 없고 /etc/passwd 권한이 정상입니다."
        DETAILS+=("양호: 중복 UID가 없습니다.")
    fi
    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done

    local PRE_VAL="UID 중복 및 파일 권한"
    local POST_VAL="Policy Applied"
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
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$PRE_VAL" "$POST_VAL" "$BACKUP_BASE" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u10

echo "]" >> "$RESULT_JSON"