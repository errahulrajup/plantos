export interface TagValue {
  tagId: string;
  value: any;
  timestamp: string;
  quality: string;
}

/**
 * Abstract base class for Edge Protocols.
 * Whether it's OPC UA, Modbus, or a Simulator, they all must normalize 
 * data into TagValue events and push them to the PlantOS EventBus.
 */
export abstract class ProtocolAdapter {
  protected connected: boolean = false;

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract subscribe(tags: string[]): Promise<void>;

  /**
   * Pushes normalized tag data to the central Event Bus
   * In the Edge architecture, this prevents hitting the DB directly.
   */
  protected pushToEventBus(tagValue: TagValue) {
    // In production, this pushes to MQTT or Redis Streams (the actual Event Bus)
    // console.log(`[EventBus] Pushed Telemetry: ${tagValue.tagId} = ${tagValue.value}`);
  }
}

export class SimulationAdapter extends ProtocolAdapter {
  private interval: any;

  async connect(): Promise<void> {
    this.connected = true;
    console.log('[SimulationAdapter] Connected to virtual factory.');
  }

  async disconnect(): Promise<void> {
    clearInterval(this.interval);
    this.connected = false;
  }

  async subscribe(tags: string[]): Promise<void> {
    console.log(`[SimulationAdapter] Subscribing to ${tags.length} tags...`);
    
    // Simulate high-throughput telemetry from equipment
    this.interval = setInterval(() => {
      tags.forEach(tag => {
        this.pushToEventBus({
          tagId: tag,
          value: (Math.random() * 100).toFixed(2),
          timestamp: new Date().toISOString(),
          quality: 'GOOD'
        });
      });
    }, 1000);
  }
}
