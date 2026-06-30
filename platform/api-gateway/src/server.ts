import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { AuthService } from './identity/AuthService';

// ─── Boot PlantOS Kernel ──────────────────────────────────────────────────────
// Dynamic require to avoid TS cross-package issues
const path = require('path');
const kernelPath = path.resolve(__dirname, '../../../plantos-core/src/kernel/PlantOSKernel');
const runtimePath = path.resolve(__dirname, '../../runtime/src/engines/EquipmentEngine');
const providerPath = path.resolve(__dirname, '../../runtime/src/interfaces/IStateMachineProvider');

const { PlantOSKernel, CMMSEngine } = require(kernelPath);

// Minimal state machine provider
class SimpleMachine {
  id: string; currentState: string;
  private transitions: Record<string, Record<string, string>>;
  private listeners: Array<(s: string) => void> = [];
  constructor(def: any) {
    this.id = def.id; this.currentState = def.initial; this.transitions = {};
    for (const [s, c] of Object.entries(def.states as any)) {
      this.transitions[s] = (c as any).on || {};
    }
  }
  send(e: any) {
    const next = this.transitions[this.currentState]?.[e.type];
    if (next) { this.currentState = next; this.listeners.forEach(fn => fn(next)); }
  }
  onTransition(cb: (s: string) => void) { this.listeners.push(cb); }
  start() {} stop() {}
}

const kernel = new PlantOSKernel({ environment: 'production', version: '1.0.0' });
const equipmentStates: Record<string, string> = {};

// ─── In-memory equipment registry ────────────────────────────────────────────
const factory = { equipment: ['UNL-PMP-01', 'MIX-TK-001', 'RO-WTR-001', 'PKG-LN-001'] };
const machines: Record<string, SimpleMachine> = {};

// ISA-88 definition
const isa88 = {
  Offline: { on: { CONNECT: 'Idle' } },
  Idle: { on: { START: 'Starting', FAULT: 'Fault' } },
  Starting: { on: { READY: 'Running', FAULT: 'Fault' } },
  Running: { on: { HOLD: 'Holding', STOP: 'Stopping', FAULT: 'Fault' } },
  Holding: { on: { RESUME: 'Running', STOP: 'Stopping', FAULT: 'Fault' } },
  Stopping: { on: { STOPPED: 'Stopped', FAULT: 'Fault' } },
  Stopped: { on: { RESET: 'Idle' } },
  Fault: { on: { CLEAR: 'Idle', MAINTAIN: 'Maintenance' } },
  Maintenance: { on: { RESTORE: 'Offline' } }
};

for (const id of factory.equipment) {
  const m = new SimpleMachine({ id, initial: 'Offline', states: isa88 });
  equipmentStates[id] = 'Offline';
  m.onTransition((state) => {
    equipmentStates[id] = state;
    kernel.events.publish({
      eventId: `evt-${Date.now()}`,
      type: 'EQUIPMENT_STATE_CHANGED',
      timestamp: new Date().toISOString(),
      payload: { equipmentId: id, state }
    }).catch(() => {});
  });
  machines[id] = m;
}

// ─── Fastify Server ───────────────────────────────────────────────────────────
const server = Fastify({ logger: false });

server.register(fastifyCors, { origin: true });
server.register(fastifyWebsocket);
server.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'plantos-edge-secret' });

const authService = new AuthService(server);

server.decorate('authenticate', async function (request: any, reply: any) {
  try { await request.jwtVerify(); }
  catch (err) { reply.send(err); }
});

// ─── BOOT ─────────────────────────────────────────────────────────────────────
kernel.boot().then(() => {
  console.log('[PlantOS] Kernel booted. API Gateway ready.');
});

// ─── 1. HEALTH ────────────────────────────────────────────────────────────────
server.get('/health', async () => ({
  status: 'ok', version: '1.0.0',
  equipment: equipmentStates,
  workOrders: kernel.cmms.getWorkOrders().length
}));

// ─── 2. AUTH ──────────────────────────────────────────────────────────────────
server.post('/auth/login', async (request, reply) => {
  const { username, password } = request.body as any;
  const token = await authService.authenticateLocalUser(username, password);
  if (!token) { reply.code(401).send({ error: 'Invalid credentials' }); return; }
  return { token, user: { username, role: 'PlantManager' } };
});

