import { createGridLines, createMonthHeadings, createDateScale } from './date-utl.js';
import { updateTaskStartEndDates } from './updatechart.js';
import { hideTaskDetails , showTaskDetails , editTask ,openAddModal , addTask  } from './saveEdit.js';

const svgNS = 'http://www.w3.org/2000/svg';
export default class GanttChart {
  constructor() {
    this.dateInfo;
    this.taskCount;
    this.isDragging = false;
    this.initialX;
    this.initialWidth;
    this.isDragStart;
    // Variables to store the current task and progress bar
    this.currentTaskRect;
    this.currentProgressRect;
    this.dragMoveListener = null;
    this.length;
    this.dependentTask ;
    this.tasks ;
    this.allTask ; 
  }

  getTotalLength(tasks) {
    return tasks.reduce((total, task) => {
      return total + 1 + (task.subTask ? this.getTotalLength(task.subTask) : 0);
    }, 0);
  }

  createGanttChart(tasks) {
    updateTaskStartEndDates(tasks);
    const chartContainer = document.getElementById('chart');
     // Create a button element
    const button = document.createElement('button');
    button.setAttribute('class','top-place add-button')
    button.textContent = 'Add Task'; // Set the button text
    button.addEventListener('click', () => {
      openAddModal(tasks);
    });
    let svg = chartContainer.querySelector('svg');
    // Check if the SVG element already exists
    if (!svg) {
      // Append the button to the parent container of the SVG
      chartContainer.appendChild(button);
      // If not, create a new SVG element
      svg = this.createSVG(tasks);
      chartContainer.appendChild(svg);
    } else {
      this.updateGanttChartContent(svg, tasks);
    }
  }

  createSVG(tasks) {
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('min-width', '100%');
    svg.setAttribute('height', '200%');
    const dateGroup = document.createElementNS(svgNS, 'g'); // Create a group element for the task
    dateGroup.setAttribute('class', 'date-groups');
    svg.appendChild(dateGroup);
    this.dateInfo = this.calculateDateInfo(tasks);
    const chartWidth = this.calculateChartWidth(this.dateInfo);
    this.length = this.getTotalLength(tasks);

    svg.setAttribute('viewBox', `0 0 ${chartWidth} ${this.length * 40 + 40}`);

    createGridLines(dateGroup, chartWidth, this.length);
    createMonthHeadings(dateGroup, this.dateInfo, chartWidth);
    createDateScale(dateGroup, this.dateInfo, chartWidth, this.length);
    this.createTaskBars(svg, tasks, this.dateInfo);
    return svg;
  }

