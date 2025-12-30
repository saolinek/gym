import { state } from './data.js';

export function renderCharts() {
    if (!state.appReady) return;

    const container = document.getElementById('view-charts');
    if (!container) return;

    // Filter and sort weeks (chronological for chart)
    const weeks = Object.values(state.weeks).sort((a,b) => a.week - b.week).slice(-10);
    
    let html = `
        <h1 class="gym-h1" style="margin-bottom: 32px;">Vývoj aktivity</h1>
        <div class="chart-box">
            <div class="chart-title">Splněné cviky za týden</div>
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
    const w = 300, h = 150;
    const padding = { top: 20, right: 10, bottom: 20, left: 10 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    
    const barW = (chartW / weeks.length) * 0.6;
    const gap = (chartW / weeks.length) * 0.4;
    const maxVal = Math.max(...weeks.map(wk => wk.done ? wk.done.length : 0), 5); // min max of 5 for scale
    
    let svg = `<svg viewBox="0 0 ${w} ${h}" style="width: 100%; height: auto;">`;
    
    weeks.forEach((wk, i) => {
        const count = wk.done ? wk.done.length : 0;
        const barH = (count / maxVal) * chartH;
        const x = padding.left + i * (barW + gap) + gap/2;
        const y = h - padding.bottom - barH;
        
        // Bar
        svg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" class="bar-rect" fill="#3b82f6" rx="4" />`;
        
        // Date Label (Mon date)
        const d = new Date(wk.week);
        svg += `<text x="${x + barW/2}" y="${h - 5}" class="chart-label" style="font-size: 8px; fill: #94a3b8; text-anchor: middle;">${d.getDate()}.${d.getMonth()+1}.</text>`;
        
        // Count Label
        if(count > 0) {
            svg += `<text x="${x + barW/2}" y="${y - 5}" class="chart-label" style="font-size: 9px; font-weight: bold; fill: #1e293b; text-anchor: middle;">${count}</text>`;
        }
    });
    
    svg += `</svg>`;
    chartTarget.innerHTML = svg;
}