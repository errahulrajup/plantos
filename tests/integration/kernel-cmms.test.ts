import { PlantOSKernel } from '../../plantos-core/src/kernel/PlantOSKernel';
import { EquipmentEngine } from '../../platform/runtime/src/engines/EquipmentEngine';
import {
  IStateMachineProvider,
  IStateMachine,
  MachineDefinition,
  StateEvent
} from '../../platform/runtime/src/interfaces/IStateMachineProvider';

// ─── Minimal In-Memory State Machine ────────────────────────────────────────
class SimpleMachine implements IStateMachine {
  id: string;
  currentState: string;
  private transitions: Record<string, Record<string, string>>;
  private listeners: Array<(state: string) => void> = [];

  constructor(definition: MachineDefinition) {
    this.id = definition.id;
    this.currentState = definition.initial;
    this.transitions = {};
    for (const [state, config] of Object.entries(definition.states)) {
      this.transitions[state] = (config as any).on || {};
    }
  }

  send(event: StateEvent): void {
    const next = this.transitions[this.currentState]?.[event.type];
    if (next) {
      this.currentState = next;
      this.listeners.forEach(fn => fn(next));
    }
  }
  onTransition(callback: (state: string) => void): void {
    this.listeners.push(callback);
  }
  start(): void {}
  stop(): void {}
}

class SimpleStateMachineProvider implements IStateMachineProvider {
  createMachine(definition: MachineDefinition): IStateMachine {
    return new SimpleMachine(definition);
  }
}

// ─── Integration Test Runner ─────────────────────────────────────────────────
async function runIntegrationTest() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║       PlantOS 1.0 GA — Integration Test Suite        ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // 1. Boot Kernel
  const kernel = new PlantOSKernel({ environment: 'simulation', version: '1.0.0' });
  await kernel.boot();
  console.log('');

  // 2. Init EquipmentEngine with provider AND event dispatcher
  const provider = new SimpleStateMachineProvider();
  const equipmentEngine = new EquipmentEngine(provider, kernel.events);

  // 3. Register equipment
  const equipmentId = 'MIX-TK-001';
  equipmentEngine.initializeEquipment(equipmentId);
  console.log(`[Test] Initialized equipment: ${equipmentId}`);

  // 4. Normal transitions: Offline → Idle → Starting → Running
  console.log('\n[Test] Starting normal production sequence...');
  equipmentEngine.sendCommand(equipmentId, 'CONNECT');
  equipmentEngine.sendCommand(equipmentId, 'START');
  equipmentEngine.sendCommand(equipmentId, 'READY');
  await new Promise(resolve => setTimeout(resolve, 50));

  console.log('\n[Test] 🚨 Injecting FAULT event...');
  equipmentEngine.sendCommand(equipmentId, 'FAULT');
  await new Promise(resolve => setTimeout(resolve, 50));

  // 5. Verify CMMS Work Orders were created
  const workOrders = kernel.cmms.getWorkOrders(equipmentId);
  console.log('\n─────────────────────────────────────────────────────────');
  if (workOrders.length > 0) {
    console.log(`✅ PASS: CMMSEngine auto-created ${workOrders.length} Work Order(s):`);
    workOrders.forEach(wo => {
      console.log(`   → [${wo.id}] Priority: ${wo.priority} | Status: ${wo.status}`);
      console.log(`     "${wo.description}"`);
    });
  } else {
    console.log('❌ FAIL: No Work Orders were created. Check EventDispatcher wiring.');
    process.exit(1);
  }

  // 6. Shutdown
  await kernel.shutdown();

  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║         Integration Test: ✅ ALL PASSED               ║');
  console.log('║         PlantOS 1.0 GA — READY FOR DEPLOYMENT         ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
}

runIntegrationTest().catch(err => {
  console.error('❌ Integration test FAILED:', err);
  process.exit(1);
});
