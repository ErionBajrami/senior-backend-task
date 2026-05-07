import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { MongoClient, type Db } from 'mongodb';
import type { FastifyInstance } from 'fastify';

import { composeApp } from '../../../src/main/compose.js';
import { seedAdmin } from '../../../src/main/seed-admin.js';
import { ensureIndexes } from '../../../src/infrastructure/persistence/mongo/indexes.js';
import { buildFastifyServer } from '../../../src/infrastructure/http/fastify-server.js';
import { createLogger, createLoggerOptions } from '../../../src/infrastructure/config/logger.js';
import { registerRoutes } from '../../../src/interfaces/http/routes.js';
import type { Env } from '../../../src/infrastructure/config/env.js';

export interface TestApp {
  app: FastifyInstance;
  client: MongoClient;
  db: Db;
  container: StartedTestContainer;
  env: Env;
  shutdown: () => Promise<void>;
}

const TEST_ADMIN_USERNAME = 'admin';
const TEST_ADMIN_PASSWORD = 'test-password-12345';

export const TEST_CREDENTIALS = {
  username: TEST_ADMIN_USERNAME,
  password: TEST_ADMIN_PASSWORD,
} as const;

/**
 * Boots a real-Mongo, fully-composed Fastify app for E2E tests. The
 * only fake is that `fastify.inject()` simulates HTTP without binding
 * a TCP port — argon2, JWT, Mongo, the use cases, and the layering
 * are all production paths.
 */
export async function buildTestApp(): Promise<TestApp> {
  const container = await new GenericContainer('mongo:7').withExposedPorts(27017).start();

  const uri = `mongodb://${container.getHost()}:${container.getMappedPort(27017).toString()}`;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('quanos_e2e');

  await ensureIndexes(db);

  const env: Env = {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    PORT: 3000,
    OPS_PORT: 3001,
    MONGO_URI: uri,
    MONGO_DB_NAME: 'quanos_e2e',
    MONGO_TIMEOUT_MS: 5000,
    JWT_SECRET: 'a'.repeat(40),
    JWT_TTL_SECONDS: 3600,
    JWT_ISSUER: 'quanos-e2e',
    ADMIN_USERNAME: TEST_ADMIN_USERNAME,
    ADMIN_PASSWORD: TEST_ADMIN_PASSWORD,
    RATE_LIMIT_MAX: 1000,
    RATE_LIMIT_TIME_WINDOW: '1 minute',
    CORS_ORIGINS: '',
    REQUEST_ID_HEADER: 'x-request-id',
  };

  const composed = composeApp({ db, env });

  const loggerConfig = { level: env.LOG_LEVEL, prettyPrint: false };
  const logger = createLogger(loggerConfig);
  const loggerOptions = createLoggerOptions(loggerConfig);

  await seedAdmin({
    adminRepo: composed.adminRepo,
    passwordHasher: composed.passwordHasher,
    idGenerator: composed.idGenerator,
    clock: composed.clock,
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD,
    logger,
  });

  const app = await buildFastifyServer({
    loggerOptions,
    requestIdHeader: env.REQUEST_ID_HEADER,
    security: {
      rateLimitMax: env.RATE_LIMIT_MAX,
      rateLimitTimeWindow: env.RATE_LIMIT_TIME_WINDOW,
      corsOrigins: false,
    },
  });
  await registerRoutes(app, {
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
  await app.ready();

  const shutdown = async (): Promise<void> => {
    await app.close();
    await client.close();
    await container.stop();
  };

  return { app, client, db, container, env, shutdown };
}

/** Empties the `links` collection between tests; leaves the seeded admin alone. */
export async function clearLinks(db: Db): Promise<void> {
  await db.collection('links').deleteMany({});
}
