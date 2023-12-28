import { IBaseTask } from './BaseTask';
import { ISubTask } from './SubTask';

export interface ITask extends IBaseTask {
    subTask?: ISubTask[];
}
