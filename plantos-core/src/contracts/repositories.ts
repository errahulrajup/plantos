import { UUID } from '../types';
import { EquipmentDTO, BatchDTO, AlarmDTO } from './dtos';

/**
 * Base Repository interface to enforce generic data access standards
 */
export interface IRepository<T> {
  findById(id: UUID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: UUID): Promise<void>;
}

export interface IEquipmentRepository extends IRepository<EquipmentDTO> {
  findByTag(tag: string): Promise<EquipmentDTO | null>;
  findByCapability(capability: string): Promise<EquipmentDTO[]>;
}

export interface IBatchRepository extends IRepository<BatchDTO> {
  findByStatus(status: string): Promise<BatchDTO[]>;
  findByRecipe(recipeId: UUID): Promise<BatchDTO[]>;
}

export interface IAlarmRepository extends IRepository<AlarmDTO> {
  findActiveAlarms(): Promise<AlarmDTO[]>;
  findAlarmsByEquipment(equipmentId: UUID): Promise<AlarmDTO[]>;
}

export interface IProductionOrderRepository extends IRepository<ProductionOrderDTO> {
  findByStatus(status: string): Promise<ProductionOrderDTO[]>;
  findByOrderNumber(orderNumber: string): Promise<ProductionOrderDTO | null>;
}