// ─── 3. EQUIPMENT ─────────────────────────────────────────────────────────────
server.get('/equipment', async () => ({
  equipment: factory.equipment.map(id => ({
    id, state: equipmentStates[id],
    workOrders: kernel.cmms.getWorkOrders(id).length
  }))
}));

server.post('/equipment/:id/command', async (request, reply) => {
  const { id } = request.params as any;
  const { command } = request.body as any;
  if (!machines[id]) { reply.code(404).send({ error: 'Equipment not found' }); return; }
  machines[id].send({ type: command.toUpperCase() });
  return { equipmentId: id, command, newState: equipmentStates[id] };
});

// ─── 4. BATCH SIMULATION ──────────────────────────────────────────────────────
server.post('/simulate/startup', async () => {
  for (const id of factory.equipment) {
    machines[id].send({ type: 'CONNECT' });
    await new Promise(r => setTimeout(r, 100));
    machines[id].send({ type: 'START' });
    await new Promise(r => setTimeout(r, 100));
    machines[id].send({ type: 'READY' });
    await new Promise(r => setTimeout(r, 100));
  }
  return { status: 'All equipment Running', states: equipmentStates };
});

server.post('/simulate/shutdown', async () => {
  for (const id of factory.equipment) {
    machines[id].send({ type: 'STOP' });
    await new Promise(r => setTimeout(r, 100));
    machines[id].send({ type: 'STOPPED' });
    await new Promise(r => setTimeout(r, 100));
    machines[id].send({ type: 'RESET' });
  }
  return { status: 'All equipment Idle', states: equipmentStates };
});

// ─── 5. CMMS WORK ORDERS ──────────────────────────────────────────────────────
server.get('/cmms/workorders', async () => ({
  workOrders: kernel.cmms.getWorkOrders()
}));

server.post('/cmms/workorders/:id/resolve', async (request, reply) => {
  const { id } = request.params as any;
  const wos = kernel.cmms.getWorkOrders();
  const wo = wos.find((w: any) => w.id === id);
  if (!wo) { reply.code(404).send({ error: 'Work order not found' }); return; }
  wo.status = 'RESOLVED';
  return { workOrder: wo };
});

// ─── 6. STUDIO PUBLISH ────────────────────────────────────────────────────────
server.post('/studio/publish', async (request) => {
  const packageData = request.body;
  console.log('[Studio] Package received for compilation:', JSON.stringify(packageData).slice(0, 100));
  return { status: 'published', version: '1.0.0', packageId: `pkg-${Date.now()}` };
});

// ─── 7. REAL-TIME TELEMETRY WEBSOCKET ─────────────────────────────────────────
const wsClients: Set<any> = new Set();

server.get('/ws/telemetry', { websocket: true }, (connection) => {
  wsClients.add(connection.socket);
  console.log(`[WS] Client connected. Total: ${wsClients.size}`);

  // Push live state every 2 seconds
  const interval = setInterval(() => {
    const payload = JSON.stringify({
      type: 'TELEMETRY_UPDATE',
      timestamp: new Date().toISOString(),
      equipment: factory.equipment.map(id => ({
        id,
        state: equipmentStates[id],
        telemetry: {
          temperature: equipmentStates[id] === 'Running' ? 60 + Math.random() * 15 : 20 + Math.random() * 5,
          pressure: equipmentStates[id] === 'Running' ? 2.5 + Math.random() * 0.5 : 0.1,
          rpm: id.includes('MIX') && equipmentStates[id] === 'Running' ? 120 + Math.random() * 30 : 0,
          flowRate: id.includes('PMP') && equipmentStates[id] === 'Running' ? 45 + Math.random() * 10 : 0,
        }
      })),
      workOrders: kernel.cmms.getWorkOrders().length
    });
    try { connection.socket.send(payload); } catch (e) {}
  }, 2000);

  connection.socket.on('close', () => {
    wsClients.delete(connection.socket);
    clearInterval(interval);
    console.log(`[WS] Client disconnected. Total: ${wsClients.size}`);
  });
});

// ─── START ────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║        PlantOS 1.0 GA — API Gateway                   ║');
    console.log('║                                                        ║');
    console.log('║  HTTP  : http://localhost:3000                         ║');
    console.log('║  WS    : ws://localhost:3000/ws/telemetry              ║');
    console.log('║  Login : POST /auth/login  admin/admin                 ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
