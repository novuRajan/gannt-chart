// Function to close the edit modal
function closeEditModal() {
    const editModal = document.getElementById('editModal');
    editModal.style.display = 'none';
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
    length = length + 1; //after adding of each task length should be increased
    // Update the Gantt chart with the new data
    updateTaskStartEndDates(tasks);
    // Call the function with sample data
    createGanttChart(tasks);
}
  
// Function to handle task editing
function editTask(event, task, tasks, allTasks = null) {
    const editTaskForm = document.getElementById('editTaskForm');
    const editTaskNameInput = document.getElementById('editTaskName');
    const editStartDateInput = document.getElementById('editStartDate');
    const editEndDateInput = document.getElementById('editEndDate');
    const editProgress = document.getElementById('editProgress');
    const editDependenciesSelect = document.getElementById('editDependencies');
    const editModal = document.getElementById('editModal');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    // Set the current task details in the form
    editTaskNameInput.value = task.name;
    editStartDateInput.value = task.start;
    editEndDateInput.value = task.end;
    editProgress.value = task.progress;

    // Clear existing options
    editDependenciesSelect.innerHTML = '';

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

    // Display the modal
    editModal.style.display = 'block';
    console.log('ahha');
    // Attach a click event listener to the "Save Changes" button
    saveChangesBtn.addEventListener('click', function saveChangesHandler() {
        console.log('Save Changes clicked');
        // Call your function to save the edited task data
        saveEditedTask(tasks, allTasks);
        // Close the modal after saving changes
        closeEditModal();
    }, { once: true });

    // Prevent the contextmenu event from propagating further
    event.preventDefault();
}
  
// Function to check if a task is dependent on another task
function isTaskDependent(currentTask, otherTask, allTasks) {
    return otherTask.dependencies.includes(currentTask.id) || otherTask.dependencies.some(depId => isTaskDependent(currentTask, allTasks[depId - 1], allTasks));
}
  
// Function to save edited task
function saveEditedTask(tasks,alltasks=null) {
    console.log("after save",tasks);
    console.log('after all task',alltasks);
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
    if(alltasks)
    {
        createGanttChart(alltasks);
    }
    else{
        createGanttChart(tasks);
    }

    // Close the modal
    closeEditModal();
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