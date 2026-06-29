import { describe, it, expect, beforeEach } from 'vitest';
import { 
  AssetSDK, 
  MESSDK, 
  PlantOSInternalSDK, 
  Logger, 
  IdentityService, 
  EventDispatcher,
  CreateEquipmentCommand,
  StartBatchCommand,
  BatchStatus
} from '../src';
import { MockEquipmentRepository } from './mocks/MockEquipmentRepository';
import { MockBatchRepository } from './mocks/MockBatchRepository';

import { MockProductionOrderRepository } from './mocks/MockProductionOrderRepository';

describe('PlantOS Internal SDK', () => {
  let sdk: PlantOSInternalSDK;
  let identity: IdentityService;
  let events: EventDispatcher;
  let batchRepo: MockBatchRepository;
  let orderRepo: MockProductionOrderRepository;

  beforeEach(() => {
    identity = new IdentityService();
    const logger = new Logger('TestSDK');
    events = new EventDispatcher(logger);
    
    const equipmentRepo = new MockEquipmentRepository();
    batchRepo = new MockBatchRepository();
    orderRepo = new MockProductionOrderRepository();

    const assetSDK = new AssetSDK(equipmentRepo, identity, logger, events);
    const mesSDK = new MESSDK(batchRepo, orderRepo, identity, logger, events);

    sdk = new PlantOSInternalSDK(assetSDK, mesSDK);
  });

  it('AssetSDK: should register new equipment and publish event', async () => {
    let eventFired = false;
    events.subscribe('EquipmentStateChangedEvent', () => { eventFired = true; });

    const cmd: CreateEquipmentCommand = {
      commandId: identity.generateUUID(),
      type: 'CreateEquipmentCommand',
      timestamp: new Date(),
      payload: {
        tag: 'TANK-9',
        name: 'Oil Storage Tank 9',
        type: 'StorageTank',
        capabilities: ['CanStoreOil'],
        properties: { capacity: 14000 }
      }
    };

    const id = await sdk.asset.registerEquipment(cmd);
    expect(id).toBeDefined();

    const details = await sdk.asset.getEquipmentDetails(id);
    expect(details.tag).toBe('TANK-9');
    expect(eventFired).toBe(true);
  });

  it('MESSDK: should successfully start a PLANNED batch', async () => {
    const batchId = identity.generateUUID();
    
    // Seed the mock DB
    await batchRepo.save({
      id: batchId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      batchNumber: 'B-100',
      recipeId: identity.generateUUID(),
      status: BatchStatus.PLANNED,
      plannedQuantity: 1000,
      actualQuantity: 0,
      unit: 'KG'
    });

    let eventFired = false;
    events.subscribe('BatchStartedEvent', () => { eventFired = true; });

    const cmd: StartBatchCommand = {
      commandId: identity.generateUUID(),
      type: 'StartBatchCommand',
      timestamp: new Date(),
      payload: {
        batchId: batchId,
        operatorId: identity.generateUUID()
      }
    };

    await sdk.mes.startBatch(cmd);

    const details = await sdk.mes.getBatchDetails(batchId);
    expect(details.status).toBe(BatchStatus.RUNNING);
    expect(eventFired).toBe(true);
  });

  it('MESSDK: should throw error when starting an already running batch', async () => {
    const batchId = identity.generateUUID();
    await batchRepo.save({
      id: batchId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      batchNumber: 'B-100',
      recipeId: identity.generateUUID(),
      status: BatchStatus.RUNNING, // Already running
      plannedQuantity: 1000,
      actualQuantity: 0,
      unit: 'KG'
    });

    const cmd: StartBatchCommand = {
      commandId: identity.generateUUID(),
      type: 'StartBatchCommand',
      timestamp: new Date(),
      payload: {
        batchId: batchId,
        operatorId: identity.generateUUID()
      }
    };

    await expect(sdk.mes.startBatch(cmd)).rejects.toThrow(/Batch cannot be started from current status/);
  });
});
