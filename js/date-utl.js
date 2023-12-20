const svgNS = 'http://www.w3.org/2000/svg';

export function createGridLines(dateGroup, chartWidth, taskCount) {
    const gridLines = document.createElementNS(svgNS, 'g');
    gridLines.classList.add('lines')
    dateGroup.appendChild(gridLines)
    for (let i = 0; i <= chartWidth; i += 50) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', i);
        line.setAttribute('x2', i);
        line.setAttribute('y1', 35);
        line.setAttribute('y2', taskCount * 40 + 40);
        line.classList.add('grid-line');
        gridLines.appendChild(line);
    }
}

export function createMonthHeadings(dateGroup, dateInfo, chartWidth) {
    const month = document.createElementNS(svgNS, 'g');
    month.classList.add('month')
    dateGroup.appendChild(month)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let currentMonth = -1;

    for (let i = 0; i <= chartWidth; i += 50) {
        const currentDate = new Date(dateInfo.startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
        const monthIndex = currentDate.getMonth();
        if (monthIndex !== currentMonth) {
            currentMonth = monthIndex;

            const monthHeading = document.createElementNS(svgNS, 'text');
            monthHeading.setAttribute('x', i);
            monthHeading.setAttribute('y', 10);
            monthHeading.classList.add('month-heading');
            monthHeading.textContent = months[currentMonth];
            month.appendChild(monthHeading);
        }
    }
}

export function createDateScale(dateGroup, dateInfo, chartWidth, taskCount) {
    const date = document.createElementNS(svgNS, 'g')
    dateGroup.appendChild(date)
    date.classList.add('date')
    const dateScale = document.createElementNS(svgNS, 'text');
    dateScale.setAttribute('x', '0');
    dateScale.setAttribute('y', taskCount);
    date.appendChild(dateScale);
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i <= chartWidth; i += 50) {
        const currentDate = new Date(dateInfo.startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', i - 3);
        text.setAttribute('font-size','10px')
        text.setAttribute('y', 30);
        text.textContent = currentDate.getDate();
        const day = document.createElementNS(svgNS, 'text');
        day.setAttribute('x', i - 3);
        day.setAttribute('y', 20);
        day.setAttribute('font-size','10px')
        day.textContent = daysOfWeek[currentDate.getDay()]
        date.appendChild(text);
        date.appendChild(day)
    }
}
