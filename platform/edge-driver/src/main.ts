import { SimulationAdapter } from './ProtocolAdapter';

async function bootstrap() {
  console.log('Starting PlantOS Edge Driver Service...');
  
  // In a real factory, we would load the connection string from env vars
  // and instantiate the OpcUaAdapter or ModbusAdapter.
  // For the POC, we use the SimulationAdapter.
  const adapter = new SimulationAdapter();
  
  await adapter.connect();
  
  // Simulate subscribing to tags configured in the active packages
  const activeTags = [
    'MIX-TK-001.Temperature',
    'MIX-TK-001.Level',
    'MIX-TK-001.AgitatorSpeed',
    'UNL-PMP-01.FlowRate'
  ];

  await adapter.subscribe(activeTags);

  console.log('Edge Driver is running. Pushing telemetry to EventBus.');
}

bootstrap().catch(console.error);
