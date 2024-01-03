import { ITask } from "../Task/Task";
import { ISubTask } from "../Task/SubTask";

export interface IChartConfig {
    activeTasks?: boolean;
    add?: (type: string, task: ITask | ISubTask) => void;
    update?: (type: string, task: ITask | ISubTask) => void;
    change?: (type: string, task: ITask | ISubTask) => void;
}
