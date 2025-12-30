import { state } from './data.js';

export function renderHistory() {
    if (!state.appReady) return;

    const container = document.getElementById('history-list');
    if (!container) return;
    
    let html = `
        <h2 style="font-weight: 800; font-size: 1.25rem; color: #1e293b; margin-bottom: 16px;">Pracovní týden (Po–Pá)</h2>
    `;

    // 1. Current Week Data
    const currentWeek = state.weeks[state.currentWeekId];
    if (currentWeek) {
        const dayNames = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek"];
        const dayIndices = [1, 2, 3, 4, 5]; // Mon to Fri

        dayIndices.forEach((dayIdx, i) => {
            const dayDone = (currentWeek.done || []).filter(entry => {
                const parts = entry.split('|');
                if (parts.length < 2) return false;
                const d = new Date(parseInt(parts[1]));
                return d.getDay() === dayIdx;
            });

            let prevailingCat = "Žádná data";
            if (dayDone.length > 0) {
                const catCounts = {};
                dayDone.forEach(entry => {
                    const id = entry.split('|')[0];
                    const category = state.plan.find(c => c.items.some(item => item.replace(/\s+/g,'_') === id));
                    if (category && category.cat !== "OSTATNÍ") {
                        catCounts[category.cat] = (catCounts[category.cat] || 0) + 1;
                    }
                });

                const sortedCats = Object.entries(catCounts).sort((a,b) => b[1] - a[1]);
                if (sortedCats.length > 0) prevailingCat = sortedCats[0][0];
                else prevailingCat = "Smíšený trénink";
            }

            html += `
            <div class="history-card" style="margin-bottom: 8px; border-left: 4px solid #3b82f6;">
                <div class="history-date">${dayNames[i]}</div>
                <div class="history-stats">
                    <div class="history-perc" style="font-size: 0.9rem; color: #64748b;">Splněno: ${dayDone.length}</div>
                    <div class="history-count" style="color: #1e293b;">${prevailingCat}</div>
                </div>
            </div>`;
        });
    } else {
        html += "<div style='text-align:center; padding:20px; color:#94a3b8;'>Žádná data pro tento týden.</div>";
    }

    // No past weeks rendering as requested.
    container.innerHTML = html;
}