
import {
    state,
    calcTotalItems,
    isDayLocked,
    createCategory,
    createExercise,
    getCategoryName,
    getExerciseId,
    getExerciseName,
    registerDeletedExercise
} from './data.js';
import { saveCloudWeekData, saveCloudPlan } from './firebase.js';

// === DOM CACHE (Performance optimization) ===
let domCache = {
    list: null,
    bar: null,
    text: null
};

// === CARDS VIEW STATE ===
let cardsScrollHandler = null;

function getDomElements() {
    if (!domCache.list) domCache.list = document.getElementById("gym-list");
    if (!domCache.bar) domCache.bar = document.getElementById('gym-bar');
    if (!domCache.text) domCache.text = document.getElementById('gym-text');
    return domCache;
}

// === MEMOIZATION FOR PREVIOUS WEEK DATA ===
let prevWeekCache = {
    weekId: null,
    doneList: null
};

function getPrevWeekDoneList(currentWeekId) {
    if (prevWeekCache.weekId === currentWeekId) {
        return prevWeekCache.doneList;
    }

    const currentTs = parseInt(currentWeekId);
    const currentMonday = new Date(currentTs);

    // Check if there is any history at all before the current week
    const hasAnyHistory = Object.keys(state.weeks).some(weekKey => parseInt(weekKey) < currentTs);

    if (!hasAnyHistory) {
        prevWeekCache.weekId = currentWeekId;
        prevWeekCache.doneList = null;
        return null;
    }

    // Safely compute the exact previous Monday (DST-safe)
    const prevMonday = new Date(currentMonday);
    prevMonday.setDate(currentMonday.getDate() - 7);
    const prevWeekKey = prevMonday.getTime().toString();
    const prevWeekData = state.weeks[prevWeekKey];

    prevWeekCache.weekId = currentWeekId;
    prevWeekCache.doneList = (prevWeekData && prevWeekData.done)
        ? prevWeekData.done.map(entry => entry.split('|')[0])
        : [];

    return prevWeekCache.doneList;
}

function isToday(ts) {
    if (!ts) return false;
    const d = new Date(parseInt(ts));
    const today = new Date();
    return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
}

// Check if timestamp is within the current ISO week
function isInCurrentWeek(ts) {
    if (!ts) return false;
    const weekStart = parseInt(state.currentWeekId);
    const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000);
    const timestamp = parseInt(ts);
    return timestamp >= weekStart && timestamp < weekEnd;
}

function triggerHaptic() {
    if (state.settings && state.settings.haptics && navigator.vibrate) {
        navigator.vibrate(8); // Short tap, not vibration
    }
}

const GRIP_SVG = `<svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor"><circle cx="4" cy="3" r="1.5"/><circle cx="10" cy="3" r="1.5"/><circle cx="4" cy="9" r="1.5"/><circle cx="10" cy="9" r="1.5"/><circle cx="4" cy="15" r="1.5"/><circle cx="10" cy="15" r="1.5"/></svg>`;

