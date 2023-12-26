import { IDateInfo } from './Interfaces/Date/DateInfo';
import GanttChart from './gantchart';

const svgNS = 'http://www.w3.org/2000/svg';

export function createGridLines(dateGroup: SVGGElement, chartWidth: number, taskCount: number) {
    const gridLines = document.createElementNS(svgNS, 'g');
    gridLines.classList.add('lines');
    dateGroup.appendChild(gridLines);
    for (let i = 0; i <= chartWidth; i += 50) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', String(i));
        line.setAttribute('x2', String(i));
        line.setAttribute('y1', String(35));
        line.setAttribute('y2', String(taskCount * 40 + 40));
        line.classList.add('grid-line');
        gridLines.appendChild(line);
    }
}

export function createMonthHeadings(dateGroup: SVGGElement, dateInfo: IDateInfo, chartWidth: number) {
    const month = document.createElementNS(svgNS, 'g');
    month.classList.add('month');
    dateGroup.appendChild(month);
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    let currentMonth = -1;

    for (let i = 0; i <= chartWidth; i += 50) {
        const currentDate = new Date(
            dateInfo.startingDate.getTime() + (i / 50) * (24 * 60 * 60 * 1000),
        );
        const monthIndex = currentDate.getMonth();
        if (monthIndex !== currentMonth) {
            currentMonth = monthIndex;

            const monthHeading = document.createElementNS(svgNS, 'text');
            monthHeading.setAttribute('x', String(i));
            monthHeading.setAttribute('y', String(10));
            monthHeading.classList.add('month-heading');
            monthHeading.textContent = months[currentMonth];
            month.appendChild(monthHeading);
        }
    }
}

export function createDateScale(dateGroup: SVGGElement, dateInfo: IDateInfo, chartWidth: number, taskCount:  number) {
    const date = document.createElementNS(svgNS, 'g')
    dateGroup.appendChild(date)
    date.classList.add('date')
    const dateScale = document.createElementNS(svgNS, 'text');
    dateScale.setAttribute('x', '0');
    dateScale.setAttribute('y', `${ taskCount }`);
    date.appendChild(dateScale);
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i <= chartWidth; i += 50) {
        const currentDate = new Date(dateInfo.startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
        const day = document.createElementNS(svgNS, 'text');
        day.setAttribute('x', String(i - 3));
        day.setAttribute('y', String(25));
        day.setAttribute('font-size','12px')
        if(currentDate.getDay() === 0 || currentDate.getDay() === 6){
            day.setAttribute('fill','red')
        }
        day.textContent = daysOfWeek[currentDate.getDay()]
        date.appendChild(day)
    }
}

export function createDivDateScale(dateInfo : IDateInfo, chartWidth : number) {
    const dateDiv = document.createElement('div')
    dateDiv.setAttribute('id','div-date')
    dateDiv.classList.add('date')
    const div = document.createElement('div-date')
    document.createElement('div');
    const width = GanttChart.returnWidth();
    for (let i = 0; i <= chartWidth; i += 50) {
        const currentDate = new Date(dateInfo.startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
        const day = document.createElement('div');

        day.setAttribute('font-size','10px')
        day.setAttribute('y', String(30));
        day.textContent = `${currentDate.getDate()}`;
        if(currentDate.getDay() === 0 || currentDate.getDay() === 6){
            day.setAttribute('style',`position:absolute;left:${i*width/chartWidth-5}px;color:red`)
        }
        else{
            day.setAttribute('style', `position:absolute;left:${i*width/chartWidth-5}px`);
        }
        div.appendChild(day);
    }
    dateDiv.appendChild(div)
    return dateDiv;
}
