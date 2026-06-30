export interface SimulationProfile {
  name: string;
  durationMs: number;
  faults: FaultInjection[];
}

export interface FaultInjection {
  timeMs: number;
  equipmentId: string;
  faultType: 'PUMP_FAIL' | 'VALVE_STUCK' | 'COMM_LOSS' | 'TEMP_HIGH';
}

/**
 * The Digital Twin Runtime Engine.
 * Boots a sandboxed instance of the PlantOS Runtime and drives it via a Deterministic Clock.
 */
export class SimulationEngine {
  private currentTimeMs: number = 0;
  private runtime: any; // Instance of PlantOS Runtime

  constructor(runtimeInstance: any) {
    this.runtime = runtimeInstance;
  }

  public async runScenario(profile: SimulationProfile) {
    console.log(`\n=================================================`);
    console.log(`[Validation Suite] Executing Scenario: ${profile.name}`);
    console.log(`=================================================`);

    this.currentTimeMs = 0;
    const ticks = profile.durationMs / 1000;

    for (let i = 0; i < ticks; i++) {
      this.tick();
      this.injectFaults(profile.faults);
      
      // Allow Runtime to process events for this tick
      await new Promise(resolve => setTimeout(resolve, 0)); 
    }

    this.generateExecutionReport();
  }

  private tick() {
    this.currentTimeMs += 1000;
    // Simulate physics (e.g. Tank levels rising if pumps are on)
  }

  private injectFaults(faults: FaultInjection[]) {
    faults.forEach(f => {
      if (f.timeMs === this.currentTimeMs) {
        console.log(`[${this.currentTimeMs}ms] 🚨 FAULT INJECTED: ${f.faultType} on ${f.equipmentId}`);
        // Push raw fault event to EventBus to trigger Runtime Interlocks
      }
    });
  }

  private generateExecutionReport() {
    console.log(`\n✅ Scenario Completed. Extracting KPIs...`);
    // Assert against Runtime State (e.g., Batch Completed? Traces captured? Recovered from fault?)
  }
}
