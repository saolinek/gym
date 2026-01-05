
import { state, calcTotalItems, saveLocalPlan, saveLocalData } from './data.js';
import { saveCloudWeekData, saveCloudPlan } from './firebase.js';

// === PURE RENDER FUNCTION ===
export function renderPlan() {
    if (!state.appReady) return;

    const list = document.getElementById("gym-list");
    if (!list) return;

    const weekData = state.weeks[state.currentWeekId];
    // Support both old string format and new "id|timestamp" format
    const doneList = weekData ? (weekData.done || []).map(entry => entry.split('|')[0]) : [];
    
    // === LOGIC FOR MISSED EXERCISES ===
    const prevWeekTs = parseInt(state.currentWeekId) - (7 * 24 * 60 * 60 * 1000);
    const prevWeekData = state.weeks[prevWeekTs.toString()];
    const prevDoneList = prevWeekData ? (prevWeekData.done || []).map(entry => entry.split('|')[0]) : null;

    let html = "";
    let doneCount = 0;

    state.plan.forEach((c, catIdx) => {
        html += `<div class="gym-cat">`;
        
        html += `<div class="cat-header">
                    <h2 style="font-weight:800; margin:0; font-size:1.25rem; flex-grow:1;" ${state.isEditMode ? `onclick="renameCategory(${catIdx})"` : ''}>${c.cat}</h2>
                    ${state.isEditMode ? `
                        <div class="edit-controls">
                            <div class="icon-btn del-btn" onclick="deleteCategory(${catIdx})">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </div>
                        </div>
                    ` : ''}
                 </div>`;
        
        c.items.forEach((i, itemIdx) => {
            let id = i.replace(/\s+/g,'_');
            let isDone = doneList.includes(id);
            if(isDone) doneCount++;

            // Check if missed last week (only if data exists for prev week and currently not done/or done, doesn't matter, it's a history fact)
            // Logic: IF prevWeekData exists AND item NOT in prevDoneList -> Missed
            let missedLabel = "";
            if (prevDoneList && !prevDoneList.includes(id)) {
                missedLabel = `<span style="font-size: 0.75rem; color: #f97316; font-weight: 600; margin-left: 8px;">(Minule vynecháno)</span>`;
            }

            if (state.isEditMode) {
                html += `<div class="gym-item" style="cursor: default;">
                    <span style="font-weight:500; flex-grow:1;">${i}</span>
                    <div class="icon-btn del-btn" onclick="deleteItem(${catIdx}, ${itemIdx})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </div>
                </div>`;
            } else {
                html += `<div class="gym-item ${isDone ? 'checked' : ''}" onclick="togGym('${id}', this)">
                    <div class="gym-box"></div><span style="font-weight:500;">${i} ${missedLabel}</span>
                </div>`;
            }
        });

        if (state.isEditMode) {
            html += `<div class="add-btn" onclick="addItem(${catIdx})">+ Přidat cvik</div>`;
        }

        html += `</div>`;
    });
    list.innerHTML = html;
    
    const bar = document.getElementById('gym-bar');
    const txt = document.getElementById('gym-text');
    if(bar) bar.style.width = (state.totalItems > 0 ? (doneCount/state.totalItems*100) : 0) + '%';
    if(txt) txt.innerText = `${doneCount} / ${state.totalItems} hotovo`;
}

function triggerAppRender() {
    if (window.renderApp) window.renderApp();
    else renderPlan();
}

export function togGym(id, el) {
    if (state.isEditMode) return;
    
    if (!state.weeks[state.currentWeekId]) return;
    
    const weekData = state.weeks[state.currentWeekId];
    const timestamp = Date.now();
    
    // Find if already done (independent of timestamp)
    let existingEntry = weekData.done.find(entry => entry.split('|')[0] === id);
    let idx = weekData.done.indexOf(existingEntry);
    
    if(idx > -1) {
        weekData.done.splice(idx, 1);
        el.classList.remove('checked');
    } else {
        // Store with timestamp for daily history
        weekData.done.push(`${id}|${timestamp}`);
        el.classList.add('checked');
        spawnPart(el);
    }
    
    weekData.total = state.totalItems;
    saveCloudWeekData(state.currentWeekId);
    
    const doneCount = weekData.done.length;
    const bar = document.getElementById('gym-bar');
    const txt = document.getElementById('gym-text');
    if(bar) bar.style.width = (state.totalItems > 0 ? (doneCount/state.totalItems*100) : 0) + '%';
    if(txt) txt.innerText = `${doneCount} / ${state.totalItems} hotovo`;
}

export function toggleEditMode() {
    state.isEditMode = !state.isEditMode;
    const btn = document.getElementById('edit-btn');
    const controls = document.getElementById('edit-controls-main');
    
    if (state.isEditMode) {
        if(btn) btn.classList.add('active');
        if(controls) controls.style.display = 'block';
    } else {
        if(btn) btn.classList.remove('active');
        if(controls) controls.style.display = 'none';
    }
    triggerAppRender();
}

export function addCategory() {
    const name = prompt("Název nové kategorie:");
    if (name) {
        state.plan.push({ cat: name, items: [] });
        calcTotalItems();
        saveCloudPlan();
        triggerAppRender();
    }
}

export function deleteCategory(idx) {
    if (confirm(`Opravdu smazat kategorii "${state.plan[idx].cat}"?`)) {
        state.plan.splice(idx, 1);
        calcTotalItems();
        saveCloudPlan();
        triggerAppRender();
    }
}

export function addItem(catIdx) {
    const name = prompt("Název nového cviku:");
    if (name) {
        state.plan[catIdx].items.push(name);
        calcTotalItems();
        saveCloudPlan();
        triggerAppRender();
    }
}

export function deleteItem(catIdx, itemIdx) {
    state.plan[catIdx].items.splice(itemIdx, 1);
    calcTotalItems();
    saveCloudPlan();
    triggerAppRender();
}

export function renameCategory(catIdx) {
     const newName = prompt("Nový název kategorie:", state.plan[catIdx].cat);
     if(newName) {
         state.plan[catIdx].cat = newName;
         saveCloudPlan();
         triggerAppRender();
     }
}

function spawnPart(el) {
    let rect = el.getBoundingClientRect();
    let emojis = ['🔥','💪','⚡','✨','🎯'];
    for(let i=0; i<8; i++) {
        let p = document.createElement('div');
        p.className = 'particle';
        p.innerText = emojis[Math.floor(Math.random()*emojis.length)];
        p.style.left = (rect.left + rect.width/2) + 'px';
        p.style.top = (rect.top + rect.height/2) + 'px';
        let a = Math.random() * Math.PI * 2;
        let d = 50 + Math.random()*50;
        p.style.setProperty('--tx', Math.cos(a)*d + 'px');
        p.style.setProperty('--ty', Math.sin(a)*d + 'px');
        p.style.animation = 'particle-burst 0.6s ease-out forwards';
        document.body.appendChild(p);
        setTimeout(()=>p.remove(), 600);
    }
}
