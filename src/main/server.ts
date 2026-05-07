import type { FastifyInstance } from 'fastify';
import type { MongoClient } from 'mongodb';
import type { Logger } from 'pino';

import type { Env } from '../infrastructure/config/env.js';
import { parseCorsOrigins } from '../infrastructure/config/env.js';
import { createLogger, createLoggerOptions } from '../infrastructure/config/logger.js';
import { connectMongo } from '../infrastructure/persistence/mongo/mongo-client.js';
import { ensureIndexes } from '../infrastructure/persistence/mongo/indexes.js';
import { buildFastifyServer } from '../infrastructure/http/fastify-server.js';
import { buildOpsServer } from '../infrastructure/http/ops-server.js';
import { registerRoutes } from '../interfaces/http/routes.js';
import { composeApp } from './compose.js';
import { seedAdmin } from './seed-admin.js';

export interface RunningApp {
  apiServer: FastifyInstance;
  opsServer: FastifyInstance;
  mongoClient: MongoClient;
  logger: Logger;
}

export async function startServer(env: Env): Promise<RunningApp> {
  const loggerConfig = {
    level: env.LOG_LEVEL,
    prettyPrint: env.NODE_ENV === 'development',
  };
  const loggerOptions = createLoggerOptions(loggerConfig);
  const logger = createLogger(loggerConfig);

  logger.info({ dbName: env.MONGO_DB_NAME }, 'connecting to mongo');
  const { client: mongoClient, db } = await connectMongo({
    uri: env.MONGO_URI,
    dbName: env.MONGO_DB_NAME,
    serverSelectionTimeoutMs: env.MONGO_TIMEOUT_MS,
  });
  await ensureIndexes(db);
  logger.info('mongo connected, indexes ensured');

  const composed = composeApp({ db, env });

  await seedAdmin({
    adminRepo: composed.adminRepo,
    passwordHasher: composed.passwordHasher,
    idGenerator: composed.idGenerator,
    clock: composed.clock,
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD,
    logger,
  });

  const apiServer = await buildFastifyServer({
    loggerOptions,
    requestIdHeader: env.REQUEST_ID_HEADER,

    security: {
      rateLimitMax: env.RATE_LIMIT_MAX,
      rateLimitTimeWindow: env.RATE_LIMIT_TIME_WINDOW,
      corsOrigins: parseCorsOrigins(env.CORS_ORIGINS),
    },
  });
  await registerRoutes(apiServer, {
    listActiveLinks: composed.listActiveLinks,
    getActiveLink: composed.getActiveLink,
    jumpToLink: composed.jumpToLink,
    listAllLinks: composed.listAllLinks,
    getLink: composed.getLink,
    createLink: composed.createLink,
    updateLink: composed.updateLink,
    deleteLink: composed.deleteLink,
    authenticateAdmin: composed.authenticateAdmin,
    authMiddleware: composed.authMiddleware,
  });

  const opsServer = buildOpsServer({
    loggerOptions,
    mongoClient,
    mongoTimeoutMs: env.MONGO_TIMEOUT_MS,
  });

  await apiServer.listen({ port: env.PORT, host: '0.0.0.0' });
  await opsServer.listen({ port: env.OPS_PORT, host: '0.0.0.0' });
  logger.info({ port: env.PORT, opsPort: env.OPS_PORT }, 'app listening');

  return { apiServer, opsServer, mongoClient, logger };
}
