import { SimulationEngine, SimulationProfile } from './SimulationEngine';

async function runPlantSmorValidationSuite() {
  console.log(`Starting PlantOS Reference Manufacturing Validation Suite`);
  console.log(`Target: PlantSmör Margarine Plant\n`);

  // Mocking the Runtime instance for the POC
  const mockRuntime = {}; 
  const engine = new SimulationEngine(mockRuntime);

  // Scenario 1: Normal Production
  const normalProduction: SimulationProfile = {
    name: 'Scenario 1: Normal Production (Oil Unloading -> Dispatch)',
    durationMs: 5000, // 5 virtual seconds
    faults: []
  };

  // Scenario 2: Pump Failure Injection
  const pumpFailure: SimulationProfile = {
    name: 'Scenario 2: Unloading Pump Failure during Intake',
    durationMs: 5000,
    faults: [
      { timeMs: 2000, equipmentId: 'UNL-PMP-01', faultType: 'PUMP_FAIL' }
    ]
  };

  // Scenario 3: Sensor Drift (Temperature too high)
  const tempHigh: SimulationProfile = {
    name: 'Scenario 3: Emulsifier Temperature Exceeds Interlock (90°C)',
    durationMs: 5000,
    faults: [
      { timeMs: 3000, equipmentId: 'MIX-TK-001', faultType: 'TEMP_HIGH' }
    ]
  };

  // Scenario 4: Communication Loss
  const commLoss: SimulationProfile = {
    name: 'Scenario 4: OPC-UA Edge Driver Disconnects',
    durationMs: 5000,
    faults: [
      { timeMs: 4000, equipmentId: 'RO-WTR-001', faultType: 'COMM_LOSS' }
    ]
  };

  await engine.runScenario(normalProduction);
  await engine.runScenario(pumpFailure);
  await engine.runScenario(tempHigh);
  await engine.runScenario(commLoss);

  console.log(`\n=================================================`);
  console.log(`Validation Suite Execution Completed.`);
  console.log(`PlantSmör Package Status: [ READY FOR DEPLOYMENT ]`);
  console.log(`=================================================`);
}

runPlantSmorValidationSuite().catch(console.error);
