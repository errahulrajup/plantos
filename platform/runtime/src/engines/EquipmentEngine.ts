import { IStateMachineProvider, IStateMachine } from '../interfaces/IStateMachineProvider';
import { EventDispatcher } from '../../../../plantos-core/src/events/EventDispatcher';

/**
 * Manages the ISA-88 standard Equipment State Machines
 * (Unknown -> Offline -> Idle -> Starting -> Running -> Holding -> Stopping -> Stopped -> Fault -> Maintenance)
 */
export class EquipmentEngine {
  private provider: IStateMachineProvider;
  private eventDispatcher?: EventDispatcher;
  private activeMachines: Map<string, IStateMachine> = new Map();

  constructor(provider: IStateMachineProvider, eventDispatcher?: EventDispatcher) {
    this.provider = provider;
    this.eventDispatcher = eventDispatcher;
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
      if (this.eventDispatcher) {
        this.eventDispatcher.publish({
          eventId: `evt-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          type: 'EQUIPMENT_STATE_CHANGED',
          timestamp: new Date().toISOString(),
          payload: { equipmentId, state }
        }).catch(err => console.error(err));
      }
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
