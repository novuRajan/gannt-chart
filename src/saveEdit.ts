import { updateTaskStartEndDates } from './updatechart';
import GanttChart from './gantchart';

import { ITask } from './Interfaces/Task/Task';
import { ISubTask } from './Interfaces/Task/SubTask';
import { createInputElement } from "./lib/Html/InputHelper";
import { InputTypes } from "./types/Inputs/InputTypes";
import { createElement, createButton } from "./lib/Html/HtmlHelper";
import stores from "./stores";
import { appendChildToParent, createElementFromObject } from "./lib/Html/HtmlHelper";


const tooltip = createElement('div', 'bar-hover');
appendChildToParent(document.body, tooltip)



const inputs: InputTypes[] = [
    { label: 'Task Name:', id: 'editTaskName', name: 'name', type: 'text' },
    { label: 'Start Date:', id: 'editStartDate', name: 'start', type: 'date' },
    { label: 'End Date:', id: 'editEndDate', name: 'end', type: 'date' },
    { label: 'Progress:', id: 'editProgress', name: 'progress', type: 'number' },
];


export function closeModal(modal: HTMLElement) {
    modal.style.display = 'none';
}
export function openAddModal(tasks: ITask[] | ISubTask[]) {
    // Create or get the modal element
    let addModal = document.getElementById('addFormModal');
    if (!addModal) {
        addModal = createElement('div', 'modal', '', 'addFormModal');
        appendChildToParent(document.body, addModal);

    }

    // Create or get the form element
    let addTaskForm = document.getElementById('addTaskForm');
    if (!addTaskForm) {
        addTaskForm = createElement('form', '', '', 'addTaskForm');
        appendChildToParent(addModal, addTaskForm);

    }

    // Clear existing content in the form
    addTaskForm.innerHTML = '';
    // Create form elements dynamically and append them to the form
    inputs.filter(input => {
        return !(input.type === 'select' && input.options.length === 0);
    }).forEach(input => {
        input.value = "";
        const inputEL = createInputElement(input)
        appendChildToParent(addTaskForm, inputEL);

    })
    // Create and append Save Changes button
    const saveChangesBtn = createButton('save-changes-btn', 'Save Changes', '', function saveChangesHandler() {
        addTask(tasks);
    });
    appendChildToParent(addTaskForm, saveChangesBtn);


    // Create and append Cancel button
    const cancelBtn = createButton('cancel-btn', 'Cancel', '', function saveChangesHandler() {
        if (addModal) {
            closeModal(addModal);
        }
    });
    appendChildToParent(addTaskForm, cancelBtn);


    // Display the modal
    addModal.style.display = 'block';
}



//function to update the task array
export function addTask(tasks: ITask[] | ISubTask[]) {
    const addModal = document.getElementById('addFormModal');
    const addTaskForm = document.getElementById('addTaskForm') as HTMLFormElement;
    const formData = new FormData(addTaskForm);
    const taskName = formData.get('name') as string | undefined;
    const startDate = formData.get('start') as string | undefined;
    const endDate = formData.get('end') as string | undefined;
    const progress = formData.get('progress') as string | undefined;
    // Ensure the required fields are not empty
    if (!taskName || !startDate || !endDate) {
        alert('Please fill in all fields.');
        return;
    }

    const existingIds = tasks.map((task: ITask | ISubTask) => task.id);
    const newTaskId = Math.max(...existingIds, 0) + 1;

    const newTask:ITask|ISubTask = {
        id: newTaskId,
        name: taskName,
        start: startDate,
        end: endDate,
        progress: progress ? parseInt(progress) : 0, // You can set the progress as needed
        dependencies: [] // You can set dependencies as needed
    };
    const chartConfig = stores.chartConfig.getState();
    if (chartConfig.add) {
        chartConfig.add(newTask)
    }
    // Add the new task to the existing tasks
    tasks.push(newTask);

    length++; //after adding of each task length should be increaseD
    if (addModal) {
        closeModal(addModal);
    }
    // Call the function with sample data
    GanttChart.createChart(tasks);
}

