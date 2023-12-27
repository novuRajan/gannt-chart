import { createDateScale, createDivDateScale, createGridLines, createMonthHeadings } from './date-utl';
import { updateTaskStartEndDates } from './updatechart';
import { editTask, hideTaskDetails, openAddModal, showTaskDetails } from './saveEdit';
import { ITask } from './Interfaces/Task/Task';
import { ISubTask } from './Interfaces/Task/SubTask';
import { IDateInfo } from './Interfaces/Date/DateInfo';
import { DateHelper } from './lib/Date';

const svgNS = 'http://www.w3.org/2000/svg';
export default class GanttChart {
    protected dateInfo: IDateInfo;
    private allTasks: ITask[];
    private isDragging: boolean = false;
    private initialX: number;
    private initialWidth: number;
    private isDragStart: boolean;
    private currentTaskRect: SVGRectElement;
    private currentProgressRect: SVGRectElement;
    private dragMoveListener: () => void;
    private length: number;
    private dependentTask: ITask | ISubTask;
    private tasks: ITask[] | ISubTask[];
    private chartWidth: number;
    private taskRect: SVGRectElement;

    getTotalLength(tasks: ITask[]) {
        return tasks.reduce((total, task) => {
            return total + 1 + (task.subTask ? this.getTotalLength(task.subTask) : 0);
        }, 0);
    }

    createButton(tasks: ITask[]) {
        const button = document.createElement('button');
        button.setAttribute('class', 'top-place add-button');
        button.textContent = 'Add Task'; // Set the button text
        button.addEventListener('click', () => {
            openAddModal(tasks);
        });
        return button;
    }

    createGanttChart(tasks: ITask[]) {
        updateTaskStartEndDates(tasks);
        const chartContainer = document.getElementById('chart');
        // Create a button element
        const button = this.createButton(tasks);
        let svg = chartContainer.querySelector('svg');
        // Check if the SVG element already exists
        if (!svg) {
            // Append the button to the parent container of the SVG
            chartContainer.appendChild(button);
            // If not, create a new SVG element
            svg = this.createSVG(tasks);
            chartContainer.appendChild(svg);
            const DateDiv = createDivDateScale(this.dateInfo, this.chartWidth);
            chartContainer.insertBefore(DateDiv, svg);

        } else {
            this.updateGanttChartContent(svg, tasks);
        }
    }

