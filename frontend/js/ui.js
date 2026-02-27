// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainWrapper = document.getElementById('mainWrapper');
    const toggleBtn = document.getElementById('sidebarToggle');
    const topNav = document.querySelector('.top-nav');

    const isActive = sidebar.classList.contains('active');
    const sidebarWidth = sidebar.offsetWidth;

    sidebar.classList.toggle('active');
    mainWrapper.classList.toggle('shifted');
    topNav.classList.toggle('shifted');

    if (!isActive) {
        toggleBtn.style.left = sidebarWidth + 'px';
        mainWrapper.style.marginLeft = sidebarWidth + 'px';
    } else {
        toggleBtn.style.left = '0px';
        mainWrapper.style.marginLeft = '0px';
    }
}

// Guide Toggle
function toggleGuide() {
    const guideSection = document.getElementById('guideSection');
    guideSection.classList.toggle('collapsed');
}

// Horizontal Resizer
let isHorizontalResizing = false;
let startY = 0;
let startGuideHeight = 0;

document.getElementById('horizontalResizer').addEventListener('mousedown', (e) => {
    const guideSection = document.getElementById('guideSection');

    if(guideSection.classList.contains('collapsed')) return;

    isHorizontalResizing = true;
    startY = e.clientY;

    const guideContent = document.querySelector('.guide-content');
    startGuideHeight = guideContent.offsetHeight;

    document.getElementById('horizontalResizer').classList.add('dragging');
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isHorizontalResizing) return;

    const diff = e.clientY - startY;
    const newHeight = Math.max(100, Math.min(600, startGuideHeight + diff));

    const guideContent = document.querySelector('.guide-content');
    guideContent.style.maxHeight = newHeight + 'px';
});

document.addEventListener('mouseup', () => {
    if (isHorizontalResizing) {
        isHorizontalResizing = false;
        document.getElementById('horizontalResizer').classList.remove('dragging');
    }
});

// Terminal Logs
function addLog(message, type = 'info') {
    logCount++;
    document.getElementById('logCount').textContent = logCount;

    const logsContainer = document.getElementById('terminalLogs');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;

    const now = new Date();
    const time = now.toTimeString().split(' ')[0];

    logEntry.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span>${message}</span>
    `;

    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

// Search Targets
function searchTargets() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#targetTableBody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const ip = row.cells[1]?.textContent.toLowerCase() || '';
        const hostname = row.cells[2]?.textContent.toLowerCase() || '';

        if (ip.includes(searchTerm) || hostname.includes(searchTerm)) {
            row.classList.remove('hidden');
            visibleCount++;
        } else {
            row.classList.add('hidden');
        }
    });

    document.getElementById('noResults').style.display = visibleCount === 0 ? 'block' : 'none';
}

// Sort Table
function sortTable(column) {
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }

    document.querySelectorAll('.table-wrapper th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });

    const headerMap = {
        'ip': 1, 'hostname': 2, 'connected': 3, 'vulnCount': 4, 'regression': 5
    };

    const th = document.querySelectorAll('.table-wrapper th')[headerMap[column]];
    th.classList.add(currentSortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');

    targetServers.sort((a, b) => {
        let aVal, bVal;

        switch(column) {
            case 'ip':
                aVal = a.ip.split('.').map(n => parseInt(n).toString().padStart(3, '0')).join('');
                bVal = b.ip.split('.').map(n => parseInt(n).toString().padStart(3, '0')).join('');
                break;
            case 'hostname':
                aVal = a.hostname.toLowerCase();
                bVal = b.hostname.toLowerCase();
                break;
            case 'connected':
                aVal = a.connected ? 1 : 0;
                bVal = b.connected ? 1 : 0;
                break;
            case 'vulnCount':
                aVal = a.vulnCount;
                bVal = b.vulnCount;
                break;
            case 'regression':
                aVal = a.hasRegression ? 1 : 0;
                bVal = b.hasRegression ? 1 : 0;
                break;
            default:
                return 0;
        }

        if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    renderTargetTable();
    addLog(`${column} 컬럼 ${currentSortDirection === 'asc' ? '오름차순' : '내림차순'} 정렬`, 'info');
}

// 모달 테이블 정렬
function sortModalTable(column) {
    if (currentModalSortColumn === column) {
        currentModalSortDirection = currentModalSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentModalSortColumn = column;
        currentModalSortDirection = 'asc';
    }

    renderModalTable();
    addLog(`상세 테이블: ${column} 컬럼 ${currentModalSortDirection === 'asc' ? '오름차순' : '내림차순'} 정렬`, 'info');
}

// Update Snapshot Badge
function updateSnapshotBadge() {
    const badge = document.getElementById('snapshotBadge');
    badge.innerHTML = `<span>Snapshot #${currentSnapshot}</span>`;
}

