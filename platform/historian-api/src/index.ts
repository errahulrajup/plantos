import Fastify from 'fastify';

const server = Fastify({ logger: true });

// Mock TimescaleDB Service
class TimescaleDBService {
  async queryTelemetry(tagId: string, from: string, to: string) {
    // In a real implementation, this would execute a SQL query against TimescaleDB
    // e.g., SELECT time, value FROM telemetry WHERE tag_id = $1 AND time > $2 AND time < $3
    return [
      { time: new Date().toISOString(), value: 45.2 },
      { time: new Date(Date.now() - 60000).toISOString(), value: 44.8 }
    ];
  }
}

const db = new TimescaleDBService();

// --- REST API ---
server.get('/api/telemetry', async (request, reply) => {
  const { tagId, from, to } = request.query as any;
  if (!tagId) {
    reply.code(400).send({ error: 'tagId is required' });
    return;
  }
  
  const data = await db.queryTelemetry(tagId, from, to);
  return { tagId, data };
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Historian API running on http://0.0.0.0:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
