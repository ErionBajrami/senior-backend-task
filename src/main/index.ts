import { EnvValidationError, loadEnv } from '../infrastructure/config/env.js';
import { startServer, type RunningApp } from './server.js';

async function main(): Promise<void> {
  let env;
  try {
    env = loadEnv();
  } catch (err) {
    if (err instanceof EnvValidationError) {
      console.error(err.message);
    } else {
      console.error('Failed to load environment:', err);
    }
    process.exit(1);
  }
  process.on('uncaughtException', (err) => {
    console.error('uncaughtException:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('unhandledRejection:', reason);
    process.exit(1);
  });

  let running: RunningApp;
  try {
    running = await startServer(env);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    running.logger.info({ signal }, 'shutdown initiated');

    try {
      await running.apiServer.close();
      await running.opsServer.close();
      running.logger.info('http servers closed');
    } catch (err) {
      running.logger.error({ err }, 'error closing http servers');
    }

    try {
      await running.mongoClient.close();
      running.logger.info('mongo closed');
    } catch (err) {
      running.logger.error({ err }, 'error closing mongo');
    }

    process.exit(0);
  };

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => {
      shutdown(signal).catch((err: unknown) => {
        console.error('shutdown handler failed:', err);
        process.exit(1);
      });
    });
  }
}

main().catch((err: unknown) => {
  console.error('Unhandled error in main:', err);
  process.exit(1);
});
