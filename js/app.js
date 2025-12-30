
import { state, initializeState } from './data.js';
import { auth, loginGoogle, updateAuthUI, syncFromFirestore } from './firebase.js';
import { renderPlan, togGym, toggleEditMode, addCategory, deleteCategory, addItem, deleteItem, renameCategory } from './plan.js';
import { renderHistory } from './history.js';
import { renderCharts } from './charts.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
    // A. Verify State Readiness
    if (!state.appReady) return;

    // B. Manage Visibility based on activeView
    ['plan', 'history', 'charts'].forEach(t => {
        const v = document.getElementById('view-'+t);
        const b = document.getElementById('nav-btn-'+t);
        
        if (v) v.style.display = (t === state.activeView) ? 'block' : 'none';
        if (b) {
            if (t === state.activeView) b.classList.add('active');
            else b.classList.remove('active');
        }
    });

    // C. Dispatch Specific Render
    if (state.activeView === 'plan') renderPlan();
    if (state.activeView === 'history') renderHistory();
    if (state.activeView === 'charts') renderCharts();
};

// === 3. NAVIGATION ===
window.switchTab = function(tabName) {
    if (!state.appReady) return;
    
    // Update State
    state.activeView = tabName;
    
    // Trigger Render
    window.renderApp();
};

// === 4. BOOT SEQUENCE (SYNCHRONOUS START) ===
function boot() {
    // A. Initialize State (Loads LS, Calcs Totals, Ensures Integrity)
    initializeState();
    
    // B. Initial Render
    window.renderApp();
}

// Start immediately
boot();

// === 5. ASYNC SYNC LISTENER ===
// Only attach if Auth is actually available (prevent crash on offline init)
if (auth && auth.onAuthStateChanged) {
    onAuthStateChanged(auth, async (user) => {
        state.currentUser = user;
        updateAuthUI(user);
        
        if (user) {
            // Sync: Pull Cloud Data
            await syncFromFirestore(user.uid);
            
            // Re-Init: Merge Data & Recalculate Totals
            initializeState();
            
            // Re-Render: Update UI with fresh data
            window.renderApp();
        }
    });
}

// === 6. ANON FALLBACK ===
if (auth && !auth.currentUser) {
    setTimeout(() => { 
        if(!auth.currentUser) signInAnonymously(auth).catch(console.warn); 
    }, 1500);
}
