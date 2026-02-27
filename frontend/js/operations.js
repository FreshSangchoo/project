// 전체 조치 이후에만 조치 보고서 버튼 활성화용 (전체 진단만으로는 비활성 유지)
window.remediationReportAvailable = false;

// 수동조치 포함 "위험 항목" 개수 계산 (취약 + 기타)
function countIssuesFromVulns(vulns) {
    if (!Array.isArray(vulns)) return 0;
    return vulns.filter(v => {
        const status = (v.status || '').toLowerCase();
        // result.json 기준: 취약(VULNERABLE) + 수동조치(MANUAL)만 위험 항목으로 본다.
        return status === 'vulnerable' || status === 'manual';
    }).length;
}

// Load Inventory
async function loadInventory() {
    addLog('Ansible Inventory 탐색 시작', 'info');
    showProgress('🗂️', 'Inventory 확인 중', 'Ansible 설정 파일을 분석하고 있습니다', 10);

    try {
        console.log('[DEBUG] API 호출 시작');
        updateProgress(30, 'Ansible 서버에 연결 중...');

        const response = await apiCall('/api/inventory/load', 'GET');
        console.log('[DEBUG] API 응답 받음:', response);

        updateProgress(60, '서버 목록 파싱 중...');

        if (!response || !response.servers) {
            throw new Error('서버 목록을 받지 못했습니다');
        }

        console.log('[DEBUG] 서버 개수:', response.servers.length);

        targetServers = response.servers.map(server => ({
            ip: server.ip,
            hostname: server.hostname,
            connected: server.connected,
            server_id: server.server_id,
            vulnerabilities: server.vulnerabilities || [],
            vulnCount: server.vuln_count || 0,
            diagnosed: server.diagnosed || false,
            remediated: false,
            hasRegression: server.has_regression || false,
            regressionCodes: server.regression_codes || [],
            analysis_id: server.analysis_id,
        }));

        console.log('[DEBUG] targetServers 변환 완료:', targetServers.length);

        updateProgress(80, '데이터 렌더링 중...');

        // 등록된 서버(server_id 있음)에 대해 연결 상태 재확인 → 로드 시점 일시 실패로 끊김으로 나온 서버 보정
        const serverIdsToCheck = targetServers.filter(s => s.server_id).map(s => s.server_id);
        if (serverIdsToCheck.length > 0) {
            try {
                updateProgress(85, '연결 상태 확인 중...');
                const connResponse = await apiCall('/api/servers/check-connections', 'POST', { server_ids: serverIdsToCheck });
                if (connResponse && Array.isArray(connResponse.results)) {
                    connResponse.results.forEach(r => {
                        const server = targetServers.find(s => s.server_id === r.server_id);
                        if (server) server.connected = r.connected === true;
                    });
                }
            } catch (e) {
                console.warn('[DEBUG] 연결 재확인 실패(무시):', e);
            }
        }

        console.log('[DEBUG] renderTargetTable 시작');
        renderTargetTable();
        console.log('[DEBUG] renderTargetTable 완료');

        console.log('[DEBUG] updateStats 시작');
        updateStats();
        console.log('[DEBUG] updateStats 완료');

        updateProgress(100, '완료!');

        setTimeout(() => {
            console.log('[DEBUG] closeProgress 호출');
            closeProgress();

            console.log('[DEBUG] 페이지 전환 시작');
            document.getElementById('initialPage').classList.remove('active');
            document.getElementById('targetListPage').classList.add('active');
            console.log('[DEBUG] 페이지 전환 완료');

            addLog(`${targetServers.length}개 타겟 서버 발견`, 'success');
        }, 500);
    } catch (error) {
        console.error('[ERROR] loadInventory 실패:', error);
        showProgressError('Inventory 로드 실패', error.message);
        addLog(`Inventory 로드 실패: ${error.message}`, 'error');
    }
}

