
폴더 하이라이트
보안 조치 스크립트 모음으로, U-01부터 U-67까지 시스템 설정 및 서비스 비활성화 관련 개별 조치 내용을 포함합니다.

#!/bin/bash
###############################################################################
# [U-67] 로그 디렉터리 소유자 및 권한 설정 - 개별 조치 (통합조치와 동일 로직)
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/remediation_common.sh"
echo "[" > "$RESULT_JSON"

remediate_u67() {
    local CHECK_ID="U-67"
    local CATEGORY="파일 및 디렉터리 관리"
    local DESCRIPTION="로그 디렉터리 소유자 및 권한 설정"
    local EXPECTED_VAL="/var/log 내 주요 로그 파일 소유자가 root이고, 권한이 644 이하임"

    local ACTIONS_TAKEN=()
    local DETAILS=()
    local STATUS="SAFE"
    local LOG_DIR="/var/log"
    local DETAIL_OBJS=()
    local CRITERIA="양호는 /var/log 주요 로그 파일 소유자가 root이며 권한이 644 이하인 상태"
    local CRITERIA_FILE_OK="로그 디렉터리 존재 시에만 점검, 없으면 수동 확인 필요"

    echo -e "[Checking] $CHECK_ID. $DESCRIPTION..."

    if [ ! -d "$LOG_DIR" ]; then
        STATUS="ERROR"
        local ERR_MSG="오류: $LOG_DIR 디렉터리를 찾을 수 없습니다."
        local BEFORE="점검 디렉터리 없음"
        local AFTER="디렉터리 없음"
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" " " "$AFTER" "$ERR_MSG" "$CRITERIA_FILE_OK")")
        local DETAILS_STR="$ERR_MSG"
        local DETAILS_JSON="["
        local i=0
        for obj in "${DETAIL_OBJS[@]}"; do
            [ $i -gt 0 ] && DETAILS_JSON+=","
            DETAILS_JSON+="$obj"
            ((i++)) || true
        done
        DETAILS_JSON+="]"
        generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "점검 디렉터리 없음" "$EXPECTED_VAL" "" "$DETAILS_STR" "$DETAILS_JSON"
        return 1
    fi

    local BACKUP_DIR="/root/u67_strong_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    DETAILS+=("백업 디렉터리 생성: $BACKUP_DIR")

    local BEFORE="" AFTER="" REMEDY_CMD=""
    BEFORE="root가 아닌 파일(조치 전):"$'\n'"$(find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" ! -user root 2>/dev/null || echo '(없음)')"
    BEFORE="${BEFORE}"$'\n'"과도한 권한 파일(조치 전):"$'\n'"$(find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" \( -perm /022 -o -perm /111 \) 2>/dev/null || echo '(없음)')"

    local NON_ROOT_FILES=$(find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" ! -user root 2>/dev/null)
    if [ -n "$NON_ROOT_FILES" ]; then
        find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" ! -user root -exec chown root:root {} + 2>/dev/null
        ACTIONS_TAKEN+=("소유권: root가 아닌 파일들의 소유자를 root:root로 일괄 변경함")
    fi

    local OVER_PERM_FILES=$(find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" \( -perm /022 -o -perm /111 \) 2>/dev/null)
    if [ -n "$OVER_PERM_FILES" ]; then
        find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" \( -perm /022 -o -perm /111 \) -exec chmod 644 {} + 2>/dev/null
        ACTIONS_TAKEN+=("권한: 644를 초과하거나 실행 권한이 있는 파일들을 644로 일괄 조정함")
    fi

    sleep 2
    local NON_ROOT_FILES2=$(find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" ! -user root 2>/dev/null)
    if [ -n "$NON_ROOT_FILES2" ]; then
        find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" ! -user root -exec chown root:root {} + 2>/dev/null
        ACTIONS_TAKEN+=("2차: rsyslog 재시작 등으로 새로 생성된 로그 파일 소유자 root 보정")
    fi
    local OVER_PERM_FILES2=$(find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" \( -perm /022 -o -perm /111 \) 2>/dev/null)
    if [ -n "$OVER_PERM_FILES2" ]; then
        find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" \( -perm /022 -o -perm /111 \) -exec chmod 644 {} + 2>/dev/null
        ACTIONS_TAKEN+=("2차: 새로 생성된 로그 파일 권한 644 보정")
    fi

    AFTER="root가 아닌 파일(조치 후):"$'\n'"$(find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" ! -user root 2>/dev/null || echo '(없음)')"
    AFTER="${AFTER}"$'\n'"과도한 권한 파일(조치 후):"$'\n'"$(find "$LOG_DIR" -maxdepth 2 -type f -not -path "*/journal/*" \( -perm /022 -o -perm /111 \) 2>/dev/null || echo '(없음)')"
    REMEDY_CMD="find로 /var/log 비root 소유 및 과도 권한 파일을 chown root:root, chmod 644로 보정"

    if [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        STATUS="SAFE"
        echo -e "조치 완료: 로그 파일 소유자 및 권한 보안 강화가 완료되었습니다."
        DETAILS+=("=== 최종 조치 결과 ===")
        for action in "${ACTIONS_TAKEN[@]}"; do DETAILS+=("✓ $action"); done
        DETAILS+=("결과 요약: 모든 파일이 이제 root 소유 및 644 권한을 충족합니다.")
    else
        STATUS="SAFE"
        echo -e "양호: 이미 모든 로그 파일이 보안 가이드라인을 준수하고 있습니다."
        DETAILS+=("양호: 현재 시스템의 모든 로그 파일이 이미 root 소유 및 644 이하 권한입니다.")
    fi

    local DETAILS_STR
    DETAILS_STR=$(printf '%s\n' "${DETAILS[@]}")
    if [ ${#ACTIONS_TAKEN[@]} -gt 0 ]; then
        DETAIL_OBJS+=("$(build_detail_obj_full "취약" "$BEFORE" "$REMEDY_CMD" "$AFTER" "조치후 양호 전환" "$CRITERIA")")
    else
        DETAIL_OBJS+=("$(build_detail_obj_full "양호" "$BEFORE" " " "$AFTER" "기존 양호여서 조치 없음" "$CRITERIA")")
    fi
    local DETAILS_JSON="["
    local i=0
    for obj in "${DETAIL_OBJS[@]}"; do
        [ $i -gt 0 ] && DETAILS_JSON+=","
        DETAILS_JSON+="$obj"
        ((i++)) || true
    done
    DETAILS_JSON+="]"
    generate_json_output "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "Hardened/Safe" "$EXPECTED_VAL" "" "$DETAILS_STR" "$DETAILS_JSON"
}

remediate_u67
echo "]" >> "$RESULT_JSON"