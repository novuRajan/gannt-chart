import { createStateManager } from "../lib/State/StateManager";
import chartConfig from "./ChartConfig";

export default {
  chartConfig:createStateManager(chartConfig)
}