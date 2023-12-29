import { updateTaskStartEndDates } from './updatechart';
import GanttChart from './gantchart';

import { ITask } from './Interfaces/Task/Task';
import { ISubTask } from './Interfaces/Task/SubTask';
import { createInputElement } from "./lib/Html/InputHelper";
import { InputTypes } from "./types/Inputs/InputTypes";

const tooltip = document.createElement('div');
tooltip.className = 'bar-hover';
document.body.appendChild(tooltip);



const inputs:InputTypes[]=[
    {label:'Task Name:',id:'editTaskName',name:'name',type:'text'},
    {label:'Start Date:',id:'editStartDate',name:'start',type:'date'},
    {label:'End Date:',id:'editEndDate',name:'end',type:'date'},
    {label:'Progress:',id:'editProgress',name:'progress',type:'number'},
];


export function closeModal(modal: HTMLElement) {
    modal.style.display = 'none';
}
export function openAddModal(tasks : ITask[] | ISubTask[]) {
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
    inputs.filter(input=>{
        return !(input.type === 'select' && input.options.length === 0);
    }).forEach(input=>{
        input.value = "";
        const inputEL=createInputElement(input)
        addTaskForm.appendChild(inputEL)
    })
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
}



//function to update the task array
export function addTask(tasks : ITask[] | ISubTask[]) {
    const addModal = document.getElementById('addFormModal');
    const addTaskForm = document.getElementById('addTaskForm') as HTMLFormElement;
    const formData=new FormData(addTaskForm);
    const taskName = formData.get('name') as string|undefined;
    const startDate =formData.get('start') as string|undefined;
    const endDate = formData.get('end') as string|undefined;
    const progress = formData.get('progress') as string|undefined;
    // Ensure the required fields are not empty
    if (!taskName || !startDate || !endDate) {
        alert('Please fill in all fields.');
        return;
    }

    const newTask:ITask|ISubTask = {
        id: tasks.length + 1, // Incremental ID
        name: taskName,
        start: startDate,
        end: endDate,
        progress: progress?parseInt(progress):0, // You can set the progress as needed
        dependencies: [] // You can set dependencies as needed
    };

    // Add the new task to the existing tasks
    tasks.push(newTask);
    // eslint-disable-next-line no-global-assign
    length++; //after adding of each task length should be increased
    closeModal(addModal);
    // Call the function with sample data
    GanttChart.createChart(tasks);
}

// Function to handle task editing
export function editTask(event: MouseEvent, task: ITask | ISubTask, tasks: ITask[] | ISubTask [], allTasks = null) {
    event.preventDefault();
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
    inputs.forEach(input=>{
        input['value']=task[<string>input.name]
        const inputEL=createInputElement(input)
        editTaskForm.appendChild(inputEL)
    })
    const editDependenciesSelect = document.createElement('select');
    editDependenciesSelect.setAttribute('id', 'editDependencies');
    editDependenciesSelect.setAttribute('multiple', 'multiple'); // Set the multiple attribute


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
    editTaskForm.appendChild(editDependenciesSelect);
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



// Function to check if a task is dependent on another task
export function isTaskDependent(currentTask: ITask | ISubTask, otherTask: ITask | ISubTask, allTasks: ITask[] | ISubTask[] = null) {
    return otherTask.dependencies.includes(currentTask.id) || otherTask.dependencies.some(depId => {
        const dependentSubTask = allTasks.find(sub => sub.id === depId);
        return dependentSubTask ? isTaskDependent(currentTask, dependentSubTask, allTasks) : false;
    });
}

// Function to save edited task
export function saveEditedTask(tasks: ISubTask[] | ITask [], allTasks = null) {
    const editTaskForm = document.getElementById('editTaskForm') as HTMLFormElement;
    const editDependenciesSelect = document.getElementById('editDependencies') as HTMLSelectElement;

    // Retrieve the task ID from the data attribute
    const taskId = parseInt(editTaskForm.getAttribute('data-task-id'), 10);

    // Retrieve the selected dependencies from the updated select element
    const selectedDependencies = Array.from(editDependenciesSelect.selectedOptions).map(option => parseInt(option.value, 10));

    // Find the task in the array and update its properties
    const editedTaskIndex = tasks.findIndex(task => task.id === taskId);
    if (editedTaskIndex !== -1) {
        const addTaskForm = document.getElementById('editTaskForm') as HTMLFormElement;
        const formData=new FormData(addTaskForm);
        tasks[editedTaskIndex].name = formData.get('name') as string;
        tasks[editedTaskIndex].start = formData.get('start') as string;
        tasks[editedTaskIndex].end = formData.get('end') as string;

        // Parse the progress value and ensure it's a number
        const parsedProgress = parseInt(String(formData.get('progress')), 10);
        tasks[editedTaskIndex].progress = isNaN(parsedProgress) ? 0 : Math.min(100, parsedProgress);
        if (selectedDependencies.filter(d=>!isNaN(d)).length) {
          tasks[editedTaskIndex].dependencies = selectedDependencies;
        }
    }


    // Update the Gantt chart with the new data
    updateTaskStartEndDates(tasks);
    // Call the function with sample data
    if (allTasks) {
        GanttChart.createChart(allTasks);
    } else {
        GanttChart.createChart(tasks);
    }
}

export function showTaskDetails(event: MouseEvent, task: ISubTask | ITask, allTasks: ISubTask[] | ITask [] = null) {
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
