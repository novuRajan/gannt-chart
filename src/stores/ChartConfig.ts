import { IChartConfig } from "../Interfaces/Chart/ChartConfig";
import { ITask } from "../Interfaces/Task/Task";
import { IFormDataObject } from "../lib/Html/FormHelper";
import { DateHelper } from "../lib/Date";
const initialState: IChartConfig = {
  activeTasks: false,
  displayFilter: true,
  filters: [
    {
      type: 'date',
      name: 'start',
      label: 'start',
      filter:(task:ITask,filterData:IFormDataObject):boolean=>{
        if (filterData.start && filterData.end) {
          return new DateHelper().filterDateBetween(task.start, task.end, <string>filterData.start, <string>filterData.end);
        }
        return true;
      }
    },
    {
      type: 'date',
      name: 'end',
      label: 'end',
      filter:(task:ITask,filterData:IFormDataObject):boolean=>{
        if (filterData.start && filterData.end) {
          return new DateHelper().filterDateBetween(task.start, task.end, <string>filterData.start, <string>filterData.end);
        }
        return true;
      }
    },
    {
      type: 'text',
      name: 'name',
      label: 'Search by Name',
      filter:(task:ITask,filterData:IFormDataObject):boolean=>{
        return task.name.toLowerCase().includes(String(filterData.name).toLowerCase());
      }
    },
  ],
}
export default initialState;