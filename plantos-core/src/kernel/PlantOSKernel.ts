import { Container } from '../di/Container';
import { EventDispatcher } from '../events/EventDispatcher';
import { IdentityService } from '../identity/IdentityService';
import { Logger } from '../logging/Logger';
import { LogLayer } from '../types';

export interface KernelConfig {
  environment: 'development' | 'production' | 'simulation';
  version: string;
}

export class PlantOSKernel {
  public readonly di: Container;
  public readonly events: EventDispatcher;
  public readonly identity: IdentityService;
  public readonly logger: Logger;
  
  private config: KernelConfig;
  private isRunning: boolean = false;

  constructor(config: KernelConfig) {
    this.config = config;
    this.di = new Container();
    this.logger = new Logger('PlantOSKernel');
    this.events = new EventDispatcher(this.logger);
    this.identity = new IdentityService();

    // Register core services into DI
    this.di.register('Logger', this.logger);
    this.di.register('EventDispatcher', this.events);
    this.di.register('IdentityService', this.identity);
  }

  /**
   * Boot the PlantOS Kernel
   */
  public async boot(): Promise<void> {
    this.logger.info(LogLayer.SYSTEM, 'Kernel', `Booting PlantOS Kernel v${this.config.version} in ${this.config.environment} mode...`);
    
    // Here we would load plugins and initialize base services
    
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
