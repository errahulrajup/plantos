import { AssetTag } from '../types';

export interface TelemetryPoint {
  tag: AssetTag;
  property: string; // e.g., 'temperature', 'speed'
  value: number;
  timestamp: Date;
  quality: 'GOOD' | 'BAD' | 'UNCERTAIN';
}

/**
 * HistorianService acts as the abstraction layer over a Time-Series Database
 * like TimescaleDB or InfluxDB.
 */
export class HistorianService {
  // In-memory mock buffer for the POC
  private data: TelemetryPoint[] = [];

  /**
   * Batch insert for high-throughput
   */
  public async writePoints(points: TelemetryPoint[]): Promise<void> {
    this.data.push(...points);
    // To prevent memory leak in POC, keep only last 10,000 points
    if (this.data.length > 10000) {
      this.data = this.data.slice(-10000);
    }
  }

  /**
   * Query historical trends
   */
  public async queryTrend(tag: AssetTag, property: string, from: Date, to: Date): Promise<TelemetryPoint[]> {
    return this.data.filter(p => 
      p.tag === tag && 
      p.property === property && 
      p.timestamp >= from && 
      p.timestamp <= to
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get the absolute latest value (used by UI for live dashboards)
   */
  public async getLatestValue(tag: AssetTag, property: string): Promise<TelemetryPoint | null> {
    for (let i = this.data.length - 1; i >= 0; i--) {
      if (this.data[i].tag === tag && this.data[i].property === property) {
        return this.data[i];
      }
    }
    return null;
  }
}
