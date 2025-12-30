import { state } from './data.js';

export function renderHistory() {
    if (!state.appReady) return;

    const container = document.getElementById('history-list');
    if (!container) return;
    
    let html = '<div style="display: flex; flex-direction: column; gap: 8px; padding: 10px 0;">';

    const currentWeek = state.weeks[state.currentWeekId];
    const dayNames = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek"];
    const dayIndices = [1, 2, 3, 4, 5]; // Monday (1) to Friday (5)

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
                    const category = state.plan.find(c => c.items.some(item => item.replace(/\s+/g,'_') === id));
                    if (category && category.cat !== "OSTATNÍ") {
                        catCounts[category.cat] = (catCounts[category.cat] || 0) + 1;
                    }
                });

                let prevailingCat = "Smíšené";
                const entries = Object.entries(catCounts);
                
                if (entries.length > 0) {
                    const sortedCats = entries.sort((a,b) => b[1] - a[1]);
                    if (sortedCats.length > 1 && sortedCats[0][1] === sortedCats[1][1]) {
                        prevailingCat = "Smíšené";
                    } else {
                        prevailingCat = sortedCats[0][0];
                    }
                    
                    dayActivityHtml = `<span style="margin-left: auto; font-weight: 800; color: #3b82f6;">${dayDone.length} ${prevailingCat}</span>`;
                }
                // If entries.length is 0 (only OSTATNÍ or no identified categories), show nothing specific or just count?
                // The requirement: "Pokud den nemá aktivitu: zobraz pouze název dne".
                // If it has activity but it's ignored (OSTATNÍ), effectively it might look like no activity if we strictly follow logic.
                // However, requirement 3 says "Kategorie Ostatní ignoruj".
                // If dayDone > 0 but no valid category (all OSTATNÍ), entries is empty.
                // Requirement 2: "Pokud má den aktivitu: zobraz 'číslo + kategorie'".
                // If the only activity is OSTATNÍ, and we ignore it for category determination...
                // The code above calculates counts excluding OSTATNÍ.
                // If only OSTATNÍ exists, entries is empty, dayActivityHtml remains "".
                // This seems consistent with "ignoring" OSTATNÍ for the summary.
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