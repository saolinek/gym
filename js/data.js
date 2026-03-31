export const LS_KEY = "gym_history_v1";
export const PLAN_KEY = "gym_plan_v1";
export const SETTINGS_KEY = "gym_settings_v1";
export const DELETED_KEY = "gym_deleted_exercises_v1";
export const PLAN_BACKUP_KEY = "gym_plan_v1_legacy_backup";
export const HISTORY_BACKUP_KEY = "gym_history_v1_legacy_backup";
export const APP_VERSION = "1.7.0"; // Version 1.7.0: Stable exercise/category IDs with legacy data migration

export const DEFAULT_PLAN = [
    {
        id: "cat_zada",
        name: "ZÁDA",
        items: [
            { id: "ex_pritahy_vsede", name: "Přítahy vsedě" },
            { id: "ex_jednorucni_pritahy", name: "Jednoruční přítahy" },
            { id: "ex_shrugs", name: "Shrugs" },
            { id: "ex_deadlift", name: "Deadlift" }
        ]
    },
    {
        id: "cat_ruce",
        name: "RUCE",
        items: [
            { id: "ex_biceps", name: "Biceps" },
            { id: "ex_triceps", name: "Triceps" },
            { id: "ex_tlak_nad_hlavu", name: "Tlak nad hlavu" },
            { id: "ex_upazovani", name: "Upažování" },
            { id: "ex_zapesti", name: "Zápěstí" }
        ]
    },
    {
        id: "cat_nohy",
        name: "NOHY",
        items: [
            { id: "ex_lytka", name: "Lýtka" },
            { id: "ex_leg_press", name: "Leg press" },
            { id: "ex_predkopavani", name: "Předkopávání" },
            { id: "ex_zadni_stehna", name: "Zadní stehna" }
        ]
    },
    {
        id: "cat_ostatni",
        name: "OSTATNÍ",
        items: [
            { id: "ex_bench_press", name: "Bench press" },
            { id: "ex_bricho", name: "Břicho" }
        ]
    }
];

// === 1. CENTRAL STATE ===
export const state = {
    // System Flags
    appReady: false,
    activeView: 'day', // 'day', 'week', 'month', 'year', 'settings'
    version: APP_VERSION,

    // Data
    currentUser: null,
    currentWeekId: "",
    totalItems: 0,

    // Application Data
    plan: [],
    weeks: {},
    deletedExercises: {}, // { exerciseId: { name, category } }
    settings: {
        theme: 'material', // 'material' or 'liquid'
        darkMode: false,
        haptics: true
    },

    // UI State
    isEditMode: false
};

// === 2. PURE HELPERS ===

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function normalizeLegacyExerciseKey(name) {
    return String(name || '').trim().replace(/\s+/g, '_');
}

function createId(prefix) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugifyIdPart(value) {
    const normalized = String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    return normalized || 'item';
}

function createStableIdFromLabel(prefix, label, usedIds) {
    const baseId = `${prefix}_${slugifyIdPart(label)}`;
    let candidateId = baseId;
    let suffix = 2;

    while (usedIds.has(candidateId)) {
        candidateId = `${baseId}_${suffix}`;
        suffix += 1;
    }

    return candidateId;
}

export function createCategory(name) {
    return {
        id: createId('cat'),
        name: String(name || '').trim(),
        items: []
    };
}

export function createExercise(name) {
    return {
        id: createId('ex'),
        name: String(name || '').trim()
    };
}

export function getCategoryName(category) {
    return String(category?.name || category?.cat || '').trim();
}

export function getExerciseName(exercise) {
    if (typeof exercise === 'string') return exercise.trim();
    return String(exercise?.name || '').trim();
}

export function getExerciseId(exercise) {
    if (typeof exercise === 'string') return normalizeLegacyExerciseKey(exercise);
    return String(exercise?.id || '').trim();
}

