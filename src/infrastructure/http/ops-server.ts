import Fastify, { type FastifyInstance } from 'fastify';
import type { LoggerOptions } from 'pino';
import type { MongoClient } from 'mongodb';

export interface OpsServerConfig {
  loggerOptions: LoggerOptions;
  mongoClient: MongoClient;
  mongoTimeoutMs: number;
}

async function pingWithTimeout(client: MongoClient, ms: number): Promise<void> {
  await Promise.race([
    client.db().admin().ping(),
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        reject(new Error(`Mongo ping timed out after ${ms.toString()}ms`));
      }, ms).unref(),
    ),
  ]);
}

export function buildOpsServer(config: OpsServerConfig): FastifyInstance {
  const app = Fastify({ logger: config.loggerOptions }) as unknown as FastifyInstance;

  app.get('/healthz', () => ({ status: 'ok' }));

  app.get('/readyz', async (req, reply) => {
    try {
      await pingWithTimeout(config.mongoClient, config.mongoTimeoutMs);
      return await reply.send({ status: 'ready' });
    } catch (err) {
      req.log.warn({ err }, 'readiness check failed');
      return reply.status(503).send({ status: 'not ready' });
    }
  });

  return app;
}