    createSVG(tasks: ITask[]) {
        const svg = document.createElementNS(svgNS, 'svg');
        // svg.setAttribute('style', 'position: absolute; left: 10rem');
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

    calculateDateInfo(tasks: ITask[]): IDateInfo {
        const startDates = tasks.map(task => task.start);
        const endDates = tasks.map(task => task.end);

        // const minDate = new Date(Math.min(...startDates));
        const startingDate = new DateHelper(startDates).earliestDate();
        startingDate.setDate(startingDate.getDate() - 5);

        const maxDate = new DateHelper(endDates).latestDate();
        const dateDiff = (maxDate.getTime() - startingDate.getTime()) / (24 * 60 * 60 * 1000);

        const multiplier = dateDiff > 100 ? 54 : dateDiff > 30 ? 60 : 120;

        return { startingDate, maxDate, multiplier };
    }

    calculateChartWidth(dateInfo : IDateInfo) {
        this.chartWidth = (dateInfo.maxDate.getTime() - dateInfo.startingDate.getTime()) / (24 * 60 * 60 * 1000) * dateInfo.multiplier;
        return this.chartWidth;
    }

    createTaskBars(svg: SVGElement, tasks: ITask[], dateInfo: IDateInfo) {
        let customIndex = 0;

        tasks.forEach((task) => {
            const taskGroup = document.createElementNS(svgNS, 'g'); // Create a group element for the task
            taskGroup.setAttribute('class', 'tasks');
            svg.appendChild(taskGroup);

            const dependentTaskEnd = Math.max(...task.dependencies.map(depId => new Date(tasks[depId - 1].end).getTime()));
            const startOffset = Math.max((dependentTaskEnd - dateInfo.startingDate.getTime()) / (24 * 60 * 60 * 1000) * 50, (new Date(task.start).getTime() - dateInfo.startingDate.getTime()) / (24 * 60 * 60 * 1000) * 50);
            const duration = (new Date(task.end).getTime() - new Date(task.start).getTime()) / (24 * 60 * 60 * 1000) * 50;

            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', String(startOffset));
            rect.setAttribute('y', String(customIndex * 40 + 40));
            rect.setAttribute('width', String(duration));
            rect.setAttribute('height', String(30));
            rect.setAttribute('fill', '#3498db');
            rect.setAttribute('id', `task-${task.id}`); // Set the id attribute
            taskGroup.appendChild(rect);

            const progressWidth = (duration * task.progress) / 100;
            const progressRect = document.createElementNS(svgNS, 'rect');
            progressRect.setAttribute('x', String(startOffset));
            progressRect.setAttribute('y', String(customIndex * 40 + 40));
            progressRect.setAttribute('width', String(progressWidth));
            progressRect.setAttribute('height', String(30));
            progressRect.setAttribute('fill', '#2ecc71');
            taskGroup.appendChild(progressRect);

            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', String(startOffset + 5));
            text.setAttribute('y', String(customIndex * 40 + 60));
            text.textContent = task.name;
            taskGroup.appendChild(text);

            // Render subtasks
            if (task.subTask && task.subTask.length > 0) {
                const subTaskGroup = document.createElementNS(svgNS, 'g'); // Create a group element for the task
                subTaskGroup.setAttribute('class', 'subtask');
                taskGroup.appendChild(subTaskGroup);
                task.subTask.forEach((subtask, subIndex) => {
                    const subDependentTaskEnd = Math.max(...subtask.dependencies.map(depId => new Date(task.subTask[depId - 1].end).getTime()));
                    const subStartOffset = Math.max((subDependentTaskEnd - dateInfo.startingDate.getTime()) / (24 * 60 * 60 * 1000) * 50, (new Date(subtask.start).getTime() - dateInfo.startingDate.getTime()) / (24 * 60 * 60 * 1000) * 50);
                    const subDuration = (new Date(subtask.end).getTime() - new Date(subtask.start).getTime()) / (24 * 60 * 60 * 1000) * 50;

                    const subRect = document.createElementNS(svgNS, 'rect');
                    subRect.setAttribute('class', 'subtask');
                    subRect.setAttribute('x', String(subStartOffset));
                    subRect.setAttribute('y', String((subIndex + customIndex + 1) * 40 + 40));
                    subRect.setAttribute('width', String(subDuration));
                    subRect.setAttribute('height', String(15));
                    subRect.setAttribute('fill', '#e74c3c');
                    subRect.setAttribute('id', `subtask-${task.id}-${subtask.id}`); // Set the id attribute for subtasks
                    subTaskGroup.appendChild(subRect);

                    const subProgressWidth = (subDuration * subtask.progress) / 100;
                    const subProgressRect = document.createElementNS(svgNS, 'rect');
                    subProgressRect.setAttribute('class', 'subtask-progress');
                    subProgressRect.setAttribute('x', String(subStartOffset));
                    subProgressRect.setAttribute('y', String((subIndex + customIndex + 1) * 40 + 40));
                    subProgressRect.setAttribute('width', String(subProgressWidth));
                    subProgressRect.setAttribute('height', String(15));
                    subProgressRect.setAttribute('fill', '#c0392b');
                    subTaskGroup.appendChild(subProgressRect);

                    const subText = document.createElementNS(svgNS, 'text');
                    subText.setAttribute('x', String(subStartOffset + 5));
                    subText.setAttribute('y', String((subIndex + customIndex + 1) * 40 + 50));
                    subText.textContent = subtask.name;
                    subText.setAttribute('font-size', '10px');
                    subTaskGroup.appendChild(subText);

                    subText.addEventListener('mouseover', (e) => showTaskDetails(e, subtask, task.subTask));
                    subRect.addEventListener('mouseover', (e) => showTaskDetails(e, subtask, task.subTask));
                    subRect.addEventListener('mouseout', hideTaskDetails);

                    subProgressRect.addEventListener('mouseover', (e) => showTaskDetails(e, subtask, task.subTask));
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
            text.addEventListener('mouseover', (e) => showTaskDetails(e, task, tasks));
            rect.addEventListener('mouseover', (e) => showTaskDetails(e, task, tasks));
            rect.addEventListener('mouseout', hideTaskDetails);

            progressRect.addEventListener('mouseover', (e) => showTaskDetails(e, task, tasks));
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
            // Remove the existing event listener before adding a new one
            document.addEventListener('mouseup', () => {
                if(this.taskRect)
                {
                    return this.handleMouseUp(this.taskRect, this.dependentTask, this.tasks, this.dateInfo, this.allTasks);
                }
                else{
                   this.stopDrag();
                }
            });
            // task below the subtask
            customIndex = customIndex + 1;
            if (task.subTask && task.subTask.length > 0) {
                customIndex = customIndex + task.subTask.length;
            }
        });
    }

    throttle<T extends (...args: any[]) => any>(func: T, limit: number) {
        let inThrottle: boolean;

        return function(this: any) {
            const args = arguments;
            const context = this;

            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }


    isExceedingDependentEndDate(sartDate : Date, dependentTask : ISubTask | ITask, tasks : ITask[] | ISubTask[]) {
        const tasksWithDesiredIds = tasks.filter(task =>
            dependentTask.dependencies.includes(task.id)
        );
        const endDates = new DateHelper(tasksWithDesiredIds.map(task => (task.end)))
        const maxDate = endDates.latestDate();
        if (maxDate > sartDate) {
            return 1;
        } else {
            return 0;
        }
    }

    handleDragMove(event: { preventDefault: () => void; clientX: any; }, taskRect : SVGRectElement, progress : SVGRectElement, dependentTask : ITask | ISubTask, tasks : ITask[] | ISubTask [], allTasks = null) {
        event.preventDefault();
        if (this.isDragging) {
            this.updateTaskBarPosition(event.clientX, taskRect, progress, dependentTask, tasks, allTasks);
        }
    }

    startDrag(event: MouseEvent, taskRect: SVGRectElement, taskProgressRect: SVGRectElement , dependentTask : ITask | ISubTask, task : ITask[] | ISubTask[] ,  allTasks = null) {
        this.dependentTask = dependentTask;
        this.tasks = task;
        this.allTasks = allTasks;
        document.body.classList.add('dragging');
        hideTaskDetails;
        this.isDragging = true;
        this.initialX = event.clientX;
        this.initialWidth = parseFloat(taskRect.getAttribute('width'));
        this.isDragStart = event.clientX < taskRect.getBoundingClientRect().left + this.initialWidth / 2;
        // Set the current task and progress bar
        this.currentTaskRect = taskRect;
        this.currentProgressRect = taskProgressRect;
        this.dragMoveListener = this.throttle((event: { preventDefault: () => void; clientX: any; }) => {
            this.handleDragMove(event, this.currentTaskRect, this.currentProgressRect, dependentTask, task, allTasks);
        }, 16);
        event.preventDefault();
        document.addEventListener('mousemove', this.dragMoveListener);

    }

    updateTaskBarPosition(clientX: number, taskRect: SVGRectElement, progress: SVGRectElement, dependentTask: ITask | ISubTask, tasks: ITask[] | ISubTask [], allTasks: ITask[] | null) {
        const width = this.getWidth();
        const deltaX = (clientX - this.initialX) / (width / this.chartWidth);// Adjust the sensitivity factor
        if (this.isDragStart) {
            // Dragging start handle
            const newStartOffset = (new Date(dependentTask.start).getTime() - this.dateInfo.startingDate.getTime()) / (24 * 60 * 60 * 1000) * 50 + deltaX;
            const startDate = new Date(this.dateInfo.startingDate.getTime() + (parseFloat(taskRect.getAttribute('x'))) / 50 * (24 * 60 * 60 * 1000));

            if (this.isExceedingDependentEndDate(startDate, dependentTask, tasks)) {
                alert('Start Date has exceeded its dependent EndDate');
                const updatedTaskIndex = tasks.findIndex(t => t.id === dependentTask.id);
                if (updatedTaskIndex !== -1) {
                    const newEndDate = new Date(startDate.getTime() + (parseFloat(taskRect.getAttribute('width')) / 51) * (24 * 60 * 60 * 1000));

                    // Update the properties of the task in the array
                    tasks[updatedTaskIndex].start = startDate.toISOString().split('T')[0];
                    tasks[updatedTaskIndex].end = newEndDate.toISOString().split('T')[0];
                    this.stopDrag();
                    // Update the Gantt chart with the new data
                    updateTaskStartEndDates(tasks);
                    if (allTasks) {
                        this.createGanttChart(allTasks);
                    } else {
                        this.createGanttChart(tasks);
                    }
                }
            }

            const maxStartOffset = parseFloat(taskRect.getAttribute('x')) + parseFloat(taskRect.getAttribute('width'));
            const adjustedStartOffset = Math.min(newStartOffset, maxStartOffset);
            const adjustedWidth = maxStartOffset - adjustedStartOffset;
            taskRect.setAttribute('x', String(newStartOffset));
            taskRect.setAttribute('width', String(adjustedWidth));

            progress.setAttribute('x', String(newStartOffset));
            progress.setAttribute('width', String(adjustedWidth * dependentTask.progress / 100));

        } else {
            // Dragging end handle
            const newWidth = this.initialWidth + deltaX;
            taskRect.setAttribute('width', String(newWidth));
            progress.setAttribute('width', String(newWidth * dependentTask.progress / 100));
        }
        this.taskRect = taskRect;
    }

    handleMouseUp(taskRect : SVGRectElement, dependentTask : ITask | ISubTask, tasks : ISubTask[] | ITask [], dateInfo: IDateInfo, allTasks = null) {
        if (this.isDragging) {
            this.stopDrag();
            // Find the task in the array and update its properties
            const updatedTaskIndex = tasks.findIndex((t: { id: number; }) => t.id === dependentTask.id);
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
            // Reset the current task and progress bar
            this.taskRect = null;
        }

    }

    updateGanttChartContent(svg: SVGElement, tasks: ITask[]) {
        const chartContainer = document.getElementById('chart');
        //clear the existing date div
        let DateDiv = document.getElementById('div-date');
        chartContainer.removeChild(DateDiv);
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
        DateDiv = createDivDateScale(this.dateInfo, this.chartWidth);
        chartContainer.insertBefore(DateDiv, svg);
        this.createTaskBars(svg, tasks, this.dateInfo);
        this.drawDependencyLine(svg, tasks);
    }

    drawDependencyLine(svg: SVGElement, tasks: ITask[]) {
        const arrowheadSize = 5;

        const drawTaskDependency = (dependentTask: ITask, task: ITask, elementIdPrefix: string) => {
            const startTaskElement = document.getElementById(`${elementIdPrefix}-${dependentTask.id}`);
            const endTaskElement = document.getElementById(`${elementIdPrefix}-${task.id}`);

            if (startTaskElement && endTaskElement) {
                const x1 = parseFloat(startTaskElement.getAttribute('width')) + parseFloat(startTaskElement.getAttribute('x'));
                const y1 = parseFloat(startTaskElement.getAttribute('y'));
                const x2 = parseFloat(endTaskElement.getAttribute('x')) + parseFloat(endTaskElement.getAttribute('width')) / 2;

                // Draw horizontal line
                const lineHorizontal = this.createSvgLine(x1, y1 + parseFloat(endTaskElement.getAttribute('height')) / 2, x2, y1 + parseFloat(endTaskElement.getAttribute('height')) / 2);
                svg.appendChild(lineHorizontal);

                // Determine extra height for the vertical line
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
        };

        tasks.forEach((task) => {
            if (task.dependencies && task.dependencies.length > 0) {
                task.dependencies.forEach((dependencyId) => {
                    const dependentTask = tasks.find((t) => t.id === dependencyId);
                    if (dependentTask) {
                        drawTaskDependency(dependentTask, task, 'task');
                    }
                });
            }

            if (task.subTask) {
                task.subTask.forEach((subtask) => {
                    if (subtask.dependencies && subtask.dependencies.length > 0) {
                        subtask.dependencies.forEach((dependencyId) => {
                            const dependentTask = task.subTask.find((t) => t.id === dependencyId);
                            if (dependentTask) {
                                drawTaskDependency(dependentTask, subtask, 'subtask');
                            }
                        });
                    }
                });
            }
        });
    }

    createSvgLine(x1: number, y1: number, x2: number, y2: number) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', String(x1));
        line.setAttribute('y1', String(y1));
        line.setAttribute('x2', String(x2));
        line.setAttribute('y2', String(y2));
        line.classList.add('dependency-line');
        return line;
    }


    createArrowhead(x: number, y: number, size: number, arrowDirection: string) {
        const arrowhead = document.createElementNS(svgNS, 'polygon');
        const points = arrowDirection === 'down'
            ? `${x},${y - size} ${x - size},${y - size} ${x},${y} ${x + size},${y - size}`
            : `${x - size},${y + size} ${x},${y} ${x + size},${y + size}`;
        arrowhead.setAttribute('points', points);
        arrowhead.classList.add('dependency-arrowhead');
        return arrowhead;
    }

    stopDrag() {
        this.isDragging = false;
        document.body.classList.remove('dragging');
        document.removeEventListener('mousemove', this.dragMoveListener);
    }


    getWidth() {
        const svgElement = document.getElementById('mySvg');

        if (svgElement) {
            const svgWidthInPixels = window.getComputedStyle(svgElement).width;
            return parseFloat(svgWidthInPixels);
        } else {
            return null;
        }
    }

    getHeight() {
        const svgElement = document.getElementById('mySvg');

        if (svgElement) {
            const svgHeightInPixels = window.getComputedStyle(svgElement).height;
            return parseFloat(svgHeightInPixels);
        } else {
            return null;
        }
    }

    static returnHeight() {
        const height = new GanttChart();
        return height.getHeight();
    }

    static returnWidth() {
        const width = new GanttChart();
        return width.getWidth();
    }

    static createChart(tasks: ITask[] | ISubTask[]) {
        const ganttChart = new GanttChart();
        ganttChart.createGanttChart(tasks);
    }
}
