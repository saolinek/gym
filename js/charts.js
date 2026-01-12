
import { state } from './data.js';

export function renderCharts() {
    if (!state.appReady) return;

    const container = document.getElementById('view-charts');
    if (!container) return;

    // Filter and sort weeks (chronological for chart)
    const weeks = Object.values(state.weeks).sort((a, b) => a.week - b.week);

    let html = `
        <h1 class="gym-h1" style="margin-bottom: 32px;">Vývoj aktivity</h1>
        <div class="chart-box">
            <div class="chart-title" style="margin-bottom: 24px;">Splněné cviky za týden</div>
            <div id="main-chart-container"></div>
        </div>
    `;

    container.innerHTML = html;

    const chartTarget = document.getElementById('main-chart-container');
    if (weeks.length === 0) {
        chartTarget.innerHTML = "<div style='text-align:center; padding:40px; color:#94a3b8;'>Zatím žádná data k zobrazení.</div>";
        return;
    }

    // Generate Bar Chart SVG
    const w = 300, h = 180; // Increased height for date ranges
    const padding = { top: 25, right: 10, bottom: 45, left: 10 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const barW = (chartW / weeks.length) * 0.6;
    const gap = (chartW / weeks.length) * 0.4;
    const maxVal = Math.max(...weeks.map(wk => wk.done ? wk.done.length : 0), 5);

    let svg = `<svg viewBox="0 0 ${w} ${h}" style="width: 100%; height: auto; overflow: visible;">`;

    weeks.forEach((wk, i) => {
        const count = wk.done ? wk.done.length : 0;
        const barH = (count / maxVal) * chartH;
        const x = padding.left + i * (barW + gap) + gap / 2;
        const y = h - padding.bottom - barH;

        // Bar
        svg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="#3b82f6" rx="4" />`;

        // Date Range Label (Mon - Sun)
        const mon = new Date(wk.week);
        const sun = new Date(wk.week);
        sun.setDate(mon.getDate() + 6);

        const dateRange = `${mon.getDate()}.${mon.getMonth() + 1}.–${sun.getDate()}.${sun.getMonth() + 1}.`;

        // Split label or rotate if needed, but here we'll try two lines or small font
        svg += `<text x="${x + barW / 2}" y="${h - 25}" class="chart-label" style="font-size: 6.5px; fill: #94a3b8; text-anchor: middle;">${mon.getDate()}.${mon.getMonth() + 1}. –</text>`;
        svg += `<text x="${x + barW / 2}" y="${h - 15}" class="chart-label" style="font-size: 6.5px; fill: #94a3b8; text-anchor: middle;">${sun.getDate()}.${sun.getMonth() + 1}.</text>`;

        // Count Label
        if (count > 0) {
            svg += `<text x="${x + barW / 2}" y="${y - 8}" class="chart-label" style="font-size: 10px; font-weight: 900; fill: #1e293b; text-anchor: middle;">${count}</text>`;
        }
    });

    svg += `</svg>`;
    chartTarget.innerHTML = svg;
}
