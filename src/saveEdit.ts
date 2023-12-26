import { updateTaskStartEndDates } from './updatechart';
import GanttChart from './gantchart';
import { ITask } from './Interfaces/Task/Task';
import { ISubTask } from './Interfaces/Task/SubTask';

const tooltip = document.createElement('div');
tooltip.className = 'bar-hover';
document.body.appendChild(tooltip);
export function closeModal(modal: HTMLElement) {
    modal.style.display = 'none';
}
export function openAddModal(tasks : ITask[] | ISubTask[]) {
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
}
//function to update the task array
export function addTask(tasks : ITask[] | ISubTask[]) {
    const addModal = document.getElementById('addFormModal');
    const taskName = document.getElementById('taskName')  as HTMLInputElement;
    const startDate = document.getElementById('startDate') as HTMLInputElement;
    const endDate = document.getElementById('endDate') as HTMLInputElement;

    // Ensure the required fields are not empty
    if (!taskName.value || !startDate.value || !endDate.value) {
        alert('Please fill in all fields.');
        return;
    }

    const newTask = {
        id: tasks.length + 1, // Incremental ID
        name: taskName.value,
        start: startDate.value,
        end: endDate.value,
        progress: 0, // You can set the progress as needed
        dependencies: [] // You can set dependencies as needed
    };

    // Add the new task to the existing tasks
    tasks.push(newTask);
    // eslint-disable-next-line no-global-assign
    length = length + 1; //after adding of each task length should be increased
    closeModal(addModal);
    // Call the function with sample data
    GanttChart.createChart(tasks);
}

// Function to handle task editing
export function editTask(event: MouseEvent, task : ITask | ISubTask, tasks : ITask[] | ISubTask [], allTasks = null) {
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
    tasks.forEach((availableTask) => {
        // Check if the available task is not the current task and not dependent on the current task
        if (availableTask.id !== task.id && !isTaskDependent(task, availableTask, tasks)) {
            const option = document.createElement('option');
            option.value = `${availableTask.id}`; // Convert to string using template literal
            option.textContent = availableTask.name;
            if (task.dependencies.includes(availableTask.id)) {
                // If the task is already a dependency, mark it as selected
                option.selected = true;
            }
            editDependenciesSelect.appendChild(option);
        }
    });


    // Store the task ID in a data attribute of the form
    editTaskForm.setAttribute('data-task-id', `${task.id}`);

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

function createFormField(labelText: string, inputId: string, inputValue: string | number, inputType: string, required: boolean, parentName: HTMLElement) {
    const label = document.createElement('label');
    label.setAttribute('for', inputId);
    label.textContent = labelText;

    const input = document.createElement('input');
    input.setAttribute('type', inputType);
    input.setAttribute('id', inputId);
    input.setAttribute('name', inputId);
    input.value =  `${inputValue}`;
    input.required = required;

    // Append label and input to the form
    parentName.appendChild(label);
    parentName.appendChild(input);
}



// Function to check if a task is dependent on another task
export function isTaskDependent(currentTask: ITask | ISubTask, otherTask: ITask, allTasks: ITask[] | ISubTask[] = null) {
    return otherTask.dependencies.includes(currentTask.id) || otherTask.dependencies.some(depId => isTaskDependent(currentTask, allTasks[depId - 1], allTasks));
}

// Function to save edited task
export function saveEditedTask(tasks : ISubTask[] | ITask [] , allTasks = null) {
    const editTaskForm = document.getElementById('editTaskForm') as HTMLFormElement;
    const editTaskNameInput = document.getElementById('editTaskName') as HTMLInputElement;
    const editStartDateInput = document.getElementById('editStartDate')as HTMLInputElement;
    const editEndDateInput = document.getElementById('editEndDate')as HTMLInputElement;
    const editProgress = document.getElementById('editProgress')as HTMLInputElement;
    const editDependenciesSelect = document.getElementById('editDependencies') as HTMLSelectElement;

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

        // Parse the progress value and ensure it's a number
        const parsedProgress = parseInt(progress, 10);
        tasks[editedTaskIndex].progress = isNaN(parsedProgress) ? 0 : Math.min(100, parsedProgress);

        tasks[editedTaskIndex].dependencies = selectedDependencies;
    }


    // Update the Gantt chart with the new data
    updateTaskStartEndDates(tasks);
    // Call the function with sample data
    if (allTasks) {
        GanttChart.createChart(allTasks);
    }
    else {
        GanttChart.createChart(tasks);
    }
}

export function showTaskDetails(event: MouseEvent, task: ISubTask, allTasks: ISubTask[] = null) {
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
