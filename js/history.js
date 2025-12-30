
import { state } from './data.js';

export function renderHistory() {
    if (!state.appReady) return;

    const container = document.getElementById('history-list');
    if (!container) return;
    
    let html = "";

    // 1. Current Week Breakdown (Mon-Fri)
    const currentWeek = state.weeks[state.currentWeekId];
    if (currentWeek) {
        html += `<div style="margin-bottom: 32px;">
                    <h2 style="font-weight: 800; font-size: 1.25rem; color: #1e293b; margin-bottom: 16px;">Aktuální týden (Po–Pá)</h2>`;
        
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
        html += `</div>`;
    }

    // 2. Past Weeks Summary
    html += `<h2 style="font-weight: 800; font-size: 1.25rem; color: #1e293b; margin-bottom: 16px;">Minulé týdny</h2>`;
    const weeks = Object.values(state.weeks).sort((a,b) => b.week - a.week);
    let pastWeeksHtml = "";
    
    weeks.forEach(w => {
        if (w.week.toString() === state.currentWeekId) return;
        
        const d = new Date(w.week);
        const endD = new Date(d); endD.setDate(d.getDate() + 6);
        const count = w.done ? w.done.length : 0;
        const tot = w.total || state.totalItems;
        const perc = tot > 0 ? Math.round((count/tot)*100) : 0;
        
        pastWeeksHtml += `
        <div class="history-card">
            <div class="history-date">${d.getDate()}.${d.getMonth()+1}. – ${endD.getDate()}.${endD.getMonth()+1}.</div>
            <div class="history-stats">
                <div class="history-perc">${perc}%</div>
                <div class="history-count">${count} / ${tot}</div>
            </div>
        </div>`;
    });
    
    if (pastWeeksHtml === "") pastWeeksHtml = "<div style='text-align:center; padding:20px; color:#94a3b8;'>Žádná historie</div>";
    
    container.innerHTML = html + pastWeeksHtml;
}
