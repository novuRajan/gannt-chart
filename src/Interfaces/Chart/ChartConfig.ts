import { ITask } from "../Task/Task";
import { ISubTask } from "../Task/SubTask";
import { IFormDataObject } from "../../lib/Html/FormHelper";
import { FilterInputTypes } from "../../types/Inputs/FilterInputTypes";

export interface IChartConfig {
    activeTasks?: boolean;
    filters?: FilterInputTypes[];
    displayFilter?: boolean;
    add?: (task: ITask | ISubTask) => void;
    update?: (task: ITask | ISubTask) => void;
    change?: (task: ITask | ISubTask) => void;
    filter?: (filterObj:IFormDataObject) => void;
}
