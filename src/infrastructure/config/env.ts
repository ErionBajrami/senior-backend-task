import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),

  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  OPS_PORT: z.coerce.number().int().min(1).max(65535).default(3001),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  MONGO_DB_NAME: z.string().min(1).default('quanos'),
  MONGO_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  JWT_ISSUER: z.string().min(1).default('quanos'),

  ADMIN_USERNAME: z.string().min(3, 'ADMIN_USERNAME must be at least 3 characters'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_TIME_WINDOW: z.string().default('1 minute'),

  CORS_ORIGINS: z.string().default(''),

  REQUEST_ID_HEADER: z.string().default('x-request-id'),
});

// const EnvSchema = z.object({
//   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
//   LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),

//   PORT: z.coerce.number().int().min(1).max(65535).default(3000),
//   OPS_PORT: z.coerce.number().int().min(1).max(65535).default(3001),

//   MONGO_URI: z.string().min(1, 'MONGO_URI is required').default('mongodb://localhost:27017'),
//   MONGO_DB_NAME: z.string().min(1).default('quanos'),
//   MONGO_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),

//   JWT_SECRET: z
//     .string()
//     .min(32, 'JWT_SECRET must be at least 32 characters')
//     .default('dev-secret-please-change-me-in-production-now'),
//   JWT_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
//   JWT_ISSUER: z.string().min(1).default('quanos'),

//   ADMIN_USERNAME: z.string().min(3, 'ADMIN_USERNAME must be at least 3 characters').default('admin'),
//   ADMIN_PASSWORD: z
//     .string()
//     .min(8, 'ADMIN_PASSWORD must be at least 8 characters')
//     .default('change-me-please'),

//   RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
//   RATE_LIMIT_TIME_WINDOW: z.string().default('1 minute'),

//   CORS_ORIGINS: z.string().default(''),

//   REQUEST_ID_HEADER: z.string().default('x-request-id'),
// });

export type Env = z.infer<typeof EnvSchema>;

export interface EnvIssue {
  path: string;
  message: string;
}

export class EnvValidationError extends Error {
  readonly issues: readonly EnvIssue[];

  constructor(issues: readonly EnvIssue[]) {
    const formatted = issues.map((i) => `  - ${i.path}: ${i.message}`).join('\n');
    super(`Invalid environment configuration:\n${formatted}`);
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new EnvValidationError(
      parsed.error.issues.map((i) => ({
        path: i.path.join('.') || '<root>',
        message: i.message,
      })),
    );
  }
  return parsed.data;
}

export function parseCorsOrigins(value: string): string[] | true | false {
  const trimmed = value.trim();
  if (trimmed === '') {
    return false;
  }
  if (trimmed === '*') {
    return true;
  }
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