function normalizePlanSchema(rawPlan) {
    const sourcePlan = Array.isArray(rawPlan) ? rawPlan : deepClone(DEFAULT_PLAN);
    const normalizedPlan = [];
    const usedCategoryIds = new Set();
    const usedExerciseIds = new Set();
    const legacyToExerciseId = new Map();

    sourcePlan.forEach((rawCategory, categoryIndex) => {
        const categoryName = getCategoryName(rawCategory) || `Kategorie ${categoryIndex + 1}`;
        const hasCategoryObjectId = typeof rawCategory === 'object' && rawCategory !== null && typeof rawCategory.id === 'string';
        let categoryId = hasCategoryObjectId ? String(rawCategory.id || '').trim() : '';
        if (!categoryId || usedCategoryIds.has(categoryId)) {
            categoryId = createStableIdFromLabel('cat', categoryName, usedCategoryIds);
        }
        usedCategoryIds.add(categoryId);

        const rawItems = Array.isArray(rawCategory?.items) ? rawCategory.items : [];
        const items = rawItems.map((rawItem, itemIndex) => {
            const itemName = getExerciseName(rawItem) || `Cvik ${itemIndex + 1}`;
            const hasExerciseObjectId = typeof rawItem === 'object' && rawItem !== null && typeof rawItem.id === 'string';
            let itemId = hasExerciseObjectId ? String(rawItem.id || '').trim() : '';
            if (!itemId || usedExerciseIds.has(itemId)) {
                itemId = createStableIdFromLabel('ex', itemName, usedExerciseIds);
            }
            usedExerciseIds.add(itemId);

            const legacyKey = normalizeLegacyExerciseKey(itemName);
            if (legacyKey && !legacyToExerciseId.has(legacyKey)) {
                legacyToExerciseId.set(legacyKey, itemId);
            }

            return { id: itemId, name: itemName };
        });

        normalizedPlan.push({ id: categoryId, name: categoryName, items });
    });

    return {
        plan: normalizedPlan,
        legacyToExerciseId,
        changed: JSON.stringify(sourcePlan) !== JSON.stringify(normalizedPlan)
    };
}

function normalizeDoneEntry(entry, legacyToExerciseId) {
    if (typeof entry !== 'string') return null;

    const separatorIndex = entry.indexOf('|');
    if (separatorIndex === -1) return null;

    const rawId = entry.slice(0, separatorIndex);
    const rawTimestamp = entry.slice(separatorIndex + 1);
    if (!rawId || !rawTimestamp) return null;

    const resolvedId = legacyToExerciseId.get(rawId) || rawId;
    return `${resolvedId}|${rawTimestamp}`;
}

function normalizeWeeksSchema(rawWeeks, legacyToExerciseId) {
    const sourceWeeks = rawWeeks && typeof rawWeeks === 'object' ? rawWeeks : {};
    const normalizedWeeks = {};

    Object.entries(sourceWeeks).forEach(([weekId, rawWeek]) => {
        const uniqueDoneEntries = Array.from(new Set(
            (Array.isArray(rawWeek?.done) ? rawWeek.done : [])
                .map(entry => normalizeDoneEntry(entry, legacyToExerciseId))
                .filter(Boolean)
        ));

        normalizedWeeks[weekId] = {
            week: Number.isFinite(rawWeek?.week) ? rawWeek.week : parseInt(weekId, 10),
            done: uniqueDoneEntries,
            total: Number.isFinite(rawWeek?.total) ? rawWeek.total : uniqueDoneEntries.length
        };
    });

    return {
        weeks: normalizedWeeks,
        changed: JSON.stringify(sourceWeeks) !== JSON.stringify(normalizedWeeks)
    };
}

export function normalizeStoredData(rawPlan, rawWeeks) {
    const { plan, legacyToExerciseId, changed: planChanged } = normalizePlanSchema(rawPlan);
    const { weeks, changed: weeksChanged } = normalizeWeeksSchema(rawWeeks, legacyToExerciseId);

    return {
        plan,
        weeks,
        planChanged,
        weeksChanged,
        changed: planChanged || weeksChanged
    };
}

