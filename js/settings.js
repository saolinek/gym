import {
    state,
    saveLocalSettings,
    saveLocalData,
    getMondayTimestamp,
    getCategoryName,
    getExerciseId,
    getExerciseName
} from './data.js';
import { loginGoogle, logout, updateAuthUI, saveCloudWeekData } from './firebase.js';

export function renderSettings() {
    if (!state.appReady) return;
    const container = document.getElementById('settings-list');
    if (!container) return;

    const currentTheme = state.settings.theme || 'material';
    const viewMode = state.settings.viewMode || 'list';

    container.innerHTML = `
        <div class="settings-section">
            <h3 style="margin-bottom: 8px; color: #64748b; font-size: 0.85rem;">ZOBRAZENÍ</h3>
            <div class="settings-item">
                <span style="font-weight: 500;">Stránka Dnes</span>
                <div class="segmented-control">
                    <button class="seg-btn ${viewMode === 'list' ? 'active' : ''}" onclick="setViewMode('list')">Seznam</button>
                    <button class="seg-btn ${viewMode === 'cards' ? 'active' : ''}" onclick="setViewMode('cards')">Karty</button>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <h3 style="margin-bottom: 8px; color: #64748b; font-size: 0.85rem;">VZHLED A CHOVÁNÍ</h3>



            <div class="settings-item">
                <span style="font-weight: 500;">Tmavý režim</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="toggle-darkmode" ${state.settings.darkMode ? 'checked' : ''} onchange="toggleDarkMode()">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="settings-item">
                <span style="font-weight: 500;">Vibrace</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="toggle-haptics" ${state.settings.haptics ? 'checked' : ''} onchange="toggleHaptics()">
                    <span class="slider"></span>
                </label>
            </div>
        </div>

        <div class="settings-section">
            <h3 style="margin-bottom: 8px; color: #64748b; font-size: 0.85rem;">HISTORIE</h3>
            <div class="settings-item" onclick="window.location.href='history-edit.html'" style="cursor: pointer; justify-content: center;">
                <span style="font-weight: 600; color: #3b82f6;">📝 Upravit historii</span>
            </div>
            <div class="settings-item" onclick="window.location.href='stats.html'" style="cursor: pointer; justify-content: center;">
                <span style="font-weight: 600; color: #3b82f6;">📊 Statistiky, Měsíc & Rok</span>
            </div>
        </div>

        <div class="settings-section">
            <h3 style="margin-bottom: 8px; color: #64748b; font-size: 0.85rem;">ÚČET A DATA</h3>

            <div class="settings-item" style="flex-direction: column; align-items: stretch; gap: 12px;">
                <div id="user-status" class="user-status" style="text-align: left; font-weight: 500;">Načítání...</div>
                <button onclick="loginGoogle()" class="google-btn" id="google-btn" style="width: 100%;">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
                    Přihlásit přes Google
                </button>
                 <button onclick="logout()" class="google-btn" id="logout-btn" style="width: 100%; display: none; color: #ef4444; border-color: #fecaca;">
                    Odhlásit se
                </button>
            </div>

        </div>
    `;

    // Trigger UI update for auth status
    updateAuthUI(state.currentUser);
}

// Global functions for onclick


window.setViewMode = function (mode) {
    state.settings.viewMode = mode;
    saveLocalSettings();
    renderSettings();
};

window.toggleHaptics = function () {
    state.settings.haptics = !state.settings.haptics;
    saveLocalSettings();
};

window.toggleDarkMode = function () {
    state.settings.darkMode = !state.settings.darkMode;
    applyTheme();
    saveLocalSettings();
};

window.logout = logout;

// === HISTORY EDITOR FUNCTIONS ===
window.openHistoryEditor = function () {
    const modal = document.getElementById('history-modal');
    const dateInput = document.getElementById('history-date');

    // Set default date to today
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];

    modal.classList.add('active');
    loadDateExercises();
};

window.closeHistoryEditor = function () {
    document.getElementById('history-modal').classList.remove('active');
};

window.loadDateExercises = function () {
    const dateInput = document.getElementById('history-date');
    const container = document.getElementById('history-exercises');

    // Parse date parts explicitly to avoid timezone issues
    const [year, month, day] = dateInput.value.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0, 0);

    // Get the week ID for the selected date
    const weekId = getMondayTimestamp(selectedDate).toString();
    const weekData = state.weeks[weekId];
    const doneList = weekData ? (weekData.done || []) : [];

    // Build exercise list HTML
    let html = '';

    state.plan.forEach(category => {
        html += `<div class="history-cat-title">${getCategoryName(category)}</div>`;

        category.items.forEach(item => {
            const id = getExerciseId(item);
            const itemName = getExerciseName(item);

            // Check if this exercise was done on the selected date
            const isDone = doneList.some(entry => {
                const parts = entry.split('|');
                if (parts[0] !== id || !parts[1]) return false;
                const entryDate = new Date(parseInt(parts[1]));
                return entryDate.getDate() === selectedDate.getDate() &&
                    entryDate.getMonth() === selectedDate.getMonth() &&
                    entryDate.getFullYear() === selectedDate.getFullYear();
            });

            html += `
                <label class="history-item">
                    <input type="checkbox" data-id="${id}" ${isDone ? 'checked' : ''}>
                    <span>${itemName}</span>
                </label>
            `;
        });
    });

    container.innerHTML = html;
};

window.saveHistoryEdit = function () {
    const dateInput = document.getElementById('history-date');
    const container = document.getElementById('history-exercises');
    const selectedDate = new Date(dateInput.value);
    selectedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    // Get the week ID for the selected date
    const weekId = getMondayTimestamp(selectedDate).toString();

    // Ensure week data exists
    if (!state.weeks[weekId]) {
        state.weeks[weekId] = {
            week: parseInt(weekId),
            done: [],
            total: state.totalItems
        };
    }

    const weekData = state.weeks[weekId];
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        const id = checkbox.dataset.id;

        // Remove any existing entry for this exercise on this date
        weekData.done = weekData.done.filter(entry => {
            const parts = entry.split('|');
            if (parts[0] !== id || !parts[1]) return true;
            const entryDate = new Date(parseInt(parts[1]));
            return !(entryDate.getDate() === selectedDate.getDate() &&
                entryDate.getMonth() === selectedDate.getMonth() &&
                entryDate.getFullYear() === selectedDate.getFullYear());
        });

        // Add new entry if checked
        if (checkbox.checked) {
            weekData.done.push(`${id}|${selectedDate.getTime()}`);
        }
    });

    // Save to localStorage and cloud
    saveLocalData();
    saveCloudWeekData(weekId);

    // Close modal and refresh UI
    closeHistoryEditor();
    if (window.renderApp) window.renderApp();
};

export function applyTheme() {
    const theme = 'material';
    const isDark = state.settings.darkMode;

    // Remove theme classes
    document.body.classList.remove('theme-material', 'theme-liquid', 'dark-mode');

    // Apply basic theme
    document.body.classList.add(`theme-${theme}`);

    // Apply Dark Mode if active
    if (isDark) {
        document.body.classList.add('dark-mode');
        // Update meta theme color
        document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0f172a');
    } else {
        document.querySelector('meta[name="theme-color"]').setAttribute('content', '#a1c4fd');
    }
}
