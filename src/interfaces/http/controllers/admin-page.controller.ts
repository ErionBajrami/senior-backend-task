import type { FastifyInstance } from 'fastify';
import { renderAdminPage } from '../views/admin.view.js';

export function registerAdminPageRoutes(app: FastifyInstance): void {
  app.get('/admin', (_req, reply) =>
    reply.type('text/html; charset=utf-8').header('cache-control', 'no-store').send(renderAdminPage()),
  );
}
