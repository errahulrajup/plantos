import { createMachine, interpret, Interpreter } from 'xstate';
import { IStateMachineProvider, IStateMachine, MachineDefinition, StateEvent } from '../interfaces/IStateMachineProvider';

class XStateMachine implements IStateMachine {
  public id: string;
  private service: Interpreter<any, any, any, any, any>;
  private transitionCallbacks: ((state: string) => void)[] = [];

  constructor(definition: MachineDefinition) {
    this.id = definition.id;
    // Map PlantOS generic definition to XState specific format
    const machine = createMachine({
      id: definition.id,
      initial: definition.initial,
      states: definition.states
    });

    this.service = interpret(machine).onTransition((state) => {
      if (state.changed) {
        this.transitionCallbacks.forEach(cb => cb(state.value as string));
      }
    });
  }

  get currentState(): string {
    return this.service.state.value as string;
  }

  send(event: StateEvent): void {
    this.service.send(event);
  }

  onTransition(callback: (state: string) => void): void {
    this.transitionCallbacks.push(callback);
  }

  start(): void {
    this.service.start();
  }

  stop(): void {
    this.service.stop();
  }
}

export class XStateAdapter implements IStateMachineProvider {
  createMachine(definition: MachineDefinition): IStateMachine {
    return new XStateMachine(definition);
  }
}
