// Sample data for tasks with start and end dates and progress
const tasks = [
  {id:1, name: 'Task 1', start: '2023-10-03', end: '2023-10-12', progress: 50, dependencies: [] },
  {id:2, name: 'Task 2', start: '2023-10-04', end: '2023-10-18', progress: 75, dependencies: [1] },
  {id:3, name: 'Task 3', start: '2023-10-05', end: '2023-10-30', progress: 25, dependencies: [] },
  {id:4, name: 'Task 4', start: '2023-10-06', end: '2023-10-12', progress: 25, dependencies: [] },
  {id:5, name: 'Task 5', start: '2023-10-07', end: '2023-10-14', progress: 50, dependencies: [] },
  {id:6, name: 'Task 6', start: '2023-10-08', end: '2023-10-18', progress: 50, dependencies: [] },
  {id:7, name: 'Task 7', start: '2023-10-09', end: '2023-10-16', progress: 50, dependencies: [] },
  {id:8, name: 'Task 8', start: '2023-10-10', end: '2023-10-17', progress: 50, dependencies: [] },
  {id:9, name: 'Task 9', start: '2023-10-11', end: '2023-10-20', progress: 58, dependencies: [1] },
  {id:10, name: 'Task 10', start: '2023-10-12', end: '2023-10-18', progress: 50, dependencies: [] },
  // Add more tasks as needed
];

const svgNS = 'http://www.w3.org/2000/svg';
var taskCount;

// Function to create Gantt chart
function createGanttChart(tasks) {
  const chartContainer = document.getElementById('chart');
  const svg = createSVG(tasks);
  chartContainer.appendChild(svg);
}

function createSVG(tasks) {
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('min-width', '100%');
  svg.setAttribute('height', '100%');

  const dateInfo = calculateDateInfo(tasks);
  const chartWidth = calculateChartWidth(dateInfo);

  svg.setAttribute('viewBox', `0 0 ${chartWidth} ${tasks.length * 40 + 40}`);

  createGridLines(svg, chartWidth, tasks.length);
  createMonthHeadings(svg, dateInfo, chartWidth);
  createDateScale(svg, dateInfo, chartWidth, tasks.length);
  createTaskBars(svg, tasks, dateInfo);

  return svg;
}

function calculateDateInfo(tasks) {
  const startDates = tasks.map(task => new Date(task.start));
  const endDates = tasks.map(task => new Date(task.end));

  const minDate = new Date(Math.min(...startDates));
  const startingDate = new Date(minDate);
  startingDate.setDate(minDate.getDate() - 5);

  const maxDate = new Date(Math.max(...endDates));
  const dateDiff = (maxDate - minDate) / (24 * 60 * 60 * 1000);

  let multiplier = dateDiff > 100 ? 54 : dateDiff > 30 ? 60 : 120;

  return { startingDate, maxDate, multiplier };
}

function calculateChartWidth(dateInfo) {
  return dateInfo.multiplier * ((dateInfo.maxDate - dateInfo.startingDate) / (24 * 60 * 60 * 1000));
}

function createGridLines(svg, chartWidth, taskCount) {

  for (let i = 0; i <= chartWidth; i += 50) {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', i);
    line.setAttribute('x2', i);
    line.setAttribute('y1', 35);
    line.setAttribute('y2', taskCount * 40 + 40);
    line.classList.add('grid-line');
    svg.appendChild(line);
  }
}

function createMonthHeadings(svg, dateInfo, chartWidth) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let currentMonth = -1;

  for (let i = 0; i <= chartWidth; i += 50) {
    const currentDate = new Date(dateInfo.startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
    const monthIndex = currentDate.getMonth();
    if (monthIndex !== currentMonth) {
      currentMonth = monthIndex;

      const monthHeading = document.createElementNS(svgNS, 'text');
      monthHeading.setAttribute('x', i);
      monthHeading.setAttribute('y', 15);
      monthHeading.classList.add('month-heading');
      monthHeading.textContent = months[currentMonth];
      svg.appendChild(monthHeading);
    }
  }
}

function createDateScale(svg, dateInfo, chartWidth, taskCount) {
  const dateScale = document.createElementNS(svgNS, 'text');
  dateScale.setAttribute('x', '0');
  dateScale.setAttribute('y', taskCount);
  dateScale.classList.add('date-scale');
  svg.appendChild(dateScale);

  for (let i = 0; i <= chartWidth; i += 50) {
    const currentDate = new Date(dateInfo.startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', i - 3);
    text.setAttribute('y', taskCount + 25);
    text.textContent = currentDate.getDate();
    svg.appendChild(text);
  }
}

function createTaskBars(svg, tasks, dateInfo) {
  tasks.forEach((task, index) => {
    const dependentTaskEnd = Math.max(...task.dependencies.map(depId => new Date(tasks[depId - 1].end)));
    const startOffset = Math.max((dependentTaskEnd - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50, (new Date(task.start) - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50);
    const duration = (new Date(task.end) - new Date(task.start)) / (24 * 60 * 60 * 1000) * 50;

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', startOffset);
    rect.setAttribute('y', index * 40 + 40);
    rect.setAttribute('width', duration);
    rect.setAttribute('height', 30);
    rect.setAttribute('fill', '#3498db');
    svg.appendChild(rect);

    const progressWidth = (duration * task.progress) / 100;
    const progressRect = document.createElementNS(svgNS, 'rect');
    progressRect.setAttribute('x', startOffset);
    progressRect.setAttribute('y', index * 40 + 40);
    progressRect.setAttribute('width', progressWidth);
    progressRect.setAttribute('height', 30);
    progressRect.setAttribute('fill', '#2ecc71');
    svg.appendChild(progressRect);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', startOffset + 5);
    text.setAttribute('y', index * 40 + 60);
    text.textContent = task.name;
    svg.appendChild(text);
  });
}

// Call the function with sample data
createGanttChart(tasks);