export function getMondayTimestamp(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

// Day is locked if it's not today (central locking logic)
export function isDayLocked(timestamp) {
    if (!timestamp) return true;
    const taskDate = new Date(parseInt(timestamp));
    const today = new Date();
    return !(taskDate.getDate() === today.getDate() &&
        taskDate.getMonth() === today.getMonth() &&
        taskDate.getFullYear() === today.getFullYear());
}

export function calcTotalItems() {
    state.totalItems = 0;
    if (state.plan && Array.isArray(state.plan)) {
        state.plan.forEach(c => {
            if (Array.isArray(c.items)) state.totalItems += c.items.length;
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
    let rawPlan = null;
    let rawPlanSerialized = null;
    try {
        rawPlanSerialized = localStorage.getItem(PLAN_KEY);
        rawPlan = rawPlanSerialized ? JSON.parse(rawPlanSerialized) : deepClone(DEFAULT_PLAN);
    } catch (e) {
        rawPlan = deepClone(DEFAULT_PLAN);
    }

    // C2. Load Settings
    try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
        }
    } catch (e) { }

    // D. Load History
    let rawWeeks = {};
    let rawHistorySerialized = null;
    try {
        rawHistorySerialized = localStorage.getItem(LS_KEY);
        if (rawHistorySerialized) {
            const parsed = JSON.parse(rawHistorySerialized);
            rawWeeks = (parsed && parsed.weeks) ? parsed.weeks : {};
        }
    } catch (e) {
        rawWeeks = {};
    }

    const normalizedData = normalizeStoredData(rawPlan, rawWeeks);
    state.plan = normalizedData.plan;
    state.weeks = normalizedData.weeks;
    calcTotalItems();

    if (normalizedData.planChanged && rawPlanSerialized && !localStorage.getItem(PLAN_BACKUP_KEY)) {
        localStorage.setItem(PLAN_BACKUP_KEY, rawPlanSerialized);
    }

    if (normalizedData.weeksChanged && rawHistorySerialized && !localStorage.getItem(HISTORY_BACKUP_KEY)) {
        localStorage.setItem(HISTORY_BACKUP_KEY, rawHistorySerialized);
    }

    if (normalizedData.planChanged) {
        localStorage.setItem(PLAN_KEY, JSON.stringify(state.plan));
    }

    if (normalizedData.weeksChanged) {
        localStorage.setItem(LS_KEY, JSON.stringify({ weeks: state.weeks }));
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

    // G. Load Deleted Exercises Registry
    loadLocalDeletedExercises();

    // H. Mark Ready
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
        el.innerText = `${d.getDate()}.${d.getMonth() + 1}. – ${endD.getDate()}.${endD.getMonth() + 1}.`;
    }
}

// === DELETED EXERCISES REGISTRY ===

export function registerDeletedExercise(exerciseId, exerciseName, categoryName) {
    state.deletedExercises[exerciseId] = { name: exerciseName, category: categoryName };
    saveLocalDeletedExercises();
}

function saveLocalDeletedExercises() {
    try {
        localStorage.setItem(DELETED_KEY, JSON.stringify(state.deletedExercises));
    } catch (e) { }
}

function loadLocalDeletedExercises() {
    try {
        const saved = localStorage.getItem(DELETED_KEY);
        if (saved) {
            state.deletedExercises = JSON.parse(saved);
        }
    } catch (e) { }
}

// === 4. PERSISTENCE ===

export function saveLocalData() {
    if (!state.appReady) return;
    try {
        localStorage.setItem(LS_KEY, JSON.stringify({ weeks: state.weeks }));
    } catch (e) { }
}

export function saveLocalPlan() {
    if (!state.appReady) return;
    try {
        localStorage.setItem(PLAN_KEY, JSON.stringify(state.plan));
    } catch (e) { }
}

export function saveLocalSettings() {
    if (!state.appReady) return;
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    } catch (e) { }
}
