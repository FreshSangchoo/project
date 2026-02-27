#!/bin/bash

# 로컬 환경 설정 (한글 깨짐 방지)
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export TZ=Asia/Seoul

## 그래도 깨져보이면 이거 쓰기
## export LANG=C.UTF-8
## export LC_ALL=C.UTF-8

###############################################################################
# Script Name: security_check.sh
# Description: 보안 점검 스크립트 (JSON 출력)
# Target OS: Rocky Linux 9.7, Ubuntu 24
# Author: Security Automation Project
# Date: 2026-02-09
###############################################################################

# [환경 설정]
RESULT_JSON="result.json"
HOSTNAME=$(hostname)

# OS 타입 자동 감지
if [ -f /etc/rocky-release ]; then
    OS_TYPE="rocky"
elif [ -f /etc/lsb-release ] && grep -q "Ubuntu" /etc/lsb-release; then
    OS_TYPE="ubuntu"
else
    OS_TYPE="unknown"
fi

OS_VERSION=$(grep -oP '(?<=^VERSION_ID=).+' /etc/os-release | tr -d '"' 2>/dev/null || echo "unknown")

# [JSON 초기화]
echo "[" > "$RESULT_JSON"

# ----------------------------------------------------------
# 함수명: Write_JSON_Result
# 설명: 모든 점검 항목을 동일한 JSON 규격으로 기록
# ----------------------------------------------------------
function Write_JSON_Result() {
    local CHECK_ID=$1
    local CATEGORY=$2
    local DESCRIPTION=$3
    local STATUS=$4
    local CURRENT_VAL=$5
    local EXPECTED_VAL=$6
    local DETAILS=$7

    if [ $(wc -l < "$RESULT_JSON") -gt 1 ]; then
        sed -i '$s/$/,/' "$RESULT_JSON"
    fi

    cat <<EOF >> "$RESULT_JSON"
{
  "check_id": "$CHECK_ID",
  "category": "$CATEGORY",
  "description": "$DESCRIPTION",
  "hostname": "$HOSTNAME",
  "os_type": "$OS_TYPE",
  "os_version": "$OS_VERSION",
  "timestamp": "$(date '+%Y-%m-%d %H:%M:%S')",
  "status": "$STATUS",
  "current_value": "$CURRENT_VAL",
  "expected_value": "$EXPECTED_VAL",
  "details": $DETAILS
}
EOF
}

