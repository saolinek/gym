export const LS_KEY = "gym_history_v1";
export const PLAN_KEY = "gym_plan_v1";
export const APP_VERSION = "1.2.0"; // Version 1.2.0: Robust cache invalidation

export const DEFAULT_PLAN = [
    { cat: "ZÁDA", items: ["Přítahy vsedě", "Jednoruční přítahy", "Shrugs", "Deadlift"] },
    { cat: "RUCE", items: ["Biceps", "Triceps", "Tlak nad hlavu", "Upažování", "Zápěstí"] },
    { cat: "NOHY", items: ["Lýtka", "Leg press", "Předkopávání", "Zadní stehna"] },
    { cat: "OSTATNÍ", items: ["Bench press", "Břicho"] }
];

// === 1. CENTRAL STATE ===
export const state = {
    // System Flags
    appReady: false,
    activeView: 'plan', // 'plan', 'history', 'charts'
    version: APP_VERSION,
    isLocal: false,
    
    // Data
    currentUser: null,
    currentWeekId: "",
    totalItems: 0,
    
    // Application Data
    plan: [],
    weeks: {},
    
    // UI State
    isEditMode: false
};

// === 2. PURE HELPERS ===

export function getMondayTimestamp(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

export function calcTotalItems() {
    state.totalItems = 0;
    if (state.plan && Array.isArray(state.plan)) {
        state.plan.forEach(c => {
            if(c.items) state.totalItems += c.items.length;
        });
    }
}

// === 3. STATE INITIALIZATION ===

export function initializeState() {
    state.isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

    // A. Check Version & Force Cache Clear if needed
    const versionChanged = checkVersionSync();

    // B. Set Context
    state.currentWeekId = getMondayTimestamp(new Date()).toString();

    // C. Load Plan
    try {
        const savedPlan = localStorage.getItem(PLAN_KEY);
        state.plan = savedPlan ? JSON.parse(savedPlan) : JSON.parse(JSON.stringify(DEFAULT_PLAN));
    } catch (e) { 
        state.plan = JSON.parse(JSON.stringify(DEFAULT_PLAN));
    }

    // D. Calculate Derived State
    calcTotalItems();

    // E. Load History
    try {
        const savedHistory = localStorage.getItem(LS_KEY);
        if (savedHistory) {
            const parsed = JSON.parse(savedHistory);
            state.weeks = (parsed && parsed.weeks) ? parsed.weeks : {};
        } else {
            state.weeks = {};
        }
    } catch (e) { 
        state.weeks = {};
    }

    // F. Ensure Integrity
    if (!state.weeks[state.currentWeekId]) {
        state.weeks[state.currentWeekId] = {
            week: parseInt(state.currentWeekId),
            done: [],
            total: state.totalItems
        };
    }
    if (!state.weeks[state.currentWeekId].done) state.weeks[state.currentWeekId].done = [];
    
    // G. Mark Ready
    state.appReady = true;
    
    // H. Passive UI Update
    updateDateLabel();

    // I. If version changed, perform async cleanup in background
    if (versionChanged) {
        performAsyncCleanup();
    }
}

/**
 * Synchronous version check to decide if we need a refresh
 */
function checkVersionSync() {
    const savedVersion = localStorage.getItem('gym_app_version');
    if (savedVersion !== APP_VERSION) {
        console.info(`Version upgrade: ${savedVersion || '0.0.0'} -> ${APP_VERSION}`);
        localStorage.setItem('gym_app_version', APP_VERSION);
        
        // If we already had a version saved and it's different, 
        // it means we might have stale JS in browser memory/cache.
        return true;
    }
    return false;
}

/**
 * Asynchronous cleanup of browser caches
 */
async function performAsyncCleanup() {
    console.log("Invalidating application cache...");
    
    // 1. Clear Cache Storage (Service Worker)
    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log("Cache Storage cleared.");
        } catch (e) {
            console.warn("Cache Storage clear failed:", e);
        }
    }

    // 2. Unregister Service Workers to ensure fresh load next time
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
            console.log("Service Workers unregistered.");
        } catch (e) {
            console.warn("Service Worker unregister failed:", e);
        }
    }

    // 3. Optional: Hard reload if critical version mismatch (not always needed but safe)
    // window.location.reload(true);
}

function updateDateLabel() {
    const el = document.getElementById('current-week-date');
    if (el && state.currentWeekId) {
        const d = new Date(parseInt(state.currentWeekId));
        const endD = new Date(d); endD.setDate(d.getDate() + 6);
        el.innerText = `${d.getDate()}.${d.getMonth()+1}. – ${endD.getDate()}.${endD.getMonth()+1}.`;
    }
}

// === 4. PERSISTENCE ===

export function saveLocalData() {
    if (!state.appReady) return;
    try {
        localStorage.setItem(LS_KEY, JSON.stringify({ weeks: state.weeks }));
    } catch(e) {}
}

export function saveLocalPlan() {
    if (!state.appReady) return;
    try {
        localStorage.setItem(PLAN_KEY, JSON.stringify(state.plan));
    } catch(e) {}
}