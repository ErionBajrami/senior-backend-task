import type { FastifyInstance } from 'fastify';
import type { JumpToLink } from '../../../application/use-cases/jump-to-link.use-case.js';
import { LinkIdParam } from '../schemas/link.schema.js';

export interface JumpControllerDeps {
  jumpToLink: JumpToLink;
}

export function registerJumpRoutes(app: FastifyInstance, deps: JumpControllerDeps): void {
  app.get('/go/:id', async (req, reply) => {
    const { id } = LinkIdParam.parse(req.params);
    const result = await deps.jumpToLink.execute({ id });
    return reply.header('cache-control', 'no-store').redirect(result.url, 302);
  });
}
