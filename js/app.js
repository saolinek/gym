import { state, initializeState } from './data.js';
import { auth, loginGoogle, updateAuthUI, syncFromFirestore, firebaseInitialized } from './firebase.js';
import { renderPlan, togGym, toggleEditMode, addCategory, deleteCategory, addItem, deleteItem, renameCategory } from './plan.js';
import { renderHistory } from './history.js';
import { renderCharts } from './charts.js';
import { onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// === 1. GLOBAL BINDINGS ===
window.togGym = togGym;
window.toggleEditMode = toggleEditMode;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.addItem = addItem;
window.deleteItem = deleteItem;
window.renameCategory = renameCategory;
window.loginGoogle = loginGoogle;

// === 2. MAIN RENDER CONTROLLER ===
window.renderApp = function() {
    if (!state.appReady) return;

    ['plan', 'history', 'charts'].forEach(t => {
        const v = document.getElementById('view-'+t);
        const b = document.getElementById('nav-btn-'+t);
        if (v) v.style.display = (t === state.activeView) ? 'block' : 'none';
        if (b) {
            if (t === state.activeView) b.classList.add('active');
            else b.classList.remove('active');
        }
    });

    if (state.activeView === 'plan') renderPlan();
    if (state.activeView === 'history') renderHistory();
    if (state.activeView === 'charts') renderCharts();
};

// === 3. NAVIGATION ===
window.switchTab = function(tabName) {
    if (!state.appReady) return;
    state.activeView = tabName;
    window.renderApp();
};

// === 4. BOOT SEQUENCE ===
function boot() {
    initializeState();
    
    const verEl = document.getElementById('app-ver-display');
    if(verEl) {
        let label = `v${state.version}`;
        if (state.isLocal) label += ' (Local Development)';
        verEl.innerText = label;
    }

    window.renderApp();
}

boot();

// === 5. ASYNC AUTH ===
if (firebaseInitialized && auth && auth.onAuthStateChanged) {
    onAuthStateChanged(auth, async (user) => {
        state.currentUser = user;
        updateAuthUI(user);
        
        if (user) {
            await syncFromFirestore(user.uid);
            initializeState(); 
            window.renderApp();
        } else {
            signInAnonymously(auth).catch(() => {});
        }
    });
} else {
    updateAuthUI(null);
}