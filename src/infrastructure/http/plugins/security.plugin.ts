import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

export interface SecurityConfig {
  rateLimitMax: number;
  rateLimitTimeWindow: string;
  corsOrigins: string[] | true | false;
}

export async function registerSecurityPlugins(app: FastifyInstance, config: SecurityConfig): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: false,
  });

  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitTimeWindow,
  });
}