// Progress Modal 상태 관리
let progressState = {
    isActive: false,
    currentProgress: 0,
    targetProgress: 0,
    intervalId: null,
    status: 'progress' // 'progress', 'success', 'error'
};

function showProgress(icon, title, desc, initialProgress = 0) {
    // 이전 진행률 초기화
    if (progressState.intervalId) {
        clearInterval(progressState.intervalId);
    }

    progressState.isActive = true;
    progressState.currentProgress = initialProgress;
    progressState.targetProgress = initialProgress;
    progressState.status = 'progress';

    document.getElementById('progressIcon').textContent = icon;
    document.getElementById('progressTitle').textContent = title;
    document.getElementById('progressDesc').textContent = desc;

    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = initialProgress + '%';
    progressBar.style.background = 'var(--primary)'; // 파란색으로 초기화

    document.getElementById('progressPercent').textContent = Math.round(initialProgress);
    document.getElementById('progressModal').classList.add('active');

    // 부드러운 애니메이션을 위한 interval
    progressState.intervalId = setInterval(() => {
        if (progressState.currentProgress < progressState.targetProgress) {
            progressState.currentProgress += 1;
            if (progressState.currentProgress > progressState.targetProgress) {
                progressState.currentProgress = progressState.targetProgress;
            }
            updateProgressBar(progressState.currentProgress);
        }
    }, 20);
}

function updateProgress(targetProgress, desc = null) {
    if (!progressState.isActive) return;

    progressState.targetProgress = Math.min(100, Math.max(0, targetProgress));

    if (desc) {
        document.getElementById('progressDesc').textContent = desc;
    }
}

function showProgressError(errorTitle, errorDesc) {
    if (progressState.intervalId) {
        clearInterval(progressState.intervalId);
        progressState.intervalId = null;
    }

    progressState.status = 'error';

    document.getElementById('progressIcon').textContent = '❌';
    document.getElementById('progressTitle').textContent = errorTitle;
    document.getElementById('progressDesc').textContent = errorDesc;

    const progressBar = document.getElementById('progressBar');
    progressBar.style.background = 'var(--danger)'; // 빨간색으로 변경

    // 3초 후 자동 닫기
    setTimeout(() => {
        closeProgress();
    }, 3000);
}

function updateProgressBar(progress) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = progress + '%';
    document.getElementById('progressPercent').textContent = Math.round(progress);
}

function closeProgress() {
    if (progressState.intervalId) {
        clearInterval(progressState.intervalId);
        progressState.intervalId = null;
    }

    progressState.isActive = false;

    setTimeout(() => {
        document.getElementById('progressModal').classList.remove('active');
        // 완전히 초기화
        progressState.currentProgress = 0;
        progressState.targetProgress = 0;
        progressState.status = 'progress';

        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = '0%';
        progressBar.style.background = 'var(--primary)'; // 기본 색상으로 복구
        document.getElementById('progressPercent').textContent = '0';
    }, 300);
}

// ========== Dashboard / Servers / Reports 네비게이션 ==========
function updateActiveNav() {
    const hash = window.location.hash || '#dashboard';
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(function (a) {
        const href = a.getAttribute('href') || '';
        if (href === hash) {
            a.classList.add('active');
        } else {
            a.classList.remove('active');
        }
    });
}

function initNav() {
    if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = 'dashboard';
    }
    updateActiveNav();

    document.querySelectorAll('.nav-links a').forEach(function (a) {
        a.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                window.location.hash = href.slice(1);
                updateActiveNav();
            }
        });
    });

    window.addEventListener('hashchange', updateActiveNav);
}
