import { state, getMondayTimestamp } from './data.js';

// === VIEW STATE ===
let viewedWeekOffset = 0; // 0 = current week, -1 = previous week, etc.

// === NAVIGATION ===
export function navigateWeek(direction) {
    viewedWeekOffset += direction;
    renderHistory();
}

// Reset offset when switching to week view
export function resetWeekOffset() {
    viewedWeekOffset = 0;
}

// === MEMOIZED CATEGORY LOOKUP MAP ===
let categoryLookupCache = {
    planVersion: null,
    map: null
};

function getCategoryLookupMap() {
    // Rebuild map only if plan changed (simple version check via length + first item)
    const planKey = state.plan.length + (state.plan[0]?.cat || '');

    if (categoryLookupCache.planVersion === planKey && categoryLookupCache.map) {
        return categoryLookupCache.map;
    }

    const map = new Map();
    // Include ALL categories (including OSTATNÍ) for weekly view display
    state.plan.forEach(c => {
        c.items.forEach(item => {
            map.set(item.replace(/\s+/g, '_'), c.cat);
        });
    });

    categoryLookupCache.planVersion = planKey;
    categoryLookupCache.map = map;
    return map;
}

export function renderHistory() {
    if (!state.appReady) return;

    const container = document.getElementById('history-list');
    if (!container) return;

    // Calculate viewed week based on offset
    const today = new Date();
    const currentMonday = getMondayTimestamp(today);
    const viewedMonday = new Date(currentMonday);
    viewedMonday.setDate(viewedMonday.getDate() + (viewedWeekOffset * 7));
    const viewedWeekId = viewedMonday.getTime().toString();
    
    // Update date label
    const dateEl = document.getElementById('current-week-date');
    if (dateEl) {
        const endDate = new Date(viewedMonday);
        endDate.setDate(viewedMonday.getDate() + 6);
        const isCurrentWeek = viewedWeekOffset === 0;
        const weekLabel = isCurrentWeek ? '' : ` (${viewedWeekOffset > 0 ? '+' : ''}${viewedWeekOffset} týden${Math.abs(viewedWeekOffset) > 1 ? 'ů' : ''})`;
        dateEl.innerHTML = `
            <button onclick="navigateWeek(-1)" style="background: none; border: none; cursor: pointer; padding: 8px 12px; font-size: 1.2rem; color: #3b82f6;">←</button>
            <span style="min-width: 140px; display: inline-block;">${viewedMonday.getDate()}.${viewedMonday.getMonth() + 1}. – ${endDate.getDate()}.${endDate.getMonth() + 1}.${weekLabel}</span>
            <button onclick="navigateWeek(1)" style="background: none; border: none; cursor: pointer; padding: 8px 12px; font-size: 1.2rem; color: #3b82f6;" ${viewedWeekOffset >= 0 ? 'disabled style="opacity: 0.3; cursor: default; background: none; border: none; padding: 8px 12px; font-size: 1.2rem; color: #3b82f6;"' : ''}>→</button>
        `;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 8px; padding: 10px 0;">';

    const viewedWeek = state.weeks[viewedWeekId];
    const dayNames = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];
    const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Monday (1) to Sunday (0)

    // Get memoized lookup map for O(1) category resolution
    const categoryMap = getCategoryLookupMap();

    dayIndices.forEach((dayIdx, i) => {
        let dayActivityHtml = "";

        if (viewedWeek) {
            // Calculate exact date for this day in the viewed week
            const targetDate = new Date(viewedMonday);
            targetDate.setDate(viewedMonday.getDate() + i); // i = 0 (Monday) to 6 (Sunday)

            const dayDone = (viewedWeek.done || []).filter(entry => {
                const parts = entry.split('|');
                if (parts.length < 2) return false;
                const d = new Date(parseInt(parts[1]));
                // Compare exact date, not just day of week
                return d.getDate() === targetDate.getDate() &&
                    d.getMonth() === targetDate.getMonth() &&
                    d.getFullYear() === targetDate.getFullYear();
            });

            if (dayDone.length > 0) {
                const catCounts = {};
                dayDone.forEach(entry => {
                    const id = entry.split('|')[0];
                    // O(1) lookup instead of O(n) .find()
                    const category = categoryMap.get(id);
                    if (category) {
                        catCounts[category] = (catCounts[category] || 0) + 1;
                    }
                });

                let prevailingCat = "Smíšené";
                const entries = Object.entries(catCounts);

                if (entries.length > 0) {
                    const sortedCats = entries.sort((a, b) => b[1] - a[1]);
                    if (sortedCats.length > 1 && sortedCats[0][1] === sortedCats[1][1]) {
                        prevailingCat = "Smíšené";
                    } else {
                        prevailingCat = sortedCats[0][0];
                    }

                    dayActivityHtml = `<span style="margin-left: auto; font-weight: 800; color: #3b82f6;">${dayDone.length} ${prevailingCat}</span>`;
                }
            }
        }

        html += `
        <div style="display: flex; align-items: center; padding: 12px 16px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
            <span style="font-weight: 600; color: #64748b;">${dayNames[i]}</span>
            ${dayActivityHtml}
        </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
}