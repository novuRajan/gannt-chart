class StateManager<T> {
  private state: T;

  constructor(initialState: T) {
    this.state = initialState;
  }

  // Getter to access the state
  getState(): T {
    return this.state;
  }

  // Setter to update the state
  setState(newState: Partial<T>) {
    this.state = { ...this.state, ...newState };
  }
}

export function createStateManager<T>(state:T): StateManager<T> {
  return  new StateManager(state);
}