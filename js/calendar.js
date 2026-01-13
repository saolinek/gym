
export function renderCalendar() {
    const container = document.getElementById('view-calendar');
    if (!container) return;

    // Use DocumentFragment to reduce layout reflows
    const fragment = document.createDocumentFragment();

    const year = new Date().getFullYear();

    // Header
    const header = document.createElement('div');
    header.className = 'header-row';
    header.style.marginBottom = '24px';
    header.innerHTML = `<h1 class="gym-h1">Kalendář ${year}</h1>`;
    fragment.appendChild(header);

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;';

    const monthNames = [
        "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
        "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
    ];

    const dayNames = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    for (let m = 0; m < 12; m++) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'gym-cat';
        monthDiv.style.cssText = 'border-top: none; padding: 16px;';

        // Month Title
        const mTitle = document.createElement('h3');
        mTitle.innerText = monthNames[m];
        mTitle.style.cssText = 'text-align: center; margin: 0 0 12px 0; color: #334155;';
        monthDiv.appendChild(mTitle);

        // Days Header
        const daysHeader = document.createElement('div');
        daysHeader.style.cssText = 'display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 0.8rem; color: #64748b; margin-bottom: 8px;';

        dayNames.forEach(d => {
            const dEl = document.createElement('div');
            dEl.innerText = d;
            daysHeader.appendChild(dEl);
        });
        monthDiv.appendChild(daysHeader);

        // Calendar Grid - use DocumentFragment for days too
        const daysGrid = document.createElement('div');
        daysGrid.style.cssText = 'display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;';

        const daysFragment = document.createDocumentFragment();

        // Calculate days
        const firstDayDate = new Date(year, m, 1);
        let firstDay = firstDayDate.getDay();
        // JS getDay(): 0=Sun, 1=Mon. We want Mon=0, ..., Sun=6
        firstDay = (firstDay === 0) ? 6 : firstDay - 1;

        const daysInMonth = new Date(year, m + 1, 0).getDate();

        // Empty cells for days before start
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            daysFragment.appendChild(empty);
        }

        // Day cells
        const isCurrentMonth = (year === todayYear && m === todayMonth);

        for (let d = 1; d <= daysInMonth; d++) {
            const dayCell = document.createElement('div');
            dayCell.innerText = d;
            dayCell.style.cssText = 'text-align: center; padding: 6px 0; font-size: 0.9rem; border-radius: 6px;';

            // Highlight today
            if (isCurrentMonth && d === todayDate) {
                dayCell.style.cssText += 'background-color: #3b82f6; color: white; font-weight: bold;';
            }

            daysFragment.appendChild(dayCell);
        }

        daysGrid.appendChild(daysFragment);
        monthDiv.appendChild(daysGrid);
        grid.appendChild(monthDiv);
    }

    fragment.appendChild(grid);

    // Single DOM update
    container.innerHTML = '';
    container.appendChild(fragment);
}
