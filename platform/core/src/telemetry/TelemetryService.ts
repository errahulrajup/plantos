import { TelemetryPoint, HistorianService } from './HistorianService';
import { Logger } from '../logging/Logger';
import { LogLayer } from '../types';

/**
 * TelemetryService receives high-velocity incoming data (e.g. from OPC-UA/MQTT)
 * and buffers it before writing to the Historian to avoid database thrashing.
 */
export class TelemetryService {
  private buffer: TelemetryPoint[] = [];
  private flushIntervalMs = 1000; // Flush every 1 second
  private timer: any;

  constructor(
    private readonly historian: HistorianService,
    private readonly logger: Logger
  ) {
    this.startBuffer();
  }

  public ingest(point: TelemetryPoint): void {
    this.buffer.push(point);
  }

  private startBuffer(): void {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const pointsToWrite = [...this.buffer];
    this.buffer = [];

    try {
      await this.historian.writePoints(pointsToWrite);
      // Omit logging every flush to prevent log spam, only log debug if needed
      // this.logger.debug(LogLayer.TELEMETRY, 'TelemetryService', `Flushed ${pointsToWrite.length} points to Historian.`);
    } catch (err) {
      this.logger.error(LogLayer.TELEMETRY, 'TelemetryService', `Failed to flush telemetry: ${(err as Error).message}`);
      // Basic retry mechanism: put them back in buffer
      this.buffer.unshift(...pointsToWrite);
    }
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
