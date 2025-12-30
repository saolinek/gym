
import { state } from './data.js';

export function renderCharts() {
    if (!state.appReady) return;

    const container = document.getElementById('view-charts');
    if (!container) return;

    // Filter and sort weeks
    const weeks = Object.values(state.weeks).sort((a,b) => b.week - a.week);
    
    let html = `
        <h1 class="gym-h1" style="margin-bottom: 32px;">Přehled aktivity</h1>
        <div style="display: flex; flex-direction: column; gap: 12px; max-width: 500px; margin: 0 auto;">
    `;

    weeks.forEach(w => {
        const isCurrent = w.week.toString() === state.currentWeekId;
        const d = new Date(w.week);
        const endD = new Date(d); endD.setDate(d.getDate() + 6);
        
        const label = isCurrent ? "Tento týden" : `${d.getDate()}.${d.getMonth()+1}. – ${endD.getDate()}.${endD.getMonth()+1}.`;
        const count = w.done ? w.done.length : 0;

        html += `
            <div class="history-card" style="margin-bottom: 0; padding: 16px 24px; border-top: none; border-left: 5px solid ${isCurrent ? '#3b82f6' : '#cbd5e1'}">
                <div style="font-weight: 600; color: ${isCurrent ? '#1e293b' : '#64748b'};">${label}</div>
                <div style="text-align: right;">
                    <div style="font-size: 1.5rem; font-weight: 900; color: #1e293b;">${count}</div>
                    <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">splněno</div>
                </div>
            </div>
        `;
    });

    if (weeks.length === 0) {
        html += "<div style='text-align:center; padding:40px; color:#94a3b8;'>Zatím žádná data k zobrazení.</div>";
    }

    html += `</div>`;
    container.innerHTML = html;
}
