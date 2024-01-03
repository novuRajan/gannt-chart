import { SvgHelper } from './lib/Svg/SvgHelper';
import { createDateScale, createDivDateScale, createGridLines, createMonthHeadings } from './date-utl';
import { updateTaskStartEndDates } from './updatechart';
import { editTask, hideTaskDetails, openAddModal, showTaskDetails } from './saveEdit';
import { ITask } from './Interfaces/Task/Task';
import { ISubTask } from './Interfaces/Task/SubTask';
import { IDateInfo } from './Interfaces/Date/DateInfo';
import { DateHelper } from './lib/Date';
import { IChartConfig } from './Interfaces/Chart/ChartConfig';
import './styles/chart.scss';
import stores from "./stores";

export default class GanttChart {
    protected dateInfo: IDateInfo;
    private allTasks: ITask[];
    private isDragging: boolean = false;
    private initialX: number;
    private initialWidth: number;
    private isDragStart: boolean;
    private currentTaskRect: SVGRectElement;
    private currentProgressRect: SVGRectElement;
    private dragMoveListener: (() => void);
    private length: number;
    private dependentTask: ITask | ISubTask;
    private tasks: ITask[] | ISubTask[];
    private chartWidth: number;
    private taskRect: SVGRectElement;

    getTotalLength(tasks: ITask[]) : number {
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

    createGanttChart(_tasks: ITask[], _configs: IChartConfig = {}) {
        stores.chartConfig.setState(_configs);
        let tasks: ITask[] = _tasks.filter(task => task.start !== undefined && task.end !== undefined);
        if (_configs.activeTasks) {
            tasks = _tasks.filter(task => new DateHelper().isBetween(task.start, task.end));
            tasks = !tasks.length ? _tasks : tasks;
        }
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
        const svg = new SvgHelper().createSVGElement('svg') ;

        svg.setAttribute('id', 'mySvg');

        const dateGroup = new SvgHelper().createGroup("date-groups"); // Create a group element for the task
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

    calculateChartWidth(dateInfo: IDateInfo) {
        this.chartWidth = (dateInfo.maxDate.getTime() - dateInfo.startingDate.getTime()) / (24 * 60 * 60 * 1000) * dateInfo.multiplier;
        return this.chartWidth;
    }

    createTaskBars(svg: SVGElement, tasks: ITask[], dateInfo: IDateInfo) {
        let customIndex = 0;

        tasks.forEach((task) => {
            const taskGroup = new SvgHelper().createGroup("tasks"); // Create a group element for the task
            svg.appendChild(taskGroup);

            const dependentTaskEnd = this.calculateDependencyMaxEndDate(task.dependencies, tasks);
            const startOffset = Math.max((dependentTaskEnd - dateInfo.startingDate.getTime()) / (24 * 60 * 60 * 1000) * 50, (new Date(task.start).getTime() - dateInfo.startingDate.getTime()) / (24 * 60 * 60 * 1000) * 50);
            const duration = (new Date(task.end).getTime() - new Date(task.start).getTime()) / (24 * 60 * 60 * 1000) * 50;

            const rect = new SvgHelper().createRectElement(startOffset, customIndex * 40 + 40, duration, 30, '#3498db', `task-${task.id}`);
            taskGroup.appendChild(rect);

            const progressWidth = (duration * task.progress) / 100;
            const progressRect = new SvgHelper().createRectElement(startOffset, customIndex * 40 + 40, progressWidth, 30, '#2ecc71', `task-${task.id}-progress`);
            taskGroup.appendChild(progressRect);

            const text = new SvgHelper().createTextElement(startOffset + 5, customIndex * 40 + 60, task.name);
            taskGroup.appendChild(text);

            // Render subtasks
            if (task.subTask && task.subTask.length > 0) {
                const subTaskGroup = new SvgHelper().createGroup("subtask"); // Create a group element for the task
                taskGroup.appendChild(subTaskGroup);
                task.subTask.forEach((subtask, subIndex) => {
                    const subDependentTaskEnd = this.calculateDependencyMaxEndDate(subtask.dependencies, task.subTask);

                    const subStartOffset = Math.max((subDependentTaskEnd - dateInfo.startingDate.getTime()) / (24 * 60 * 60 * 1000) * 50, (new Date(subtask.start).getTime() - dateInfo.startingDate.getTime()) / (24 * 60 * 60 * 1000) * 50);
                    const subDuration = (new Date(subtask.end).getTime() - new Date(subtask.start).getTime()) / (24 * 60 * 60 * 1000) * 50;
                    const subRect = new SvgHelper().createRectElement(subStartOffset, (subIndex + customIndex + 1) * 40 + 40, subDuration, 15, '#e74c3c', `subtask-${task.id}-${subtask.id}`);
                    subTaskGroup.appendChild(subRect);

                    const subProgressWidth = (subDuration * subtask.progress) / 100;
                    const subProgressRect = new SvgHelper().createRectElement(subStartOffset, (subIndex + customIndex + 1) * 40 + 40, subProgressWidth, 15, '#c0392b', `subtask-${task.id}-${subtask.id}-progress`);
                    subTaskGroup.appendChild(subProgressRect);

                    const subText = new SvgHelper().createTextElement(subStartOffset + 5, (subIndex + customIndex + 1) * 40 + 50, subtask.name, 10);
                    subTaskGroup.appendChild(subText);

                    // Add mouseover and mouseout event listeners
                    this.addMouseOverOutListeners(subText, (e) => showTaskDetails(e, subtask, task.subTask), hideTaskDetails);
                    this.addMouseOverOutListeners(subRect, (e) => showTaskDetails(e, subtask, task.subTask), hideTaskDetails);
                    this.addMouseOverOutListeners(subProgressRect, (e) => showTaskDetails(e, subtask, task.subTask), hideTaskDetails);

                    // Add context menu event listeners
                    this.addContextMenuListener(subRect, subtask, task.subTask, tasks);
                    this.addContextMenuListener(subProgressRect, subtask, task.subTask, tasks);
                    this.addContextMenuListener(subText, subtask, task.subTask, tasks);

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

            // Add mouseover and mouseout event listeners
            this.addMouseOverOutListeners(text, (e) => showTaskDetails(e, task, tasks), hideTaskDetails);
            this.addMouseOverOutListeners(rect, (e) => showTaskDetails(e, task, tasks), hideTaskDetails);
            this.addMouseOverOutListeners(progressRect, (e) => showTaskDetails(e, task, tasks), hideTaskDetails);

            // Add context menu event listeners
            this.addContextMenuListener(rect, task, tasks);
            this.addContextMenuListener(progressRect, task, tasks);
            this.addContextMenuListener(text, task, tasks);

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
                if (this.taskRect) {
                    return this.handleMouseUp(this.taskRect, this.dependentTask, this.tasks, this.dateInfo, this.allTasks);
                } else {
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

// Function to add context menu event listener
    addContextMenuListener(element: SVGElement, task: ITask | ISubTask, tasks: ITask[] | ISubTask[], allTasks: ITask[] = null) {
        this.allTasks = allTasks;
        element.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            if (allTasks) {
                editTask(event, task, tasks, allTasks);
            } else {
                editTask(event, task, tasks);
            }
        });
    }

    addMouseOverOutListeners(element: SVGElement, showDetails: (e: MouseEvent) => void, hideDetails: () => void) {
        element.addEventListener('mouseover', showDetails);
        element.addEventListener('mouseout', hideDetails);
    }

    throttle<T extends (...args: unknown[]) => void>(func: T, limit: number) {
        let inThrottle: boolean;

        return function(this: unknown, ...args: unknown[]) {
            const context = this as typeof globalThis; // Adjust the type as needed

            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }



    isExceedingDependentEndDate(startDate: Date, dependentTask: ISubTask | ITask, tasks: ITask[] | ISubTask[]) {
        const tasksWithDesiredIds = tasks.filter(task =>
            dependentTask.dependencies.includes(task.id)
        );
        const endDates = new DateHelper(tasksWithDesiredIds.map(task => (task.end)));
        const maxDate = endDates.latestDate();
        if (maxDate > startDate) {
            return 1;
        } else {
            return 0;
        }
    }

    handleDragMove(event: {
        preventDefault: () => void;
        clientX: number;
    }, taskRect: SVGRectElement, progress: SVGRectElement, dependentTask: ITask | ISubTask, tasks: ITask[] | ISubTask [], allTasks = null) {
        hideTaskDetails();
        event.preventDefault();
        if (this.isDragging) {
            this.updateTaskBarPosition(event.clientX, taskRect, progress, dependentTask, tasks, allTasks);
        }
    }

    calculateDependencyMaxEndDate(dependencies: number[], tasks: ISubTask[] | ITask []): number {
        const maxDates = dependencies.map(depId => {
            const dependentSubTask = tasks.find(sub => sub.id === depId);
            return dependentSubTask ? new Date(dependentSubTask.end).getTime() : 0;
        });

        return Math.max(...maxDates);
    }

    startDrag(event: MouseEvent, taskRect: SVGRectElement, taskProgressRect: SVGRectElement, dependentTask: ITask | ISubTask, task: ITask[] | ISubTask[], allTasks = null) {
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
        this.dragMoveListener = this.throttle((event: { preventDefault: () => void; clientX: number; }) => {
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
            } else {
                const maxStartOffset = parseFloat(taskRect.getAttribute('x')) + parseFloat(taskRect.getAttribute('width'));
                const adjustedStartOffset = Math.min(newStartOffset, maxStartOffset);
                const adjustedWidth = maxStartOffset - adjustedStartOffset;
                taskRect.setAttribute('x', String(newStartOffset));
                taskRect.setAttribute('width', String(adjustedWidth));

                progress.setAttribute('x', String(newStartOffset));
                progress.setAttribute('width', String(adjustedWidth * dependentTask.progress / 100));
                this.taskRect = taskRect;
            }

        } else {
            // Dragging end handle
            const newWidth = this.initialWidth + deltaX;
            taskRect.setAttribute('width', String(newWidth));
            progress.setAttribute('width', String(newWidth * dependentTask.progress / 100));
            this.taskRect = taskRect;
        }

    }

    handleMouseUp(taskRect: SVGRectElement, dependentTask: ITask | ISubTask, tasks: ISubTask[] | ITask [], dateInfo: IDateInfo, allTasks = null) {
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

                //return which data is updated for user side
                const chartConfig=stores.chartConfig.getState();

                // Update the Gantt chart with the new data
                updateTaskStartEndDates(tasks);
                if (allTasks) {
                    if (chartConfig.change) {
                        chartConfig.change("subtask", tasks[updatedTaskIndex])
                    }
                    this.createGanttChart(allTasks);
                } else {
                    if (chartConfig.change) {
                        chartConfig.change('task',tasks[updatedTaskIndex])
                    }
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
        const dateGroup = new SvgHelper().createGroup("date-groups"); // Create a group element for the task
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

        const drawTaskDependency = (dependentTask: ITask | ISubTask, task: ITask | ISubTask, elementIdPrefix: string) => {
            const startTaskElement = document.getElementById(`${elementIdPrefix}-${dependentTask.id}`);
            const endTaskElement = document.getElementById(`${elementIdPrefix}-${task.id}`);

            if (startTaskElement && endTaskElement) {
                const x1 = parseFloat(startTaskElement.getAttribute('width')) + parseFloat(startTaskElement.getAttribute('x'));
                const y1 = parseFloat(startTaskElement.getAttribute('y'));
                const x2 = parseFloat(endTaskElement.getAttribute('x')) + parseFloat(endTaskElement.getAttribute('width')) / 2;

                // Draw horizontal line
                const lineHorizontal = new SvgHelper().createSvgLine(x1, y1 + parseFloat(endTaskElement.getAttribute('height')) / 2, x2, y1 + parseFloat(endTaskElement.getAttribute('height')) / 2 , 'dependency-line');
                svg.appendChild(lineHorizontal);

                // Determine extra height for the vertical line
                const isDependentAfterTask = dependentTask.id > task.id;
                const extraHeight = isDependentAfterTask ? parseFloat(endTaskElement.getAttribute('height')) : 0;

                // Draw vertical line
                const lineVertical = new SvgHelper().createSvgLine(x2, y1 + parseFloat(endTaskElement.getAttribute('height')) / 2, x2, parseFloat(endTaskElement.getAttribute('y')) + extraHeight , 'dependency-line');
                svg.appendChild(lineVertical);

                // Draw arrowhead
                const arrowheadY = isDependentAfterTask ? parseFloat(endTaskElement.getAttribute('y')) + parseFloat(endTaskElement.getAttribute('height')) : parseFloat(endTaskElement.getAttribute('y'));
                const arrowDirection = isDependentAfterTask ? 'up' : 'down';
                const arrowhead = new SvgHelper().creatPolygon(x2, arrowheadY, arrowheadSize, arrowDirection ,  'dependency-line');
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
                                drawTaskDependency(dependentTask, subtask, `subtask-${task.id}`);
                            }
                        });
                    }
                });
            }
        });
    }

    stopDrag() {
        this.taskRect = null;
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
            return 0;
        }
    }

    getHeight() {
        const svgElement = document.getElementById('mySvg');

        if (svgElement) {
            const svgHeightInPixels = window.getComputedStyle(svgElement).height;
            return parseFloat(svgHeightInPixels);
        } else {
            return 0;
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
