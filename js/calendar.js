import { state } from './data.js';

export function renderCalendar() {
    const container = document.getElementById('view-month');
    if (!container) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11

    const monthNames = [
        "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
        "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
    ];

    // --- 1. GATHER DATA ---
    const activeDays = new Set();
    let totalItems = 0;

    Object.values(state.weeks).forEach(week => {
        if (!week.done) return;
        week.done.forEach(entry => {
            const parts = entry.split('|');
            if (parts.length < 2) return;
            const ts = parseInt(parts[1]);
            const d = new Date(ts);

            if (d.getMonth() === month && d.getFullYear() === year) {
                activeDays.add(d.getDate());
                totalItems++;
            }
        });
    });

    // --- 2. RENDER HEADER & SUMMARY ---
    let html = `
        <div class="header-row">
            <h1 class="gym-h1">${monthNames[month]} ${year}</h1>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 32px;">
            <div class="gym-cat" style="flex:1; padding: 16px; margin: 0; text-align: center; border-top-color: #3b82f6;">
                <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 4px;">Aktivní dny</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #1e293b;">${activeDays.size}</div>
            </div>
            <div class="gym-cat" style="flex:1; padding: 16px; margin: 0; text-align: center; border-top-color: #8b5cf6;">
                <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 4px;">Celkem cviků</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #1e293b;">${totalItems}</div>
            </div>
        </div>
    `;

    // --- 3. RENDER CALENDAR GRID ---
    html += `<div class="gym-cat" style="padding: 20px; border-top: none;">`;

    // Days Header
    const dayNames = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
    html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 12px; font-weight: 600; color: #94a3b8; font-size: 0.9rem;">`;
    dayNames.forEach(d => html += `<div>${d}</div>`);
    html += `</div>`;

    // Days Grid
    html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">`;

    const firstDayDate = new Date(year, month, 1);
    let firstDay = firstDayDate.getDay(); // 0=Sun
    firstDay = (firstDay === 0) ? 6 : firstDay - 1; // 0=Mon

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        html += `<div></div>`;
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
        const isActive = activeDays.has(d);
        const isToday = (d === today.getDate());

        let cellClass = 'day-cell';
        if (isActive) cellClass += ' active';
        if (isToday) cellClass += ' today';

        html += `<div class="${cellClass}">${d}</div>`;
    }

    html += `</div></div>`; // Close grid and card

    container.innerHTML = html;
}
