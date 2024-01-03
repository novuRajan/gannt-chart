var Gantt = (function () {
    'use strict';

    const svgNS$1 = 'http://www.w3.org/2000/svg';

    function createGridLines(dateGroup, chartWidth, taskCount) {
        const gridLines = document.createElementNS(svgNS$1, 'g');
        gridLines.classList.add('lines');
        dateGroup.appendChild(gridLines);
        for (let i = 0; i <= chartWidth; i += 50) {
            const line = document.createElementNS(svgNS$1, 'line');
            line.setAttribute('x1', i);
            line.setAttribute('x2', i);
            line.setAttribute('y1', 35);
            line.setAttribute('y2', taskCount * 40 + 40);
            line.classList.add('grid-line');
            gridLines.appendChild(line);
        }
    }

    function createMonthHeadings(dateGroup, dateInfo, chartWidth) {
        const month = document.createElementNS(svgNS$1, 'g');
        month.classList.add('month');
        dateGroup.appendChild(month);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let currentMonth = -1;

        for (let i = 0; i <= chartWidth; i += 50) {
            const currentDate = new Date(dateInfo.startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
            const monthIndex = currentDate.getMonth();
            if (monthIndex !== currentMonth) {
                currentMonth = monthIndex;

                const monthHeading = document.createElementNS(svgNS$1, 'text');
                monthHeading.setAttribute('x', i);
                monthHeading.setAttribute('y', 10);
                monthHeading.classList.add('month-heading');
                monthHeading.textContent = months[currentMonth];
                month.appendChild(monthHeading);
            }
        }
    }

    function createDateScale(dateGroup, dateInfo, chartWidth, taskCount) {
        const date = document.createElementNS(svgNS$1, 'g');
        dateGroup.appendChild(date);
        date.classList.add('date');
        const dateScale = document.createElementNS(svgNS$1, 'text');
        dateScale.setAttribute('x', '0');
        dateScale.setAttribute('y', taskCount);
        date.appendChild(dateScale);
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 0; i <= chartWidth; i += 50) {
            const currentDate = new Date(dateInfo.startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
            const day = document.createElementNS(svgNS$1, 'text');
            day.setAttribute('x', i - 3);
            day.setAttribute('y', 25);
            day.setAttribute('font-size','12px');
            if(currentDate.getDay() === 0 || currentDate.getDay() === 6){
                day.setAttribute('fill','red');
            }
            day.textContent = daysOfWeek[currentDate.getDay()];
            date.appendChild(day);
        }
    }

    function createDivDateScale(dateInfo, chartWidth, taskCount) {
        GanttChart.returnHeight();
        const dateDiv = document.createElement('div');
        dateDiv.setAttribute('id','div-date');
        dateDiv.classList.add('date');
        const div = document.createElement('div');
        div.setAttribute('class','date-div');
        document.createElement('div');
        const width = GanttChart.returnWidth();
        console.log(width);
        for (let i = 0; i <= chartWidth; i += 50) {
            const currentDate = new Date(dateInfo.startingDate.getTime() + i / 50 * (24 * 60 * 60 * 1000));
            const day = document.createElement('div');
          
            day.setAttribute('font-size','10px');
            day.setAttribute('y', 30);
            day.textContent = `${currentDate.getDate()}`;
            // const day = document.createElement('div');
            // day.setAttribute('x', i - 3);
            // day.setAttribute('y', 20);
            // day.setAttribute('font-size','10px')
            if(currentDate.getDay() === 0 || currentDate.getDay() === 6){
                day.setAttribute('style',`position:absolute;left:${i*width/chartWidth}px;color:red`);
            }
            else {
                day.setAttribute('style', `position:absolute;left:${i*width/chartWidth}px`);
            }
            // day.dayContent = daysOfWeek[currentDate.getDay()]
            div.appendChild(day);
            // dateDiv.appendChild(day)
        }
        dateDiv.appendChild(div);
        return dateDiv;
    }

    const updateTaskStartEndDates = (tasks) => {
      const taskMap = new Map(tasks.map(task => [task.id, task]));

      tasks.forEach(task => {
        updateTaskDates(task, taskMap);
        updateSubTaskStartEndDate(task);
      });

    };
    function updateTaskDates(task, taskMap) {
      if (task.dependencies.length === 0) {
        return; // Base case: no dependencies, nothing to update
      }

      const dependentTasks = task.dependencies.map(depId => taskMap.get(depId));

      // Find the maximum end date among dependent tasks
      const maxEndDate = new Date(Math.max(...dependentTasks.map(depTask => new Date(depTask.end))));

      dependentTasks.forEach(dependentTask => {
        updateTaskDates(dependentTask, taskMap);

        // Calculate the duration of the task
        const duration = (new Date(task.end) - new Date(task.start)) / (24 * 60 * 60 * 1000);

        // Check if the start date of the dependent task is after the max end date
        if (new Date(task.start) < maxEndDate) {
          // Update the start date of the current task based on the maximum end date of dependent tasks
          task.start = maxEndDate.toISOString().split('T')[0];

          // Update the end date of the current task based on its duration
          task.end = new Date(new Date(task.start).setDate(new Date(task.start).getDate() + duration)).toISOString().split('T')[0];
        }
      });

    }

    function updateSubTaskStartEndDate(task) {
      // Check if the task has subtasks
      if (task.subTask && task.subTask.length > 0) {
        const subTaskMap = new Map(task.subTask.map(subtask => [subtask.id, subtask]));
        task.subTask.forEach(subTask => {
          const subDuration = (new Date(subTask.end) - new Date(subTask.start)) / (24 * 60 * 60 * 1000);
          // Example condition: If subtask start date is less than task start date, update it
          if (new Date(subTask.start) < new Date(task.start)) {
            subTask.start = task.start;
            subTask.end = new Date(new Date(subTask.start).setDate(new Date(task.start).getDate() + subDuration)).toISOString().split('T')[0];
          }
          updateTaskDates(subTask, subTaskMap);
          if (subTask.end > task.end) {
            task.end = subTask.end;
          }
        });
      }
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'bar-hover';
    document.body.appendChild(tooltip);
    function closeModal(modal) {
        modal.style.display = 'none';
    }
    function openAddModal(tasks) {
        // Create or get the modal element
        let addModal = document.getElementById('addFormModal');
        if (!addModal) {
            addModal = document.createElement('div');
            addModal.setAttribute('id', 'addFormModal');
            addModal.setAttribute('class', 'modal');
            document.body.appendChild(addModal);
        }

        // Create or get the form element
        let addTaskForm = document.getElementById('addTaskForm');
        if (!addTaskForm) {
            addTaskForm = document.createElement('form');
            addTaskForm.setAttribute('id', 'addTaskForm');
            addModal.appendChild(addTaskForm);
        }

        // Clear existing content in the form
        addTaskForm.innerHTML = '';

        // Create form elements dynamically and append them to the form
        createFormField('Task Name:', 'taskName', '', 'text', true, addTaskForm);
        createFormField('Start Date:', 'startDate', '', 'date', true, addTaskForm);
        createFormField('End Date:', 'endDate', '', 'date', true, addTaskForm);
        createFormField('Progress:', 'progress', '', 'number', true, addTaskForm);
        // Create and append Save Changes button
        const saveChangesBtn = document.createElement('button');
        saveChangesBtn.setAttribute('type', 'button');
        saveChangesBtn.textContent = 'Save Changes';
        saveChangesBtn.addEventListener('click', function saveChangesHandler() {
            addTask(tasks);
        });
        addTaskForm.appendChild(saveChangesBtn);

        // Create and append Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.setAttribute('type', 'button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', function saveChangesHandler() {
            closeModal(addModal);
        });
        addTaskForm.appendChild(cancelBtn);

        // Display the modal
        addModal.style.display = 'block';

        // Prevent the contextmenu event from propagating further
        event.preventDefault();
    }
    //function to update the task array
    function addTask(tasks) {
        const addModal = document.getElementById('addFormModal');
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
        length = length + 1; //after adding of each task length should be increased
        closeModal(addModal);
        // Call the function with sample data
        GanttChart.createChart(tasks);
    }

    // Function to handle task editing
    function editTask(event, task, tasks, allTasks = null) {
        event.preventDefault();
        GanttChart.stopDrag();

        // Create or get the modal element
        let editModal = document.getElementById('editModal');
        if (!editModal) {
            editModal = document.createElement('div');
            editModal.setAttribute('id', 'editModal');
            editModal.setAttribute('class', 'modal');
            document.body.appendChild(editModal);
        }

        // Create or get the form element
        let editTaskForm = document.getElementById('editTaskForm');
        if (!editTaskForm) {
            editTaskForm = document.createElement('form');
            editTaskForm.setAttribute('id', 'editTaskForm');
            editModal.appendChild(editTaskForm);
        }

        // Clear existing content in the form
        editTaskForm.innerHTML = '';

        // Create form elements dynamically and append them to the form
        createFormField('Task Name:', 'editTaskName', task.name, 'text', true, editTaskForm);
        createFormField('Start Date:', 'editStartDate', task.start, 'date', true, editTaskForm);
        createFormField('End Date:', 'editEndDate', task.end, 'date', true, editTaskForm);
        createFormField('Progress:', 'editProgress', task.progress, 'number', true, editTaskForm);

        // Clear existing options
        const editDependenciesSelect = document.createElement('select');
        editDependenciesSelect.setAttribute('id', 'editDependencies');
        editDependenciesSelect.setAttribute('multiple', 'multiple'); // Set the multiple attribute
        editTaskForm.appendChild(editDependenciesSelect);

        // Display dependencies in the modal as select options
        tasks.forEach(availableTask => {
            // Check if the available task is not the current task and not dependent on the current task
            if (availableTask.id !== task.id && !isTaskDependent(task, availableTask, tasks)) {
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

        // Create and append Save Changes button
        const saveChangesBtn = document.createElement('button');
        saveChangesBtn.setAttribute('type', 'button');
        saveChangesBtn.textContent = 'Save Changes';
        saveChangesBtn.addEventListener('click', function saveChangesHandler() {
            // Call your function to save the edited task data
            saveEditedTask(tasks, allTasks);
            // Close the modal after saving changes
            closeModal(editModal);
        });
        editTaskForm.appendChild(saveChangesBtn);

        // Create and append Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.setAttribute('type', 'button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', function saveChangesHandler() {
            closeModal(editModal);
        });
        editTaskForm.appendChild(cancelBtn);

        // Display the modal
        editModal.style.display = 'block';

        // Prevent the contextmenu event from propagating further
        event.preventDefault();
    }

    function createFormField(labelText, inputId, inputValue, inputType, required, parentName) {
        const label = document.createElement('label');
        label.setAttribute('for', inputId);
        label.textContent = labelText;

        const input = document.createElement('input');
        input.setAttribute('type', inputType);
        input.setAttribute('id', inputId);
        input.setAttribute('name', inputId);
        input.value = inputValue;
        input.required = required;

        // Append label and input to the form
        parentName.appendChild(label);
        parentName.appendChild(input);
    }



    // Function to check if a task is dependent on another task
    function isTaskDependent(currentTask, otherTask, allTasks) {
        return otherTask.dependencies.includes(currentTask.id) || otherTask.dependencies.some(depId => isTaskDependent(currentTask, allTasks[depId - 1], allTasks));
    }

    // Function to save edited task
    function saveEditedTask(tasks, alltasks = null) {
        const editTaskForm = document.getElementById('editTaskForm');
        const editTaskNameInput = document.getElementById('editTaskName');
        const editStartDateInput = document.getElementById('editStartDate');
        const editEndDateInput = document.getElementById('editEndDate');
        const editProgress = document.getElementById('editProgress');
        const editDependenciesSelect = document.getElementById('editDependencies');

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
        if (alltasks) {
            GanttChart.createChart(alltasks);
        }
        else {
            GanttChart.createChart(tasks);
        }
    }

    function showTaskDetails(task, allTasks) {
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

    const svgNS = 'http://www.w3.org/2000/svg';
    class GanttChart {
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
        this.dependentTask;
        this.tasks;
        this.allTask;
        this.chartWidth;
        this.taskBar;
      }

      getTotalLength(tasks) {
        return tasks.reduce((total, task) => {
          return total + 1 + (task.subTask ? this.getTotalLength(task.subTask) : 0);
        }, 0);
      }

      createButton(tasks) {
        const button = document.createElement('button');
        const btn_add_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        // appending svg icon start
        btn_add_svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        btn_add_svg.setAttribute('height', '10');
        btn_add_svg.setAttribute('viewBox', '0 -960 960 960');
        btn_add_svg.setAttribute('width', '10');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M680-80v-120H560v-80h120v-120h80v120h120v80H760v120h-80Zm-480-80q-33 0-56.5-23.5T120-240v-480q0-33 23.5-56.5T200-800h40v-80h80v80h240v-80h80v80h40q33 0 56.5 23.5T760-720v244q-20-3-40-3t-40 3v-84H200v320h280q0 20 3 40t11 40H200Zm0-480h480v-80H200v80Zm0 0v-80 80Z');
        btn_add_svg.appendChild(path);
        button.appendChild(btn_add_svg);
        // appending svg icon End

        button.setAttribute('class', 'add-button');
        button.setAttribute('title', 'Add task');

        // button.textContent = 'Add Task'; // Set the button text
        button.addEventListener('click', () => {
          openAddModal(tasks);
        });
        return button;
      }

      createGanttChart(tasks) {
        updateTaskStartEndDates(tasks);
        const chartContainer = document.getElementById('chart');
        // Create a button element
        const overallDiv = document.createElement('div'); // Create a div element for the SVG ,date and side bar
        overallDiv.setAttribute('class', 'top-class');
        overallDiv.setAttribute('id', 'overall-div');
        const addTask = document.createElement('div');
        addTask.setAttribute('class', 'add-tasks');
        const sideBar = document.createElement('div');
        sideBar.setAttribute('class', 'sidebar');
        this.taskBar = document.createElement('div');
        this.taskBar.setAttribute('class', 'taskbar');
        sideBar.appendChild(this.taskBar);
        const button = this.createButton(tasks);
        let svg = chartContainer.querySelector('svg');
        // Check if the SVG element already exists
        if (!svg) {
          // Append the button to the parent container of the SVG
          addTask.appendChild(button);
          overallDiv.appendChild(addTask);
          overallDiv.appendChild(sideBar);
          // If not, create a new SVG da
          svg = this.createSVG(tasks);
          overallDiv.appendChild(svg);
          chartContainer.appendChild(overallDiv);
          const Datediv = createDivDateScale(this.dateInfo, this.chartWidth, this.length);
          overallDiv.insertBefore(Datediv, svg);
        } else {
          this.updateGanttChartContent(svg, tasks);
        }
      }

      createSVG(tasks) {
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('id', 'mySvg');
        // svg.setAttribute('min-width', '100%');
        // svg.setAttribute('height', '200%');
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
        setTimeout(() => {
          this.drawDependencyLine(svg, tasks);
        }, 0);
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
        this.chartWidth = (dateInfo.maxDate - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * dateInfo.multiplier;
        return this.chartWidth;
      }

      createTaskBars(svg, tasks, dateInfo) {
        let customIndex = 0;

        tasks.forEach((task, index) => {
          this.createSideBar();

          const taskGroup = document.createElementNS(svgNS, 'g'); // Create a group element for the task
          taskGroup.setAttribute('class', 'tasks');
          svg.appendChild(taskGroup);
          const mainTask = document.createElement('div');
          mainTask.setAttribute('class', 'main-task');
          const dependentTaskEnd = Math.max(...task.dependencies.map(depId => new Date(tasks[depId - 1].end)));
          const startOffset = Math.max((dependentTaskEnd - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50, (new Date(task.start) - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50);
          const duration = (new Date(task.end) - new Date(task.start)) / (24 * 60 * 60 * 1000) * 50;

          const rect = document.createElementNS(svgNS, 'rect');
          rect.setAttribute('x', startOffset);
          rect.setAttribute('y', customIndex * 40 + 40);
          rect.setAttribute('width', duration);
          rect.setAttribute('height', 30);
          rect.setAttribute('fill', '#3498db');
          rect.setAttribute('id', `task-${task.id}`); // Set the id attribute
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
          // div added for the task 
          mainTask.setAttribute('style', `top:${(customIndex * 40 + 40) * 770 / (this.length * 40 + 40)}px;height:auto;`);
          mainTask.textContent = task.name;
          this.taskBar.appendChild(mainTask);
          // Render subtasks
          if (task.subTask && task.subTask.length > 0) {
            const subTaskGroup = document.createElementNS(svgNS, 'g'); // Create a group element for the task
            subTaskGroup.setAttribute('class', 'subtask');
            taskGroup.appendChild(subTaskGroup);
            task.subTask.forEach((subtask, subIndex) => {
              const subTask = document.createElement('div');
              subTask.setAttribute('class', 'sub-task');
              const subDependentTaskEnd = Math.max(...subtask.dependencies.map(depId => new Date(task.subTask[depId - 1].end)));
              const subStartOffset = Math.max((subDependentTaskEnd - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50, (new Date(subtask.start) - dateInfo.startingDate) / (24 * 60 * 60 * 1000) * 50);
              const subDuration = (new Date(subtask.end) - new Date(subtask.start)) / (24 * 60 * 60 * 1000) * 50;

              const subRect = document.createElementNS(svgNS, 'rect');
              subRect.setAttribute('class', 'subtask');
              subRect.setAttribute('x', subStartOffset);
              subRect.setAttribute('y', (subIndex + customIndex + 1) * 40 + 40);
              subRect.setAttribute('width', subDuration);
              subRect.setAttribute('height', 15);
              subRect.setAttribute('fill', '#e74c3c');
              subRect.setAttribute('id', `subtask-${task.id}-${subtask.id}`); // Set the id attribute for subtasks
              subTaskGroup.appendChild(subRect);

              const subProgressWidth = (subDuration * subtask.progress) / 100;
              const subProgressRect = document.createElementNS(svgNS, 'rect');
              subProgressRect.setAttribute('class', 'subtask-progress');
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

              // div added for the subtask
              subTask.setAttribute('style', `top:${((subIndex + customIndex + 1) * 40 + 50) * 770 / (this.length * 40 + 40)}px;height:auto;`);
              subTask.textContent = subtask.name;
              this.taskBar.appendChild(subTask);

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
                this.startDrag(event, subRect, subProgressRect, subtask, task.subTask, tasks);
              });
              subProgressRect.addEventListener('mousedown', (event) => {
                event.preventDefault();
                this.startDrag(event, subRect, subProgressRect, subtask, task.subTask, tasks);
              });
              subText.addEventListener('mousedown', (event) => {
                event.preventDefault();
                this.startDrag(event, subRect, subProgressRect, subtask, task.subTask, tasks);
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
            this.startDrag(event, rect, progressRect, task, tasks);
          });
          progressRect.addEventListener('mousedown', (event) => {
            event.preventDefault();
            this.startDrag(event, rect, progressRect, task, tasks);
          });
          text.addEventListener('mousedown', (event) => {
            event.preventDefault();
            this.startDrag(event, rect, progressRect, task, tasks);
          });
          document.addEventListener('mouseup', (event) => {
            this.handleMouseUp(this.taskRect, this.dependentTask, this.tasks, this.dateInfo, this.allTasks);
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
        const maxDate = new Date(Math.max(...endDates));
        if (maxDate > sartDate) {
          return 1;
        } else {
          return 0;
        }
      }

      handleDragMove(event, taskRect, progress, dependentTask, tasks, allTasks = null) {
        event.preventDefault();
        if (this.isDragging) {
          this.updateTaskBarPosition(event.clientX, taskRect, progress, dependentTask, tasks, allTasks);
        }
      }

      startDrag(event, taskRect, taskProgressRect, dependentTask, task, allTasks = null) {
        this.dependentTask = dependentTask;
        this.tasks = task;
        this.allTasks = allTasks;
        document.body.classList.add('dragging');
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
        document.addEventListener('mousemove', this.dragMoveListener);

      }

      updateTaskBarPosition(clientX, taskRect, progress, dependentTask, tasks, allTasks) {
        const width = this.getWidth();
        const deltaX = (clientX - this.initialX) / (width / this.chartWidth);// Adjust the sensitivity factor 
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
              const newEndDate = new Date(startDate.getTime() + (parseFloat(taskRect.getAttribute('width')) / 51) * (24 * 60 * 60 * 1000));

              // Update the properties of the task in the array
              tasks[updatedTaskIndex].start = startDate.toISOString().split('T')[0];
              tasks[updatedTaskIndex].end = newEndDate.toISOString().split('T')[0];
              document.removeEventListener('mousemove', this.dragMoveListener);
              // Update the Gantt chart with the new data
              updateTaskStartEndDates(tasks);
              if (allTasks) {
                this.createGanttChart(allTasks);
              }
              else {
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

      handleMouseUp(taskRect, dependentTask, tasks, dateInfo, allTasks = null) {
        document.body.classList.remove('dragging');
        document.removeEventListener('mousemove', this.dragMoveListener);
        if (this.isDragging) {
          this.isDragging = false;
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
        const chartContainer = document.getElementById('overall-div');
        //clear the excisting date div
        let Datediv = document.getElementById('div-date');
        chartContainer.removeChild(Datediv);
        // Clear existing content
        while (svg.firstChild) {
          svg.removeChild(svg.firstChild);
        }
        this.length = this.getTotalLength(tasks);
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
        Datediv = createDivDateScale(this.dateInfo, this.chartWidth, this.length);
        chartContainer.insertBefore(Datediv, svg);
        this.createTaskBars(svg, tasks, this.dateInfo);
        this.drawDependencyLine(svg, tasks);
      }

      drawDependencyLine(svg, tasks) {
        const arrowheadSize = 5;

        tasks.forEach((task, index) => {
          if (task.dependencies && task.dependencies.length > 0) {
            task.dependencies.forEach((dependencyId) => {
              const dependentTask = tasks.find((t) => t.id === dependencyId);
              if (dependentTask) {
                const startTaskElement = document.getElementById(`task-${dependentTask.id}`);
                const endTaskElement = document.getElementById(`task-${task.id}`);

                if (startTaskElement && endTaskElement) {
                  const startOffset = parseFloat(startTaskElement.getAttribute('width')) + parseFloat(startTaskElement.getAttribute('x'));
                  const x1 = startOffset;
                  const y1 = parseFloat(startTaskElement.getAttribute('y'));
                  const x2 = parseFloat(endTaskElement.getAttribute('x')) + parseFloat(endTaskElement.getAttribute('width')) / 2;

                  // Draw horizontal line
                  const lineHorizontal = this.createSvgLine(x1, y1 + parseFloat(endTaskElement.getAttribute('height')) / 2, x2, y1 + parseFloat(endTaskElement.getAttribute('height')) / 2);
                  svg.appendChild(lineHorizontal);

                  //if blocked task is above the blocker task in the chart ,add extra height to the vertical line
                  const isDependentAfterTask = dependentTask.id > task.id;
                  const extraHeight = isDependentAfterTask ? parseFloat(endTaskElement.getAttribute('height')) : 0;


                  // Draw vertical line
                  const lineVertical = this.createSvgLine(x2, y1 + parseFloat(endTaskElement.getAttribute('height')) / 2, x2, parseFloat(endTaskElement.getAttribute('y')) + extraHeight);
                  svg.appendChild(lineVertical);

                  // Draw arrowhead
                  const arrowheadY = isDependentAfterTask ? parseFloat(endTaskElement.getAttribute('y')) + parseFloat(endTaskElement.getAttribute('height')) : parseFloat(endTaskElement.getAttribute('y'));
                  const arrowDirection = isDependentAfterTask ? 'up' : 'down';
                  const arrowhead = this.createArrowhead(x2, arrowheadY, arrowheadSize, arrowDirection);
                  svg.appendChild(arrowhead);
                }
              }
            });
          }

          if (task.subTask) {
            task.subTask.forEach((subtask, subindex) => {
              if (subtask.dependencies && subtask.dependencies.length > 0) {
                subtask.dependencies.forEach((dependencyId) => {
                  const dependentTask = task.subTask.find((t) => t.id === dependencyId);
                  if (dependentTask) {
                    const startTaskElement = document.getElementById(`subtask-${task.id}-${dependentTask.id}`);
                    const endTaskElement = document.getElementById(`subtask-${task.id}-${subtask.id}`);

                    if (startTaskElement && endTaskElement) {
                      const startOffset = parseFloat(startTaskElement.getAttribute('width')) + parseFloat(startTaskElement.getAttribute('x'));
                      const x1 = startOffset;
                      const y1 = parseFloat(startTaskElement.getAttribute('y'));
                      const x2 = parseFloat(endTaskElement.getAttribute('x')) + parseFloat(endTaskElement.getAttribute('width')) / 2;

                      // Draw horizontal line
                      const lineHorizontal = this.createSvgLine(x1, y1 + parseFloat(endTaskElement.getAttribute('height')) / 2, x2, y1 + parseFloat(endTaskElement.getAttribute('height')) / 2);
                      svg.appendChild(lineHorizontal);

                      //if blocked subtask is above the blocker task in the chart ,add extra height to the vertical line
                      const isDependentAfterTask = dependentTask.id > subtask.id;
                      const extraHeight = isDependentAfterTask ? parseFloat(endTaskElement.getAttribute('height')) : 0;

                      // Draw vertical line
                      const lineVertical = this.createSvgLine(x2, y1 + parseFloat(endTaskElement.getAttribute('height')) / 2, x2, parseFloat(endTaskElement.getAttribute('y')) + extraHeight);
                      svg.appendChild(lineVertical);

                      // Draw arrowhead
                      const arrowheadY = dependentTask.id > subtask.id ? parseFloat(endTaskElement.getAttribute('y')) + parseFloat(endTaskElement.getAttribute('height')) : parseFloat(endTaskElement.getAttribute('y'));
                      const arrowDirection = isDependentAfterTask ? 'up' : 'down';
                      const arrowhead = this.createArrowhead(x2, arrowheadY, arrowheadSize, arrowDirection);
                      svg.appendChild(arrowhead);
                    }
                  }
                });
              }
            });
          }
        });
      }

      createSvgLine(x1, y1, x2, y2) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.classList.add('dependency-line');
        return line;
      }

      createArrowhead(x, y, size, arrowDirection) {
        const arrowhead = document.createElementNS(svgNS, 'polygon');
        const points = arrowDirection === "down"
          ? `${x},${y - size} ${x - size},${y - size} ${x},${y} ${x + size},${y - size}`
          : `${x - size},${y + size} ${x},${y} ${x + size},${y + size}`;
        arrowhead.setAttribute('points', points);
        arrowhead.classList.add('dependency-arrowhead');
        return arrowhead;
      }

      createSideBar() {
        const sidebar = document.createElement('div');
        sidebar.setAttribute('class', 'sidebar');
        return sidebar;
      }

      getWidth() {
        var svgElement = document.getElementById('mySvg');

        if (svgElement) {
          var svgWidthInPixels = window.getComputedStyle(svgElement).width;
          var numericWidth = parseFloat(svgWidthInPixels);
          return numericWidth;
        } else {
          return null;
        }
      }

      getheight() {
        var svgElement = document.getElementById('mySvg');

        if (svgElement) {
          var svgWidthInPixels = window.getComputedStyle(svgElement).height;
          var numericWidth = parseFloat(svgWidthInPixels);
          return numericWidth;
        } else {
          return null;
        }
      }

      static returnHeight() {
        const height = new GanttChart();
        return height.getheight();
      }

      static returnWidth() {
        const width = new GanttChart();
        return width.getWidth();
      }

      static createChart(tasks) {
        const ganttChart = new GanttChart();
        ganttChart.createGanttChart(tasks);
      }

      static stopDrag() {
        // Remove the event listener when the dragging stops
        document.removeEventListener('mousemove', this.dragMoveListener);
      }
    }

    return GanttChart;

})();
//# sourceMappingURL=gantt.js.map
