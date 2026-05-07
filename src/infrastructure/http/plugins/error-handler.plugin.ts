import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { DomainError } from '../../../domain/errors/domain-error.js';

const DOMAIN_TO_STATUS: Readonly<Record<string, number>> = {
  LINK_NOT_FOUND: 404,
  ADMIN_NOT_FOUND: 404,
  INVALID_URL: 422,
  INVALID_TITLE: 422,
  INVALID_DESCRIPTION: 422,
  INVALID_CATEGORY: 422,
  INVALID_USERNAME: 401,
  INVALID_CREDENTIALS: 401,
};

export interface ErrorIssue {
  path: string;
  message: string;
}

export interface ErrorResponseBody {
  code: string;
  message: string;
  issues?: readonly ErrorIssue[];
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err: FastifyError | Error, req: FastifyRequest, reply: FastifyReply): FastifyReply => {
    if (err instanceof ZodError) {
      req.log.warn({ issues: err.issues }, 'request validation failed');
      const body: ErrorResponseBody = {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        issues: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      };
      return reply.status(422).send(body);
    }

    if (err instanceof DomainError) {
      const status = DOMAIN_TO_STATUS[err.code] ?? 400;
      if (status === 401) {
        req.log.warn({ code: err.code }, 'authentication failed');
        return reply.status(401).send({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
      }
      req.log.warn({ code: err.code, name: err.name }, err.message);
      return reply.status(status).send({ code: err.code, message: err.message });
    }

    if ('statusCode' in err && typeof err.statusCode === 'number' && err.statusCode < 500) {
      req.log.warn({ statusCode: err.statusCode, name: err.name }, err.message);
      const code = 'code' in err && typeof err.code === 'string' ? err.code : 'HTTP_ERROR';
      return reply.status(err.statusCode).send({ code, message: err.message });
    }

    req.log.error({ err }, 'unhandled error');
    return reply.status(500).send({ code: 'INTERNAL', message: 'Internal server error' });
  });
}
