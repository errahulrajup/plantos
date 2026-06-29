import { UUID } from '../types';
import { EquipmentDTO, BatchDTO } from './dtos';
import { CreateEquipmentCommand, StartBatchCommand } from './commands';

/**
 * The Internal SDK Interfaces.
 * These are the ONLY ways modules interact with each other.
 * They shield the underlying repositories and event buses.
 */

export interface IAssetSDK {
  registerEquipment(cmd: CreateEquipmentCommand): Promise<UUID>;
  getEquipmentDetails(equipmentId: UUID): Promise<EquipmentDTO>;
  findCapabilities(capabilities: string[]): Promise<EquipmentDTO[]>;
}

export interface IMESBaseSDK {
  createProductionOrder(cmd: CreateProductionOrderCommand): Promise<UUID>;
  startBatch(cmd: StartBatchCommand): Promise<void>;
  getBatchDetails(batchId: UUID): Promise<BatchDTO>;
  holdBatch(batchId: UUID, reason: string): Promise<void>;
}

export interface IPlantOSInternalSDK {
  asset: IAssetSDK;
  mes: IMESBaseSDK;
}
