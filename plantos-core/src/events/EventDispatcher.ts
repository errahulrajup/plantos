import { IEvent } from '../types';
import { Logger } from '../logging/Logger';
import { LogLayer } from '../types';

export type EventHandler = (event: IEvent) => void | Promise<void>;

export class EventDispatcher {
  private handlers: Map<string, EventHandler[]> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Subscribe to a specific event type
   */
  public subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    this.logger.debug(LogLayer.SYSTEM, 'EventDispatcher', `Subscribed to event: ${eventType}`);
  }

  /**
   * Publish an event to the bus
   */
  public async publish(event: IEvent): Promise<void> {
    this.logger.info(LogLayer.SYSTEM, 'EventDispatcher', `Publishing event: ${event.type} [${event.eventId}]`);
    
    const eventHandlers = this.handlers.get(event.type) || [];
    
    // Execute all handlers asynchronously but wait for them
    const promises = eventHandlers.map(handler => {
      try {
        return Promise.resolve(handler(event));
      } catch (err) {
        this.logger.error(LogLayer.SYSTEM, 'EventDispatcher', `Error in handler for ${event.type}: ${err}`);
        return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }
}