# ----------------------------------------------------------
# 함수명: Add_Detail_Item
# 설명: 구조화된 점검 항목을 DETAILS_ARRAY에 JSON 객체로 추가
# 인자: check_name, check_file, check_cmd, status, detail
# ----------------------------------------------------------
function Add_Detail_Item() {
    local check_name="$1"
    local check_file="$2"
    local check_cmd="$3"
    local status="$4"
    local detail="$5"

    # 특수문자 이스케이프 (백슬래시, 큰따옴표)
    check_cmd=$(echo "$check_cmd" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
    detail=$(echo "$detail" | sed 's/"/\\"/g')

    local json_obj="{\"점검항목\":\"$check_name\",\"상태\":\"$status\",\"세부내용\":\"$detail\"}"
    DETAILS_ARRAY+=("$json_obj")
}

# ----------------------------------------------------------
# 함수명: Build_Details_JSON
# 설명: DETAILS_ARRAY를 JSON 배열 문자열로 변환
# ----------------------------------------------------------
function Build_Details_JSON() {
    local DETAILS_JSON="["
    for i in "${!DETAILS_ARRAY[@]}"; do
        [ $i -gt 0 ] && DETAILS_JSON+=","
        DETAILS_JSON+="${DETAILS_ARRAY[$i]}"
    done
    DETAILS_JSON+="]"
    echo "$DETAILS_JSON"
}



#####################################################################################################################
# 함수명: U-39
# 설명: 불필요한 NFS 서비스 비활성화 점검
# ----------------------------------------------------------
function U-39() {
    local CHECK_ID="U-39"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="불필요한 NFS 서비스 비활성화"
    local EXPECTED_VAL="불필요한 NFS 서비스가 비활성화된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local ACTIVE_SERVICES=0
    local INACTIVE_SERVICES=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # NFS 관련 서비스 목록
    local NFS_SERVICES=(
        "nfs-server:NFS 서버"
        "nfs-kernel-server:NFS 커널 서버 (Ubuntu)"
        "nfs:NFS 서비스"
        "rpcbind:RPC 바인드 (NFS 필수)"
        "nfs-idmap:NFS ID 매핑"
        "nfs-mountd:NFS 마운트 데몬"
    )

    # [점검 1] NFS 관련 서비스 상태 확인
    for service_info in "${NFS_SERVICES[@]}"; do
        local service=$(echo "$service_info" | cut -d':' -f1)
        local description=$(echo "$service_info" | cut -d':' -f2)

        if systemctl list-unit-files "$service" 2>/dev/null | grep -q "$service"; then
            ((TOTAL_CHECKED++))

            local active_status=$(systemctl is-active "$service" 2>/dev/null)
            local enabled_status=$(systemctl is-enabled "$service" 2>/dev/null)

            if [ "$active_status" = "active" ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service ($description) - 실행 중 (Enabled: $enabled_status)\"}")
                ((ACTIVE_SERVICES++))
                IS_VULN=1
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - 비활성화\"}")
                ((INACTIVE_SERVICES++))
            fi
        fi
    done

    # [점검 2] NFS 마운트 상태 확인
    local nfs_mounts=$(mount | grep "type nfs")

    if [ -n "$nfs_mounts" ]; then
        ((TOTAL_CHECKED++))

        local mount_count=$(echo "$nfs_mounts" | wc -l)
        while IFS= read -r mount_line; do
            local mount_point=$(echo "$mount_line" | awk '{print $3}')
            local remote_path=$(echo "$mount_line" | awk '{print $1}')
        done <<< "$nfs_mounts"

        ((ACTIVE_SERVICES++))
        IS_VULN=1
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: 마운트된 NFS 없음\"}")
    fi

    # [점검 3] /etc/fstab NFS 설정 확인
    if [ ! -f /etc/fstab ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/fstab\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/fstab 파일 없음\"}")
    else
        local nfs_entries=$(grep -v '^#' /etc/fstab | grep 'nfs')

        if [ -n "$nfs_entries" ]; then
            ((TOTAL_CHECKED++))

            local entry_count=$(echo "$nfs_entries" | wc -l)
            DETAILS_ARRAY+=("\"양호(주의): /etc/fstab에 NFS 설정 ${entry_count}개 발견\"")

            while IFS= read -r line; do
                DETAILS_ARRAY+=("\"  - $line\"")
            done <<< "$nfs_entries"

            ((ACTIVE_SERVICES++))
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/fstab에 NFS 설정 없음\"}")
        fi
    fi

    # [점검 4] /etc/exports 공유 설정 확인
    if [ ! -f /etc/exports ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"etc/exports\",\"상태\":\"양호\",\"세부내용\":\"양호: /etc/exports 파일 없음\"}")
    else
        local export_entries=$(grep -v '^#' /etc/exports | grep -v '^$')

        if [ -n "$export_entries" ]; then
            ((TOTAL_CHECKED++))

            DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: NFS 공유 디렉토리 설정 발견\"}")

            while IFS= read -r line; do
                local share_path=$(echo "$line" | awk '{print $1}')
                if echo "$line" | grep -q "no_root_squash"; then
                    :
                    #DETAILS_ARRAY+=("\"    → no_root_squash 설정 (위험)\"")
                fi

                if echo "$line" | grep -q "rw"; then
                    :
                    #DETAILS_ARRAY+=("\"    → 쓰기 권한 허용\"")
                fi
            done <<< "$export_entries"

            ((ACTIVE_SERVICES++))
            IS_VULN=1
        else
            DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 공유 설정 없음\"}")
        fi
    fi

    # [점검 5] NFS 관련 프로세스 확인
    local nfs_procs=$(ps aux | grep -E 'nfs|rpc' | grep -v grep)

    if [ -n "$nfs_procs" ]; then
        local proc_count=$(echo "$nfs_procs" | wc -l)
        DETAILS_ARRAY+=("\"양호(주의): NFS 관련 프로세스 ${proc_count}개 실행 중\"")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 관련 프로세스 없음\"}")
    fi

    # [점검 6] NFS 포트 리스닝 확인
    local nfs_ports=(2049 111 20048)
    local listening_found=0

    for port in "${nfs_ports[@]}"; do
        if ss -tuln 2>/dev/null | grep -q ":${port} "; then
            listening_found=1

            local protocol=$(ss -tuln 2>/dev/null | grep ":${port} " | awk '{print $1}' | head -1)
            local address=$(ss -tuln 2>/dev/null | grep ":${port} " | awk '{print $5}' | head -1)

            DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 포트 $port/$protocol 리스닝 중 ($address)\"}")
        fi
    done

    if [ $listening_found -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 포트 리스닝 없음\"}")
    else
        ((TOTAL_CHECKED++))
        ((ACTIVE_SERVICES++))
        IS_VULN=1
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="NFS 서비스 및 관련 설정 없음"
        # DETAILS_ARRAY+=("{\"점검항목\":\"NFS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: NFS 관련 서비스가 설치되지 않았습니다.\"}")
    elif [ $ACTIVE_SERVICES -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 항목 모두 비활성화"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 중 활성화 ${ACTIVE_SERVICES}개, 비활성화 ${INACTIVE_SERVICES}개"
    fi
    
    
     if [ $IS_VULN -eq 1 ]; then
        echo -e "${RED}  => [취약] $CHECK_ID 점검 기준 미달${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-39)..."
U-39

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
