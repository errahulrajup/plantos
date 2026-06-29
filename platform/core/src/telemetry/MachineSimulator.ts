import { TelemetryService } from './TelemetryService';
import { Logger } from '../logging/Logger';
import { AssetTag, LogLayer } from '../types';

export class MachineSimulator {
  private timers: any[] = [];
  
  constructor(
    private readonly telemetryService: TelemetryService,
    private readonly logger: Logger
  ) {}

  /**
   * Starts generating fake temperature data for a heater
   */
  public startHeaterSimulation(tag: AssetTag, baseTemp: number = 25): void {
    this.logger.info(LogLayer.SYSTEM, 'Simulator', `Started Heater Simulation for ${tag}`);
    let currentTemp = baseTemp;

    const timer = setInterval(() => {
      // Random walk for temperature (-1 to +2 degrees)
      const change = (Math.random() * 3) - 1;
      currentTemp += change;
      
      this.telemetryService.ingest({
        tag,
        property: 'Temperature',
        value: Number(currentTemp.toFixed(2)),
        timestamp: new Date(),
        quality: 'GOOD'
      });
    }, 1000); // Send data every 1 second

    this.timers.push(timer);
  }

  /**
   * Starts generating fake RPM data for a mixer
   */
  public startMixerSimulation(tag: AssetTag, targetRpm: number = 150): void {
    this.logger.info(LogLayer.SYSTEM, 'Simulator', `Started Mixer Simulation for ${tag}`);
    let currentRpm = 0;

    const timer = setInterval(() => {
      // Ramp up to target or slightly fluctuate
      if (currentRpm < targetRpm - 5) {
        currentRpm += 5;
      } else {
        currentRpm = targetRpm + (Math.random() * 4 - 2);
      }
      
      this.telemetryService.ingest({
        tag,
        property: 'Speed_RPM',
        value: Number(currentRpm.toFixed(1)),
        timestamp: new Date(),
        quality: 'GOOD'
      });
    }, 1000);

    this.timers.push(timer);
  }

  public stopAll(): void {
    for (const timer of this.timers) {
      clearInterval(timer);
    }
    this.timers = [];
  }
}
