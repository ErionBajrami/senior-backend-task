import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { InvalidCredentialsError } from '../../../domain/errors/invalid-credentials.error.js';
import type { VerifyAdminToken } from '../../../application/use-cases/verify-admin-token.use-case.js';

const BEARER_PREFIX = 'Bearer ';

export interface AuthMiddlewareDeps {
  verifyAdminToken: VerifyAdminToken;
}

export function makeAuthMiddleware(deps: AuthMiddlewareDeps): preHandlerHookHandler {
  return async function authMiddleware(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const header = req.headers.authorization;
    if (typeof header !== 'string' || !header.startsWith(BEARER_PREFIX)) {
      throw new InvalidCredentialsError();
    }

    const token = header.slice(BEARER_PREFIX.length).trim();
    if (token.length === 0) {
      throw new InvalidCredentialsError();
    }

    const admin = await deps.verifyAdminToken.execute({ token });
    if (!admin) {
      throw new InvalidCredentialsError();
    }
  };
}
