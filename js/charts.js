import { state } from './data.js';

export function renderCharts() {
    if (!state.appReady) return;

    if (!state.weeks) return;
    const weeks = Object.values(state.weeks).sort((a,b) => a.week - b.week).slice(-10);
    
    // 1. Bar Chart (Count)
    const elCount = document.getElementById('chart-count');
    if (elCount) {
        if (weeks.length === 0) { 
            elCount.innerHTML = "<div style='text-align:center; color:#ccc; padding:20px;'>Žádná data</div>"; 
        } else {
            const w = 300, h = 150;
            const barW = (w / weeks.length) * 0.6;
            const gap = (w / weeks.length) * 0.4;
            const maxVal = Math.max(...weeks.map(wk => wk.total || state.totalItems)) || 1;
            
            let svg = `<svg viewBox="0 0 ${w} ${h}">`;
            weeks.forEach((wk, i) => {
                const count = wk.done ? wk.done.length : 0;
                const barH = (count / maxVal) * (h - 20);
                const x = i * (barW + gap) + 10;
                const y = h - barH - 20;
                svg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" class="bar-rect" /><text x="${x + barW/2}" y="${h}" class="chart-label">${new Date(wk.week).getDate()}.${new Date(wk.week).getMonth()+1}.</text>`;
                if(count > 0) svg += `<text x="${x + barW/2}" y="${y-5}" class="chart-label" style="font-weight:bold;">${count}</text>`;
            });
            svg += `</svg>`;
            elCount.innerHTML = svg;
        }
    }

    // 2. Line Chart (Percent)
    const elPerc = document.getElementById('chart-percent');
    if (elPerc) {
         if (weeks.length === 0) { 
             elPerc.innerHTML = "<div style='text-align:center; color:#ccc; padding:20px;'>Žádná data</div>"; 
         } else {
            const w = 300, h = 150;
            let svg = `<svg viewBox="0 0 ${w} ${h}">`;
            let points = "";
            weeks.forEach((wk, i) => {
                const count = wk.done ? wk.done.length : 0;
                const tot = wk.total || state.totalItems;
                const perc = tot > 0 ? (count / tot) : 0;
                const x = (i / (weeks.length - 1 || 1)) * (w - 20) + 10;
                const y = h - (perc * (h - 30)) - 20;
                
                points += `${x},${y} `;
                svg += `<circle cx="${x}" cy="${y}" r="4" class="chart-dot" /><text x="${x}" y="${y-10}" class="chart-label">${Math.round(perc*100)}%</text>`;
            });
            svg += `<polyline points="${points}" class="chart-line" /></svg>`;
            elPerc.innerHTML = svg;
        }
    }
}