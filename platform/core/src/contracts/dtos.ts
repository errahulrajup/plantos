import { UUID, AssetTag, BusinessCode, AssetState, BatchStatus, AlarmPriority } from '../types';

export interface BaseEntityDTO {
  id: UUID;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface EquipmentDTO extends BaseEntityDTO {
  tag: AssetTag;
  businessCode?: BusinessCode;
  name: string;
  type: string;
  state: AssetState;
  capabilities: string[];
  properties: Record<string, any>;
}

export interface BatchDTO extends BaseEntityDTO {
  batchNumber: string;
  recipeId: UUID;
  status: BatchStatus;
  plannedQuantity: number;
  actualQuantity: number;
  unit: string;
}

export interface AlarmDTO extends BaseEntityDTO {
  equipmentId: UUID;
  priority: AlarmPriority;
  message: string;
  isActive: boolean;
  acknowledgedAt?: Date;
}

export interface OperationDTO {
  id: UUID;
  name: string;
  sequence: number;
  requiredCapabilities: string[]; // e.g., ['CanHeat', 'CanMix']
  parameters: Record<string, any>; // e.g., { targetTemp: 80, mixSpeed: 100 }
}

export interface RecipeDTO extends BaseEntityDTO {
  name: string;
  version: string;
  operations: OperationDTO[];
  targetProduct: string;
}

export interface ProductionOrderDTO extends BaseEntityDTO {
  orderNumber: string; // ERP ID
  recipeId: UUID;
  status: string; // OrderStatus
  targetQuantity: number;
  completedQuantity: number;
  unit: string;
}
