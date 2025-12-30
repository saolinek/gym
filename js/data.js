export const LS_KEY = "gym_history_v1";
export const PLAN_KEY = "gym_plan_v1";
export const APP_VERSION = "1.3.6"; // Version 1.3.6: Returned Sat/Sun to history

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

// === 3. STATE INITIALIZATION (PHASE: INIT) ===

export function initializeState() {
    // A. Check Version & Force Cache Clear if needed
    checkVersionSync();

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
}

function checkVersionSync() {
    const savedVersion = localStorage.getItem('gym_app_version');
    if (savedVersion !== APP_VERSION) {
        localStorage.setItem('gym_app_version', APP_VERSION);
        return true;
    }
    return false;
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