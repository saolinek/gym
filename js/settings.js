import { state, saveLocalSettings } from './data.js';
import { loginGoogle, logout, updateAuthUI } from './firebase.js';

export function renderSettings() {
    if (!state.appReady) return;
    const container = document.getElementById('settings-list');
    if (!container) return;

    container.innerHTML = `
        <div class="settings-section">
            <h3 style="margin-bottom: 12px; color: #64748b; font-size: 0.9rem;">VZHLED A CHOVÁNÍ</h3>

            <div class="settings-item">
                <span style="font-weight: 500;">Tmavý režim</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="toggle-dark-mode" ${state.settings.darkMode ? 'checked' : ''} onchange="toggleDarkMode()">
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
            <h3 style="margin-bottom: 12px; color: #64748b; font-size: 0.9rem;">ÚČET A DATA</h3>

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
window.toggleDarkMode = function() {
    state.settings.darkMode = !state.settings.darkMode;
    applyTheme();
    saveLocalSettings();
};

window.toggleHaptics = function() {
    state.settings.haptics = !state.settings.haptics;
    saveLocalSettings();
};

window.logout = logout;

export function applyTheme() {
    if (state.settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}
