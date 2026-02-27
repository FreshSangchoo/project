#!/bin/bash
###############################################################################
# [U-20] /etc/(x)inetd.conf 및 관련 설정 파일 소유자 및 권한 - 개별 조치
# 점검: 소유자 root, 권한 600 이하
# 조치: chown root, chmod 600 (디렉터리 내 파일 포함)
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u20() {
    local CHECK_ID="U-20"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="/etc/(x)inetd.conf 및 관련 파일 소유자 및 권한 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local TARGET_LIST=("/etc/inetd.conf" "/etc/xinetd.conf" "/etc/xinetd.d" "/etc/systemd/system.conf" "/etc/systemd")
    local CRITERIA="양호는 소유자 root, 권한 600 이하"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    # ---------- 조치 전 상태 수집 (실제 ls -l / ls -ld 출력만) ----------
    local BEFORE=""
    local AFTER=""
    local REMEDY_CMD=""
    local HAS_ANY=0

    for item in "${TARGET_LIST[@]}"; do
        [ ! -e "$item" ] && continue
        HAS_ANY=1
        if [ -d "$item" ]; then
            local line
            line=$(ls -ld "$item" 2>/dev/null)
            local p o
            p=$(stat -c "%a" "$item" 2>/dev/null)
            o=$(stat -c "%U" "$item" 2>/dev/null)
            [ -n "$p" ] && [ -n "$o" ] && line="${line} (권한: ${p}, 소유자: ${o})"
            BEFORE="${BEFORE}${BEFORE:+$'\n'}${line}"
            # 디렉터리 내 파일들
            while IFS= read -r f; do
                [ -z "$f" ] && continue
                line=$(ls -l "$f" 2>/dev/null)
                p=$(stat -c "%a" "$f" 2>/dev/null)
                o=$(stat -c "%U" "$f" 2>/dev/null)
                [ -n "$p" ] && [ -n "$o" ] && line="${line} (권한: ${p}, 소유자: ${o})"
                BEFORE="${BEFORE}${BEFORE:+$'\n'}${line}"
            done < <(find "$item" -maxdepth 1 -type f 2>/dev/null)
        else
            local line
            line=$(ls -l "$item" 2>/dev/null)
            local p o
            p=$(stat -c "%a" "$item" 2>/dev/null)
            o=$(stat -c "%U" "$item" 2>/dev/null)
            [ -n "$p" ] && [ -n "$o" ] && line="${line} (권한: ${p}, 소유자: ${o})"
            BEFORE="${BEFORE}${BEFORE:+$'\n'}${line}"
        fi
    done

    if [ "$HAS_ANY" -eq 0 ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "설정 파일 없음(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: 점검 대상 파일/디렉터리 없음(해당없음)")
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

    # ---------- 조치 전 취약 여부 (조치 적용 전에 판단) ----------
    local NEED_FIX=0
    for item in "${TARGET_LIST[@]}"; do
        [ ! -e "$item" ] && continue
        if [ -d "$item" ]; then
            local o p
            o=$(stat -c "%U" "$item" 2>/dev/null)
            p=$(stat -c "%a" "$item" 2>/dev/null)
            [ "$o" != "root" ] && NEED_FIX=1
            [ -n "$p" ] && [ "$p" -gt 600 ] && NEED_FIX=1
            while IFS= read -r f; do
                [ -z "$f" ] && continue
                o=$(stat -c "%U" "$f" 2>/dev/null)
                p=$(stat -c "%a" "$f" 2>/dev/null)
                [ "$o" != "root" ] && NEED_FIX=1
                [ -n "$p" ] && [ "$p" -gt 600 ] && NEED_FIX=1
            done < <(find "$item" -maxdepth 1 -type f 2>/dev/null)
        else
            local o p
            o=$(stat -c "%U" "$item" 2>/dev/null)
            p=$(stat -c "%a" "$item" 2>/dev/null)
            [ "$o" != "root" ] && NEED_FIX=1
            [ -n "$p" ] && [ "$p" -gt 600 ] && NEED_FIX=1
        fi
    done

    # ---------- 조치 수행 (소유자 root, 권한 600) ----------
    if [ "$NEED_FIX" -eq 1 ]; then
        for item in "${TARGET_LIST[@]}"; do
            [ ! -e "$item" ] && continue
            if [ -d "$item" ]; then
                chown -R root "$item" 2>/dev/null
                find "$item" -type f -exec chmod 600 {} \; 2>/dev/null
                REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}chown -R root \"$item\"; find \"$item\" -type f -exec chmod 600 {} \\;"
                ACTIONS_TAKEN+=("$item 디렉터리 소유권 root, 내부 파일 권한 600")
            else
                chown root "$item" 2>/dev/null
                chmod 600 "$item" 2>/dev/null
                REMEDY_CMD="${REMEDY_CMD}${REMEDY_CMD:+$'\n'}chown root \"$item\"; chmod 600 \"$item\""
                ACTIONS_TAKEN+=("$item 소유권 root, 권한 600")
            fi
        done
    fi

    # ---------- 조치 후 상태 수집 ----------
    for item in "${TARGET_LIST[@]}"; do
        [ ! -e "$item" ] && continue
        if [ -d "$item" ]; then
            local line
            line=$(ls -ld "$item" 2>/dev/null)
            local p o
            p=$(stat -c "%a" "$item" 2>/dev/null)
            o=$(stat -c "%U" "$item" 2>/dev/null)
            [ -n "$p" ] && [ -n "$o" ] && line="${line} (권한: ${p}, 소유자: ${o})"
            AFTER="${AFTER}${AFTER:+$'\n'}${line}"
            while IFS= read -r f; do
                [ -z "$f" ] && continue
                line=$(ls -l "$f" 2>/dev/null)
                p=$(stat -c "%a" "$f" 2>/dev/null)
                o=$(stat -c "%U" "$f" 2>/dev/null)
                [ -n "$p" ] && [ -n "$o" ] && line="${line} (권한: ${p}, 소유자: ${o})"
                AFTER="${AFTER}${AFTER:+$'\n'}${line}"
            done < <(find "$item" -maxdepth 1 -type f 2>/dev/null)
        else
            local line
            line=$(ls -l "$item" 2>/dev/null)
            local p o
            p=$(stat -c "%a" "$item" 2>/dev/null)
            o=$(stat -c "%U" "$item" 2>/dev/null)
            [ -n "$p" ] && [ -n "$o" ] && line="${line} (권한: ${p}, 소유자: ${o})"
            AFTER="${AFTER}${AFTER:+$'\n'}${line}"
        fi
    done

    # ---------- 조치 후 취약 여부 ----------
    local STILL_VULN=0
    for item in "${TARGET_LIST[@]}"; do
        [ ! -e "$item" ] && continue
        if [ -d "$item" ]; then
            # 디렉터리 자체 권한은 무시하고, 내부 파일들만 점검 스크립트와 동일 기준으로 확인
            while IFS= read -r f; do
                [ -z "$f" ] && continue
                local fo fp
                fo=$(stat -c "%U" "$f" 2>/dev/null)
                fp=$(stat -c "%a" "$f" 2>/dev/null)
                [ "$fo" != "root" ] && STILL_VULN=1
                [ -n "$fp" ] && [ "$fp" -gt 600 ] && STILL_VULN=1
            done < <(find "$item" -maxdepth 1 -type f 2>/dev/null)
        else
            local o p
            o=$(stat -c "%U" "$item" 2>/dev/null)
            p=$(stat -c "%a" "$item" 2>/dev/null)
            [ "$o" != "root" ] && STILL_VULN=1
            [ -n "$p" ] && [ "$p" -gt 600 ] && STILL_VULN=1
        fi
    done

    [ "$STILL_VULN" -eq 1 ] && STATUS="VULNERABLE"

    if [ "$NEED_FIX" -eq 1 ]; then
        if [ "$STILL_VULN" -eq 1 ]; then
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후 계속 취약(일부)" "$CRITERIA")")
            DETAILS+=("취약: 조치 후에도 일부 설정 부적절")
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
            DETAILS+=("조치 완료: inetd/xinetd/systemd 관련 파일 소유자 및 권한 조치")
        fi
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
        DETAILS+=("양호: 모든 대상 파일 소유자 root, 권한 600 이하")
    fi

    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local PRE_VAL="inetd/xinetd/systemd 설정"
    local POST_VAL="root 소유, 권한 600"
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

remediate_u20

echo "]" >> "$RESULT_JSON"