// Render Target Table
function renderTargetTable() {
    const tbody = document.getElementById('targetTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    targetServers.forEach((server, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="target-checkbox" data-index="${index}" onchange="updateSelectButtons()"></td>
            <td><span class="code-badge">${server.ip}</span></td>
            <td>${server.hostname}</td>
            <td>
                ${server.connected ?
                    '<span class="badge success">연결됨</span>' :
                    '<span class="badge danger">끊김</span>'
                }
            </td>
            <td>${server.diagnosed ? server.vulnCount : '-'}</td>
            <td>${(function() {
                if (!server.hasRegression) return '-';
                const codes = server.regressionCodes || [];
                if (codes.length) return '<span class="badge warning" title="회귀 항목: ' + codes.join(', ') + '">회귀 (' + codes.length + '개)</span>';
                return '<span class="badge warning">회귀</span>';
            })()}</td>
            <td class="actions-cell">
                <div class="action-btns">
                    <button class="action-btn primary" onclick="showDetail('${server.ip}')" ${!server.diagnosed ? 'disabled' : ''}>상세</button>
                    <button class="action-btn" style="background: #3b82f6; color: white;" onclick="openReportFormatModal('server_diagnosis', '${server.ip}')" ${!server.diagnosed ? 'disabled' : ''} title="진단 결과 보고서 (PDF/CSV/JSON 선택)">진단 보고서</button>
                    ${server.diagnosed ? (server.remediated ? '<button class="action-btn" style="background: #22c55e; color: white;" onclick="openReportFormatModal(\'server_remediation\', \'' + server.ip + '\')" title="조치 내역 보고서 (PDF/CSV/JSON 선택)">조치 보고서</button>' : '') + '<button class="action-btn action-btn-fix" onclick="fixServer(\'' + server.ip + '\')" ' + (!server.connected || !server.server_id || !server.analysis_id || !server.vulnCount ? 'disabled' : '') + ' title="이 서버만 전체 조치">🔧 ' + (server.hostname || server.ip) + ' 조치</button>' : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Toggle Select All
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.target-checkbox');

    checkboxes.forEach(cb => {
        const index = parseInt(cb.dataset.index);
        if (targetServers[index].connected) {
            cb.checked = selectAll.checked;
        }
    });

    updateSelectButtons();
}

// Update Select Buttons
function updateSelectButtons() {
    const checkboxes = document.querySelectorAll('.target-checkbox:checked');
    document.getElementById('diagnoseSelectedBtn').disabled = checkboxes.length === 0;
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn) deleteSelectedBtn.disabled = checkboxes.length === 0;
}

// Diagnose Selected
async function diagnoseSelected() {
    const checkboxes = document.querySelectorAll('.target-checkbox:checked');
    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));

    if (selectedIndices.length === 0) return;

    const selectedServers = selectedIndices.map(idx => targetServers[idx]);
    const serverIds = selectedServers
        .filter(s => s.server_id)
        .map(s => s.server_id);

    if (serverIds.length === 0) {
        alert('선택한 서버 중 등록된 서버가 없습니다. 인벤토리를 새로고침한 뒤 다시 시도하세요.');
        return;
    }

    addLog(`${serverIds.length}개 서버 진단 시작`, 'info');
    showProgress('🔍', '취약점 스캔 중', '선택된 서버를 분석하고 있습니다', 10);

    try {
        updateProgress(20, '서버 연결 중...');

        const response = await apiCall('/api/analysis/run-bulk', 'POST', {
            server_ids: serverIds,
            use_ansible: true,
        });

        updateProgress(70, '진단 결과 처리 중...');

        // 결과를 targetServers에 반영 (진단 성공 시 연결됨으로 갱신)
        response.results.forEach(result => {
            const server = targetServers.find(s => s.server_id === result.server_id);
            if (server && result.status === 'completed') {
                server.connected = true;
                server.vulnerabilities = result.vulnerabilities || [];
                server.vulnCount = countIssuesFromVulns(server.vulnerabilities) || result.vuln_count || 0;
                server.diagnosed = true;
                server.analysis_id = result.analysis_id;
                server.hasRegression = result.has_regression || false;
                server.regressionCodes = result.regression_codes || [];
                addLog(`${server.ip}: ${server.vulnCount}개 취약점 발견`, 'warning');
                if (server.hasRegression && server.regressionCodes.length > 0) {
                    addLog(`${server.ip}: 회귀 발견 - ${server.regressionCodes.join(', ')} (이전 양호→현재 취약)`, 'warning');
                }
            } else if (result.status === 'failed') {
                addLog(`${result.ip}: 진단 실패 - ${result.error}`, 'error');
            }
        });

        updateProgress(90, '화면 업데이트 중...');

        renderTargetTable();
        updateStats();

        currentSnapshot = 1;
        updateSnapshotBadge();

        document.getElementById('fixAllTargetsBtn').style.display = 'inline-flex';
        document.getElementById('diagnosisReportBtn').style.display = 'inline-flex';
        const diagExcelBtn = document.getElementById('diagnosisIndividualsExcelBtn');
        if (diagExcelBtn) diagExcelBtn.style.display = 'inline-flex';

        updateProgress(100, '완료!');

        setTimeout(() => {
            closeProgress();
            addLog('진단 완료', 'success');
        }, 500);
    } catch (error) {
        showProgressError('진단 실패', error.message);
        addLog(`진단 실패: ${error.message}`, 'error');
    }
}