  calculateDateInfo(tasks) {
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

  calculateChartWidth(dateInfo) {
    return (dateInfo.multiplier * ((dateInfo.maxDate - dateInfo.startingDate) / (24 * 60 * 60 * 1000)));
  }

  createTaskBars(svg, tasks, dateInfo) {
    let customIndex = 0;

    tasks.forEach((task, index) => {
      const taskGroup = document.createElementNS(svgNS, 'g'); // Create a group element for the task
      taskGroup.setAttribute('class', 'tasks');
      svg.appendChild(taskGroup);

      const dependentTaskEnd = Math.max(...task.dependencies.map(depId => new Date(tasks[depId - 1].end)));
      const startOffset = Math.max((dependentTaskEnd - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50, (new Date(task.start) - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50);
      const duration = (new Date(task.end) - new Date(task.start)) / (24 * 60 * 60 * 1000) * 50;

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', startOffset);
      rect.setAttribute('y', customIndex * 40 + 40);
      rect.setAttribute('width', duration);
      rect.setAttribute('height', 30);
      rect.setAttribute('fill', '#3498db');
      taskGroup.appendChild(rect);

      const progressWidth = (duration * task.progress) / 100;
      const progressRect = document.createElementNS(svgNS, 'rect');
      progressRect.setAttribute('x', startOffset);
      progressRect.setAttribute('y', customIndex * 40 + 40);
      progressRect.setAttribute('width', progressWidth);
      progressRect.setAttribute('height', 30);
      progressRect.setAttribute('fill', '#2ecc71');
      taskGroup.appendChild(progressRect);

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', startOffset + 5);
      text.setAttribute('y', customIndex * 40 + 60);
      text.textContent = task.name;
      taskGroup.appendChild(text);

      // Render subtasks
      if (task.subTask && task.subTask.length > 0) {
        const subTaskGroup = document.createElementNS(svgNS, 'g'); // Create a group element for the task
        subTaskGroup.setAttribute('class','subtask')
        taskGroup.appendChild(subTaskGroup);
        task.subTask.forEach((subtask, subIndex) => {
          const subDependentTaskEnd = Math.max(...subtask.dependencies.map(depId => new Date(task.subTask[depId - 1].end)));
          const subStartOffset = Math.max((subDependentTaskEnd - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50, (new Date(subtask.start) - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50);
          const subDuration = (new Date(subtask.end) - new Date(subtask.start)) / (24 * 60 * 60 * 1000) * 50;

          const subRect = document.createElementNS(svgNS, 'rect');
          subRect.setAttribute('class','subtask')
          subRect.setAttribute('x', subStartOffset);
          subRect.setAttribute('y', (subIndex + customIndex + 1) * 40 + 40);
          subRect.setAttribute('width', subDuration);
          subRect.setAttribute('height', 15);
          subRect.setAttribute('fill', '#e74c3c');
          subTaskGroup.appendChild(subRect);

          const subProgressWidth = (subDuration * subtask.progress) / 100;
          const subProgressRect = document.createElementNS(svgNS, 'rect');
          subProgressRect.setAttribute('class','subtask-progress')
          subProgressRect.setAttribute('x', subStartOffset);
          subProgressRect.setAttribute('y', (subIndex + customIndex + 1) * 40 + 40);
          subProgressRect.setAttribute('width', subProgressWidth);
          subProgressRect.setAttribute('height', 15);
          subProgressRect.setAttribute('fill', '#c0392b');
          subTaskGroup.appendChild(subProgressRect);

          const subText = document.createElementNS(svgNS, 'text');
          subText.setAttribute('x', subStartOffset + 5);
          subText.setAttribute('y', (subIndex + customIndex + 1) * 40 + 50);
          subText.textContent = subtask.name;
          subText.setAttribute('font-size', '10px');
          subTaskGroup.appendChild(subText);

          subText.addEventListener('mouseover', () => showTaskDetails(subtask, task.subTask));
          subRect.addEventListener('mouseover', () => showTaskDetails(subtask, task.subTask));
          subRect.addEventListener('mouseout', hideTaskDetails);

          subProgressRect.addEventListener('mouseover', () => showTaskDetails(subtask, task.subTask));
          subProgressRect.addEventListener('mouseout', hideTaskDetails);

          subRect.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            editTask(event, subtask, task.subTask, tasks);
          });
          subProgressRect.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            editTask(event, subtask, task.subTask, tasks);
          });
          subText.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            editTask(event, subtask, task.subTask, tasks);
          });
          subRect.addEventListener('mousedown', (event) => {
            event.preventDefault();
            this.startDrag(event, subRect, subProgressRect , subtask , task.subTask , tasks);
          });
          subProgressRect.addEventListener('mousedown', (event) => {
            event.preventDefault();
            this.startDrag(event, subRect, subProgressRect, subtask , task.subTask , tasks)
          });
          subText.addEventListener('mousedown', (event) => {
            event.preventDefault();
            this.startDrag(event, subRect, subProgressRect , subtask , task.subTask , tasks);
          });
        });
      }

      // Add event listeners for both rectangle and progress bar
      text.addEventListener('mouseover', () => showTaskDetails(task, tasks));
      rect.addEventListener('mouseover', () => showTaskDetails(task, tasks));
      rect.addEventListener('mouseout', hideTaskDetails);

      progressRect.addEventListener('mouseover', () => showTaskDetails(task, tasks));
      progressRect.addEventListener('mouseout', hideTaskDetails);

      rect.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        editTask(event, task, tasks);
      });
      progressRect.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        editTask(event, task, tasks);
      });
      text.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        editTask(event, task, tasks);
      });
      // Add event listeners for dragging to edit start and end dates
      rect.addEventListener('mousedown', (event) => {
        event.preventDefault();
        this.startDrag(event, rect, progressRect,task ,tasks);
      });
      progressRect.addEventListener('mousedown', (event) => {
        event.preventDefault();
        this.startDrag(event, rect, progressRect ,task ,tasks)
      });
      text.addEventListener('mousedown', (event) => {
        event.preventDefault();
        this.startDrag(event, rect, progressRect,task ,tasks);
      });     
      document.addEventListener('mouseup', (event) => {
        document.removeEventListener('mousemove',this.dragMoveListener)
        this.handleMouseUp(this.taskRect, this.dependentTask, this.tasks, this.dateInfo ,this.allTasks);
      });
      // task below the subtask
      customIndex = customIndex + 1;
      if (task.subTask && task.subTask.length > 0) {
        customIndex = customIndex + task.subTask.length;
      }
    });
  }

  throttle(func, limit) {
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

  isExceedingDepenentEndDate(sartDate, dependentTask, tasks) {
    const tasksWithDesiredIds = tasks.filter(task =>
      dependentTask.dependencies.includes(task.id)
    );
    const endDates = tasksWithDesiredIds.map(task => new Date(task.end));
    const maxDate = new Date(Math.max(...endDates))
    if (maxDate > sartDate) {
      return 1;
    } else {
      return 0;
    }
  }

  handleDragMove(event, taskRect, progress, dependentTask, tasks ,allTasks=null) {
    event.preventDefault();
    if (this.isDragging) {
      this.updateTaskBarPosition(event.clientX, taskRect, progress, dependentTask, tasks ,allTasks);
    }
  }

  startDrag(event, taskRect, taskProgressRect , dependentTask, task , allTasks=null) {
    this.dependentTask = dependentTask ;
    this.tasks = task ;
    this.allTasks = allTasks ; 
    document.body.classList.add('dragging');
    hideTaskDetails
    this.isDragging = true;
    this.initialX = event.clientX;
    this.initialWidth = parseFloat(taskRect.getAttribute('width'));
    this.isDragStart = event.clientX < taskRect.getBoundingClientRect().left + this.initialWidth / 2;

    // Set the current task and progress bar
    this.currentTaskRect = taskRect;
    this.currentProgressRect = taskProgressRect;
    this.dragMoveListener = this.throttle((event) => {
      this.handleDragMove(event, this.currentTaskRect, this.currentProgressRect, dependentTask, task, allTasks);
    }, 16); 
    event.preventDefault();
    document.addEventListener('mousemove',this.dragMoveListener);

  }

  updateTaskBarPosition(clientX, taskRect, progress, dependentTask, tasks ,allTasks) {
    const deltaX = (clientX - this.initialX) * .73 // Adjust the sensitivity factor 
    if (this.isDragStart) {
      // Dragging start handle
      const newStartOffset = (new Date(dependentTask.start) - this.dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50 + deltaX;
      const startDate = new Date(this.dateInfo.startingDate.getTime() + (parseFloat(taskRect.getAttribute('x'))) / 50 * (24 * 60 * 60 * 1000));

      if (this.isExceedingDepenentEndDate(startDate, dependentTask, tasks)) {
        alert('Start Date has exceeded its dependent EndDate');
        document.body.classList.remove('dragging');
        this.isDragging = false;
        const updatedTaskIndex = tasks.findIndex(t => t.id === dependentTask.id);
        if (updatedTaskIndex !== -1) {
          const newEndDate = new Date(startDate.getTime() + (parseFloat(taskRect.getAttribute('width')) / 52) * (24 * 60 * 60 * 1000));

          // Update the properties of the task in the array
          tasks[updatedTaskIndex].start = startDate.toISOString().split('T')[0];
          tasks[updatedTaskIndex].end = newEndDate.toISOString().split('T')[0];

          // Update the Gantt chart with the new data
          updateTaskStartEndDates(tasks);
          if(allTasks)
          {
            this.createGanttChart(allTasks);
          }
          else{
            this.createGanttChart(tasks);
          }
        }
      }

      // const endDate = new Date(dateInfo.startingDate.getTime() + (parseFloat(taskRect.getAttribute('x')) + parseFloat(taskRect.getAttribute('width'))) / 50 * (24 * 60 * 60 * 1000));

      const maxStartOffset = parseFloat(taskRect.getAttribute('x')) + parseFloat(taskRect.getAttribute('width'));
      const adjustedStartOffset = Math.min(newStartOffset, maxStartOffset);
      const adjustedWidth = maxStartOffset - adjustedStartOffset;
      taskRect.setAttribute('x', newStartOffset);
      taskRect.setAttribute('width', adjustedWidth);

      progress.setAttribute('x', newStartOffset);
      progress.setAttribute('width', adjustedWidth * dependentTask.progress / 100);

    } else {
      // Dragging end handle
      const newWidth = this.initialWidth + deltaX;
      taskRect.setAttribute('width', newWidth);
      progress.setAttribute('width', newWidth * dependentTask.progress / 100);
    }
    this.taskRect = taskRect;
  }

  handleMouseUp(taskRect,  dependentTask, tasks, dateInfo, allTasks = null) {
    document.body.classList.remove('dragging');
    if (this.isDragging) {
      this.isDragging = false
      // Find the task in the array and update its properties
      const updatedTaskIndex = tasks.findIndex((t) => t.id === dependentTask.id);
      if (updatedTaskIndex !== -1) {
        const newStartDate = new Date(
          dateInfo.startingDate.getTime() +
          (parseFloat(taskRect.getAttribute('x')) / 50) * (24 * 60 * 60 * 1000)
        );
        const newEndDate = new Date(
          newStartDate.getTime() +
          (parseFloat(taskRect.getAttribute('width')) / 50) * (24 * 60 * 60 * 1000)
        );
        // Update the properties of the task in the array
        tasks[updatedTaskIndex].start = newStartDate.toISOString().split('T')[0];
        tasks[updatedTaskIndex].end = newEndDate.toISOString().split('T')[0];
        // Update the Gantt chart with the new data
        updateTaskStartEndDates(tasks);
        if (allTasks) {
          this.createGanttChart(allTasks);
        } else {
          this.createGanttChart(tasks);
        }

      }
    }

  }

  updateGanttChartContent(svg, tasks) {
    // Clear existing content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    this.length = this.getTotalLength(tasks)
    // Update the content with the new tasks
    this.dateInfo = this.calculateDateInfo(tasks);
    const chartWidth = this.calculateChartWidth(this.dateInfo);
    const dateGroup = document.createElementNS(svgNS, 'g'); // Create a group element for the task
    dateGroup.setAttribute('class', 'date-groups');
    svg.appendChild(dateGroup);

    svg.setAttribute('viewBox', `0 0 ${chartWidth} ${this.length * 40 + 40}`);

    createGridLines(dateGroup, chartWidth, this.length);
    createMonthHeadings(dateGroup, this.dateInfo, chartWidth);
    createDateScale(dateGroup, this.dateInfo, chartWidth, this.length);
    this.createTaskBars(svg, tasks, this.dateInfo);
  }
  static createChart(tasks) {
    const ganttChart = new GanttChart();
    ganttChart.createGanttChart(tasks);
  }

  static stopDrag(){
    // Remove the event listener when the dragging stops
    document.removeEventListener('mousemove', this.dragMoveListener);  
  }
}