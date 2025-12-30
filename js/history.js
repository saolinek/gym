
import { state } from './data.js';

export function renderHistory() {
    if (!state.appReady) return;

    const container = document.getElementById('history-list');
    if (!container) return;
    
    let html = '<div style="display: flex; flex-direction: column; gap: 12px; padding: 10px 0;">';

    const currentWeek = state.weeks[state.currentWeekId];
    if (currentWeek) {
        const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Pondělí (1) až Neděle (0)

        dayIndices.forEach(dayIdx => {
            const dayDone = (currentWeek.done || []).filter(entry => {
                const parts = entry.split('|');
                if (parts.length < 2) return false;
                const d = new Date(parseInt(parts[1]));
                return d.getDay() === dayIdx;
            });

            // Zobrazuj pouze dny s aktivitou > 0
            if (dayDone.length > 0) {
                const catCounts = {};
                dayDone.forEach(entry => {
                    const id = entry.split('|')[0];
                    const category = state.plan.find(c => c.items.some(item => item.replace(/\s+/g,'_') === id));
                    // Kategorie "OSTATNÍ" se ignoruje pro určení převládající kategorie
                    if (category && category.cat !== "OSTATNÍ") {
                        catCounts[category.cat] = (catCounts[category.cat] || 0) + 1;
                    }
                });

                let prevailingCat = "Smíšené";
                const entries = Object.entries(catCounts);
                
                if (entries.length > 0) {
                    const sortedCats = entries.sort((a,b) => b[1] - a[1]);
                    // Kontrola, zda první kategorie skutečně převládá (není tam remíza na prvním místě)
                    if (sortedCats.length > 1 && sortedCats[0][1] === sortedCats[1][1]) {
                        prevailingCat = "Smíšené";
                    } else {
                        prevailingCat = sortedCats[0][0];
                    }
                }

                // Minimalistický formát: "Počet Kategorie"
                html += `
                <div style="font-weight: 800; font-size: 1.5rem; color: #1e293b; letter-spacing: -0.5px;">
                    <span style="color: #3b82f6;">${dayDone.length}</span> ${prevailingCat}
                </div>`;
            }
        });
    }

    html += '</div>';
    
    // Fallback pokud není žádná aktivita v celém týdnu
    if (html === '<div style="display: flex; flex-direction: column; gap: 12px; padding: 10px 0;"></div>') {
        html = "<div style='text-align:center; padding:40px; color:#94a3b8; font-weight:500;'>Zatím žádná aktivita</div>";
    }
    
    container.innerHTML = html;
}
