import { UUID, AssetState, BatchStatus } from '../types';

export interface GetEquipmentByIdQuery {
  type: 'GetEquipmentByIdQuery';
  payload: {
    equipmentId: UUID;
  };
}

export interface GetActiveBatchesQuery {
  type: 'GetActiveBatchesQuery';
  payload: {
    lineId?: UUID;
  };
}

export interface FindEquipmentByCapabilityQuery {
  type: 'FindEquipmentByCapabilityQuery';
  payload: {
    capabilities: string[];
    state?: AssetState;
  };
}
