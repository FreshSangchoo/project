// 다크/라이트 테마 전환 (스위치 UI)
const THEME_KEY = 'autoisms-theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';

function getStoredTheme() {
    try {
        const stored = localStorage.getItem(THEME_KEY);
        return stored === THEME_DARK || stored === THEME_LIGHT ? stored : THEME_DARK;
    } catch (_) {
        return THEME_DARK;
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    updateThemeSwitchState(theme);
    if (typeof applyChartTheme === 'function') applyChartTheme();
}

function updateThemeSwitchState(theme) {
    const sw = document.getElementById('themeSwitch');
    if (!sw) return;
    const isDark = theme === THEME_DARK;
    sw.setAttribute('aria-checked', isDark ? 'true' : 'false');
    sw.classList.toggle('is-dark', isDark);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || THEME_DARK;
    const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    setTheme(next);
}

function initTheme() {
    const theme = getStoredTheme();
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeSwitchState(theme);
    const sw = document.getElementById('themeSwitch');
    if (sw) {
        sw.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleTheme();
        });
    }
}

// 스크립트 로드 시 저장된 테마 즉시 적용 (깜빡임 방지)
(function () {
    const theme = getStoredTheme();
    document.documentElement.setAttribute('data-theme', theme);
})();

// DOM 준비 시 스위치 시각 상태 동기화
document.addEventListener('DOMContentLoaded', function () {
    updateThemeSwitchState(getStoredTheme());
});