// Diagnose All - 현재 인벤토리 기준 서버만 진단 (server_ids 생략 시 백엔드가 인벤토리 기준 사용)
async function diagnoseAll() {
    addLog('현재 인벤토리 기준 전체 진단 시작', 'info');
    showProgress('🔍', '전체 스캔 중', '인벤토리에 등록된 서버를 분석하고 있습니다', 10);

    try {
        updateProgress(20, '서버 연결 중...');

        // server_ids 생략 → 백엔드가 현재 인벤토리 기준으로 서버 목록 사용 (삭제된 서버 제외)
        const response = await apiCall('/api/analysis/run-bulk', 'POST', {
            use_ansible: true,
        });

        console.log('[DEBUG] API 응답 전체:', response);

        updateProgress(70, '진단 결과 처리 중...');

        // 응답 검증
        if (!response || !response.results) {
            throw new Error('백엔드 응답에 results 필드가 없습니다');
        }

        if (!Array.isArray(response.results)) {
            throw new Error(`results가 배열이 아닙니다: ${typeof response.results}`);
        }

        console.log('[DEBUG] 진단 결과 개수:', response.results.length);

        // 인벤토리 기준으로 진단했으므로, 결과 기준으로 targetServers 동기화 (삭제된 서버 제거)
        const newTargetServers = response.results.map(result => {
            const completed = result.status === 'completed';
            const vulns = result.vulnerabilities || [];
            const vulnCount = countIssuesFromVulns(vulns) || result.vuln_count || 0;
            const existing = targetServers.find(s => s.server_id === result.server_id);
            if (completed) {
                addLog(`${result.ip}: ${vulnCount}개 취약점 발견`, 'warning');
                if (result.has_regression && (result.regression_codes || []).length > 0) {
                    addLog(`${result.ip}: 회귀 발견 - ${(result.regression_codes || []).join(', ')} (이전 양호→현재 취약)`, 'warning');
                }
            } else {
                addLog(`${result.ip}: 진단 실패 - ${result.error || '알 수 없음'}`, 'error');
            }
            return {
                ip: result.ip,
                hostname: result.hostname || result.ip,
                connected: completed,
                server_id: result.server_id,
                vulnerabilities: vulns,
                vulnCount: vulnCount,
                diagnosed: completed,
                remediated: existing ? existing.remediated : false,
                hasRegression: result.has_regression || false,
                regressionCodes: result.regression_codes || [],
                analysis_id: result.analysis_id || (existing ? existing.analysis_id : null),
            };
        });
        targetServers = newTargetServers;

        updateProgress(90, '화면 업데이트 중...');

        renderTargetTable();
        updateStats();

        currentSnapshot = 1;
        updateSnapshotBadge();

        document.getElementById('fixAllTargetsBtn').style.display = 'inline-flex';
        document.getElementById('diagnosisReportBtn').style.display = 'inline-flex';
        const diagExcelBtn = document.getElementById('diagnosisIndividualsExcelBtn');
        if (diagExcelBtn) diagExcelBtn.style.display = 'inline-flex';

        updateProgress(100, '완료!');

        setTimeout(() => {
            closeProgress();
            addLog('전체 진단 완료', 'success');
        }, 500);
    } catch (error) {
        console.error('[ERROR] diagnoseAll 실패:', error);
        showProgressError('진단 실패', error.message);
        addLog(`진단 실패: ${error.message}`, 'error');
    }
}

