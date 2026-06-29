import { Logger } from '../logging/Logger';
import { LogLayer } from '../types';

export interface IQuery<TResult = any> {
  type: string;
  payload: any;
}

export interface IQueryHandler<TQuery extends IQuery, TResult> {
  handle(query: TQuery): Promise<TResult>;
}

export class QueryBus {
  private handlers: Map<string, IQueryHandler<any, any>> = new Map();

  constructor(private readonly logger: Logger) {}

  /**
   * Register a handler for a specific query type
   */
  public registerHandler(queryType: string, handler: IQueryHandler<any, any>): void {
    if (this.handlers.has(queryType)) {
      throw new Error(`QueryHandler for ${queryType} is already registered.`);
    }
    this.handlers.set(queryType, handler);
    this.logger.debug(LogLayer.SYSTEM, 'QueryBus', `Registered handler for query: ${queryType}`);
  }

  /**
   * Dispatch a query to its registered handler and return the result
   */
  public async ask<TResult = any>(query: IQuery<TResult>): Promise<TResult> {
    this.logger.debug(LogLayer.SYSTEM, 'QueryBus', `Executing query: ${query.type}`);
    
    const handler = this.handlers.get(query.type);
    if (!handler) {
      throw new Error(`No QueryHandler registered for query type: ${query.type}`);
    }

    try {
      return await handler.handle(query);
    } catch (error: any) {
      this.logger.error(LogLayer.SYSTEM, 'QueryBus', `Query execution failed [${query.type}]: ${error.message}`);
      throw error;
    }
  }
}
