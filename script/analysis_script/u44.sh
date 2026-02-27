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



######################################################################################################################
# ----------------------------------------------------------
# 함수명: U-44
# 설명: tftp, talk, ntalk 서비스 비활성화 점검
# ----------------------------------------------------------
function U-44() {
    local CHECK_ID="U-44"
    local CATEGORY="서비스 관리"
    local DESCRIPTION="tftp, talk, 서비스 비활성화"
    local EXPECTED_VAL="tftp, talk, ntalk 서비스가 비활성화된 경우"

    local STATUS="SAFE"
    local CURRENT_VAL=""
    local DETAILS_ARRAY=()
    local IS_VULN=0

    local TOTAL_CHECKED=0
    local VULNERABLE_COUNT=0
    local SECURE_COUNT=0
    
    echo  "${BLUE}[Checking] $CHECK_ID. $DESCRIPTION...${NC}"

    # OS 감지
    local os_type=""
    if [ -f /etc/redhat-release ]; then
        os_type="rocky"
    elif [ -f /etc/lsb-release ] || [ -f /etc/debian_version ]; then
        os_type="ubuntu"
    else
        os_type="unknown"
    fi

    # TFTP 관련 서비스
    local TFTP_SERVICES_ROCKY=(
        "tftp.socket:TFTP 소켓"
        "tftp.service:TFTP 서비스"
        "tftp-server:TFTP 서버"
    )

    local TFTP_SERVICES_UBUNTU=(
        "tftpd-hpa:TFTP 서버 (HPA)"
        "atftpd:Advanced TFTP 서버"
        "tftp:TFTP 서비스"
    )

    # Talk 관련 서비스
    local TALK_SERVICES=(
        "talk:Talk 서비스"
        "ntalk:New Talk 서비스"
        "talkd:Talk 데몬"
    )

    # [점검 1] TFTP systemd 서비스 확인
    local services_to_check=()
    if [ "$os_type" = "rocky" ]; then
        services_to_check=("${TFTP_SERVICES_ROCKY[@]}")
    elif [ "$os_type" = "ubuntu" ]; then
        services_to_check=("${TFTP_SERVICES_UBUNTU[@]}")
    else
        services_to_check=("${TFTP_SERVICES_ROCKY[@]}" "${TFTP_SERVICES_UBUNTU[@]}")
    fi

    local tftp_found=0

    for service_info in "${services_to_check[@]}"; do
        local service=$(echo "$service_info" | cut -d':' -f1)
        local description=$(echo "$service_info" | cut -d':' -f2)

        if systemctl list-unit-files "$service" 2>/dev/null | grep -q "$service"; then
            ((TOTAL_CHECKED++))
            tftp_found=1

            local active_status=$(systemctl is-active "$service" 2>/dev/null)
            local enabled_status=$(systemctl is-enabled "$service" 2>/dev/null)

            if [ "$active_status" = "active" ]; then
                ((VULNERABLE_COUNT++))
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service ($description) - 실행 중 (Active=$active_status, Enabled=$enabled_status)\"}")
            else
                ((SECURE_COUNT++))
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - 비활성화\"}")
            fi
        fi
    done

    if [ $tftp_found -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: TFTP systemd 서비스 없음\"}")
    fi

    # [점검 2] Talk/ntalk systemd 서비스 확인
    local talk_found=0

    for service_info in "${TALK_SERVICES[@]}"; do
        local service=$(echo "$service_info" | cut -d':' -f1)
        local description=$(echo "$service_info" | cut -d':' -f2)

        if systemctl list-unit-files "$service" 2>/dev/null | grep -q "$service"; then
            ((TOTAL_CHECKED++))
            talk_found=1

            local active_status=$(systemctl is-active "$service" 2>/dev/null)
            local enabled_status=$(systemctl is-enabled "$service" 2>/dev/null)

            if [ "$active_status" = "active" ]; then
                ((VULNERABLE_COUNT++))
                IS_VULN=1
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"취약\",\"세부내용\":\"취약: $service ($description) - 실행 중 (Active=$active_status, Enabled=$enabled_status)\"}")
            else
                ((SECURE_COUNT++))
                DETAILS_ARRAY+=("{\"점검항목\":\"$service\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - 비활성화\"}")
            fi
        fi
    done

    if [ $talk_found -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"Talk/ntalk\",\"상태\":\"양호\",\"세부내용\":\"양호: Talk/ntalk systemd 서비스 없음\"}")
    fi

    # [점검 3] TFTP 프로세스 확인
    local tftp_procs=$(ps aux | grep -E 'tftpd|tftp-server|in.tftpd' | grep -v grep)

    if [ -n "$tftp_procs" ]; then
        ((TOTAL_CHECKED++))
        ((VULNERABLE_COUNT++))
        IS_VULN=1

        local proc_count=$(echo "$tftp_procs" | wc -l)
        DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"취약\",\"세부내용\":\"취약: TFTP 프로세스 ${proc_count}개 실행 중\"}")

        echo "$tftp_procs" | while IFS= read -r proc; do
            local proc_pid=$(echo "$proc" | awk '{print $2}')
            local proc_name=$(echo "$proc" | awk '{print $11}')
        done
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: TFTP 프로세스 없음\"}")
    fi

    # [점검 4] Talk 프로세스 확인
    local talk_procs=$(ps aux | grep -E 'talkd|ntalkd|in.talkd|in.ntalkd' | grep -v grep)

    if [ -n "$talk_procs" ]; then
        ((TOTAL_CHECKED++))
        ((VULNERABLE_COUNT++))
        IS_VULN=1

        local proc_count=$(echo "$talk_procs" | wc -l)
        DETAILS_ARRAY+=("{\"점검항목\":\"Talk/ntalk\",\"상태\":\"취약\",\"세부내용\":\"취약: Talk/ntalk 프로세스 ${proc_count}개 실행 중\"}")

        echo "$talk_procs" | while IFS= read -r proc; do
            local proc_pid=$(echo "$proc" | awk '{print $2}')
            local proc_name=$(echo "$proc" | awk '{print $11}')
        done
    else
        DETAILS_ARRAY+=("{\"점검항목\":\"Talk/ntalk\",\"상태\":\"양호\",\"세부내용\":\"양호: Talk/ntalk 프로세스 없음\"}")
    fi

    # [점검 5] xinetd 설정 확인
    if [ ! -d /etc/xinetd.d ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: xinetd 미설치\"}")
    else
        local services=("tftp" "talk" "ntalk")
        local found_config=0

        for service in "${services[@]}"; do
            if [ -f "/etc/xinetd.d/$service" ]; then
                ((TOTAL_CHECKED++))
                found_config=1

                local disable_status=$(grep -i "disable" "/etc/xinetd.d/$service" | grep -v "^#" | awk '{print $3}')

                if [ "$disable_status" = "no" ]; then
                    ((VULNERABLE_COUNT++))
                    IS_VULN=1
                    DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"취약\",\"세부내용\":\"취약: $service - xinetd 활성화 (disable = no)\"}")
                else
                    ((SECURE_COUNT++))
                    DETAILS_ARRAY+=("{\"점검항목\":\"xinetd 설정\",\"상태\":\"양호\",\"세부내용\":\"양호: $service - xinetd 비활성화\"}")
                fi
            fi
        done

        if [ $found_config -eq 0 ]; then
            DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: xinetd에 tftp/talk 설정 없음\"}")
        fi
    fi

    # [점검 6] 포트 리스닝 확인
    local ports=("69:TFTP" "517:Talk" "518:ntalk")
    local found_listening=0

    for port_info in "${ports[@]}"; do
        local port=$(echo "$port_info" | cut -d':' -f1)
        local service=$(echo "$port_info" | cut -d':' -f2)

        if ss -tuln 2>/dev/null | grep -q ":${port} "; then
            ((TOTAL_CHECKED++))
            ((VULNERABLE_COUNT++))
            found_listening=1
            IS_VULN=1

            local protocol=$(ss -tuln 2>/dev/null | grep ":${port} " | awk '{print $1}' | head -1)
            local address=$(ss -tuln 2>/dev/null | grep ":${port} " | awk '{print $5}' | head -1)

            DETAILS_ARRAY+=("{\"점검항목\":\"설정 점검\",\"상태\":\"취약\",\"세부내용\":\"취약: 포트 $port/$protocol - $service 리스닝 중 ($address)\"}")
        fi
    done

    if [ $found_listening -eq 0 ]; then
        DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: TFTP/Talk 포트 리스닝 없음\"}")
    fi

    # [점검 7] 패키지 설치 여부 확인
    local packages=()
    if [ "$os_type" = "rocky" ]; then
        packages=("tftp-server" "tftp" "talk" "talk-server")
    elif [ "$os_type" = "ubuntu" ]; then
        packages=("tftpd-hpa" "atftpd" "tftp" "talk" "talkd")
    fi

    for pkg in "${packages[@]}"; do
        local installed=""

        if [ "$os_type" = "rocky" ]; then
            installed=$(rpm -qa | grep "^${pkg}-")
        elif [ "$os_type" = "ubuntu" ]; then
            installed=$(dpkg -l | grep "^ii" | grep "$pkg" | awk '{print $2}')
        fi

        if [ -n "$installed" ]; then
           :
           ## DETAILS_ARRAY+=("\"양호(주의): $pkg 패키지 설치됨\"")
        fi
    done

    # 최종 상태 및 현재 값 설정
    if [ $TOTAL_CHECKED -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="tftp/talk/ntalk 관련 서비스 및 설정 없음"
        ## DETAILS_ARRAY+=("{\"점검항목\":\"TFTP 서비스\",\"상태\":\"양호\",\"세부내용\":\"양호: tftp/talk/ntalk 관련 항목이 없습니다.\"}")
    elif [ $VULNERABLE_COUNT -eq 0 ]; then
        STATUS="SAFE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 항목 모두 안전"
    else
        STATUS="VULNERABLE"
        CURRENT_VAL="총 ${TOTAL_CHECKED}개 중 취약 ${VULNERABLE_COUNT}개, 안전 ${SECURE_COUNT}개"
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
echo "점검 시작 (단일 항목: U-44)..."
U-44

# JSON 배열 닫기
echo "]" >> "$RESULT_JSON"

echo "점검 완료: $RESULT_JSON"

exit 0
