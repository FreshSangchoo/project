#!/bin/bash
###############################################################################
# [U-21] /etc/(r)syslog.conf 파일 소유자 및 권한 설정 - 개별 조치
# 점검: 소유자 root(또는 bin, sys), 권한 640 이하
# 조치: chown root, chmod 640
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u21() {
    local CHECK_ID="U-21"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="/etc/(r)syslog.conf 파일 소유자 및 권한 조치"
    local ACTIONS_TAKEN=()
    local DETAILS=()
    local DETAIL_OBJS=()
    local STATUS="SAFE"
    local TARGET_FILES=("/etc/rsyslog.conf" "/etc/syslog.conf")
    local CRITERIA="양호는 소유자 root(또는 bin, sys), 권한 640 이하"
    local CRITERIA_FILE_OK="설정/점검 대상 존재 시에만 점검, 없을시에는 양호"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    local FOUND_ANY=0
    for file in "${TARGET_FILES[@]}"; do
        [ -f "$file" ] && FOUND_ANY=1 && break
    done

    if [ "$FOUND_ANY" -eq 0 ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "점검 파일 없음" " " "파일 없음" "설정 파일 없음(양호)" "$CRITERIA_FILE_OK")")
        DETAILS+=("양호: rsyslog.conf/syslog.conf 없음(해당없음)")
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

    # ---------- 파일별로 조치 전 상태, 조치, 조치 후 상태 (실제 출력만) ----------
    for file in "${TARGET_FILES[@]}"; do
        [ ! -f "$file" ] && continue

        local BEFORE AFTER REMEDY_CMD
        BEFORE=$(ls -l "$file" 2>/dev/null)
        local p o
        p=$(stat -c "%a" "$file" 2>/dev/null)
        o=$(stat -c "%U" "$file" 2>/dev/null)
        [ -n "$p" ] && [ -n "$o" ] && BEFORE="${BEFORE} (권한: ${p}, 소유자: ${o})"

        local NEED_FIX=0
        [ "$o" != "root" ] && [ "$o" != "bin" ] && [ "$o" != "sys" ] && NEED_FIX=1
        [ -n "$p" ] && [ "$p" -gt 640 ] && NEED_FIX=1

        if [ "$NEED_FIX" -eq 1 ]; then
            mkdir -p /tmp/security_audit/backup/U-21
            cp -p "$file" "/tmp/security_audit/backup/U-21/$(basename "$file").bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null
            chown root "$file" 2>/dev/null
            chmod 640 "$file" 2>/dev/null
            REMEDY_CMD="chown root $file; chmod 640 $file"
            ACTIONS_TAKEN+=("$file ($o:$p → root:640)")
        else
            REMEDY_CMD=" "
        fi

        AFTER=$(ls -l "$file" 2>/dev/null)
        local p2 o2
        p2=$(stat -c "%a" "$file" 2>/dev/null)
        o2=$(stat -c "%U" "$file" 2>/dev/null)
        [ -n "$p2" ] && [ -n "$o2" ] && AFTER="${AFTER} (권한: ${p2}, 소유자: ${o2})"

        local STILL_VULN=0
        [ "$o2" != "root" ] && [ "$o2" != "bin" ] && [ "$o2" != "sys" ] && STILL_VULN=1
        [ -n "$p2" ] && [ "$p2" -gt 640 ] && STILL_VULN=1
        [ "$STILL_VULN" -eq 1 ] && STATUS="VULNERABLE"

        if [ "$NEED_FIX" -eq 1 ]; then
            if [ "$STILL_VULN" -eq 1 ]; then
                DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치 후 계속 취약" "$CRITERIA")")
                DETAILS+=("취약: $file 조치 후에도 부적절")
            else
                DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
                DETAILS+=("조치 완료: $file 소유자/권한 조치")
            fi
        else
            DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
            DETAILS+=("양호: $file (소유자: $o, 권한: $p)")
        fi
    done

    for act in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("조치완료: $act"); done
    local PRE_VAL="syslog 설정 파일"
    local POST_VAL="root 소유, 권한 640"
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

remediate_u21

echo "]" >> "$RESULT_JSON"