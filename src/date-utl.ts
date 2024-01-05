import { IDateInfo } from './Interfaces/Date/DateInfo';
import GanttChart from './gantchart';
import { SvgHelper } from "./lib/Svg/SvgHelper";
import { createElement } from "./lib/Html/HtmlHelper";
import {  appendChildToParent } from "./lib/Html/HtmlHelper";


export function createGridLines(dateGroup: SVGGElement, chartWidth: number, chartHeight: number) {
    const gridLines = new SvgHelper().createGroup('grid-lines');
    appendChildToParent(dateGroup, gridLines);

    for (let i = 0; i <= chartWidth; i += 50) {
        const line = new SvgHelper().createSvgLine(i, 35, i, chartHeight, 'grid-line');
        appendChildToParent(gridLines, line);
    }
}

export function createMonthHeadings(dateGroup: SVGGElement, dateInfo: IDateInfo, chartWidth: number) {
    const month = new SvgHelper().createGroup('month');
    appendChildToParent(dateGroup, month);

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
        'Dec'
    ];
    let currentMonth = -1;

    for (let i = 0; i <= chartWidth; i += 50) {
        const currentDate = new Date(
            dateInfo.startingDate.getTime() + (i / 50) * (24 * 60 * 60 * 1000)
        );
        const monthIndex = currentDate.getMonth();
        if (monthIndex !== currentMonth) {
            currentMonth = monthIndex;

            const monthHeading = new SvgHelper().createTextElement(i, 10, months[currentMonth]);
            monthHeading.classList.add('month-heading');
            appendChildToParent(month, monthHeading);

        }
    }
}

export function createDateScale(dateGroup: SVGGElement, dateInfo: IDateInfo, chartWidth: number, taskCount: number) {
    const date = new SvgHelper().createGroup('date');
    appendChildToParent(dateGroup, date);

    const dateScale = new SvgHelper().createTextElement(0, taskCount, '');
    appendChildToParent(date, dateScale);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i <= chartWidth; i += 50) {
        const currentDate = new Date(dateInfo.startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
        const day = new SvgHelper().createTextElement(i - 3, 25, daysOfWeek[currentDate.getDay()], 12);
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            day.setAttribute('fill', 'red');
        }
        appendChildToParent(date, day);

    }
}

export function createDivDateScale(dateInfo: IDateInfo, chartWidth: number) {
    const dateDiv = createElement('div', 'date', '', 'div-date');
    const div = createElement('div', 'div-date');
    const width = GanttChart.returnWidth();
    for (let i = 0; i <= chartWidth; i += 50) {
        const currentDate = new Date(dateInfo.startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
        const day = createElement('div', 'day');

        day.textContent = `${currentDate.getDate()}`;
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            day.setAttribute('style', `left:${i * width / chartWidth - 5}px;color:red`);
        } else {
            day.setAttribute('style', `left:${i * width / chartWidth - 5}px`);
        }
        appendChildToParent(div, day);

    }
    appendChildToParent(dateDiv, div);

    return dateDiv;
}
