import { state } from './data.js';

export function renderCharts() {
    if (!state.appReady) return;
    const container = document.getElementById('view-year');
    if (!container) return;

    const year = new Date().getFullYear();
    const monthlyCounts = new Array(12).fill(0);

    // Aggregate data
    Object.values(state.weeks).forEach(week => {
        if (!week.done) return;
        week.done.forEach(entry => {
            const parts = entry.split('|');
            if (parts.length < 2) return;
            const d = new Date(parseInt(parts[1]));
            if (d.getFullYear() === year) {
                monthlyCounts[d.getMonth()]++;
            }
        });
    });

    const maxCount = Math.max(...monthlyCounts, 10);

    const monthNames = [
        "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
        "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
    ];

    let html = `
        <div class="header-row">
            <h1 class="gym-h1">Rok ${year}</h1>
        </div>
        <div class="gym-sub">Celkový přehled aktivity</div>

        <div class="gym-cat" style="padding: 24px;">
    `;

    monthNames.forEach((name, idx) => {
        const count = monthlyCounts[idx];
        const pct = (count / maxCount) * 100;

        const isFuture = idx > new Date().getMonth();
        const opacity = isFuture ? 0.3 : 1;

        // Use inline style for text color that works on white/dark or inherit
        // But gym-cat has specific bg/color.
        // Need to ensure text is visible. Inherit should work with dark mode classes.

        html += `
            <div style="margin-bottom: 16px; opacity: ${opacity};">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.9rem; font-weight: 600; opacity: 0.8;">
                    <span>${name}</span>
                    <span>${count}</span>
                </div>
                <div class="prog-track">
                    <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 5px;"></div>
                </div>
            </div>
        `;
    });

    html += `</div>`;

    // Total for year
    const totalYear = monthlyCounts.reduce((a, b) => a + b, 0);
    html += `
        <div style="text-align: center; opacity: 0.7; margin-top: 24px;">
            Celkem v roce ${year}: <strong style="opacity: 1;">${totalYear}</strong> splněných položek
        </div>
    `;

    container.innerHTML = html;
}
