import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import type { AuthenticateAdmin } from '../../application/use-cases/authenticate-admin.use-case.js';
import type { CreateLink } from '../../application/use-cases/create-link.use-case.js';
import type { DeleteLink } from '../../application/use-cases/delete-link.use-case.js';
import type { GetActiveLink } from '../../application/use-cases/get-active-link.use-case.js';
import type { GetLink } from '../../application/use-cases/get-link.use-case.js';
import type { JumpToLink } from '../../application/use-cases/jump-to-link.use-case.js';
import type { ListActiveLinks } from '../../application/use-cases/list-active-links.use-case.js';
import type { ListAllLinks } from '../../application/use-cases/list-all-links.use-case.js';
import type { UpdateLink } from '../../application/use-cases/update-link.use-case.js';
import { registerAdminPageRoutes } from './controllers/admin-page.controller.js';
import { registerAuthRoutes } from './controllers/auth.controller.js';
import { registerJumpRoutes } from './controllers/jump.controller.js';
import { registerLandingRoutes } from './controllers/landing.controller.js';
import { registerAdminLinkRoutes, registerPublicLinkRoutes } from './controllers/link.controller.js';

export interface RouteDeps {
  listActiveLinks: ListActiveLinks;
  getActiveLink: GetActiveLink;
  jumpToLink: JumpToLink;

  listAllLinks: ListAllLinks;
  getLink: GetLink;
  createLink: CreateLink;
  updateLink: UpdateLink;
  deleteLink: DeleteLink;

  authenticateAdmin: AuthenticateAdmin;
  authMiddleware: preHandlerHookHandler;
}

export async function registerRoutes(app: FastifyInstance, deps: RouteDeps): Promise<void> {
  await registerLandingRoutes(app, { listActiveLinks: deps.listActiveLinks });

  registerAdminPageRoutes(app);

  registerJumpRoutes(app, { jumpToLink: deps.jumpToLink });

  registerPublicLinkRoutes(app, {
    listActiveLinks: deps.listActiveLinks,
    getActiveLink: deps.getActiveLink,
  });

  registerAuthRoutes(app, { authenticateAdmin: deps.authenticateAdmin });

  registerAdminLinkRoutes(app, {
    listAllLinks: deps.listAllLinks,
    getLink: deps.getLink,
    createLink: deps.createLink,
    updateLink: deps.updateLink,
    deleteLink: deps.deleteLink,
    
    authMiddleware: deps.authMiddleware,
  });
}
