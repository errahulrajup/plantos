import { UUID, IEvent, AssetState, BatchStatus } from '../types';

export interface EquipmentStateChangedEvent extends IEvent {
  type: 'EquipmentStateChangedEvent';
  payload: {
    equipmentId: UUID;
    oldState: AssetState;
    newState: AssetState;
  };
}

export interface BatchStartedEvent extends IEvent {
  type: 'BatchStartedEvent';
  payload: {
    batchId: UUID;
    recipeId: UUID;
    operatorId: UUID;
    startTime: Date;
  };
}

export interface TelemetryLoggedEvent extends IEvent {
  type: 'TelemetryLoggedEvent';
  payload: {
    tag: string;
    value: number | string | boolean;
    quality: string;
  };
}
