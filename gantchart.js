const svgNS = 'http://www.w3.org/2000/svg';
var taskCount;


// Function to create external tooltip
const tooltip = document.createElement('div');
tooltip.className = "bar-hover"
document.body.appendChild(tooltip);

//get the total length including sub task 
function getTotalLength(tasks) {
  return tasks.reduce((total, task) => {
    return total + 1 + (task.subTask ? getTotalLength(task.subTask) : 0);
  }, 0);
}

// Function to create Gantt chart
function createGanttChart(tasks) {
  const chartContainer = document.getElementById('chart');
  let svg = chartContainer.querySelector('svg');

  // Check if the SVG element already exists
  if (!svg) {
    // If not, create a new SVG element
    svg = createSVG(tasks);
    chartContainer.appendChild(svg);
  }
  else{
    updateGanttChartContent(svg, tasks);
  }
}

function createSVG(tasks) {
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('min-width', '100%');
  svg.setAttribute('height', '200%');

  const dateInfo = calculateDateInfo(tasks);
  const chartWidth = calculateChartWidth(dateInfo);
  length = getTotalLength(tasks)

  svg.setAttribute('viewBox', `0 0 ${chartWidth} ${length * 40 + 40}`);

  createGridLines(svg, chartWidth, length);
  createMonthHeadings(svg, dateInfo, chartWidth);
  createDateScale(svg, dateInfo, chartWidth, length);
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
  let customIndex=0;
  tasks.forEach((task, index) => {
    const dependentTaskEnd = Math.max(...task.dependencies.map(depId => new Date(tasks[depId - 1].end)));
    const startOffset = Math.max((dependentTaskEnd - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50, (new Date(task.start) - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50);
    const duration = (new Date(task.end) - new Date(task.start)) / (24 * 60 * 60 * 1000) * 50;
    // index = index+1
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', startOffset);
    rect.setAttribute('y', customIndex * 40 + 40);
    rect.setAttribute('width', duration);
    rect.setAttribute('height', 30);
    rect.setAttribute('fill', '#3498db');
    svg.appendChild(rect);

    const progressWidth = (duration * task.progress) / 100;
    const progressRect = document.createElementNS(svgNS, 'rect');
    progressRect.setAttribute('x', startOffset);
    progressRect.setAttribute('y', customIndex * 40 + 40);
    progressRect.setAttribute('width', progressWidth);
    progressRect.setAttribute('height', 30);
    progressRect.setAttribute('fill', '#2ecc71');
    svg.appendChild(progressRect);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', startOffset + 5);
    text.setAttribute('y', customIndex * 40 + 60);
    text.textContent = task.name;
    svg.appendChild(text);
    // Render subtasks
    if (task.subTask && task.subTask.length > 0) {
      task.subTask.forEach((subtask, subIndex) => {
        const subDependentTaskEnd = Math.max(...subtask.dependencies.map(depId => new Date(task.subTask[depId - 1].end)));
        const subStartOffset = Math.max((subDependentTaskEnd - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50, (new Date(subtask.start) - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50);
        const subDuration = (new Date(subtask.end) - new Date(subtask.start)) / (24 * 60 * 60 * 1000) * 50;
        // const subDuration = (new Date(subtask.end) - new Date(subtask.start)) / (24 * 60 * 60 * 1000) * 50;
        const subRect = document.createElementNS(svgNS, 'rect');
        subRect.setAttribute('x',  subStartOffset);
        subRect.setAttribute('y', (subIndex + customIndex + 1) * 40 + 40);
        subRect.setAttribute('width', subDuration);
        subRect.setAttribute('height', 15);
        subRect.setAttribute('fill', '#e74c3c'); // Adjust color for subtasks
        svg.appendChild(subRect);

        const subProgressWidth = (subDuration * subtask.progress) / 100;
        const subProgressRect = document.createElementNS(svgNS, 'rect');
        subProgressRect.setAttribute('x',  subStartOffset);
        subProgressRect.setAttribute('y', (subIndex + customIndex + 1) * 40 + 40);
        subProgressRect.setAttribute('width', subProgressWidth);
        subProgressRect.setAttribute('height', 15);
        subProgressRect.setAttribute('fill', '#c0392b'); // Adjust color for subtasks
        svg.appendChild(subProgressRect);

        const subText = document.createElementNS(svgNS, 'text');
        subText.setAttribute('x',  subStartOffset + 5);
        subText.setAttribute('y', (subIndex + customIndex + 1) * 40 + 50);
        subText.textContent = subtask.name;
        subText.setAttribute('font-size', '10px'); // Adjust the font size as neede
        svg.appendChild(subText);

        subText.addEventListener('mouseover', () => showTaskDetails(subtask,task.subTask));
        subRect.addEventListener('mouseover', () => showTaskDetails(subtask,task.subTask));
        subRect.addEventListener('mouseout', hideTaskDetails);

        subProgressRect.addEventListener('mouseover', () => showTaskDetails(subtask,task.subTask));
        subProgressRect.addEventListener('mouseout', hideTaskDetails);

        // Add a contextmenu event listener for right-click to enable task editing
        subRect.addEventListener('contextmenu', (event) => {
          event.preventDefault(); // Prevent the default context menu
          editTask(event, subtask, task.subTask , tasks);
        });
        subProgressRect.addEventListener('contextmenu', (event) => {
          event.preventDefault(); // Prevent the default context menu
          editTask(event, subtask, task.subTask , tasks);
        });
        subText.addEventListener('contextmenu', (event) => {
          event.preventDefault(); // Prevent the default context menu
          editTask(event, subtask, task.subTask , tasks);
        });
      });
    }
    // Add event listeners for both rectangle and progress bar
    text.addEventListener('mouseover', () => showTaskDetails(task,tasks));
    rect.addEventListener('mouseover', () => showTaskDetails(task,tasks));
    rect.addEventListener('mouseout', hideTaskDetails);

    progressRect.addEventListener('mouseover', () => showTaskDetails(task,tasks));
    progressRect.addEventListener('mouseout', hideTaskDetails);

     // Add a contextmenu event listener for right-click to enable task editing
     rect.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // Prevent the default context menu
      editTask(event, task, tasks);
    });
    progressRect.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // Prevent the default context menu
      editTask(event, task, tasks);
    });
    text.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // Prevent the default context menu
      editTask(event, task, tasks);
    });

    let isDragging = false;
    let initialX;
    let initialWidth;
    let isDragStart;

    // Variables to store the current task and progress bar
    let currentTaskRect;
    let currentProgressRect;

    // Add event listeners for dragging to edit start and end dates
    rect.addEventListener('mousedown', (event) => startDrag(event, rect , progressRect));
    progressRect.addEventListener('mousedown', (event) => startDrag(event, rect ,progressRect));
    text.addEventListener('mousedown', (event) => startDrag(event, rect ,progressRect));

    document.addEventListener('mousemove', throttle((event) => {
      if (isDragging) {
        updateTaskBarPosition(event.clientX, currentTaskRect, currentProgressRect, task , tasks);
      }
    }, 16));

    document.addEventListener('mouseup', () => {
      document.body.classList.remove('dragging');
      if (isDragging) {
        isDragging = false;
        // Find the task in the array and update its properties
        const updatedTaskIndex = tasks.findIndex(t => t.id === task.id);
        if (updatedTaskIndex !== -1) {
          const newStartDate = new Date(dateInfo.startingDate.getTime() + (parseFloat(rect.getAttribute('x')) / 50) * (24 * 60 * 60 * 1000));
          const newEndDate = new Date(newStartDate.getTime() + (parseFloat(rect.getAttribute('width')) / 50) * (24 * 60 * 60 * 1000));

          // Update the properties of the task in the array
          tasks[updatedTaskIndex].start = newStartDate.toISOString().split('T')[0];
          tasks[updatedTaskIndex].end = newEndDate.toISOString().split('T')[0];

          // Update the Gantt chart with the new data
          updateTaskStartEndDates(tasks);
          createGanttChart(tasks);
        }
      }
    });

    function startDrag(event, taskRect, taskProgressRect) {
      document.body.classList.add('dragging');
      isDragging = true;
      initialX = event.clientX;
      initialWidth = parseFloat(taskRect.getAttribute('width'));
      isDragStart = event.clientX < taskRect.getBoundingClientRect().left + initialWidth / 2;
    
      // Set the current task and progress bar
      currentTaskRect = taskRect;
      currentProgressRect = taskProgressRect;
      // Prevent text selection during drag
      event.preventDefault();
  
    }
    
    // Function to check if a task is dependent on another task
    function isExceedingDepenentEndDate(sartDate,dependentTask, tasks) {
      const tasksWithDesiredIds = tasks.filter(task =>
        dependentTask.dependencies.includes(task.id)
      );
      const endDates = tasksWithDesiredIds.map(task => new Date(task.end));    
      const maxDate = new Date(Math.max(...endDates))
      if(maxDate > sartDate)
      {
        return 1;
      }
      else{
        return 0;
      }
    }

    function updateTaskBarPosition(clientX, taskRect, progress, dependentTask, tasks) {
      console.log('task',dependentTask)
      console.log('tasks',tasks)
      const deltaX = (clientX - initialX) * 0.6; // Adjust the sensitivity factor (0.5 is just an example)
    
      if (isDragStart) {
        const increment = event.movementX * 2.5; // Adjusting sentivity for start point 
        // Dragging start handle
        let newStartOffset = parseFloat(taskRect.getAttribute('x')) + increment;
        const startDate = new Date(dateInfo.startingDate.getTime() + (parseFloat(taskRect.getAttribute('x'))) / 50 * (24 * 60 * 60 * 1000));
        

        if(isExceedingDepenentEndDate(startDate,dependentTask,tasks))
        {
          // isDragging = false;
          alert('Start Date has exceed to its dependent EndDate');
          document.body.classList.remove('dragging');
          isDragging = false ;
          const updatedTaskIndex = tasks.findIndex(t => t.id === task.id);
          if (updatedTaskIndex !== -1) {
            const newEndDate = new Date(startDate.getTime() + (parseFloat(rect.getAttribute('width')) / 51) * (24 * 60 * 60 * 1000));

            // Update the properties of the task in the array
            tasks[updatedTaskIndex].start = startDate.toISOString().split('T')[0];
            tasks[updatedTaskIndex].end = newEndDate.toISOString().split('T')[0];

            // Update the Gantt chart with the new data
            updateTaskStartEndDates(tasks);
            createGanttChart(tasks);
          }
        }
        
        const endDate = new Date(dateInfo.startingDate.getTime() + (parseFloat(taskRect.getAttribute('x')) + parseFloat(taskRect.getAttribute('width'))) / 50 * (24 * 60 * 60 * 1000));
        
        const maxStartOffset = parseFloat(taskRect.getAttribute('x')) + parseFloat(taskRect.getAttribute('width'));
        const adjustedStartOffset = Math.min(newStartOffset, maxStartOffset);
        const adjustedWidth = maxStartOffset - adjustedStartOffset;
        taskRect.setAttribute('x', adjustedStartOffset);
        taskRect.setAttribute('width', adjustedWidth);
    
        progress.setAttribute('x', adjustedStartOffset);
        progress.setAttribute('width', adjustedWidth * dependentTask.progress / 100);
        
      } else {
        // Dragging end handle
        const newWidth = initialWidth + deltaX;
        console.log('task',dependentTask)
        taskRect.setAttribute('width', newWidth);
        progress.setAttribute('width', newWidth * dependentTask.progress / 100);
      }
    }
    // task below the sub task
    customIndex = customIndex + 1; 
    if(task.subTask && task.subTask.length > 0)
    {
      customIndex = customIndex   + task.subTask.length;
    }
  })
}

function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
// Function to update the Gantt chart with new data

function updateGanttChartContent(svg, tasks) {
  // Clear existing content
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  // Update the content with the new tasks
  const dateInfo = calculateDateInfo(tasks);
  const chartWidth = calculateChartWidth(dateInfo);

  svg.setAttribute('viewBox', `0 0 ${chartWidth} ${length * 40 + 40}`);

  createGridLines(svg, chartWidth, length);
  createMonthHeadings(svg, dateInfo, chartWidth);
  createDateScale(svg, dateInfo, chartWidth, length);
  createTaskBars(svg, tasks, dateInfo);
}



