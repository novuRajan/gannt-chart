import { ITask } from "./Interfaces/Task/Task";
import { DateHelper } from "./lib/Date";

export const updateTaskStartEndDates = (tasks:ITask[]) => {
  const taskMap = new Map(tasks.map(task => [task.id, task]));

  tasks.forEach(task => {
    updateTaskDates(task, taskMap);
    updateSubTaskStartEndDate(task);
  });

}
function updateTaskDates(task:ITask, taskMap:Map<number, ITask>) {
  if (task.dependencies.length === 0) {
    return; // Base case: no dependencies, nothing to update
  }

  const dependentTasks = task.dependencies.map(depId => taskMap.get(depId));

  // Find the maximum end date among dependent tasks
  const maxEndDate= new DateHelper(dependentTasks.map(task=>task.end)).latestDate();

  dependentTasks.forEach(dependentTask => {
    updateTaskDates(dependentTask, taskMap);

    // Calculate the duration of the task
    const duration = (new Date(task.end).getTime()- new Date(task.start).getTime()) / (24 * 60 * 60 * 1000);

    // Check if the start date of the dependent task is after the max end date
    if (new Date(task.start) < maxEndDate) {
      // Update the start date of the current task based on the maximum end date of dependent tasks
      task.start = maxEndDate.toISOString().split('T')[0];

      // Update the end date of the current task based on its duration
      task.end = new Date(new Date(task.start).setDate(new Date(task.start).getDate() + duration)).toISOString().split('T')[0];
    }
  });

}

function updateSubTaskStartEndDate(task:ITask) {
  // Check if the task has subtasks
  if (task.subTask && task.subTask.length > 0) {
    const subTaskMap = new Map(task.subTask.map(subtask => [subtask.id, subtask]));
    task.subTask.forEach(subTask => {
      const subDuration = (new Date(subTask.end).getTime() - new Date(subTask.start).getTime()) / (24 * 60 * 60 * 1000);
      // Example condition: If subtask start date is less than task start date, update it
      if (new Date(subTask.start) < new Date(task.start)) {
        subTask.start = task.start;
        subTask.end = new Date(new Date(subTask.start).setDate(new Date(task.start).getDate() + subDuration)).toISOString().split('T')[0];
      }
      updateTaskDates(subTask, subTaskMap)
      if (subTask.end > task.end) {
        task.end = subTask.end
      }
    });
  }
}
