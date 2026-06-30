import { IStateMachineProvider, IStateMachine } from '../interfaces/IStateMachineProvider';

/**
 * Manages the ISA-88 standard Equipment State Machines
 * (Unknown -> Offline -> Idle -> Starting -> Running -> Holding -> Stopping -> Stopped -> Fault -> Maintenance)
 */
export class EquipmentEngine {
  private provider: IStateMachineProvider;
  private activeMachines: Map<string, IStateMachine> = new Map();

  constructor(provider: IStateMachineProvider) {
    this.provider = provider;
  }

  public initializeEquipment(equipmentId: string) {
    // ISA-88 Standard Equipment Definition
    const machine = this.provider.createMachine({
      id: equipmentId,
      initial: 'Offline',
      states: {
        Offline: { on: { CONNECT: 'Idle' } },
        Idle: { on: { START: 'Starting', FAULT: 'Fault' } },
        Starting: { on: { READY: 'Running', FAULT: 'Fault' } },
        Running: { on: { HOLD: 'Holding', STOP: 'Stopping', FAULT: 'Fault' } },
        Holding: { on: { RESUME: 'Running', STOP: 'Stopping', FAULT: 'Fault' } },
        Stopping: { on: { STOPPED: 'Stopped', FAULT: 'Fault' } },
        Stopped: { on: { RESET: 'Idle' } },
        Fault: { on: { CLEAR: 'Idle', MAINTAIN: 'Maintenance' } },
        Maintenance: { on: { RESTORE: 'Offline' } }
      }
    });

    machine.onTransition((state) => {
      console.log(`[EquipmentEngine] ${equipmentId} transitioned to ${state}`);
    });

    machine.start();
    this.activeMachines.set(equipmentId, machine);
  }

  public sendCommand(equipmentId: string, command: string) {
    const machine = this.activeMachines.get(equipmentId);
    if (machine) {
      machine.send({ type: command });
    }
  }
}
