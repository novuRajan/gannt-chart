import { ITask } from "../Task/Task";
import { ISubTask } from "../Task/SubTask";

export interface IChartConfig {
    activeTasks?: boolean;
    add?: (task: ITask | ISubTask) => void;
    update?: (task: ITask | ISubTask) => void;
}
