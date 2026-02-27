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


#########################################################################################################################
# ----------------------------------------------------------
# 함수명: U-42
# 설명: 불필요한 RPC 서비스 비활성화 점검
# ----------------------------------------------------------
function U-42() {
    local CHECK_ID="U-42"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="불필요한 RPC 서비스 비활성화"
    local EXPECTED_VAL="rpc.cmsd, sadmind, rusersd, walld 등 취약한 RPC 서비스가 비활성화된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local VULNERABLE_COUNT=0
    local SECURE_COUNT=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # 불필요한 RPC 서비스 목록 (취약점 존재)
    local VULNERABLE_RPC_SERVICES=(
        "rpc.cmsd:Calendar Manager (버퍼 오버플로우)"
        "rpc.ttdbserverd:ToolTalk Database Server (원격 실행)"
        "sadmind:Solstice AdminSuite Daemon (버퍼 오버플로우)"
        "rusersd:Remote Users Daemon (정보 노출)"
        "walld:Write All Daemon (DoS)"
        "sprayd:Spray Daemon (DoS)"
        "rstatd:Remote Status Daemon (정보 노출)"
        "rpc.nisd:NIS+ Daemon (인증 우회)"
        "rexd:Remote Execution Daemon (원격 실행)"
        "rpc.pcnfsd:PC-NFS Daemon (인증 우회)"
        "rpc.statd:Status Monitor Daemon (DoS)"
        "rpc.ypupdated:NIS Update Daemon (권한 상승)"
        "rpc.rquotad:Remote Quota Daemon (정보 노출)"
    )

    # [점검 1] 취약한 RPC 서비스 프로세스 확인
    local found_vulnerable=0

    for service_info in "${VULNERABLE_RPC_SERVICES[@]}"; do
        local service=$(echo "$service_info" | cut -d':' -f1)
        local description=$(echo "$service_info" | cut -d':' -f2)

        local proc=$(ps aux | grep "$service" | grep -v grep)

        if [ -n "$proc" ]; then
            ((TOTAL_CHECKED++))
            ((VULNERABLE_COUNT++))
            found_vulnerable=1
            IS_VULN=1

            local proc_pid=$(echo "$proc" | awk '{print $2}')
            local proc_user=$(echo "$proc" | awk '{print $1}')

            DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - 실행 중 (PID: $proc_pid, 사용자: $proc_user) - 위협: $description\"}")
        fi
    done

    if [ $found_vulnerable -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"RPC 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: 취약한 RPC 서비스 프로세스 없음\"}")
    fi

    # [점검 2] rpcinfo 등록 취약 서비스 확인
    if ! command -v rpcinfo > /dev/null 2>&1; then
        DETAILS_ARRAY+=("{\"점검항목\":\"RPC 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: rpcinfo 명령어 없음\"}")
    elif ! systemctl is-active rpcbind > /dev/null 2>&1 && ! pgrep rpcbind > /dev/null 2>&1; then
        DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: rpcbind 비활성화\"}")
    else
        local rpc_list=$(rpcinfo -p 2>/dev/null)

        if [ -z "$rpc_list" ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"RPC 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: 등록된 RPC 서비스 없음\"}")
        else
            found_vulnerable=0

            for service_info in "${VULNERABLE_RPC_SERVICES[@]}"; do
                local service=$(echo "$service_info" | cut -d':' -f1)
                local description=$(echo "$service_info" | cut -d':' -f2)
                local service_name=$(echo "$service" | sed 's/rpc\.//')

                if echo "$rpc_list" | grep -qi "$service_name"; then
                    ((TOTAL_CHECKED++))
                    ((VULNERABLE_COUNT++))
                    found_vulnerable=1
                    IS_VULN=1

                    DETAILS_ARRAY+=("{\"점검항목\":\"RPC 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - RPC 등록됨 - 위협: $description\"}")
                fi
            done

            if [ $found_vulnerable -eq 0 ]; then
                DETAILS_ARRAY+=("{\"점검항목\":\"RPC 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: 취약한 RPC 서비스 등록 없음\"}")
            fi
        fi
    fi

    # [점검 3] xinetd/inetd RPC 서비스 설정 확인
    local found_config=0

    # xinetd.d 디렉토리 확인
    if [ -d /etc/xinetd.d ]; then
        for service_info in "${VULNERABLE_RPC_SERVICES[@]}"; do
            local service=$(echo "$service_info" | cut -d':' -f1)
            local description=$(echo "$service_info" | cut -d':' -f2)
            local config_file="/etc/xinetd.d/$service"

            if [ -f "$config_file" ]; then
                ((TOTAL_CHECKED++))
                found_config=1

                local disable_status=$(grep -i "disable" "$config_file" | grep -v "^#" | awk '{print $3}')

                if [ "$disable_status" = "no" ]; then
                    ((VULNERABLE_COUNT++))
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - xinetd 활성화 - 위협: $description\"}")
                else
                    DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - xinetd 비활성화\"}")
                fi
            fi
        done
    fi

    # inetd.conf 확인
    if [ -f /etc/inetd.conf ]; then
        for service_info in "${VULNERABLE_RPC_SERVICES[@]}"; do
            local service=$(echo "$service_info" | cut -d':' -f1)
            local description=$(echo "$service_info" | cut -d':' -f2)

            if grep "^[^#]*${service}" /etc/inetd.conf > /dev/null 2>&1; then
                ((TOTAL_CHECKED++))
                ((VULNERABLE_COUNT++))
                found_config=1
                IS_VULN=1

                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - inetd.conf 활성화 - 위협: $description\"}")
            fi
        done
    fi

    if [ $found_config -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: xinetd/inetd 설정에 취약 서비스 없음\"}")
    fi

    # [점검 4] systemd RPC 서비스 확인
    local found_service=0

    for service_info in "${VULNERABLE_RPC_SERVICES[@]}"; do
        local service=$(echo "$service_info" | cut -d':' -f1)
        local description=$(echo "$service_info" | cut -d':' -f2)

        if systemctl list-unit-files "$service" 2>/dev/null | grep -q "$service"; then
            ((TOTAL_CHECKED++))
            found_service=1

            local active_status=$(systemctl is-active "$service" 2>/dev/null)

            if [ "$active_status" = "active" ]; then
                ((VULNERABLE_COUNT++))
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - systemd 실행 중 - 위협: $description\"}")
            else
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - systemd 비활성화\"}")
            fi
        fi
    done

    if [ $found_service -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"RPC 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: systemd에 취약 RPC 서비스 없음\"}")
    fi

    # [점검 5] rpcbind 서비스 상태 확인
    ((TOTAL_CHECKED++))

    if systemctl is-active rpcbind > /dev/null 2>&1 || pgrep rpcbind > /dev/null 2>&1; then
        :
        ## DETAILS_ARRAY+=("\"양호(주의): rpcbind - 실행 중 (RPC 서비스 사용 위해 필요하나 취약점 주의)\"")
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"DNS 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: rpcbind - 비활성화\"}")
        ((SECURE_COUNT++))
    fi

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="RPC 관련 서비스 없음"
        ## DETAILS_ARRAY+=("\": RPC 관련 서비스가 설치되지 않았습니다.\"")
    elif [ $VULNERABLE_COUNT -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 항목 모두 안전"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 중 취약 ${VULNERABLE_COUNT}개, 안전 ${SECURE_COUNT}개"
    fi
    
    
    
    if [ $IS_VULN -eq 1 ]; then
        # 취약이 발견되었더라도 최종 상태를 MANUAL로 변경
        STATUS="MANUAL"
        CURRENT_VALUE="수동 점검 필요 "
        echo -e "${YELLOW}  => [수동점검] $CHECK_ID 사용자 수동 점검 및 조치 권장${NC}"
    else
        echo -e "${GREEN}  => [양호] $CHECK_ID 점검 기준 통과${NC}"
    fi

    # 배열을 JSON 형식으로 변환
    local DETAILS_JSON=$(Build_Details_JSON)

    # 공통 함수 호출
    Write_JSON_Result "$CHECK_ID" "$CATEGORY" "$DESCRIPTION" "$STATUS" "$CURRENT_VAL" "$EXPECTED_VAL" "$DETAILS_JSON"
}
echo "점검 시작 (단일 항목: U-42)..."
U-42

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
