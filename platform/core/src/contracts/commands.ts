import { UUID, ICommand } from '../types';

export interface CreateEquipmentCommand extends ICommand {
  type: 'CreateEquipmentCommand';
  payload: {
    tag: string;
    name: string;
    type: string;
    capabilities: string[];
    properties: Record<string, any>;
  };
}

export interface StartBatchCommand extends ICommand {
  type: 'StartBatchCommand';
  payload: {
    batchId: UUID;
    operatorId: UUID;
    contextOverrides?: Record<string, any>;
  };
}

export interface AcknowledgeAlarmCommand extends ICommand {
  type: 'AcknowledgeAlarmCommand';
  payload: {
    alarmId: UUID;
    operatorId: UUID;
    comments?: string;
  };
}

export interface CreateProductionOrderCommand extends ICommand {
  type: 'CreateProductionOrderCommand';
  payload: {
    orderNumber: string;
    recipeId: UUID;
    targetQuantity: number;
    unit: string;
  };
}

export interface AllocateResourcesCommand extends ICommand {
  type: 'AllocateResourcesCommand';
  payload: {
    batchId: UUID;
    recipeId: UUID;
  };
}
