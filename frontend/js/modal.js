// Show Detail Modal
function showDetail(ip) {
    const server = targetServers.find(s => s.ip === ip);
    if (!server) return;

    currentTargetIP = ip;
    currentModalSortColumn = 'code';
    currentModalSortDirection = 'asc';

    document.getElementById('modalTargetTitle').textContent = `${server.hostname} (${server.ip})`;

    // 회귀 취약점이 있으면 상단에 목록 표시
    const regressionInfoEl = document.getElementById('modalRegressionInfo');
    const codes = server.regressionCodes || [];
    if (codes.length > 0) {
        regressionInfoEl.style.display = 'block';
        regressionInfoEl.innerHTML = '<strong>⚠️ 이 서버의 회귀 취약점 (' + codes.length + '개):</strong> ' + codes.join(', ') + ' — 아래 표에서 해당 항목에 <span class="badge warning">회귀</span> 배지가 표시됩니다.';
    } else {
        regressionInfoEl.style.display = 'none';
        regressionInfoEl.innerHTML = '';
    }

    renderModalTable();

    // 조치 보고서 버튼은 진단 후 조치(전체/개별)를 실행한 서버만 표시
    const remediationBtn = document.getElementById('modalRemediationReportBtn');
    if (remediationBtn) {
        remediationBtn.style.display = (server.diagnosed && server.remediated) ? 'inline-flex' : 'none';
    }

    document.getElementById('detailModal').classList.add('active');
}

