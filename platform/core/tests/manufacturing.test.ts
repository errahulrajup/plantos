import { describe, it, expect, beforeEach } from 'vitest';
import { 
  AssetSDK, 
  Logger, 
  IdentityService, 
  EventDispatcher,
  ResourceEngine
} from '../src';
import { MockEquipmentRepository } from './mocks/MockEquipmentRepository';

describe('Manufacturing Model - Resource Engine', () => {
  let identity: IdentityService;
  let assetSDK: AssetSDK;
  let resourceEngine: ResourceEngine;

  beforeEach(async () => {
    identity = new IdentityService();
    const logger = new Logger('TestMfg');
    const events = new EventDispatcher(logger);
    
    const equipmentRepo = new MockEquipmentRepository();
    assetSDK = new AssetSDK(equipmentRepo, identity, logger, events);
    resourceEngine = new ResourceEngine(assetSDK, logger);

    // Seed equipment for testing
    await assetSDK.registerEquipment({
      commandId: identity.generateUUID(),
      type: 'CreateEquipmentCommand',
      timestamp: new Date(),
      payload: {
        tag: 'HEATER-1',
        name: 'Main Heater',
        type: 'Heater',
        capabilities: ['CanHeat', 'CanMonitorTemp'],
        properties: {}
      }
    });

    await assetSDK.registerEquipment({
      commandId: identity.generateUUID(),
      type: 'CreateEquipmentCommand',
      timestamp: new Date(),
      payload: {
        tag: 'MIXER-1',
        name: 'Main Mixer',
        type: 'Mixer',
        capabilities: ['CanMix'],
        properties: {}
      }
    });
  });

  it('should allocate correct equipment for a given recipe', async () => {
    const mockRecipe = {
      id: identity.generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      name: 'Margarine Batch',
      targetProduct: 'Margarine 500g',
      operations: [
        {
          id: identity.generateUUID(),
          name: 'Heating Phase',
          sequence: 1,
          requiredCapabilities: ['CanHeat'],
          parameters: {}
        },
        {
          id: identity.generateUUID(),
          name: 'Mixing Phase',
          sequence: 2,
          requiredCapabilities: ['CanMix'],
          parameters: {}
        }
      ]
    };

    const allocations = await resourceEngine.allocateForRecipe(mockRecipe);
    
    expect(allocations.size).toBe(2);
    
    // First operation (Heating)
    const heatAlloc = allocations.get(mockRecipe.operations[0].id);
    expect(heatAlloc?.tag).toBe('HEATER-1');

    // Second operation (Mixing)
    const mixAlloc = allocations.get(mockRecipe.operations[1].id);
    expect(mixAlloc?.tag).toBe('MIXER-1');
  });

  it('should throw if capability cannot be fulfilled', async () => {
    const mockRecipe = {
      id: identity.generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      name: 'Impossible Batch',
      targetProduct: 'Magic',
      operations: [
        {
          id: identity.generateUUID(),
          name: 'Flying Phase',
          sequence: 1,
          requiredCapabilities: ['CanFly'],
          parameters: {}
        }
      ]
    };

    await expect(resourceEngine.allocateForRecipe(mockRecipe)).rejects.toThrow(/Allocation Failed: No equipment found satisfying capabilities/);
  });
});
