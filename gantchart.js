const svgNS = 'http://www.w3.org/2000/svg';
var taskCount;


// Function to create external tooltip
const tooltip = document.createElement('div');
tooltip.className = "bar-hover"
document.body.appendChild(tooltip);


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

  // Update the content of the existing or new SVG element
  updateGanttChartContent(svg, tasks);
}

function createSVG(tasks) {
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('min-width', '100%');
  svg.setAttribute('height', '100%');

  const defs = document.createElementNS(svgNS, 'defs');
  const marker = document.createElementNS(svgNS, 'marker');
  marker.setAttribute('id', 'arrowhead');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '7');
  marker.setAttribute('refX', '0');
  marker.setAttribute('refY', '3.5');
  marker.setAttribute('orient', 'auto');
  const polygon = document.createElementNS(svgNS, 'polygon');
  polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
  marker.appendChild(polygon);
  defs.appendChild(marker);
  svg.appendChild(defs);

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

    const dependentTaskIds = task.dependencies;
    if (dependentTaskIds.length > 0) {
      dependentTaskIds.forEach(dependentTaskId => {
        const dependentTask = tasks.find(t => t.id === dependentTaskId);
        if (dependentTask) {
          const dependentTaskEndX = (new Date(dependentTask.end) - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50;
          const dependentTaskEndY = index * 40 + 30; // Adjust based on your task bar height
    
          const taskStartX = (new Date(task.start) - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50;
          const taskStartY = index * 40 + 40 + 5; // Adjust based on your task bar height
    
// Draw upper horizontal line
const upperHorizontalLine = document.createElementNS(svgNS, 'line');
upperHorizontalLine.setAttribute('x1', taskStartX);
upperHorizontalLine.setAttribute('y1', taskStartY);
upperHorizontalLine.setAttribute('x2', dependentTaskEndX);
upperHorizontalLine.setAttribute('y2', taskStartY);
upperHorizontalLine.setAttribute('stroke', 'black');

// Draw vertical line
const verticalLine = document.createElementNS(svgNS, 'line');
verticalLine.setAttribute('x1', dependentTaskEndX);
verticalLine.setAttribute('y1', taskStartY);
verticalLine.setAttribute('x2', dependentTaskEndX);
verticalLine.setAttribute('y2', dependentTaskEndY);
verticalLine.setAttribute('stroke', 'black');

// Append upper horizontal line before vertical line
svg.appendChild(upperHorizontalLine);
svg.appendChild(verticalLine);

    

        }
      });
    }

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

    // Add event listeners for both rectangle and progress bar
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

    // Add event listeners for both rectangle and progress bar
    rect.addEventListener('mouseover', () => showTaskDetails(task, tasks));
    rect.addEventListener('mouseout', hideTaskDetails);

    progressRect.addEventListener('mouseover', () => showTaskDetails(task, tasks));
    progressRect.addEventListener('mouseout', hideTaskDetails);

    let isDragging = false;
    let initialX;
    let initialWidth;
    let isDragStart;

    // Variables to store the current task and progress bar
    let currentTaskRect;
    let currentProgressRect;

    // Add a contextmenu event listener for right-click to enable task editing
    rect.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // Prevent the default context menu
      editTask(event, task, tasks);
    });
    progressRect.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // Prevent the default context menu
      editTask(event, task, tasks);
    });

    // Add event listeners for dragging to edit start and end dates
    rect.addEventListener('mousedown', (event) => startDrag(task,event, rect));
    progressRect.addEventListener('mousedown', (event) => startDrag(task,event, rect));

    document.addEventListener('mousemove', throttle((event) => {
      if (isDragging) {
        updateTaskBarPosition(event.clientX, currentTaskRect, currentProgressRect);
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

    function startDrag(dependentTask,event, rect) {
      document.body.classList.add('dragging');
      isDragging = true;
      initialX = event.clientX;
      initialWidth = parseFloat(rect.getAttribute('width'));
      isDragStart = event.clientX < rect.getBoundingClientRect().left + initialWidth / 2;
    
      // Set the current task and progress bar
      currentTaskRect = rect;
      currentProgressRect = progressRect;
      // Prevent text selection during drag
      event.preventDefault();
    
      // Check if the task is dependent on another task
      if (isTaskDependentOnOtherTaskDate(dependentTask,currentTaskRect, tasks) && isDragStart) {
        alert('Task is dependent on another task. Start date cannot be changed.');
        document.body.classList.remove('dragging'); // remove dragging class
        isDragging = false; // Cancel the drag operation
      }
    }
    
    // Function to check if a task is dependent on another task
    function isTaskDependentOnOtherTaskDate(dependentTask,taskRect, tasks) {
      console.log('taskRect',rect);
      console.log('task',dependentTask.dependencies)
      const tasksWithDesiredIds = tasks.filter(task =>
        dependentTask.dependencies.includes(task.id)
      );
      const endDates = tasksWithDesiredIds.map(task => new Date(task.end));    
      const maxDate = new Date(Math.max(...endDates));
      console.log('taskDependent',tasksWithDesiredIds)
      console.log(tasks)
      const index = taskRect.getAttribute('y') / 40 - 1; // Assuming each task has a height of 40
      const dependentTaskIds = tasks[index].dependencies;
    
      // Check if the task is dependent on another task
      return dependentTaskIds.length > 0;
    }
    

    function updateTaskBarPosition(clientX, taskRect, progressRect) {
      const deltaX = (clientX - initialX) * 0.6; // Adjust the sensitivity factor (0.5 is just an example)
    
      if (isDragStart) {
        const deltaX = event.movementX * 4; // Adjusting sentivity for start point 
        // Dragging start handle
        const newStartOffset = parseFloat(taskRect.getAttribute('x')) + deltaX;
        const endDate = new Date(dateInfo.startingDate.getTime() + (parseFloat(taskRect.getAttribute('x')) + parseFloat(taskRect.getAttribute('width'))) / 50 * (24 * 60 * 60 * 1000));
        const newWidth = (endDate - new Date(dateInfo.startingDate.getTime() + newStartOffset / 50 * (24 * 60 * 60 * 1000))) / (24 * 60 * 60 * 1000) * 50;
    
        const maxStartOffset = parseFloat(taskRect.getAttribute('x')) + parseFloat(taskRect.getAttribute('width'));
        const adjustedStartOffset = Math.min(newStartOffset, maxStartOffset);
        const adjustedWidth = maxStartOffset - adjustedStartOffset;
    
        taskRect.setAttribute('x', adjustedStartOffset);
        taskRect.setAttribute('width', adjustedWidth);
    
        progressRect.setAttribute('x', adjustedStartOffset);
        progressRect.setAttribute('width', adjustedWidth * task.progress / 100);
      } else {
        // Dragging end handle
        const newWidth = initialWidth + deltaX;
    
        taskRect.setAttribute('width', newWidth);
        progressRect.setAttribute('width', newWidth * task.progress / 100);
      }
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

// Function to close the edit modal
function closeEditModal() {
  const editModal = document.getElementById('editModal');
  editModal.style.display = 'none';
}

function showTaskDetails(task,allTasks) {
  const dependentTaskNames = task.dependencies.map(depId => allTasks[depId - 1].name);
  const dependentTaskInfo = dependentTaskNames.length > 0 ? `Dependencies: ${dependentTaskNames.join(', ')}` : '';

  tooltip.innerHTML = `
    Task: ${task.name}<br>
    Start: ${task.start}<br>
    End: ${task.end}<br>
    ${dependentTaskInfo}
  `;
  tooltip.style.left = `${event.pageX}px`;
  tooltip.style.top = `${event.pageY}px`;
  tooltip.style.display = 'block';
}

function hideTaskDetails() {
  tooltip.style.display = 'none';
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

  svg.setAttribute('viewBox', `0 0 ${chartWidth} ${tasks.length * 40 + 40}`);

  createGridLines(svg, chartWidth, tasks.length);
  createMonthHeadings(svg, dateInfo, chartWidth);
  createDateScale(svg, dateInfo, chartWidth, tasks.length);
  createTaskBars(svg, tasks, dateInfo);
}

//function to update the task array
function addTask(tasks) {
  const taskName = document.getElementById('taskName').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  // Ensure the required fields are not empty
  if (!taskName || !startDate || !endDate) {
    alert('Please fill in all fields.');
    return;
  }

  const newTask = {
    id: tasks.length + 1, // Incremental ID
    name: taskName,
    start: startDate,
    end: endDate,
    progress: 0, // You can set the progress as needed
    dependencies: [] // You can set dependencies as needed
  };

  // Add the new task to the existing tasks
  tasks.push(newTask);

  // Update the Gantt chart with the new data
  updateTaskStartEndDates(tasks);
  // Call the function with sample data
  createGanttChart(tasks);
}

// Function to handle task editing
function editTask(event, task, allTasks) {
  const editTaskForm = document.getElementById('editTaskForm');
  const editTaskNameInput = document.getElementById('editTaskName');
  const editStartDateInput = document.getElementById('editStartDate');
  const editEndDateInput = document.getElementById('editEndDate');
  const editProgress = document.getElementById('editProgress');
  const editDependenciesSelect = document.getElementById('editDependencies');
  const editModal = document.getElementById('editModal');

  // Set the current task details in the form
  editTaskNameInput.value = task.name;
  editStartDateInput.value = task.start;
  editEndDateInput.value = task.end;
  editProgress.value = task.progress;

  // Clear existing options
  editDependenciesSelect.innerHTML = '';

  // Display dependencies in the modal as select options
  allTasks.forEach(availableTask => {
    // Check if the available task is not the current task and not dependent on the current task
    if (availableTask.id !== task.id && !isTaskDependent(task, availableTask, allTasks)) {
      const option = document.createElement('option');
      option.value = availableTask.id;
      option.textContent = availableTask.name;
      if (task.dependencies.includes(availableTask.id)) {
        // If the task is already a dependency, mark it as selected
        option.selected = true;
      }
      editDependenciesSelect.appendChild(option);
    }
  });

  // Store the task ID in a data attribute of the form
  editTaskForm.setAttribute('data-task-id', task.id);

  // Display the modal
  editModal.style.display = 'block';

  // Prevent the contextmenu event from propagating further
  event.preventDefault();
}

// Function to check if a task is dependent on another task
function isTaskDependent(currentTask, otherTask, allTasks) {
  return otherTask.dependencies.includes(currentTask.id) || otherTask.dependencies.some(depId => isTaskDependent(currentTask, allTasks[depId - 1], allTasks));
}

// Function to save edited task
function saveEditedTask(tasks) {
  const editTaskForm = document.getElementById('editTaskForm');
  const editTaskNameInput = document.getElementById('editTaskName');
  const editStartDateInput = document.getElementById('editStartDate');
  const editEndDateInput = document.getElementById('editEndDate');
  const editProgress = document.getElementById('editProgress');
  const editDependenciesSelect = document.getElementById('editDependencies');
  const editModal = document.getElementById('editModal');

  // Retrieve the edited values
  const editedTaskName = editTaskNameInput.value;
  const editedStartDate = editStartDateInput.value;
  const editedEndDate = editEndDateInput.value;
  const progress = editProgress.value;

  // Retrieve the task ID from the data attribute
  const taskId = parseInt(editTaskForm.getAttribute('data-task-id'), 10);

  // Retrieve the selected dependencies from the updated select element
  const selectedDependencies = Array.from(editDependenciesSelect.selectedOptions).map(option => parseInt(option.value, 10));

  // Find the task in the array and update its properties
  const editedTaskIndex = tasks.findIndex(task => task.id === taskId);
  if (editedTaskIndex !== -1) {
    tasks[editedTaskIndex].name = editedTaskName;
    tasks[editedTaskIndex].start = editedStartDate;
    tasks[editedTaskIndex].end = editedEndDate;
    tasks[editedTaskIndex].progress = progress > 100 ? 100 : progress;
    tasks[editedTaskIndex].dependencies = selectedDependencies;
  }

  // Update the Gantt chart with the new data
  updateTaskStartEndDates(tasks);
  // Call the function with sample data
  createGanttChart(tasks);

  // Close the modal
  closeEditModal();
}



function drawDependencyLine(svg, x1, y1, x2, y2, color) {
  const line = document.createElementNS(svgNS, 'line');
  const arrowSize = 5; // Size of the arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  
  // Draw the main line
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', color);
  line.setAttribute('marker-end', 'url(#arrowhead)');
  svg.appendChild(line);

  // Draw the arrowhead
  const arrow = document.createElementNS(svgNS, 'polygon');
  arrow.setAttribute('points', `${x2 - arrowSize * Math.cos(angle - Math.PI / 6)},${y2 - arrowSize * Math.sin(angle - Math.PI / 6)} 
                                 ${x2},${y2} 
                                 ${x2 - arrowSize * Math.cos(angle + Math.PI / 6)},${y2 - arrowSize * Math.sin(angle + Math.PI / 6)}`);
  arrow.setAttribute('fill', color);
  svg.appendChild(arrow);
}
// function drawDependencyLine(svg, dependentTask, task, dateInfo) {
//   const dependentTaskEndX = calculateXPosition(dependentTask.end, dateInfo);
//   const dependentTaskEndY = calculateYPosition(dependentTask.id - 1, tasks.length);

//   const taskStartX = calculateXPosition(task.start, dateInfo);
//   const taskStartY = calculateYPosition(task.id - 1, tasks.length);

//   const line = document.createElementNS(svgNS, 'path');
//   line.setAttribute('d', `M${dependentTaskEndX},${dependentTaskEndY} H${taskStartX} V${taskStartY}`);
//   line.setAttribute('stroke', 'black');
//   line.setAttribute('fill', 'transparent');
//   line.setAttribute('marker-end', 'url(#arrowhead)'); // Add arrowhead marker

//   svg.appendChild(line);
// }


