// 테마에 따른 차트 색상
function getChartTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        text: isDark ? '#94a3b8' : '#64748b',
        grid: isDark ? '#334155' : '#e2e8f0',
        pointLabel: isDark ? '#f1f5f9' : '#1e293b'
    };
}

function applyChartTheme() {
    const t = getChartTheme();
    if (chartInstance) {
        if (chartInstance.options.scales && chartInstance.options.scales.r) {
            chartInstance.options.scales.r.pointLabels.color = t.pointLabel;
            chartInstance.options.scales.r.grid.color = t.grid;
            chartInstance.options.scales.r.angleLines.color = t.grid;
        }
        chartInstance.update('none');
    }
    if (lineChartInstance && lineChartInstance.options.scales) {
        if (lineChartInstance.options.scales.x) {
            lineChartInstance.options.scales.x.ticks.color = t.text;
            lineChartInstance.options.scales.x.grid.color = t.grid;
        }
        if (lineChartInstance.options.scales.y) {
            lineChartInstance.options.scales.y.ticks.color = t.text;
            lineChartInstance.options.scales.y.grid.color = t.grid;
        }
        lineChartInstance.update('none');
    }
    if (pieChartInstance) {
        if (pieChartInstance.options.plugins && pieChartInstance.options.plugins.legend) {
            pieChartInstance.options.plugins.legend.labels.color = t.text;
        }
        pieChartInstance.update('none');
    }
}

// Update Stats
function updateStats() {
    const total = targetServers.length;
    const connected = targetServers.filter(s => s.connected).length;
    const totalVulns = targetServers.reduce((sum, s) => sum + s.vulnCount, 0);
    const regression = targetServers.filter(s => s.hasRegression).length;

    document.getElementById('totalServers').textContent = total;
    document.getElementById('connectedServers').textContent = connected;
    document.getElementById('totalVulns').textContent = totalVulns;
    document.getElementById('regressionServers').textContent = regression;

    updateChart();
    updateLineChart();
    updatePieChart();
}

// Update Chart (Radar Chart for KISA Categories)
function updateChart() {
    const container = document.getElementById('chartContainer');
    const placeholder = document.getElementById('chartPlaceholder');

    container.style.display = 'block';
    placeholder.style.display = 'none';

    // 모든 카테고리를 미리 정의 (0개인 항목도 표시하기 위해)
    const allCategories = [
        '계정관리',
        '파일 및 디렉터리',
        '서비스 관리',
        '패치 관리',
        '로그 관리'
    ];

    // 백엔드 API 카테고리명 → 차트 라벨 매핑 (불일치 시 집계가 0으로 나오는 문제 방지)
    const categoryMap = {
        '계정 관리': '계정관리',
        '파일 및 디렉터리 관리': '파일 및 디렉터리'
    };
    // 매칭 실패 시 키워드로 분류. 반환값은 반드시 allCategories 중 하나.
    function chartCategory(apiCategory) {
        const raw = (apiCategory != null ? String(apiCategory).trim().replace(/\s+/g, ' ') : '') || '';
        const mapped = categoryMap[raw] || raw;
        if (allCategories.indexOf(mapped) >= 0) return mapped;
        const lower = raw.replace(/\s/g, '');
        if (/계정/.test(raw) || lower === '계정관리') return '계정관리';
        if (/파일|디렉터리/.test(raw) || lower === '파일및디렉터리') return '파일 및 디렉터리';
        if (/서비스/.test(raw) || lower === '서비스관리') return '서비스 관리';
        if (/패치/.test(raw) || lower === '패치관리') return '패치 관리';
        if (/로그/.test(raw) || lower === '로그관리') return '로그 관리';
        return '계정관리';
    }

    // 카테고리별 취약점 집계 (모든 카테고리를 0으로 초기화)
    const categoryCount = {};
    allCategories.forEach(cat => {
        categoryCount[cat] = 0;
    });

    // 실제 취약점 개수 집계 (status === 'vulnerable' 또는 'manual'). 총 취약점과 차트 합계가 반드시 일치하도록 함.
    targetServers.forEach(server => {
        if (server.diagnosed && Array.isArray(server.vulnerabilities)) {
            server.vulnerabilities.forEach(vuln => {
                if (vuln.status !== 'vulnerable' && vuln.status !== 'manual') return;
                const chartCat = chartCategory(vuln.category);
                categoryCount[chartCat] = (categoryCount[chartCat] || 0) + 1;
            });
        }
    });

    // 총 취약점 수(상단 카드와 동일). 차트 합계가 이와 반드시 일치하도록 보정
    const totalVulns = targetServers.reduce((sum, s) => sum + (s.vulnCount || 0), 0);
    const chartSum = allCategories.reduce((s, c) => s + (categoryCount[c] || 0), 0);
    if (totalVulns !== chartSum) {
        const otherSum = (categoryCount['파일 및 디렉터리'] || 0) + (categoryCount['서비스 관리'] || 0) + (categoryCount['패치 관리'] || 0) + (categoryCount['로그 관리'] || 0);
        categoryCount['계정관리'] = Math.max(0, totalVulns - otherSum);
    }

    const categories = allCategories;
    const counts = allCategories.map(cat => categoryCount[cat] || 0);
    const chartT = getChartTheme();

    const ctx = document.getElementById('vulnChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: categories,
            datasets: [{
                label: '취약점 개수',
                data: counts,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: 'rgba(255,255,255,0.8)',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#2563eb',
                pointHoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30,
                    right: 30,
                    bottom: 30,
                    left: 30
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    ticks: {
                        stepSize: 5,
                        display: false,
                        backdropColor: 'transparent'
                    },
                    pointLabels: {
                        font: {
                            size: 11,
                            weight: '600',
                            family: 'Inter'
                        },
                        color: chartT.pointLabel,
                        padding: 20,
                        callback: function(label) {
                            return label;
                        }
                    },
                    grid: {
                        color: chartT.grid,
                        lineWidth: 1
                    },
                    angleLines: {
                        color: chartT.grid,
                        lineWidth: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed.r + '개';
                        }
                    }
                }
            }
        }
    });

    // 컨테이너가 막 보이게 된 경우 레이아웃 반영 후 차트 크기 재계산
    requestAnimationFrame(function() {
        if (chartInstance) chartInstance.resize();
    });
}

