import { createStateManager } from "../lib/State/StateManager";
import chartConfig from "./ChartConfig";
import tasks from "./Tasks";

export default {
  chartConfig:createStateManager(chartConfig),
  tasks:createStateManager(tasks),
}