// Fix All Targets
async function fixAllTargets() {
    const diagnosedServers = targetServers.filter(s => s.diagnosed && s.vulnCount > 0 && s.server_id && s.analysis_id);

    if (diagnosedServers.length === 0) {
        alert('조치할 취약점이 없습니다.');
        return;
    }

    if (!confirm(`${diagnosedServers.length}개 서버의 모든 취약점을 조치하시겠습니까?`)) {
        return;
    }

    // 모든 취약점 코드 수집
    const allVulnCodes = new Set();
    diagnosedServers.forEach(server => {
        server.vulnerabilities.forEach(v => {
            if (v.status === 'vulnerable') {
                allVulnCodes.add(v.code);
            }
        });
    });

    const serverAnalysisMap = {};
    diagnosedServers.forEach(server => {
        if (server.server_id && server.analysis_id) {
            serverAnalysisMap[server.server_id] = server.analysis_id;
        }
    });

    addLog('전체 서버 일괄 조치 시작', 'info');
    showProgress('🔧', '일괄 조치 중', '모든 취약점을 해결하고 있습니다', 10);

    try {
        updateProgress(20, `${diagnosedServers.length}개 서버 조치 준비 중...`);

        const response = await apiCall('/api/remediation/bulk-servers', 'POST', {
            server_analysis_map: serverAnalysisMap,
            codes: Array.from(allVulnCodes),
            auto_backup: true,
        });

        updateProgress(70, '조치 결과 처리 중...');

        // 결과를 targetServers에 반영 (일부 실패해도 성공한 항목은 반영)
        let allManualRequired = [];
        response.results.forEach(result => {
            const server = targetServers.find(s => s.server_id === result.server_id);
            if (server && (result.status === 'completed' || result.status === 'completed_with_failures')) {
                if (result.vulnerabilities && result.vulnerabilities.length > 0) {
                    server.vulnerabilities = result.vulnerabilities;
                    server.vulnCount = countIssuesFromVulns(server.vulnerabilities);
                    server.hasRegression = false;
                    server.regressionCodes = [];
                }
                const hasFailed = result.failed_codes && result.failed_codes.length > 0;
                server.remediated = true;  // 조치 실행됐으면 항상 true → 개별/모달 조치 보고서 버튼 표시
                if (!hasFailed) {
                    addLog(`${server.ip}: 전체 조치 완료`, 'success');
                } else {
                    addLog(`${server.ip}: 조치 실패 (일부/전체 미반영)`, 'warning');
                    result.failed_codes.forEach(f => addLog(`${result.ip}: ${f.code} 조치 미반영 - ${f.reason}`, 'warning'));
                }
                if (result.manual_required && result.manual_required.length) {
                    allManualRequired = allManualRequired.concat(result.manual_required);
                    addLog(`${server.ip}: 수동 조치 필요 항목 - ${result.manual_required.join(', ')}`, 'warning');
                }
            } else if (result.status === 'failed') {
                addLog(`${result.ip}: 조치 실패 - ${result.error}`, 'error');
            }
        });

        updateProgress(90, '화면 업데이트 중...');

        renderTargetTable();
        updateStats();

        if (typeof showDetail === 'function' && currentTargetIP) {
            const detailModal = document.getElementById('detailModal');
            if (detailModal && detailModal.classList.contains('active')) {
                showDetail(currentTargetIP);
            }
        }

        currentSnapshot = 2;
        updateSnapshotBadge();

        // 전체 조치 완료 후 조치 보고서 버튼 표시 (대시보드 + 개별 조치 Excel)
        window.remediationReportAvailable = true;
        const remediationReportBtn = document.getElementById('remediationReportBtn');
        if (remediationReportBtn) remediationReportBtn.style.display = 'inline-flex';
        const remExcelBtn = document.getElementById('remediationIndividualsExcelBtn');
        if (remExcelBtn) remExcelBtn.style.display = 'inline-flex';
        window.lastRemediatedHostnames = response.results
            .filter(r => r.status === 'completed' || r.status === 'completed_with_failures')
            .map(r => {
                const s = targetServers.find(t => t.server_id === r.server_id);
                return s ? (s.hostname || s.ip) : null;
            })
            .filter(Boolean);

        updateProgress(100, '완료!');

        setTimeout(() => {
            closeProgress();
            const anyFailed = response.results.some(r => r.failed_codes && r.failed_codes.length > 0);
            if (anyFailed) {
                addLog('일부 서버 조치 실패 (미반영)', 'warning');
                alert('조치 실패\n\n일부 서버에서 조치가 반영되지 않았습니다. 로그를 확인해 주세요.');
            } else {
                addLog('전체 조치 완료', 'success');
            }
            if (allManualRequired.length) {
                const uniqueManual = [...new Set(allManualRequired)];
                addLog('수동 조치 필요 (자동 스크립트 없음): ' + uniqueManual.join(', '), 'warning');
                if (!anyFailed) {
                    alert('조치 완료.\n\n다음 항목은 자동 조치 스크립트가 없어 수동 조치가 필요합니다:\n' + uniqueManual.join(', ') + '\n\n상세 화면에서 해당 항목에 "수동 조치 필요"로 표시됩니다.');
                }
            }
        }, 500);
    } catch (error) {
        showProgressError('조치 실패', error.message);
        addLog(`조치 실패: ${error.message}`, 'error');
    }
}

