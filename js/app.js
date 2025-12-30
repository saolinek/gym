
import { state, initializeState } from './data.js';
import { initFirebase, loginGoogle, updateAuthUI, syncFromFirestore, firebaseInitialized } from './firebase.js';
import { renderPlan, togGym, toggleEditMode, addCategory, deleteCategory, addItem, deleteItem, renameCategory } from './plan.js';
import { renderHistory } from './history.js';
import { renderCharts } from './charts.js';
import { onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// === 1. GLOBAL BINDINGS (Exposed to window for HTML onclick) ===
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

    // View Switching
    ['plan', 'history', 'charts'].forEach(t => {
        const v = document.getElementById('view-'+t);
        const b = document.getElementById('nav-btn-'+t);
        if (v) v.style.display = (t === state.activeView) ? 'block' : 'none';
        if (b) {
            if (t === state.activeView) b.classList.add('active');
            else b.classList.remove('active');
        }
    });

    // Content Rendering
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

// === 4. BOOT SEQUENCE (SINGLE ENTRY POINT) ===
function boot() {
    console.log("App Boot Sequence Started...");

    // A. Init Data State (Synchronous)
    initializeState();
    
    // B. Init Firebase (Non-blocking Pointer Setup)
    const fb = initFirebase();

    // C. Initial UI Render
    const verEl = document.getElementById('app-ver-display');
    if(verEl) verEl.innerText = `v${state.version}`;
    window.renderApp();

    // D. Start Async Auth Sync
    if (fb.success && fb.auth) {
        onAuthStateChanged(fb.auth, async (user) => {
            state.currentUser = user;
            updateAuthUI(user);
            
            if (user) {
                await syncFromFirestore(user.uid);
                initializeState(); // Re-init to merge cloud data & recalc totals
                window.renderApp();
            } else {
                signInAnonymously(fb.auth).catch(() => {});
            }
        });
    } else {
        updateAuthUI(null);
    }

    console.log("App Boot Sequence Completed.");
}

// Start immediately
boot();
