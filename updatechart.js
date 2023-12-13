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

function updateTaskStartEndDates(tasks) {
  const taskMap = new Map(tasks.map(task => [task.id, task]));

  tasks.forEach(task => {
    updateTaskDates(task, taskMap);
    updateSubTaskStartEndDate(task);
  });

}

function updateSubTaskStartEndDate(task)
{
   // Check if the task has subtasks
   if (task.subTask && task.subTask.length > 0) {
    subTaskMap=new Map(task.subTask.map(subtask => [subtask.id, subtask]));
    task.subTask.forEach(subTask => {
      subDuration = (new Date(subTask.end) - new Date(subTask.start)) / (24 * 60 * 60 * 1000);
      // Example condition: If subtask start date is less than task start date, update it
      if (new Date(subTask.start) < new Date(task.start)) {
        subTask.start = task.start;
        subTask.end = new Date(new Date(subTask.start).setDate(new Date(task.start).getDate() + subDuration)).toISOString().split('T')[0];
      }
      else 
      {
        gap = (new Date(subTask.start) - new Date(task.start)) / (24 * 60 * 60 * 1000);
        subTask.start = new Date(new Date(subTask.start).setDate(new Date(task.start).getDate() + gap)).toISOString().split('T')[0];
      }
      updateTaskDates(subTask,subTaskMap)
      if(subTask.end > task.end)
      {
        task.end = subTask.end
      }
    });
  }
}