// 개별 서버 전체 조치 (테이블 행의 "조치" 버튼)
async function fixServer(ip) {
    const server = targetServers.find(s => s.ip === ip);
    if (!server || !server.analysis_id || !server.server_id) {
        alert('서버를 찾을 수 없거나 진단 결과가 없습니다.');
        return;
    }
    const vulnCount = (server.vulnerabilities || []).filter(v => (v.status || '').toLowerCase() === 'vulnerable').length;
    if (vulnCount === 0) {
        alert('조치할 취약점이 없습니다.');
        return;
    }
    if (!confirm(`"${server.hostname}" (${server.ip}) 서버의 취약점 ${vulnCount}개를 모두 조치하시겠습니까?`)) {
        return;
    }

    const codes = server.vulnerabilities
        .filter(v => (v.status || '').toLowerCase() === 'vulnerable')
        .map(v => v.code);

    addLog(`${server.ip}: 전체 조치 시작`, 'info');
    showProgress('🔧', '일괄 조치 중', `${server.hostname} 서버 취약점을 조치하고 있습니다`, 15);

    try {
        updateProgress(30, `${vulnCount}개 취약점 조치 중...`);

        const response = await apiCall('/api/remediation/bulk', 'POST', {
            analysis_id: server.analysis_id,
            codes: codes,
            auto_backup: true,
        });

        updateProgress(80, '결과 반영 중...');

        if (response.vulnerabilities && response.vulnerabilities.length > 0) {
            server.vulnerabilities = response.vulnerabilities;
            server.vulnCount = countIssuesFromVulns(server.vulnerabilities);
            server.hasRegression = false;
        }
        const hasFailed = response.failed_codes && response.failed_codes.length > 0;
        server.remediated = true;  // 조치 실행됐으면 항상 true → 개별/모달 조치 보고서 버튼 표시

        renderTargetTable();
        updateStats();
        currentSnapshot = 2;
        updateSnapshotBadge();

        if (typeof showDetail === 'function' && currentTargetIP === ip) {
            showDetail(ip);
        }

        window.remediationReportAvailable = true;
        window.lastRemediatedHostnames = [server.hostname || server.ip];
        const remediationReportBtn = document.getElementById('remediationReportBtn');
        if (remediationReportBtn) remediationReportBtn.style.display = 'inline-flex';
        const remExcelBtn = document.getElementById('remediationIndividualsExcelBtn');
        if (remExcelBtn) remExcelBtn.style.display = 'inline-flex';

        updateProgress(100, '완료!');

        setTimeout(() => {
            closeProgress();
            if (response.failed_codes && response.failed_codes.length > 0) {
                response.failed_codes.forEach(f => addLog(`${server.ip}: ${f.code} 조치 미반영 - ${f.reason}`, 'warning'));
                addLog(`${server.ip}: 일부 항목 조치 미반영 (스크립트 실행됐으나 서버 반영 안 됨)`, 'warning');
                const msg = response.failed_codes.map(f => `${f.code}: ${f.reason}`).join('\n\n');
                alert(`조치 실패\n\n다음 항목은 서버에 반영되지 않았습니다:\n\n${msg}\n\n※ 위는 실패 원인입니다. 로그 패널에서도 확인할 수 있습니다.`);
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

// ----- 서버 추가 (inventory.yaml에 등록) -----

function openAddServerModal() {
    document.getElementById('addServerHostname').value = '';
    document.getElementById('addServerIp').value = '';
    document.getElementById('addServerPort').value = '22';
    document.getElementById('addServerUsername').value = 'root';
    document.getElementById('addServerTermsAgree').checked = false;
    document.getElementById('addServerModal').classList.add('active');
}

function closeAddServerModal() {
    document.getElementById('addServerModal').classList.remove('active');
}

async function submitAddServer(event) {
    if (event && event.preventDefault) event.preventDefault();

    const hostname = (document.getElementById('addServerHostname').value || '').trim();
    const ip = (document.getElementById('addServerIp').value || '').trim();
    const port = parseInt(document.getElementById('addServerPort').value, 10) || 22;
    const username = (document.getElementById('addServerUsername').value || '').trim() || 'root';
    const termsAgree = document.getElementById('addServerTermsAgree').checked;

    if (!hostname || !ip) {
        alert('호스트명과 서버 IP를 입력해 주세요.');
        return false;
    }
    if (!termsAgree) {
        alert('Ansible 접속 요구사항에 동의해 주세요. (체크박스 선택)');
        return false;
    }

    const btn = document.getElementById('addServerSubmitBtn');
    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>등록 중...</span>';

    try {
        const response = await apiCall('/api/inventory/add-server', 'POST', {
            hostname: hostname,
            ip: ip,
            port: port,
            username: username,
        });
        if (response && response.success) {
            addLog(`서버 추가됨: ${response.hostname || hostname} (${ip}:${port})`, 'success');
            closeAddServerModal();
            await loadInventory();
        } else {
            alert(response?.detail || response?.message || '서버 등록에 실패했습니다.');
        }
    } catch (error) {
        const msg = error.message || '서버 등록 실패';
        addLog(`서버 추가 실패: ${msg}`, 'error');
        alert(msg);
    } finally {
        btn.disabled = false;
        btn.innerHTML = origText;
    }
    return false;
}

// ----- 서버 삭제 (inventory에서 제거) -----

async function deleteSelectedServers() {
    const checkboxes = document.querySelectorAll('.target-checkbox:checked');
    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
    if (selectedIndices.length === 0) {
        alert('삭제할 서버를 선택해 주세요.');
        return;
    }
    const hostnames = selectedIndices.map(idx => targetServers[idx].hostname).filter(Boolean);
    if (hostnames.length === 0) {
        alert('선택한 서버의 호스트명을 찾을 수 없습니다.');
        return;
    }
    if (!confirm(`선택한 ${hostnames.length}개 서버를 inventory에서 삭제하시겠습니까?\n\n${hostnames.join(', ')}`)) {
        return;
    }
    try {
        const response = await apiCall('/api/inventory/remove-servers', 'POST', { hostnames: hostnames });
        if (response && response.success) {
            addLog(response.message || `${response.removed?.length || 0}개 서버 삭제됨`, 'success');
            await loadInventory();
        } else {
            alert(response?.detail || response?.message || '삭제에 실패했습니다.');
        }
    } catch (error) {
        addLog(`서버 삭제 실패: ${error.message}`, 'error');
        alert(error.message || '서버 삭제 실패');
    }
}

async function deleteAllServers() {
    if (!targetServers || targetServers.length === 0) {
        alert('삭제할 서버가 없습니다.');
        return;
    }
    const hostnames = targetServers.map(s => s.hostname).filter(Boolean);
    if (hostnames.length === 0) {
        alert('서버 호스트명을 찾을 수 없습니다.');
        return;
    }
    const msg = [
        `⚠️ 전체 서버 삭제 확인`,
        ``,
        `정말로 ${hostnames.length}개 서버가 모두 삭제됩니다.`,
        ``,
        `삭제 대상: ${hostnames.join(', ')}`,
        ``,
        `• 등록된 서버 정보 및 진단 이력이 모두 삭제됩니다.`,
        `• 이 작업은 되돌릴 수 없습니다.`,
        `• 삭제로 인한 결과에 대한 책임은 전적으로 사용자에게 있습니다.`,
        ``,
        `계속하시겠습니까?`
    ].join('\n');
    if (!confirm(msg)) {
        return;
    }
    try {
        const response = await apiCall('/api/inventory/remove-servers', 'POST', { hostnames: hostnames });
        if (response && response.success) {
            addLog(response.message || '전체 서버 삭제됨', 'success');
            await loadInventory();
        } else {
            alert(response?.detail || response?.message || '삭제에 실패했습니다.');
        }
    } catch (error) {
        addLog(`서버 삭제 실패: ${error.message}`, 'error');
        alert(error.message || '서버 삭제 실패');
    }
}

