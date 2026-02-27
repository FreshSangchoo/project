// ===============================
// 공통 보고서 다운로드 (PDF / CSV / JSON)
// format: 'pdf' | 'csv' | 'json' (미지정 시 pdf)
// ===============================
function _reportUrl(endpoint, format) {
    const sep = endpoint.indexOf('?') >= 0 ? '&' : '?';
    if (format === 'csv' || format === 'json') {
        return `${API_BASE_URL}${endpoint}${sep}format=${format}`;
    }
    return `${API_BASE_URL}${endpoint}`;
}

async function downloadReport(endpoint, filename, format) {
    format = format || 'pdf';
    const url = _reportUrl(endpoint, format);
    console.log(`[Report] 다운로드: ${format.toUpperCase()} ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`${format.toUpperCase()} 생성 실패: ${errorText}`);
    }

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
}

/** @deprecated PDF 전용 - downloadReport(endpoint, filename, 'pdf') 사용 */
async function downloadPDF(endpoint, filename) {
    return downloadReport(endpoint, filename, 'pdf');
}


// ===============================
// 보고서 형식 선택 모달 (전체/개별 진단·조치 각각)
// type: 'diagnosis' | 'remediation' (전체) | 'server_diagnosis' | 'server_remediation' (개별)
// ip: 개별 서버일 때만 사용
// ===============================
function openReportFormatModal(type, ip) {
    window.pendingReportType = type;
    window.pendingReportIp = ip || null;
    const titles = {
        diagnosis: '전체 진단 보고서 - 형식 선택',
        remediation: '전체 조치 보고서 - 형식 선택',
        server_diagnosis: '진단 보고서 - 형식 선택',
        server_remediation: '조치 보고서 - 형식 선택',
    };
    const titleEl = document.getElementById('reportFormatModalTitle');
    if (titleEl) titleEl.textContent = titles[type] || '보고서 형식 선택';
    const modal = document.getElementById('reportFormatModal');
    if (modal) modal.classList.add('active');
}

function closeReportFormatModal() {
    window.pendingReportType = null;
    window.pendingReportIp = null;
    const modal = document.getElementById('reportFormatModal');
    if (modal) modal.classList.remove('active');
}

function selectReportFormat(format) {
    const type = window.pendingReportType;
    const ip = window.pendingReportIp;
    closeReportFormatModal();
    if (!type) return;
    if (type === 'diagnosis') {
        generateGlobalDiagnosisReport(format);
    } else if (type === 'remediation') {
        generateGlobalRemediationReport(format);
    } else if (type === 'server_diagnosis' && ip) {
        generateServerDiagnosisReport(ip, format);
    } else if (type === 'server_remediation' && ip) {
        generateServerRemediationReport(ip, format);
    }
}


// ===============================
// 1. 개별 서버 진단 보고서 (PDF / CSV / JSON)
// GET /reports/analysis/server/{hostname}?format=pdf|csv|json
// ===============================
async function generateServerDiagnosisReport(ip, format) {
    format = format || 'pdf';
    const server = targetServers.find(s => s.ip === ip);

    if (!server || !server.diagnosed) {
        alert('진단을 먼저 실행해주세요.');
        return;
    }

    const ext = { pdf: 'pdf', csv: 'csv', json: 'json' }[format] || 'pdf';
    const label = { pdf: '진단 보고서', csv: 'CSV', json: 'JSON' }[format];
    addLog(`${server.ip} ${label} 생성 중`, 'info');
    showProgress('📄', `${label} 생성 중`, '서버 취약점 진단 결과를 정리하고 있습니다', 20);

    try {
        updateProgress(60, `${format.toUpperCase()} 생성 중...`);

        await downloadReport(
            `/reports/analysis/server/${server.hostname}`,
            `analysis_${server.hostname}.${ext}`,
            format
        );

        updateProgress(100, '완료!');
        setTimeout(() => {
            closeProgress();
            addLog(`${server.ip} ${label} 생성 완료`, 'success');
        }, 500);
    } catch (error) {
        showProgressError(`${label} 생성 실패`, error.message);
        addLog(`${label} 생성 실패: ${error.message}`, 'error');
    }
}


// ===============================
// 2. 개별 서버 조치 보고서
// GET /reports/remediation/server/{hostname}
// ===============================
async function generateServerRemediationReport(ip, format) {
    format = format || 'pdf';
    const server = targetServers.find(s => s.ip === ip);

    if (!server || !server.diagnosed) {
        alert('진단을 먼저 실행해주세요.');
        return;
    }

    const ext = { pdf: 'pdf', csv: 'csv', json: 'json' }[format] || 'pdf';
    const label = { pdf: '조치 보고서', csv: 'CSV', json: 'JSON' }[format];
    addLog(`${server.ip} ${label} 생성 중`, 'info');
    showProgress('📋', `${label} 생성 중`, '취약점 조치 내역을 정리하고 있습니다', 20);

    try {
        updateProgress(60, `${format.toUpperCase()} 생성 중...`);

        await downloadReport(
            `/reports/remediation/server/${server.hostname}`,
            format === 'pdf' ? `AUTOISMS 개별 조치 보고서_${server.hostname}.pdf` : `remediation_${server.hostname}.${ext}`,
            format
        );

        updateProgress(100, '완료!');

        setTimeout(() => {
            closeProgress();
            addLog(`${server.ip} ${label} 생성 완료`, 'success');
        }, 500);

    } catch (error) {
        showProgressError(`${label} 생성 실패`, error.message);
        addLog(`${label} 생성 실패: ${error.message}`, 'error');
    }
}


// ===============================
// 3. 전체 진단 보고서 (PDF / CSV / JSON)
// GET /reports/analysis/global?format=pdf|csv|json
// ===============================
async function generateGlobalDiagnosisReport(format) {
    format = format || 'pdf';
    const diagnosedServers = targetServers.filter(s => s.diagnosed);

    if (diagnosedServers.length === 0) {
        alert('진단된 서버가 없습니다.');
        return;
    }

    const ext = { pdf: 'pdf', csv: 'csv', json: 'json' }[format] || 'pdf';
    const label = { pdf: '전체 진단 보고서', csv: 'CSV', json: 'JSON' }[format];
    addLog(`${label} 생성 중`, 'info');
    showProgress('📄', `${label} 생성 중`, '모든 서버의 진단 결과를 종합하고 있습니다', 20);

    try {
        updateProgress(60, `${format.toUpperCase()} 생성 중...`);

        await downloadReport(
            `/reports/analysis/global`,
            `analysis_global_report.${ext}`,
            format
        );

        updateProgress(100, '완료!');
        setTimeout(() => {
            closeProgress();
            addLog(`${label} 생성 완료`, 'success');
        }, 500);
    } catch (error) {
        showProgressError(`${label} 생성 실패`, error.message);
        addLog(`${label} 생성 실패: ${error.message}`, 'error');
    }
}


// ===============================
// 개별 진단 보고서 전체 → Excel (시트별 타겟)
// GET /reports/analysis/individuals/excel
// ===============================
async function downloadDiagnosisIndividualsExcel() {
    const diagnosedServers = targetServers.filter(s => s.diagnosed);
    if (diagnosedServers.length === 0) {
        alert('진단된 서버가 없습니다.');
        return;
    }
    addLog('개별 진단 Excel 생성 중', 'info');
    showProgress('📊', 'Excel 생성 중', '각 서버별 시트로 정리하고 있습니다', 20);
    try {
        updateProgress(60, 'Excel 생성 중...');
        await downloadReport('/reports/analysis/individuals/excel', 'analysis_individuals.xlsx', 'xlsx');
        updateProgress(100, '완료!');
        setTimeout(() => {
            closeProgress();
            addLog('개별 진단 Excel 생성 완료', 'success');
        }, 500);
    } catch (error) {
        showProgressError('Excel 생성 실패', error.message);
        addLog(`개별 진단 Excel 생성 실패: ${error.message}`, 'error');
    }
}

// ===============================
// 개별 조치 보고서 전체 → Excel (시트별 타겟)
// GET /reports/remediation/individuals/excel
// ===============================
async function downloadRemediationIndividualsExcel() {
    const remediatedServers = targetServers.filter(s => s.diagnosed && s.remediated);
    if (remediatedServers.length === 0) {
        alert('조치한 서버가 없습니다.');
        return;
    }
    addLog('개별 조치 Excel 생성 중', 'info');
    showProgress('📊', 'Excel 생성 중', '각 서버별 시트로 정리하고 있습니다', 20);
    try {
        updateProgress(60, 'Excel 생성 중...');
        await downloadReport('/reports/remediation/individuals/excel', 'remediation_individuals.xlsx', 'xlsx');
        updateProgress(100, '완료!');
        setTimeout(() => {
            closeProgress();
            addLog('개별 조치 Excel 생성 완료', 'success');
        }, 500);
    } catch (error) {
        showProgressError('Excel 생성 실패', error.message);
        addLog(`개별 조치 Excel 생성 실패: ${error.message}`, 'error');
    }
}

// ===============================
// 4. 전체 조치 보고서
// GET /reports/remediation/global
// ===============================
async function generateGlobalRemediationReport(format) {
    format = format || 'pdf';
    const remediatedServers = targetServers.filter(s => s.diagnosed && s.remediated);

    if (remediatedServers.length === 0) {
        alert('조치한 서버가 없습니다.');
        return;
    }

    // 조치한 서버만 포함 (개별/전체 조치 후 저장된 목록이 있으면 사용)
    const hostnames = window.lastRemediatedHostnames && window.lastRemediatedHostnames.length > 0
        ? window.lastRemediatedHostnames
        : remediatedServers.map(s => s.hostname || s.ip);
    const hostnamesParam = hostnames.length ? `?hostnames=${encodeURIComponent(hostnames.join(','))}` : '';

    const ext = { pdf: 'pdf', csv: 'csv', json: 'json' }[format] || 'pdf';
    const label = { pdf: '전체 조치 보고서', csv: 'CSV', json: 'JSON' }[format];
    addLog(`${label} 생성 중`, 'info');
    showProgress('📋', `${label} 생성 중`, '조치한 서버의 조치 내역을 종합하고 있습니다', 20);

    try {
        updateProgress(60, `${format.toUpperCase()} 생성 중...`);

        await downloadReport(
            `/reports/remediation/global${hostnamesParam}`,
            `remediation_global_report.${ext}`,
            format
        );

        updateProgress(100, '완료!');

        setTimeout(() => {
            closeProgress();
            addLog(`${label} 생성 완료`, 'success');
        }, 500);

    } catch (error) {
        showProgressError(`${label} 생성 실패`, error.message);
        addLog(`${label} 생성 실패: ${error.message}`, 'error');
    }
}
