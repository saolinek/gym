import { state } from './data.js';

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
    state.plan.forEach(c => {
        if (c.cat !== "OSTATNÍ") {
            c.items.forEach(item => {
                map.set(item.replace(/\s+/g, '_'), c.cat);
            });
        }
    });

    categoryLookupCache.planVersion = planKey;
    categoryLookupCache.map = map;
    return map;
}

export function renderHistory() {
    if (!state.appReady) return;

    const container = document.getElementById('history-list');
    if (!container) return;

    let html = '<div style="display: flex; flex-direction: column; gap: 8px; padding: 10px 0;">';

    const currentWeek = state.weeks[state.currentWeekId];
    const dayNames = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];
    const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Monday (1) to Sunday (0)

    // Get memoized lookup map for O(1) category resolution
    const categoryMap = getCategoryLookupMap();

    dayIndices.forEach((dayIdx, i) => {
        let dayActivityHtml = "";

        if (currentWeek) {
            const dayDone = (currentWeek.done || []).filter(entry => {
                const parts = entry.split('|');
                if (parts.length < 2) return false;
                const d = new Date(parseInt(parts[1]));
                return d.getDay() === dayIdx;
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