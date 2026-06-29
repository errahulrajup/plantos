import { describe, it, expect, beforeEach } from 'vitest';
import { PlantOSKernel, LogLayer, IEvent } from '../src';

describe('PlantOSKernel', () => {
  let kernel: PlantOSKernel;

  beforeEach(() => {
    kernel = new PlantOSKernel({
      environment: 'simulation',
      version: '1.0.0'
    });
  });

  it('should initialize completely with core services registered', () => {
    expect(kernel).toBeDefined();
    expect(kernel.di.has('Logger')).toBe(true);
    expect(kernel.di.has('EventDispatcher')).toBe(true);
    expect(kernel.di.has('IdentityService')).toBe(true);
  });

  it('should boot successfully and pass health check', async () => {
    expect(kernel.healthCheck()).toBe(false);
    
    await kernel.boot();
    
    expect(kernel.healthCheck()).toBe(true);
  });

  it('should shutdown gracefully', async () => {
    await kernel.boot();
    expect(kernel.healthCheck()).toBe(true);
    
    await kernel.shutdown();
    expect(kernel.healthCheck()).toBe(false);
  });

  it('should successfully dispatch and receive events through the CQRS Event Bus', async () => {
    await kernel.boot();
    let eventReceived = false;

    kernel.events.subscribe('TestEvent', (event: IEvent) => {
      expect(event.topic).toBe('TEST/TOPIC');
      eventReceived = true;
    });

    await kernel.events.publish({
      eventId: kernel.identity.generateUUID(),
      type: 'TestEvent',
      topic: 'TEST/TOPIC',
      payload: { value: 42 },
      timestamp: new Date()
    });

    expect(eventReceived).toBe(true);
  });
});