// 취약점 추이 (라인 차트) - 현재 타겟 서버들의 합산 취약점 개수 (최근 20개만 표시)
async function updateLineChart() {
    const canvas = document.getElementById('trendChart');
    const placeholder = document.getElementById('lineChartPlaceholder');
    if (!canvas || !placeholder) return;

    const t = getChartTheme();
    const targetIds = (typeof targetServers !== 'undefined' ? targetServers || [] : []).filter(s => s && s.server_id).map(s => s.server_id);
    const qs = targetIds.length ? `?server_ids=${encodeURIComponent(targetIds.join(','))}` : '';

    try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard/vulnerability-trend${qs}`);
        if (!res.ok) {
            canvas.parentElement.style.display = 'none';
            placeholder.style.display = 'flex';
            return;
        }
        const body = await res.json();
        const allPoints = body.points || [];
        const points = allPoints.slice(-20);
        if (points.length === 0) {
            if (lineChartInstance) {
                lineChartInstance.destroy();
                lineChartInstance = null;
            }
            canvas.parentElement.style.display = 'none';
            placeholder.style.display = 'flex';
            return;
        }

        const labels = points.map(p => {
            const d = new Date(p.completed_at);
            return d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        });
        const data = points.map(p => p.total);

        placeholder.style.display = 'none';
        canvas.parentElement.style.display = 'block';

        if (lineChartInstance) lineChartInstance.destroy();
        lineChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '취약점 수 (전체 합계)',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2,
                    pointBackgroundColor: '#3b82f6',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: t.grid },
                        ticks: { color: t.text, maxRotation: 45 }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: t.grid },
                        ticks: { color: t.text }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) { return '취약점: ' + ctx.parsed.y + '개'; }
                        }
                    }
                }
            }
        });
    } catch (_) {
        canvas.parentElement.style.display = 'none';
        placeholder.style.display = 'flex';
    }
}

// 상태별 분포 (파이 차트)
function updatePieChart() {
    const canvas = document.getElementById('statusPieChart');
    const placeholder = document.getElementById('pieChartPlaceholder');
    if (!canvas || !placeholder) return;

    const statusCount = { 취약: 0, 수동조치: 0, 양호: 0 };
    targetServers.forEach(server => {
        if (!server.diagnosed || !Array.isArray(server.vulnerabilities)) return;
        server.vulnerabilities.forEach(v => {
            const s = (v.status || '').toLowerCase();
            if (s === 'vulnerable') statusCount['취약']++;
            else if (s === 'manual') statusCount['수동조치']++;
            else statusCount['양호']++;
        });
    });

    const total = statusCount['취약'] + statusCount['수동조치'] + statusCount['양호'];
    if (total === 0) {
        if (pieChartInstance) {
            pieChartInstance.destroy();
            pieChartInstance = null;
        }
        canvas.parentElement.style.display = 'none';
        placeholder.style.display = 'flex';
        return;
    }

    placeholder.style.display = 'none';
    canvas.parentElement.style.display = 'block';

    const t = getChartTheme();
    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['취약', '수동조치', '양호'],
            datasets: [{
                data: [statusCount['취약'], statusCount['수동조치'], statusCount['양호']],
                backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'],
                borderColor: [ '#dc2626', '#d97706', '#16a34a' ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: t.text, padding: 12 }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                            return ctx.label + ': ' + ctx.raw + '개 (' + pct + '%)';
                        }
                    }
                }
            }
        }
    });
}