function renderDots(count) {
    const container = document.getElementById('dots-indicator');
    if (!container) return;
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<span class="dot${i === 0 ? ' active' : ''}"></span>`;
    }
    container.innerHTML = html;
    container.style.display = count > 0 ? 'flex' : 'none';
}

function hideDots() {
    const container = document.getElementById('dots-indicator');
    if (!container) return;
    container.style.display = 'none';
    container.innerHTML = '';
}

function updateActiveDot(idx) {
    const container = document.getElementById('dots-indicator');
    if (!container) return;
    container.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === idx);
    });
}

function setupCardsScroll(list) {
    if (cardsScrollHandler) {
        list.removeEventListener('scroll', cardsScrollHandler);
    }
    cardsScrollHandler = () => {
        const idx = Math.round(list.scrollLeft / list.offsetWidth);
        updateActiveDot(idx);
    };
    list.addEventListener('scroll', cardsScrollHandler, { passive: true });
}

// === PURE RENDER FUNCTION ===
export function renderPlan() {
    if (!state.appReady) return;

    const { list, bar, text } = getDomElements();
    if (!list) return;

    const weekData = state.weeks[state.currentWeekId];
    const fullDoneList = weekData ? (weekData.done || []) : [];

    // === MEMOIZED PREVIOUS WEEK LOOKUP ===
    const prevDoneList = getPrevWeekDoneList(state.currentWeekId);

    let html = "";
    let doneCount = 0;
    const viewMode = state.settings.viewMode || 'list';

    state.plan.forEach((c, catIdx) => {
        const categoryName = getCategoryName(c);
        html += `<div class="gym-cat">`;

        html += `<div class="cat-header">
                    ${state.isEditMode && viewMode !== 'cards' ? `<div class="drag-handle" data-type="cat" data-catidx="${catIdx}">${GRIP_SVG}</div>` : ''}
                    <h2 style="font-weight:800; margin:0; font-size:1.25rem; flex-grow:1;" ${state.isEditMode ? `onclick="renameCategory(${catIdx})"` : ''}>${categoryName}</h2>
                    ${state.isEditMode ? `
                        <div class="edit-controls">
                            <div class="icon-btn del-btn" onclick="deleteCategory(${catIdx})">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </div>
                        </div>
                    ` : ''}
                 </div>`;

        c.items.forEach((i, itemIdx) => {
            const exerciseId = getExerciseId(i);
            const exerciseName = getExerciseName(i);

            // Find if task is done this week and get timestamp
            let doneEntry = fullDoneList.find(entry => {
                const parts = entry.split('|');
                return parts[0] === exerciseId && parts[1] && isInCurrentWeek(parts[1]);
            });

            let isDone = !!doneEntry;
            let isLocked = false;

            // Check if the completion is from today (unlocked) or past day (locked)
            if (isDone && doneEntry) {
                const timestamp = doneEntry.split('|')[1];
                isLocked = isDayLocked(timestamp);
            }

            // Count all completions for this week
            if (isDone) doneCount++;

            // Check if missed last week AND not already done this week
            // isDone already checks if the task is done this week (via isInCurrentWeek)
            let missedLabel = "";
            const isDoneThisWeek = fullDoneList.some(entry => entry.split('|')[0] === exerciseId);
            const isNew = i.createdAt && i.createdAt >= parseInt(state.currentWeekId);
            if (prevDoneList && !prevDoneList.includes(exerciseId) && !isDoneThisWeek && !isNew) {
                missedLabel = `<span class="missed-label" style="font-size: 0.75rem; color: #f97316; font-weight: 600; margin-left: 8px;">(Minule vynecháno)</span>`;
            }

            if (state.isEditMode) {
                html += `<div class="gym-item" style="cursor: default;">
                    <div class="drag-handle" data-type="item" data-catidx="${catIdx}" data-itemidx="${itemIdx}">${GRIP_SVG}</div>
                    <span style="font-weight:500; flex-grow:1; cursor:pointer;" onclick="renameItem(${catIdx}, ${itemIdx})">${exerciseName}</span>
                    <div class="icon-btn del-btn" onclick="deleteItem(${catIdx}, ${itemIdx})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </div>
                </div>`;
            } else {
                // Locked items: checked + locked class, no onclick
                // Unlocked items: normal interactive behavior
                const itemClasses = isDone ? (isLocked ? 'checked locked' : 'checked') : '';
                const clickHandler = isLocked ? '' : `onclick="togGym('${exerciseId}', this)"`;

                html += `<div class="gym-item ${itemClasses}" ${clickHandler}>
                    <div class="gym-box"></div><span style="font-weight:500;">${exerciseName} ${missedLabel}</span>
                </div>`;
            }
        });

        if (state.isEditMode) {
            html += `<div class="add-btn" onclick="addItem(${catIdx})">+ Přidat cvik</div>`;
        }

        html += `</div>`;
    });
    list.innerHTML = html;

    // Apply view mode
    if (viewMode === 'cards') {
        list.classList.add('view-cards');
        renderDots(state.plan.length);
        setupCardsScroll(list);
    } else {
        list.classList.remove('view-cards');
        if (cardsScrollHandler) {
            list.removeEventListener('scroll', cardsScrollHandler);
            cardsScrollHandler = null;
        }
        hideDots();
    }

    if (state.isEditMode) initDragAndDrop();

    if (bar) bar.style.width = (state.totalItems > 0 ? (doneCount / state.totalItems * 100) : 0) + '%';
    if (text) text.innerText = `${doneCount} / ${state.totalItems} hotovo`;
}

function triggerAppRender() {
    if (window.renderApp) window.renderApp();
    else renderPlan();
}

export function togGym(id, el) {
    if (state.isEditMode) return;

    if (!state.weeks[state.currentWeekId]) return;

    const weekData = state.weeks[state.currentWeekId];

    // Find today's entry
    const todayEntry = weekData.done.find(entry => {
        const parts = entry.split('|');
        return parts[0] === id && parts[1] && isToday(parts[1]);
    });

    if (todayEntry) {
        // Uncheck
        const idx = weekData.done.indexOf(todayEntry);
        if (idx > -1) weekData.done.splice(idx, 1);
        el.classList.remove('checked');
        // No haptic on uncheck
    } else {
        // Check
        weekData.done.push(`${id}|${Date.now()}`);
        el.classList.add('checked');
        // Trigger completion animation (removed after animation ends)
        el.classList.add('just-checked');
        setTimeout(() => el.classList.remove('just-checked'), 400);
        triggerHaptic(); // Short tap feedback
    }

    weekData.total = state.totalItems;
    saveCloudWeekData(state.currentWeekId);

    // Recalculate Weekly Progress
    const doneCount = weekData.done.filter(entry => {
        const parts = entry.split('|');
        return parts[1] && isInCurrentWeek(parts[1]);
    }).length;

    const { bar, text } = getDomElements();
    if (bar) bar.style.width = (state.totalItems > 0 ? (doneCount / state.totalItems * 100) : 0) + '%';
    if (text) text.innerText = `${doneCount} / ${state.totalItems} hotovo`;

    // Handle "Minule vynecháno" label visibility
    const prevDoneList = getPrevWeekDoneList(state.currentWeekId);
    let exercise = null;
    for (const cat of state.plan) {
        const found = (cat.items || []).find(item => item.id === id);
        if (found) {
            exercise = found;
            break;
        }
    }
    const isNew = exercise && exercise.createdAt && exercise.createdAt >= parseInt(state.currentWeekId);
    const isMissedLastWeek = prevDoneList && !prevDoneList.includes(id) && !isNew;

    if (isMissedLastWeek) {
        // Check if done ANY time this week (including the change we just made)
        const isDoneAnyTimeThisWeek = weekData.done.some(entry => entry.split('|')[0] === id);

        const labelSpan = el.querySelector('.missed-label');

        if (isDoneAnyTimeThisWeek) {
            // Should be hidden because it is now done
            if (labelSpan) labelSpan.style.display = 'none';
        } else {
            // Should be visible because it is NOT done
            if (labelSpan) {
                labelSpan.style.display = 'inline';
            } else {
                // If it was hidden/removed and needs to be re-added
                const textSpan = el.querySelector('span');
                if (textSpan) {
                    textSpan.insertAdjacentHTML('beforeend', `<span class="missed-label" style="font-size: 0.75rem; color: #f97316; font-weight: 600; margin-left: 8px;">(Minule vynecháno)</span>`);
                }
            }
        }
    }
}

export function toggleEditMode() {
    state.isEditMode = !state.isEditMode;
    const btn = document.getElementById('edit-btn');
    const controls = document.getElementById('edit-controls-main');

    if (state.isEditMode) {
        if (btn) btn.classList.add('active');
        if (controls) controls.style.display = 'block';
    } else {
        if (btn) btn.classList.remove('active');
        if (controls) controls.style.display = 'none';
    }
    triggerAppRender();
}

export function addCategory() {
    const name = prompt("Název nové kategorie:");
    const trimmedName = String(name || '').trim();
    if (trimmedName) {
        state.plan.push(createCategory(trimmedName));
        calcTotalItems();
        saveCloudPlan();
        triggerAppRender();
    }
}

export function deleteCategory(idx) {
    const category = state.plan[idx];
    if (confirm(`Opravdu smazat kategorii "${getCategoryName(category)}"?`)) {
        const catName = getCategoryName(category);
        (category.items || []).forEach(item => {
            registerDeletedExercise(getExerciseId(item), getExerciseName(item), catName);
        });
        state.plan.splice(idx, 1);
        calcTotalItems();
        saveCloudPlan();
        triggerAppRender();
    }
}

export function addItem(catIdx) {
    const name = prompt("Název nového cviku:");
    const trimmedName = String(name || '').trim();
    if (trimmedName) {
        state.plan[catIdx].items.push(createExercise(trimmedName));
        calcTotalItems();
        saveCloudPlan();
        triggerAppRender();
    }
}

export function deleteItem(catIdx, itemIdx) {
    const item = state.plan[catIdx].items[itemIdx];
    const catName = getCategoryName(state.plan[catIdx]);
    registerDeletedExercise(getExerciseId(item), getExerciseName(item), catName);
    state.plan[catIdx].items.splice(itemIdx, 1);
    calcTotalItems();
    saveCloudPlan();
    triggerAppRender();
}

export function renameCategory(catIdx) {
    const newName = prompt("Nový název kategorie:", getCategoryName(state.plan[catIdx]));
    const trimmedName = String(newName || '').trim();
    if (trimmedName) {
        state.plan[catIdx].name = trimmedName;
        saveCloudPlan();
        triggerAppRender();
    }
}

export function renameItem(catIdx, itemIdx) {
    const currentExercise = state.plan[catIdx]?.items?.[itemIdx];
    if (!currentExercise) return;

    const newName = prompt("Nový název cviku:", getExerciseName(currentExercise));
    const trimmedName = String(newName || '').trim();
    if (trimmedName) {
        state.plan[catIdx].items[itemIdx].name = trimmedName;
        saveCloudPlan();
        triggerAppRender();
    }
}

function spawnPart(el) {
    let rect = el.getBoundingClientRect();
    let emojis = ['🔥', '💪', '⚡', '✨', '🎯'];
    for (let i = 0; i < 8; i++) {
        let p = document.createElement('div');
        p.className = 'particle';
        p.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        p.style.left = (rect.left + rect.width / 2) + 'px';
        p.style.top = (rect.top + rect.height / 2) + 'px';
        let a = Math.random() * Math.PI * 2;
        let d = 50 + Math.random() * 50;
        p.style.setProperty('--tx', Math.cos(a) * d + 'px');
        p.style.setProperty('--ty', Math.sin(a) * d + 'px');
        p.style.animation = 'particle-burst 0.6s ease-out forwards';
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 600);
    }
}

// === DRAG AND DROP ===
let dnd = null;

function initDragAndDrop() {
    const list = document.getElementById('gym-list');
    if (!list) return;
    list.querySelectorAll('.drag-handle').forEach(h => {
        h.addEventListener('pointerdown', startDrag, { passive: false });
    });
}

function startDrag(e) {
    e.preventDefault();
    const h = e.currentTarget;
    const isCat = h.dataset.type === 'cat';
    const catIdx = parseInt(h.dataset.catidx);
    const itemIdx = isCat ? -1 : parseInt(h.dataset.itemidx);
    const src = isCat ? h.closest('.gym-cat') : h.closest('.gym-item');
    const rect = src.getBoundingClientRect();

    const ghost = src.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.style.cssText += `;position:fixed;width:${rect.width}px;top:${rect.top}px;left:${rect.left}px;pointer-events:none;z-index:9999;border-top-color:${getComputedStyle(src).borderTopColor};`;
    document.body.appendChild(ghost);
    src.classList.add('dragging-source');

    dnd = { type: isCat ? 'cat' : 'item', catIdx, itemIdx, ghost, src, offsetY: e.clientY - rect.top, offsetX: e.clientX - rect.left, dropIdx: -1 };

    h.setPointerCapture(e.pointerId);
    h.addEventListener('pointermove', onDragMove, { passive: false });
    h.addEventListener('pointerup', onDragEnd);
    h.addEventListener('pointercancel', onDragCancel);
}

function onDragMove(e) {
    if (!dnd) return;
    e.preventDefault();
    dnd.ghost.style.top = (e.clientY - dnd.offsetY) + 'px';
    dnd.ghost.style.left = (e.clientX - dnd.offsetX) + 'px';

    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    if (dnd.type === 'cat') updateCatDropPos(e.clientY);
    else updateItemDropPos(e.clientY);
}

function updateCatDropPos(y) {
    const cats = Array.from(document.querySelectorAll('#gym-list > .gym-cat'));
    let idx = cats.length;
    for (let i = 0; i < cats.length; i++) {
        if (cats[i] === dnd.src) continue;
        const r = cats[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) { idx = i; break; }
    }
    dnd.dropIdx = idx;
    const ind = document.createElement('div');
    ind.className = 'drop-indicator';
    const list = document.getElementById('gym-list');
    idx >= cats.length ? list.appendChild(ind) : list.insertBefore(ind, cats[idx]);
}

function updateItemDropPos(y) {
    const catEl = document.querySelectorAll('#gym-list > .gym-cat')[dnd.catIdx];
    if (!catEl) return;
    const items = Array.from(catEl.querySelectorAll('.gym-item'));
    let idx = items.length;
    for (let i = 0; i < items.length; i++) {
        if (items[i] === dnd.src) continue;
        const r = items[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) { idx = i; break; }
    }
    dnd.dropIdx = idx;
    const ind = document.createElement('div');
    ind.className = 'drop-indicator';
    const addBtn = catEl.querySelector('.add-btn');
    idx >= items.length
        ? (addBtn ? catEl.insertBefore(ind, addBtn) : catEl.appendChild(ind))
        : catEl.insertBefore(ind, items[idx]);
}

function onDragEnd(e) {
    if (!dnd) return;
    const h = e.currentTarget;
    h.removeEventListener('pointermove', onDragMove);
    h.removeEventListener('pointerup', onDragEnd);
    h.removeEventListener('pointercancel', onDragCancel);

    const { type, catIdx, itemIdx, dropIdx } = dnd;
    dnd.ghost.remove();
    dnd.src.classList.remove('dragging-source');
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    dnd = null;

    if (dropIdx < 0) return;

    if (type === 'cat') {
        if (dropIdx === catIdx || dropIdx === catIdx + 1) return;
        const [cat] = state.plan.splice(catIdx, 1);
        state.plan.splice(dropIdx > catIdx ? dropIdx - 1 : dropIdx, 0, cat);
    } else {
        if (dropIdx === itemIdx || dropIdx === itemIdx + 1) return;
        const items = state.plan[catIdx].items;
        const [item] = items.splice(itemIdx, 1);
        items.splice(dropIdx > itemIdx ? dropIdx - 1 : dropIdx, 0, item);
    }

    saveCloudPlan();
    triggerAppRender();
}

function onDragCancel(e) {
    if (!dnd) return;
    const h = e.currentTarget;
    h.removeEventListener('pointermove', onDragMove);
    h.removeEventListener('pointerup', onDragEnd);
    h.removeEventListener('pointercancel', onDragCancel);
    dnd.ghost.remove();
    dnd.src.classList.remove('dragging-source');
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    dnd = null;
}
