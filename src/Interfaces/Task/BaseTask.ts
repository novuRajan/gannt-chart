export interface IBaseTask {
  id: number,
  name: string,
  start: string,
  end: string,
  progress: number,
  dependencies: number[]
}
