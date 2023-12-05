function updateTaskDates(task, taskMap) {
  if (task.dependencies.length === 0) {
    return; // Base case: no dependencies, nothing to update
  }

  const dependentTasks = task.dependencies.map(depId => taskMap.get(depId));

  // Find the maximum end date among dependent tasks
  const maxEndDate = new Date(Math.max(...dependentTasks.map(depTask => new Date(depTask.end))));

  dependentTasks.forEach(dependentTask => {
    updateTaskDates(dependentTask, taskMap);

    // Create a copy of the current task to avoid updating the initial values
    const currentTaskCopy = { ...task };

    // Calculate the duration of the task
    const duration = (new Date(currentTaskCopy.end) - new Date(currentTaskCopy.start)) / (24 * 60 * 60 * 1000);

    // Check if the start date of the dependent task is after the max end date
    if (new Date(dependentTask.start) > maxEndDate) {
      // Update the start date of the current task based on the maximum end date of dependent tasks
      currentTaskCopy.start = maxEndDate.toISOString().split('T')[0];

      // Update the end date of the current task based on its duration
      currentTaskCopy.end = new Date(new Date(currentTaskCopy.start).setDate(new Date(currentTaskCopy.start).getDate() + duration)).toISOString().split('T')[0];
    }

    // Update the taskMap with the updated task
    taskMap.set(currentTaskCopy.id, currentTaskCopy);
  });
}

function updateTaskStartEndDates(tasks) {
  const taskMap = new Map(tasks.map(task => [task.id, { ...task }]));

  tasks.forEach(task => {
    updateTaskDates(task, taskMap);
  });

  return Array.from(taskMap.values());
}
