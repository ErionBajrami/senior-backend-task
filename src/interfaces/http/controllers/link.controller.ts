import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import type { CreateLink } from '../../../application/use-cases/create-link.use-case.js';
import type { DeleteLink } from '../../../application/use-cases/delete-link.use-case.js';
import type { GetActiveLink } from '../../../application/use-cases/get-active-link.use-case.js';
import type { GetLink } from '../../../application/use-cases/get-link.use-case.js';
import type { ListActiveLinks } from '../../../application/use-cases/list-active-links.use-case.js';
import type { ListAllLinks } from '../../../application/use-cases/list-all-links.use-case.js';
import type { UpdateLink } from '../../../application/use-cases/update-link.use-case.js';
import { presentLink, presentLinks } from '../presenters/link.presenter.js';
import {
  CreateLinkBody,
  LinkIdParam,
  UpdateLinkBody,
  type LinkListResponseDto,
  type LinkResponseDto,
} from '../schemas/link.schema.js';

export interface PublicLinkControllerDeps {
  listActiveLinks: ListActiveLinks;
  getActiveLink: GetActiveLink;
}

export function registerPublicLinkRoutes(app: FastifyInstance, deps: PublicLinkControllerDeps): void {
  app.get('/v1/links', async (): Promise<LinkListResponseDto> => {
    const links = await deps.listActiveLinks.execute();
    return [...presentLinks(links)];
  });

  app.get('/v1/links/:id', async (req): Promise<LinkResponseDto> => {
    const { id } = LinkIdParam.parse(req.params);
    const link = await deps.getActiveLink.execute({ id });
    return presentLink(link);
  });
}

export interface AdminLinkControllerDeps {
  listAllLinks: ListAllLinks;
  getLink: GetLink;
  createLink: CreateLink;
  updateLink: UpdateLink;
  deleteLink: DeleteLink;
  authMiddleware: preHandlerHookHandler;
}

export function registerAdminLinkRoutes(app: FastifyInstance, deps: AdminLinkControllerDeps): void {
  const opts = { preHandler: deps.authMiddleware };

  app.get('/v1/admin/links', opts, async (): Promise<LinkListResponseDto> => {
    const links = await deps.listAllLinks.execute();
    return [...presentLinks(links)];
  });

  app.get('/v1/admin/links/:id', opts, async (req): Promise<LinkResponseDto> => {
    const { id } = LinkIdParam.parse(req.params);
    const link = await deps.getLink.execute({ id });
    return presentLink(link);
  });

  app.post('/v1/admin/links', opts, async (req, reply) => {
    const body = CreateLinkBody.parse(req.body);
    const link = await deps.createLink.execute({
      title: body.title,
      url: body.url,
      description: body.description ?? null,
      iconUrl: body.iconUrl,
      category: body.category,
      displayOrder: body.displayOrder,
    });
    return reply.status(201).send(presentLink(link));
  });

  app.put('/v1/admin/links/:id', opts, async (req): Promise<LinkResponseDto> => {
    const { id } = LinkIdParam.parse(req.params);
    const body = UpdateLinkBody.parse(req.body);
    const link = await deps.updateLink.execute({
      id,
      title: body.title,
      url: body.url,
      description: body.description,
      iconUrl: body.iconUrl,
      category: body.category,
      displayOrder: body.displayOrder,
      isActive: body.isActive,
    });
    return presentLink(link);
  });

  app.delete('/v1/admin/links/:id', opts, async (req, reply) => {
    const { id } = LinkIdParam.parse(req.params);
    await deps.deleteLink.execute({ id });
    return reply.status(204).send();
  });
}
