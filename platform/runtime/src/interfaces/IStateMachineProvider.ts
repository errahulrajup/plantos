export interface MachineDefinition {
  id: string;
  initial: string;
  states: Record<string, any>;
}

export interface StateEvent {
  type: string;
  payload?: any;
}

export interface IStateMachine {
  id: string;
  currentState: string;
  send(event: StateEvent): void;
  onTransition(callback: (state: string) => void): void;
  start(): void;
  stop(): void;
}

export interface IStateMachineProvider {
  createMachine(definition: MachineDefinition): IStateMachine;
}
