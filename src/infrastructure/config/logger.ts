import { pino, type Logger, type LoggerOptions } from 'pino';

export interface LoggerConfig {
  level: string;
  prettyPrint: boolean;
}

export function createLoggerOptions(config: LoggerConfig): LoggerOptions {
  const options: LoggerOptions = {
    level: config.level,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        '*.password',
        '*.passwordHash',
        '*.secret',
        '*.token',
        '*.jwt',
        'mongoUri',
        'JWT_SECRET',
        'ADMIN_PASSWORD',
        'MONGO_URI',
      ],
      remove: true,
    },
  };

  if (config.prettyPrint) {
    options.transport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
    };
  }

  return options;
}

export function createLogger(config: LoggerConfig): Logger {
  return pino(createLoggerOptions(config));
}
