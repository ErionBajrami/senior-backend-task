import Fastify, { type FastifyInstance } from 'fastify';
import type { LoggerOptions } from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { registerErrorHandler } from './plugins/error-handler.plugin.js';
import { registerSecurityPlugins, type SecurityConfig } from './plugins/security.plugin.js';

export interface FastifyServerConfig {
  loggerOptions: LoggerOptions;
  requestIdHeader: string;
  security: SecurityConfig;
}

export async function buildFastifyServer(config: FastifyServerConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.loggerOptions,
    requestIdHeader: config.requestIdHeader,
    requestIdLogLabel: 'requestId',
    genReqId: () => uuidv4(),
    disableRequestLogging: false,
    bodyLimit: 1024 * 100,
  }) as unknown as FastifyInstance;

  await registerSecurityPlugins(app, config.security);
  registerErrorHandler(app);
  
  app.addHook('onSend', (req, reply, payload, done) => {
    reply.header(config.requestIdHeader, req.id);
    done(null, payload);
  });

  return app;
}
