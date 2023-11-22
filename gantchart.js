
// Sample data for tasks with start and end dates and progress
const tasks = [
  { name: 'Task 1', start: '2023-11-01', end: '2023-11-03', progress: 50 },
  { name: 'Task 2', start: '2023-11-02', end: '2023-11-06', progress: 75 },
  { name: 'Task 3', start: '2023-12-05', end: '2023-12-20', progress: 25 },
  { name: 'Task 3', start: '2023-12-05', end: '2024-03-07', progress: 25 },
  { name: 'Task 1', start: '2023-11-01', end: '2023-11-03', progress: 50 },
  { name: 'Task 1', start: '2023-11-01', end: '2023-11-03', progress: 50 },
  { name: 'Task 1', start: '2023-11-01', end: '2024-11-03', progress: 50 },
  { name: 'Task 1', start: '2023-11-01', end: '2023-11-03', progress: 50 },
  { name: 'Task 1', start: '2023-11-01', end: '2023-11-03', progress: 50 },
  { name: 'Task 1', start: '2023-11-01', end: '2023-11-03', progress: 50 },

  // Add more tasks as needed
];

// Function to create Gantt chart
function createGanttChart(tasks) {
  const chartContainer = document.getElementById('chart');
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('min-width', '50%');
  svg.setAttribute('height', '100%');

  // Convert start and end dates to Date objects
  const startDates = tasks.map(task => new Date(task.start));
  const endDates = tasks.map(task => new Date(task.end));

  // Find the minimum and maximum dates to set the chart width
  const minDate = new Date(Math.min(...startDates));
  const startingDate = new Date(minDate);
  startingDate.setDate(minDate.getDate() - 5);
  const maxDate = new Date(Math.max(...endDates));
  const chartWidth = (maxDate - minDate) / (24 * 60 * 60 * 1000) * 53; // Adjust the scale as needed

  svg.setAttribute('viewBox', `0 0 ${chartWidth} ${tasks.length * 40 + 40}`);

  // Create grid lines for each day
  for (let i = 0; i <= chartWidth; i += 50) {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', i);
    line.setAttribute('x2', i);
    line.setAttribute('y1', 35);
    line.setAttribute('y2', tasks.length * 40 + 40);
    line.classList.add('grid-line');
    svg.appendChild(line);
  }

  // Create month headings
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let currentMonth = -1;
  for (let i = 0; i <= chartWidth; i += 50) {
    const currentDate = new Date(startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
    const monthIndex = currentDate.getMonth();
    if (monthIndex !== currentMonth) {
      currentMonth = monthIndex;

      // Month heading
      const monthHeading = document.createElementNS(svgNS, 'text');
      monthHeading.setAttribute('x', i);
      monthHeading.setAttribute('y', tasks.length + 10);
      monthHeading.classList.add('month-heading');
      monthHeading.textContent = months[currentMonth];
      svg.appendChild(monthHeading);
    }
  }

  // Create date scale
  const dateScale = document.createElementNS(svgNS, 'text');
  dateScale.setAttribute('x', '0');
  dateScale.setAttribute('y', tasks.length);
  dateScale.classList.add('date-scale');
  svg.appendChild(dateScale);

  // Add dates to the scale, starting from 15 days earlier date
  for (let i = 0; i <= chartWidth; i += 50) {
    const currentDate = new Date(startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', i - 3);
    text.setAttribute('y', tasks.length + 25);
    text.textContent = currentDate.getDate();
    svg.appendChild(text);
  }

  // Create task bars and progress indicators
  tasks.forEach((task, index) => {
    const startOffset = (new Date(task.start) - startingDate) / (24 * 60 * 60 * 1000) * 50;
    const duration = (new Date(task.end) - new Date(task.start)) / (24 * 60 * 60 * 1000) * 50;

    // Create task bar
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', startOffset);
    rect.setAttribute('y', index * 40 + 40);
    rect.setAttribute('width', duration);
    rect.setAttribute('height', 30);
    rect.setAttribute('fill', '#3498db'); // Change the color as needed
    svg.appendChild(rect);

    // Create progress indicator
    const progressWidth = (duration * task.progress) / 100;
    const progressRect = document.createElementNS(svgNS, 'rect');
    progressRect.setAttribute('x', startOffset);
    progressRect.setAttribute('y', index * 40 + 40);
    progressRect.setAttribute('width', progressWidth);
    progressRect.setAttribute('height', 30);
    progressRect.setAttribute('fill', '#2ecc71'); // Change the progress color as needed
    svg.appendChild(progressRect);

    // Add task labels
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', startOffset + 5);
    text.setAttribute('y', index * 40 + 60);
    text.textContent = task.name;
    svg.appendChild(text);
  });

  chartContainer.appendChild(svg);
}

// Call the function with sample data
createGanttChart(tasks);