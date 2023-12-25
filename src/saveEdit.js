import { updateTaskStartEndDates } from "./updatechart.js";
import GanttChart from "./gantchart.js";

const tooltip = document.createElement('div');
tooltip.className = 'bar-hover';
document.body.appendChild(tooltip);
export function closeModal(modal) {
    modal.style.display = 'none';
}
export function openAddModal(tasks) {
    // Create or get the modal element
    let addModal = document.getElementById('addFormModal');
    if (!addModal) {
        addModal = document.createElement('div');
        addModal.setAttribute('id', 'addFormModal');
        addModal.setAttribute('class', 'modal')
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
        closeModal(addModal)
    });
    addTaskForm.appendChild(cancelBtn);

    // Display the modal
    addModal.style.display = 'block';

    // Prevent the contextmenu event from propagating further
    event.preventDefault();
}
//function to update the task array
export function addTask(tasks) {
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
export function editTask(event, task, tasks, allTasks = null) {
    event.preventDefault();
    GanttChart.stopDrag();

    // Create or get the modal element
    let editModal = document.getElementById('editModal');
    if (!editModal) {
        editModal = document.createElement('div');
        editModal.setAttribute('id', 'editModal');
        editModal.setAttribute('class', 'modal')
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
export function isTaskDependent(currentTask, otherTask, allTasks) {
    return otherTask.dependencies.includes(currentTask.id) || otherTask.dependencies.some(depId => isTaskDependent(currentTask, allTasks[depId - 1], allTasks));
}

// Function to save edited task
export function saveEditedTask(tasks, alltasks = null) {
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

export function showTaskDetails(task, allTasks) {
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

export function hideTaskDetails() {
    tooltip.style.display = 'none';
}