// Function to handle task editing
export function editTask(event: MouseEvent, task: ITask | ISubTask, tasks: ITask[] | ISubTask[], allTasks = null) {
    event.preventDefault();
    // Create or get the modal element
    let editModal = document.getElementById('editModal');
    if (!editModal) {
        editModal = createElement('div', 'modal', '', 'editModal');
        appendChildToParent(document.body, editModal);

    }

    // Create or get the form element
    let editTaskForm = document.getElementById('editTaskForm');
    if (!editTaskForm) {
        editTaskForm = createElement('form', '', '', 'editTaskForm');
        appendChildToParent(editModal, editTaskForm);

    }
    // Clear existing content in the form
    editTaskForm.innerHTML = '';
    inputs.forEach(input => {
        input['value'] = task[<string>input.name]
        const inputEL = createInputElement(input)
        appendChildToParent(editTaskForm, inputEL);

    })
    const editDependenciesSelect = createElementFromObject('select', {
        id: 'editDependencies',
        multiple: 'multiple'
    })



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
            appendChildToParent(editDependenciesSelect, option);

        }
    });
    appendChildToParent(editTaskForm, editDependenciesSelect);

    // Store the task ID in a data attribute of the form
    editTaskForm.setAttribute('data-task-id', `${task.id}`);

    const saveChangesBtn = createButton('save-changes-btn', 'Save Changes', '', function saveChangesHandler() {
        // Call your function to save the edited task data
        saveEditedTask(tasks, allTasks);
        // Close the modal after saving changes
        if (editModal) {
            closeModal(editModal);
        }
    });
    appendChildToParent(editTaskForm, saveChangesBtn);


    // Create and append Delete button
    const deleteBtn = createButton('delete-btn', 'Delete', '', function deleteTaskHandler() {
        deleteTask(tasks, allTasks);
        closeModal(editModal);
    });
    appendChildToParent(editTaskForm, deleteBtn);


    // Create and append Cancel button
    const cancelBtn = createButton('cancel-btn', 'Cancel', '', function saveChangesHandler() {
        if (editModal) {
            closeModal(editModal);
        }
    });
    appendChildToParent(editTaskForm, cancelBtn);


    // Display the modal
    editModal.style.display = 'block';

    // Prevent the contextmenu event from propagating further
    event.preventDefault();
}



// Function to check if a task is dependent on another task
export function isTaskDependent(currentTask: ITask | ISubTask, otherTask: ITask | ISubTask, allTasks: ITask[] | ISubTask[] = []): boolean {
    return otherTask.dependencies.includes(currentTask.id) || otherTask.dependencies.some(depId => {
        const dependentSubTask = allTasks.find(sub => sub.id === depId);
        return dependentSubTask ? isTaskDependent(currentTask, dependentSubTask, allTasks) : false;
    });
}

// Function to save edited task
export function saveEditedTask(tasks: ISubTask[] | ITask[], allTasks = null) {
    const editTaskForm = document.getElementById('editTaskForm') as HTMLFormElement;
    const editDependenciesSelect = document.getElementById('editDependencies') as HTMLSelectElement;

    // Retrieve the task ID from the data attribute
    const taskId = parseInt(editTaskForm.getAttribute('data-task-id') ?? '0', 10);
    // Retrieve the selected dependencies from the updated select element
    const selectedDependencies = Array.from(editDependenciesSelect.selectedOptions).map(option => parseInt(option.value, 10));

    // Find the task in the array and update its properties
    const editedTaskIndex = tasks.findIndex(task => task.id === taskId);
    if (editedTaskIndex !== -1) {
        const addTaskForm = document.getElementById('editTaskForm') as HTMLFormElement;
        const formData = new FormData(addTaskForm);
        tasks[editedTaskIndex].name = formData.get('name') as string;
        tasks[editedTaskIndex].start = formData.get('start') as string;
        tasks[editedTaskIndex].end = formData.get('end') as string;

        // Parse the progress value and ensure it's a number
        const parsedProgress = parseInt(String(formData.get('progress')), 10);
        tasks[editedTaskIndex].progress = isNaN(parsedProgress) ? 0 : Math.min(100, parsedProgress);
        tasks[editedTaskIndex].dependencies = selectedDependencies;
    }

    const chartConfig = stores.chartConfig.getState();

    // Update the Gantt chart with the new data
    updateTaskStartEndDates(tasks);
    // Call the function with sample data
    if (allTasks) {
        if (chartConfig.update) {
            chartConfig.update(tasks[editedTaskIndex])
        }
        GanttChart.createChart(allTasks);
    } else {
        if (chartConfig.update) {
            chartConfig.update(tasks[editedTaskIndex])
        }
        GanttChart.createChart(tasks);
    }
}

export function showTaskDetails(event: MouseEvent, task: ISubTask | ITask, allTasks: ISubTask[] | ITask[] = []) {
    const dependentTaskNames = (task.dependencies.map(depId => {
        const dependentSubTask = allTasks.find(sub => sub.id === depId);
        return dependentSubTask ? dependentSubTask.name : '';
    })
    );
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

export function deleteTask(tasks: ISubTask[] | ITask[], allTasks: ISubTask[] | ITask[] | null) {
    const confirmation = window.confirm('Are you sure you want to delete this task?');

    if (!confirmation) {
        // If the user cancels the deletion, do nothing
        return;
    }

    const editTaskForm = document.getElementById('editTaskForm') as HTMLFormElement;
    const taskId = parseInt(editTaskForm.getAttribute('data-task-id'), 10);

    // Finding the index of the task to be deleted
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        // Removing the task ID from dependencies of other tasks
        tasks.forEach(otherTask => {
            otherTask.dependencies = otherTask.dependencies.filter(depId => depId !== taskId);
        });

        tasks.splice(taskIndex, 1);
        const chartData = allTasks || tasks;
        GanttChart.createChart(chartData);
    }
}






