import * as readline from 'readline';
import { PlantOSKernel } from '../../plantos-core/src/kernel/PlantOSKernel';
import { EquipmentEngine } from '../../platform/runtime/src/engines/EquipmentEngine';
import {
  IStateMachineProvider,
  IStateMachine,
  MachineDefinition,
  StateEvent
} from '../../platform/runtime/src/interfaces/IStateMachineProvider';

// ─── Simple In-Memory State Machine ──────────────────────────────────────────
class SimpleMachine implements IStateMachine {
  id: string;
  currentState: string;
  private transitions: Record<string, Record<string, string>>;
  private listeners: Array<(state: string) => void> = [];

  constructor(def: MachineDefinition) {
    this.id = def.id;
    this.currentState = def.initial;
    this.transitions = {};
    for (const [state, config] of Object.entries(def.states)) {
      this.transitions[state] = (config as any).on || {};
    }
  }
  send(event: StateEvent): void {
    const next = this.transitions[this.currentState]?.[event.type];
    if (next) {
      this.currentState = next;
      this.listeners.forEach(fn => fn(next));
    } else {
      console.log(`  [!] Command "${event.type}" not valid in state "${this.currentState}"`);
    }
  }
  onTransition(cb: (state: string) => void): void { this.listeners.push(cb); }
  start(): void {}
  stop(): void {}
}

class SimpleProvider implements IStateMachineProvider {
  createMachine(def: MachineDefinition): IStateMachine { return new SimpleMachine(def); }
}

// ─── PlantOS Interactive CLI ─────────────────────────────────────────────────
async function main() {
  console.clear();
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                  PlantOS 1.0 GA — Operator CLI              ║');
  console.log('║          Edge-First Manufacturing Execution Platform         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // Boot kernel
  const kernel = new PlantOSKernel({ environment: 'simulation', version: '1.0.0' });
  await kernel.boot();

  // Setup equipment engine
  const equipmentEngine = new EquipmentEngine(new SimpleProvider(), kernel.events);

  // Pre-register factory equipment (PlantSmör)
  const equipment = ['UNL-PMP-01', 'MIX-TK-001', 'RO-WTR-001', 'PKG-LN-001'];
  equipment.forEach(id => equipmentEngine.initializeEquipment(id));

  console.log('');
  console.log('📋 Factory Equipment Registered:');
  equipment.forEach(id => console.log(`   • ${id}`));
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Commands:');
  console.log('  status           — Show all equipment states');
  console.log('  send <EQ> <CMD>  — Send command to equipment');
  console.log('  workorders       — Show CMMS Work Orders');
  console.log('  simulate         — Run PlantSmör scenario');
  console.log('  help             — Show valid commands per state');
  console.log('  exit             — Shutdown & exit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // Track machines for display
  const machineStates: Record<string, string> = {};
  equipment.forEach(id => { machineStates[id] = 'Offline'; });

  // Listen to state changes to update our local map
  kernel.events.subscribe('EQUIPMENT_STATE_CHANGED', async (event) => {
    machineStates[event.payload.equipmentId] = event.payload.state;
  });

  // Wait a tick for subscriptions to settle
  await new Promise(r => setTimeout(r, 50));

  const prompt = () => {
    if (!process.stdin.readable) return;
    try {
      rl.question('plantos> ', async (input) => {
      const parts = input.trim().split(/\s+/);
      const cmd = parts[0];

      if (cmd === 'exit') {
        await kernel.shutdown();
        console.log('\nGoodbye. PlantOS shutting down...\n');
        rl.close();
        return;

      } else if (cmd === 'status') {
        console.log('');
        console.log('┌─────────────────┬──────────────────────────────┐');
        console.log('│ Equipment ID    │ State                        │');
        console.log('├─────────────────┼──────────────────────────────┤');
        for (const [id, state] of Object.entries(machineStates)) {
          const icon = state === 'Fault' ? '🔴' : state === 'Running' ? '🟢' : state === 'Offline' ? '⚫' : '🟡';
          console.log(`│ ${id.padEnd(15)} │ ${icon} ${state.padEnd(27)}│`);
        }
        console.log('└─────────────────┴──────────────────────────────┘');
        console.log('');

      } else if (cmd === 'send' && parts.length >= 3) {
        const eqId = parts[1].toUpperCase();
        const command = parts[2].toUpperCase();
        if (!equipment.includes(eqId)) {
          console.log(`  ❌ Unknown equipment: ${eqId}`);
          console.log(`  Available: ${equipment.join(', ')}`);
        } else {
          equipmentEngine.sendCommand(eqId, command);
          await new Promise(r => setTimeout(r, 100));
        }

      } else if (cmd === 'workorders') {
        const wos = kernel.cmms.getWorkOrders();
        console.log('');
        if (wos.length === 0) {
          console.log('  ℹ️  No Work Orders. Factory running normally.');
        } else {
          console.log(`  📋 CMMS Work Orders (${wos.length}):`);
          wos.forEach(wo => {
            const icon = wo.priority === 'CRITICAL' ? '🔴' : wo.priority === 'HIGH' ? '🟠' : '🟡';
            console.log(`  ${icon} [${wo.id}]`);
            console.log(`     Equipment : ${wo.equipmentId}`);
            console.log(`     Priority  : ${wo.priority}  |  Status: ${wo.status}`);
            console.log(`     Created   : ${wo.createdAt}`);
            console.log(`     Note      : ${wo.description}`);
            console.log('');
          });
        }

      } else if (cmd === 'simulate') {
        console.log('');
        console.log('▶ Running PlantSmör startup sequence...');
        for (const id of equipment) {
          equipmentEngine.sendCommand(id, 'CONNECT');
          await new Promise(r => setTimeout(r, 50));
          equipmentEngine.sendCommand(id, 'START');
          await new Promise(r => setTimeout(r, 50));
          equipmentEngine.sendCommand(id, 'READY');
          await new Promise(r => setTimeout(r, 50));
        }
        console.log('✅ All equipment Running. Type "status" to view.\n');

      } else if (cmd === 'help') {
        console.log('');
        console.log('  Valid commands per state:');
        console.log('  ┌──────────────┬────────────────────────────────────────┐');
        console.log('  │ State        │ Valid Commands                         │');
        console.log('  ├──────────────┼────────────────────────────────────────┤');
        console.log('  │ Offline      │ CONNECT                                │');
        console.log('  │ Idle         │ START, FAULT                           │');
        console.log('  │ Starting     │ READY, FAULT                           │');
        console.log('  │ Running      │ HOLD, STOP, FAULT                      │');
        console.log('  │ Holding      │ RESUME, STOP, FAULT                    │');
        console.log('  │ Stopping     │ STOPPED                                │');
        console.log('  │ Stopped      │ RESET                                  │');
        console.log('  │ Fault        │ CLEAR, MAINTAIN                        │');
        console.log('  │ Maintenance  │ RESTORE                                │');
        console.log('  └──────────────┴────────────────────────────────────────┘');
        console.log('');
        console.log('  Example: send MIX-TK-001 CONNECT');
        console.log('           send MIX-TK-001 FAULT');
        console.log('');

      } else if (cmd === '') {
        // just re-prompt

      } else {
        console.log(`  ❓ Unknown command: "${input}"`);
        console.log('  Type "help" for available commands.');
      }

      prompt();
    });
    } catch(e) { /* readline closed, exit silently */ }
  };

  prompt();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
