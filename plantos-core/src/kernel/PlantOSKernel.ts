import { Container } from '../di/Container';
import { EventDispatcher } from '../events/EventDispatcher';
import { IdentityService } from '../identity/IdentityService';
import { Logger } from '../logging/Logger';
import { LogLayer } from '../types';

// Inline minimal CMMSEngine (avoids cross-package import issues)
export interface WorkOrder {
  id: string;
  equipmentId: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

export class CMMSEngine {
  private workOrders: Map<string, WorkOrder> = new Map();

  async createWorkOrder(equipmentId: string, faultReason: string): Promise<WorkOrder> {
    const wo: WorkOrder = {
      id: `wo-${Date.now()}`,
      equipmentId,
      description: `Auto-generated from Equipment Fault: ${faultReason}`,
      priority: 'HIGH',
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    this.workOrders.set(wo.id, wo);
    console.log(`[CMMS] Work Order Created: ${wo.id} for ${equipmentId}`);
    return wo;
  }

  getWorkOrders(equipmentId?: string): WorkOrder[] {
    const all = Array.from(this.workOrders.values());
    return equipmentId ? all.filter(w => w.equipmentId === equipmentId) : all;
  }
}

export interface KernelConfig {
  environment: 'development' | 'production' | 'simulation';
  version: string;
}

export class PlantOSKernel {
  public readonly di: Container;
  public readonly events: EventDispatcher;
  public readonly identity: IdentityService;
  public readonly logger: Logger;
  public readonly cmms: CMMSEngine;
  
  private config: KernelConfig;
  private isRunning: boolean = false;

  constructor(config: KernelConfig) {
    this.config = config;
    this.di = new Container();
    this.logger = new Logger('PlantOSKernel');
    this.events = new EventDispatcher(this.logger);
    this.identity = new IdentityService();
    this.cmms = new CMMSEngine();

    // Register core services into DI
    this.di.register('Logger', this.logger);
    this.di.register('EventDispatcher', this.events);
    this.di.register('IdentityService', this.identity);
    this.di.register('CMMSEngine', this.cmms);
  }

  /**
   * Boot the PlantOS Kernel
   */
  public async boot(): Promise<void> {
    this.logger.info(LogLayer.SYSTEM, 'Kernel', `Booting PlantOS Kernel v${this.config.version} in ${this.config.environment} mode...`);
    
    // Here we would load plugins and initialize base services
    this.events.subscribe('EQUIPMENT_STATE_CHANGED', async (event) => {
      const { equipmentId, state } = event.payload;
      if (state === 'Fault') {
        this.logger.info(LogLayer.SYSTEM, 'Kernel', `Detected FAULT on ${equipmentId}, delegating to CMMSEngine...`);
        await this.cmms.createWorkOrder(equipmentId, 'Automatic fault detection from Runtime');
      }
    });
    
    this.isRunning = true;
    this.logger.info(LogLayer.SYSTEM, 'Kernel', 'PlantOS Kernel successfully booted.');
  }

  /**
   * Shutdown the PlantOS Kernel gracefully
   */
  public async shutdown(): Promise<void> {
    this.logger.info(LogLayer.SYSTEM, 'Kernel', 'Shutting down PlantOS Kernel...');
    this.isRunning = false;
    this.logger.info(LogLayer.SYSTEM, 'Kernel', 'PlantOS Kernel shutdown complete.');
  }

  /**
   * Check if the kernel is running and healthy
   */
  public healthCheck(): boolean {
    return this.isRunning;
  }
}