// 모달 테이블 렌더링 (로그 상세 포함)
function renderModalTable() {
    const server = targetServers.find(s => s.ip === currentTargetIP);
    if (!server) return;

    const tbody = document.getElementById('modalVulnTableBody');
    tbody.innerHTML = '';

    // 취약점 배열 복사 후 정렬
    const sortedVulnerabilities = [...server.vulnerabilities].sort((a, b) => {
        let aVal, bVal;

        switch (currentModalSortColumn) {
            case 'code':
                aVal = parseInt(a.code.replace('U-', ''));
                bVal = parseInt(b.code.replace('U-', ''));
                break;
            case 'name':
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
                break;
            case 'category':
                aVal = a.category.toLowerCase();
                bVal = b.category.toLowerCase();
                break;
            case 'severity':
                const severityOrder = { 'high': 2, 'medium': 1, 'low': 0 };
                aVal = severityOrder[a.severity] || 0;
                bVal = severityOrder[b.severity] || 0;
                break;
            case 'status':
                // result.json 의 status 기준 정렬
                const statusOrder = { 'manual': 3, 'vulnerable': 2, 'not-scanned': 1, 'safe': 0, 'fixed': 0, 'checking': 1 };
                aVal = statusOrder[(a.status || '').toLowerCase()] ?? 0;
                bVal = statusOrder[(b.status || '').toLowerCase()] ?? 0;
                break;
            default:
                return 0;
        }

        if (aVal < bVal) return currentModalSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentModalSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const regressionSet = new Set(server.regressionCodes || []);
    sortedVulnerabilities.forEach((vuln, index) => {
        const isRegression = regressionSet.has(vuln.code);
        const statusLower = (vuln.status || '').toLowerCase();
        // 상태 뱃지: result.json status 기준
        let statusClass = 'success';
        let statusLabel = '정상';
        if (isRegression) {
            statusClass = 'warning';
            statusLabel = '회귀';
        } else if (statusLower === 'manual') {
            statusClass = 'positive';
            statusLabel = '수동 조치 필요';
        } else if (statusLower === 'vulnerable') {
            statusClass = 'danger';
            statusLabel = '취약';
        }
        const statusBadge = '<span class="badge ' + statusClass + '">' + statusLabel + '</span>';

        const isAlreadySafe = statusLower === 'safe' || statusLower === 'fixed';
        const actionLabel = statusLower === 'fixed' ? '조치완료' : (statusLower === 'safe' ? '정상' : '조치하기');
        // result.json 이 MANUAL 인 항목만 처음부터 "수동 조치 필요"로 비활성화
        const actionButton = statusLower === 'manual'
            ? '<button class="action-btn" style="background: #78716c; color: white; cursor: not-allowed;" disabled title="수동 조치만 가능한 항목입니다. 매뉴얼에 따라 조치하세요.">수동 조치 필요</button>'
            : '<button class="action-btn primary" ' + (isAlreadySafe ? 'disabled' : '') + ' onclick="fixVulnerabilityInModal(\'' + vuln.code + '\')">' + actionLabel + '</button>';
        // 취약점 행
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="code-badge">${vuln.code}</span></td>
            <td>${vuln.name}</td>
            <td><span class="badge" style="background: #bae7e4; color: #354a52;">${vuln.category}</span></td>
            <td><span class="badge ${vuln.severity === 'high' ? 'danger' : 'warning'}">${vuln.severity === 'high' ? '높음' : '중간'}</span></td>
            <td>${statusBadge}</td>
            <td>
                <button class="action-btn" style="background: #6366f1; color: white; padding: 4px 10px; font-size: 12px;" onclick="toggleVulnDetail(${index})">
                    상세 로그
                </button>
            </td>
            <td>${actionButton}</td>
        `;
        tbody.appendChild(row);

        // 로그 상세 행 (숨김 상태로 시작)
        const detailRow = document.createElement('tr');
        detailRow.id = `vuln-detail-${index}`;
        detailRow.style.display = 'none';
        detailRow.innerHTML = `
            <td colspan="7" style="padding: 0; background: var(--bg-primary);">
                <div style="padding: 20px; border-top: 2px solid var(--primary);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; margin: 0;">
                            <span style="background: var(--primary); color: white; padding: 4px 12px; border-radius: 6px; font-size: 14px;">${vuln.code}</span>
                            <span>${vuln.name}</span>
                        </h3>
                        <button class="btn btn-secondary" style="padding: 6px 14px; font-size: 13px;" onclick="toggleVulnDetail(${index})">닫기</button>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div style="background: white; padding: 12px; border-radius: 8px; border-left: 3px solid var(--danger);">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;">현재 상태</div>
                            <div style="font-size: 14px; font-weight: 600; color: var(--danger);">${vuln.current_value || '알 수 없음'}</div>
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 8px; border-left: 3px solid var(--success);">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;">권장 설정</div>
                            <div style="font-size: 14px; font-weight: 600; color: var(--success);">${vuln.expected_value || '권장 설정 없음'}</div>
                        </div>
                    </div>

                    ${(() => {
                        const split = splitDetailsForModal(vuln.details);
                        let html = '';
                        if (split.before && split.before.length > 0) {
                            html += '<div style="margin-bottom: 16px;"><div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">진단 상세 (조치 전)</div><div style="background: #0f172a; border-radius: 8px; padding: 16px; max-height: 240px; overflow-y: auto;"><div style="color: #94a3b8; font-family: \'SF Mono\', Monaco, \'Courier New\', monospace; font-size: 13px; line-height: 1.7;">' + generateLogHTML(split.before) + '</div></div></div>';
                        }
                        if (split.after && split.after.length > 0) {
                            html += '<div><div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">조치 내역</div><div style="background: #0f172a; border-radius: 8px; padding: 16px; max-height: 240px; overflow-y: auto;"><div style="color: #94a3b8; font-family: \'SF Mono\', Monaco, \'Courier New\', monospace; font-size: 13px; line-height: 1.7;">' + generateLogHTML(split.after) + '</div></div></div>';
                        }
                        if (!html) {
                            html = '<div style="background: #0f172a; border-radius: 8px; padding: 16px; max-height: 300px; overflow-y: auto;"><div style="color: #64748b; font-size: 13px;">데이터가 없습니다.</div></div>';
                        }
                        return html;
                    })()}
                </div>
            </td>
        `;
        tbody.appendChild(detailRow);
    });
}

// Close Detail Modal
function closeDetailModal() {
    // 열려있는 로그 패널 모두 닫기
    document.querySelectorAll('[id^="vuln-detail-"]').forEach(row => {
        row.style.display = 'none';
    });
    document.getElementById('detailModal').classList.remove('active');
    currentTargetIP = null;
}

// Fix Vulnerability in Modal
async function fixVulnerabilityInModal(code) {
    const server = targetServers.find(s => s.ip === currentTargetIP);
    if (!server || !server.analysis_id) {
        alert('서버를 찾을 수 없거나 진단 결과가 없습니다.');
        return;
    }

    addLog(`${server.ip}: ${code} 조치 시작`, 'info');
    showProgress('🔧', '조치 진행 중', '취약점을 해결하고 있습니다', 20);

    try {
        updateProgress(40, '조치 스크립트 실행 중...');

        const response = await apiCall('/api/remediation/apply', 'POST', {
            analysis_id: server.analysis_id,
            code: code,
            auto_backup: true,
        });

        updateProgress(80, '결과 반영 중...');

        const hasFailed = response.failed_codes && response.failed_codes.length > 0;
        if (!hasFailed) {
            server.vulnerabilities = response.vulnerabilities || [];
            server.vulnCount = countIssuesFromVulns(server.vulnerabilities);
            server.remediated = true;
            window.remediationReportAvailable = true;
            window.lastRemediatedHostnames = window.lastRemediatedHostnames || [];
            const hn = server.hostname || server.ip;
            if (!window.lastRemediatedHostnames.includes(hn)) {
                window.lastRemediatedHostnames = [...window.lastRemediatedHostnames, hn];
            }
            const remediationReportBtn = document.getElementById('remediationReportBtn');
            if (remediationReportBtn) remediationReportBtn.style.display = 'inline-flex';
            const remExcelBtn = document.getElementById('remediationIndividualsExcelBtn');
            if (remExcelBtn) remExcelBtn.style.display = 'inline-flex';
        }

        showDetail(currentTargetIP);
        renderTargetTable();
        updateStats();

        updateProgress(100, '완료!');

        setTimeout(() => {
            closeProgress();
            if (response.failed_codes && response.failed_codes.length > 0) {
                response.failed_codes.forEach(f => addLog(`${server.ip}: ${f.code} 조치 미반영 - ${f.reason}`, 'warning'));
                addLog(`${server.ip}: ${code} 스크립트 실행됐으나 서버에 반영되지 않음`, 'warning');
            } else {
                addLog(`${server.ip}: ${code} 조치 완료`, 'success');
            }
            if (response.manual_required && response.manual_required.length > 0) {
                addLog(`${server.ip}: 수동 조치 필요 - ${response.manual_required.join(', ')}`, 'warning');
            }
        }, 500);
    } catch (error) {
        showProgressError('조치 실패', error.message);
        addLog(`조치 실패: ${error.message}`, 'error');
    }
}

// Fix All Vulnerabilities in Modal
async function fixAllVulnerabilitiesInModal() {
    const server = targetServers.find(s => s.ip === currentTargetIP);
    if (!server || !server.analysis_id) {
        alert('서버를 찾을 수 없거나 진단 결과가 없습니다.');
        return;
    }

    const vulnCount = server.vulnerabilities.filter(v => v.status === 'vulnerable').length;

    if (vulnCount === 0) {
        alert('조치할 취약점이 없습니다.');
        return;
    }

    const codes = server.vulnerabilities
        .filter(v => v.status === 'vulnerable')
        .map(v => v.code);

    addLog(`${server.ip}: 전체 조치 시작`, 'info');
    showProgress('🔧', '일괄 조치 중', '모든 취약점을 해결하고 있습니다', 15);

    try {
        updateProgress(30, `${vulnCount}개 취약점 조치 중...`);

        const response = await apiCall('/api/remediation/bulk', 'POST', {
            analysis_id: server.analysis_id,
            codes: codes,
            auto_backup: true,
        });

        updateProgress(80, '결과 반영 중...');

        // 항상 response.vulnerabilities로 갱신 (일부 실패해도 성공한 항목은 반영됨)
        if (response.vulnerabilities && response.vulnerabilities.length > 0) {
            server.vulnerabilities = response.vulnerabilities;
            server.vulnCount = countIssuesFromVulns(server.vulnerabilities);
            server.hasRegression = false;
        }
        // 조치가 실행됐으면(completed/completed_with_failures) server.remediated = true → 모달/메인 조치 보고서 버튼 표시
        const hasFailed = response.failed_codes && response.failed_codes.length > 0;
        server.remediated = true;
        window.remediationReportAvailable = true;
        window.lastRemediatedHostnames = window.lastRemediatedHostnames || [];
        const hn = server.hostname || server.ip;
        if (!window.lastRemediatedHostnames.includes(hn)) {
            window.lastRemediatedHostnames = [...window.lastRemediatedHostnames, hn];
        }
        const remediationReportBtn = document.getElementById('remediationReportBtn');
        if (remediationReportBtn) remediationReportBtn.style.display = 'inline-flex';
        const remExcelBtn = document.getElementById('remediationIndividualsExcelBtn');
        if (remExcelBtn) remExcelBtn.style.display = 'inline-flex';

        showDetail(currentTargetIP);
        renderTargetTable();
        updateStats();

        updateProgress(100, '완료!');

        setTimeout(() => {
            closeProgress();
            if (response.failed_codes && response.failed_codes.length > 0) {
                response.failed_codes.forEach(f => addLog(`${server.ip}: ${f.code} 조치 미반영 - ${f.reason}`, 'warning'));
                addLog(`${server.ip}: 일부 항목 조치 미반영 (스크립트 실행됐으나 서버 반영 안 됨)`, 'warning');
                const msg = response.failed_codes.map(f => `${f.code}: ${f.reason}`).join('\n\n');
                alert(`조치 실패\n\n다음 항목은 서버에 반영되지 않았습니다:\n\n${msg}`);
            } else {
                addLog(`${server.ip}: 전체 조치 완료`, 'success');
            }
            if (response.manual_required && response.manual_required.length > 0) {
                addLog(`${server.ip}: 수동 조치 필요 - ${response.manual_required.join(', ')}`, 'warning');
            }
        }, 500);
    } catch (error) {
        showProgressError('조치 실패', error.message);
        addLog(`조치 실패: ${error.message}`, 'error');
    }
}
