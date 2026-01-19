import { state } from './data.js';

// === VIEW STATE ===
let viewedYearOffset = 0;

// === NAVIGATION ===
export function navigateYear(direction) {
    viewedYearOffset += direction;
    renderCharts();
}

export function resetYearOffset() {
    viewedYearOffset = 0;
}

export function renderCharts() {
    if (!state.appReady) return;
    const container = document.getElementById('view-year');
    if (!container) return;

    const today = new Date();
    const year = today.getFullYear() + viewedYearOffset;
    const isCurrentYear = viewedYearOffset === 0;
    const currentMonth = today.getMonth();

    // === 1. AGGREGATE DATA ===
    const monthlyData = new Array(12).fill(null).map(() => ({ count: 0, activeDays: new Set() }));
    let totalYear = 0;
    let activeDaysYear = new Set();
    let bestStreak = 0;
    let currentStreak = 0;
    let lastActiveDate = null;

    Object.values(state.weeks).forEach(week => {
        if (!week.done) return;
        week.done.forEach(entry => {
            const parts = entry.split('|');
            if (parts.length < 2) return;
            const ts = parseInt(parts[1]);
            const d = new Date(ts);
            if (d.getFullYear() === year) {
                const monthIdx = d.getMonth();
                const dayKey = `${d.getMonth()}-${d.getDate()}`;

                monthlyData[monthIdx].count++;
                monthlyData[monthIdx].activeDays.add(d.getDate());
                activeDaysYear.add(dayKey);
                totalYear++;
            }
        });
    });

    // Calculate best month
    let bestMonth = 0;
    let bestMonthCount = 0;
    monthlyData.forEach((m, idx) => {
        if (m.count > bestMonthCount) {
            bestMonthCount = m.count;
            bestMonth = idx;
        }
    });

    const monthNames = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čvn", "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"];
    const monthNamesFull = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];

    // === 2. RENDER HEADER ===
    let html = `
        <div class="header-row" style="justify-content: center; gap: 16px; margin-bottom: 8px;">
            <button onclick="navigateYear(-1)" style="background: none; border: none; cursor: pointer; padding: 8px 16px; font-size: 1.5rem; color: #3b82f6;">←</button>
            <h1 class="gym-h1" style="min-width: 120px; text-align: center;">${year}</h1>
            <button onclick="navigateYear(1)" style="background: none; border: none; cursor: pointer; padding: 8px 16px; font-size: 1.5rem; color: #3b82f6; ${viewedYearOffset >= 0 ? 'opacity: 0.3; cursor: default;' : ''}" ${viewedYearOffset >= 0 ? 'disabled' : ''}>→</button>
        </div>
    `;

    // === 3. SUMMARY CARDS ===
    const avgPerMonth = Math.round(totalYear / (isCurrentYear ? currentMonth + 1 : 12));
    html += `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px;">
            <div class="gym-cat" style="padding: 16px; margin: 0; text-align: center; border-top-color: #3b82f6;">
                <div style="font-size: 2rem; font-weight: 800; color: #3b82f6;">${totalYear}</div>
                <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">CELKEM</div>
            </div>
            <div class="gym-cat" style="padding: 16px; margin: 0; text-align: center; border-top-color: #22c55e;">
                <div style="font-size: 2rem; font-weight: 800; color: #22c55e;">${activeDaysYear.size}</div>
                <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">AKTIVNÍCH DNŮ</div>
            </div>
            <div class="gym-cat" style="padding: 16px; margin: 0; text-align: center; border-top-color: #8b5cf6;">
                <div style="font-size: 2rem; font-weight: 800; color: #8b5cf6;">${avgPerMonth}</div>
                <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">∅ / MĚSÍC</div>
            </div>
        </div>
    `;

    // === 4. MONTHLY GRID (4x3) ===
    const maxCount = Math.max(...monthlyData.map(m => m.count), 1);

    html += `<div class="gym-cat" style="padding: 16px; border-top: none;">`;
    html += `<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">`;

    monthlyData.forEach((data, idx) => {
        const isFuture = isCurrentYear && idx > currentMonth;
        const isBest = idx === bestMonth && data.count > 0;
        const intensity = data.count / maxCount;

        // Color based on activity intensity
        let bgColor = '#f8fafc';
        let textColor = '#64748b';
        let borderColor = '#e2e8f0';

        if (!isFuture && data.count > 0) {
            if (intensity > 0.7) {
                bgColor = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                textColor = 'white';
                borderColor = 'transparent';
            } else if (intensity > 0.4) {
                bgColor = '#dbeafe';
                textColor = '#1d4ed8';
                borderColor = '#93c5fd';
            } else {
                bgColor = '#f0fdf4';
                textColor = '#16a34a';
                borderColor = '#86efac';
            }
        }

        html += `
            <div style="
                background: ${bgColor};
                border-radius: 16px;
                padding: 12px 8px;
                text-align: center;
                border: 2px solid ${borderColor};
                opacity: ${isFuture ? 0.3 : 1};
                ${isBest ? 'box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.5);' : ''}
            ">
                <div style="font-size: 0.7rem; font-weight: 700; color: ${textColor}; opacity: 0.8; margin-bottom: 4px;">
                    ${monthNames[idx]}
                </div>
                <div style="font-size: 1.4rem; font-weight: 800; color: ${textColor};">
                    ${data.count}
                </div>
                <div style="font-size: 0.65rem; color: ${textColor}; opacity: 0.7; margin-top: 2px;">
                    ${data.activeDays.size} dnů
                </div>
            </div>
        `;
    });

    html += `</div></div>`; // Close grid and card

    // === 5. BEST MONTH HIGHLIGHT ===
    if (bestMonthCount > 0) {
        html += `
            <div style="text-align: center; margin-top: 20px; padding: 16px; background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.2)); border-radius: 16px; border: 1px solid rgba(251, 191, 36, 0.3);">
                <div style="font-size: 0.8rem; color: #92400e; font-weight: 600;">🏆 Nejlepší měsíc</div>
                <div style="font-size: 1.2rem; font-weight: 800; color: #b45309; margin-top: 4px;">
                    ${monthNamesFull[bestMonth]} – ${bestMonthCount} cviků
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}
