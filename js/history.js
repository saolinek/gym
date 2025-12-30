import { state } from './data.js';

export function renderHistory() {
    if (!state.appReady) return;

    const container = document.getElementById('history-list');
    if (!container) return;
    
    // Fail-safe access
    if (!state.weeks) {
        container.innerHTML = "<div style='text-align:center; padding:20px; color:#94a3b8;'>Žádná historie</div>";
        return;
    }
    
    const weeks = Object.values(state.weeks).sort((a,b) => b.week - a.week);
    let html = "";
    
    weeks.forEach(w => {
        if (w.week.toString() === state.currentWeekId) return;
        
        const d = new Date(w.week);
        const endD = new Date(d); endD.setDate(d.getDate() + 6);
        const count = w.done ? w.done.length : 0;
        
        const tot = w.total || state.totalItems;
        const perc = tot > 0 ? Math.round((count/tot)*100) : 0;
        
        html += `<div class="history-card">
                    <div class="history-date">${d.getDate()}.${d.getMonth()+1}. – ${endD.getDate()}.${endD.getMonth()+1}.</div>
                    <div class="history-stats">
                        <div class="history-perc">${perc}%</div>
                        <div class="history-count">${count} / ${tot}</div>
                    </div>
                </div>`;
    });
    
    if (html === "") html = "<div style='text-align:center; padding:20px; color:#94a3b8;'>Žádná historie</div>";
    container.innerHTML = html;
}