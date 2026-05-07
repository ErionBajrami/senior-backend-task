import type { FastifyInstance } from 'fastify';
import type { AuthenticateAdmin } from '../../../application/use-cases/authenticate-admin.use-case.js';
import { LoginBody, type LoginResponseDto } from '../schemas/auth.schema.js';

export interface AuthControllerDeps {
  authenticateAdmin: AuthenticateAdmin;
}

export function registerAuthRoutes(app: FastifyInstance, deps: AuthControllerDeps): void {
  app.post('/v1/auth/login', async (req): Promise<LoginResponseDto> => {
    const body = LoginBody.parse(req.body);
    const signed = await deps.authenticateAdmin.execute({
      username: body.username,
      password: body.password,
    });
    return {
      token: signed.token,
      expiresAt: signed.expiresAt.toISOString(),
    };
  });
}
