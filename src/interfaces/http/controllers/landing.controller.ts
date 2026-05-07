import { resolve } from 'node:path';
import staticPlugin from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import type { ListActiveLinks } from '../../../application/use-cases/list-active-links.use-case.js';
import { renderLandingPage } from '../views/landing.view.js';

export interface LandingControllerDeps {
  listActiveLinks: ListActiveLinks;
}

export async function registerLandingRoutes(
  app: FastifyInstance,
  deps: LandingControllerDeps,
): Promise<void> {
  const publicRoot = resolve(process.cwd(), 'public');

  await app.register(staticPlugin, {
    root: publicRoot,
    prefix: '/static/',
    decorateReply: false,
  });

  app.get('/', async (_req, reply) => {
    const { items } = await deps.listActiveLinks.execute();
    const html = renderLandingPage(items);
    return reply.type('text/html; charset=utf-8').header('cache-control', 'no-store').send(html);
  });
}
