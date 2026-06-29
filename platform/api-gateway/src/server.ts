import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { AuthService } from './identity/AuthService';

// In a real app, the Kernel would be initialized here and injected into routes
// import { PlantOSKernel } from '@plantos/core';
// const kernel = new PlantOSKernel();

const server = Fastify({ logger: true });

server.register(fastifyCors, { origin: true });
server.register(fastifyWebsocket);
server.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'local-edge-secret-key' });

const authService = new AuthService(server);

// --- 1. HEALTH API ---
server.get('/health', async (request, reply) => {
  // Real implementation would check DB, Historian, EventBus
  return { 
    status: 'ok', 
    services: { 
      database: 'up', 
      historian: 'up', 
      eventBus: 'up' 
    } 
  };
});

// --- 2. IDENTITY API (Local Auth) ---
server.post('/auth/login', async (request, reply) => {
  const { username, password } = request.body as any;
  const token = await authService.authenticateLocalUser(username, password);
  if (!token) {
    reply.code(401).send({ error: 'Invalid credentials or account locked' });
    return;
  }
  return { token };
});

// Authentication middleware
server.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// --- 3. COMMAND API ---
server.post('/commands/:commandName', { preValidation: [server.authenticate] }, async (request, reply) => {
  const { commandName } = request.params as any;
  const payload = request.body;
  // await kernel.commandBus.dispatch({ name: commandName, payload, context: request.user });
  return { status: 'accepted', commandId: 'cmd-123' };
});

// --- 4. QUERY API ---
server.get('/queries/:queryName', { preValidation: [server.authenticate] }, async (request, reply) => {
  const { queryName } = request.params as any;
  // const result = await kernel.queryBus.execute({ name: queryName, params: request.query });
  return { data: [] };
});

// --- 5. TELEMETRY WS GATEWAY ---
server.get('/telemetry', { websocket: true }, (connection, req) => {
  connection.socket.on('message', message => {
    // Client requesting specific tags
    const request = JSON.parse(message.toString());
    if (request.action === 'SUBSCRIBE') {
      // Logic to pipe data from EventBus -> HistorianAdapter -> WebSocket
      connection.socket.send(JSON.stringify({ tag: request.tags[0], value: Math.random() * 100 }));
    }
  });
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('PlantOS API Gateway running on http://0.0.0.0:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
