import { ICommand, LogLayer } from '../types';
import { Logger } from '../logging/Logger';

export interface ICommandHandler<T extends ICommand, R = void> {
  execute(command: T): Promise<R>;
}

export class CommandBus {
  private handlers: Map<string, ICommandHandler<any, any>> = new Map();

  constructor(private readonly logger: Logger) {}

  /**
   * Register a handler for a specific command type
   */
  public registerHandler(commandType: string, handler: ICommandHandler<any, any>): void {
    if (this.handlers.has(commandType)) {
      throw new Error(`CommandHandler for ${commandType} is already registered.`);
    }
    this.handlers.set(commandType, handler);
    this.logger.debug(LogLayer.SYSTEM, 'CommandBus', `Registered handler for command: ${commandType}`);
  }

  /**
   * Dispatch a command to its registered handler
   */
  public async execute<R = void>(command: ICommand): Promise<R> {
    const contextLog = command.context 
      ? ` [Batch: ${command.context.batchId || 'N/A'}, Operator: ${command.context.operatorId || 'N/A'}]` 
      : '';
      
    this.logger.info(LogLayer.AUDIT, 'CommandBus', `Executing command: ${command.type} [${command.commandId}]${contextLog}`);
    
    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(`No CommandHandler registered for command type: ${command.type}`);
    }

    try {
      const result = await handler.execute(command);
      this.logger.debug(LogLayer.SYSTEM, 'CommandBus', `Command executed successfully: ${command.type}`);
      return result;
    } catch (error: any) {
      this.logger.error(LogLayer.SYSTEM, 'CommandBus', `Command execution failed [${command.commandId}]: ${error.message}`);
      throw error; // Re-throw to caller after logging
    }
  }
}
