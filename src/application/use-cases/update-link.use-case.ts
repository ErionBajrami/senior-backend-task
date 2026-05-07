import type { Link } from '../../domain/entities/link.js';
import type { LinkRepository } from '../../domain/repositories/link.repository.js';
import { LinkId } from '../../domain/value-objects/link-id.js';
import { LinkTitle } from '../../domain/value-objects/link-title.js';
import { Url } from '../../domain/value-objects/url.js';
import { LinkDescription } from '../../domain/value-objects/link-description.js';
import { LinkCategory } from '../../domain/value-objects/link-category.js';
import { LinkNotFoundError } from '../../domain/errors/link-not-found.error.js';
import type { Clock } from '../ports/out/clock.port.js';

export interface UpdateLinkInput {
  id: string;

  title?: string | undefined;
  url?: string | undefined;
  description?: string | null | undefined;
  iconUrl?: string | null | undefined;
  category?: string | null | undefined;
  displayOrder?: number | undefined;
  isActive?: boolean | undefined;
}

export class UpdateLink {
  constructor(
    private readonly linkRepo: LinkRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateLinkInput): Promise<Link> {
    const id = LinkId.fromString(input.id);
    const link = await this.linkRepo.findById(id);
    if (!link) {
      throw new LinkNotFoundError(input.id);
    }

    const now = this.clock.now();

    if (input.title !== undefined) {
      link.rename(LinkTitle.create(input.title), now);
    }
    if (input.url !== undefined) {
      link.changeUrl(Url.create(input.url), now);
    }
    if (input.description !== undefined) {
      link.editDescription(
        input.description === null ? null : LinkDescription.create(input.description),
        now,
      );
    }
    if (input.iconUrl !== undefined) {
      link.changeIcon(input.iconUrl === null ? null : Url.create(input.iconUrl), now);
    }
    if (input.category !== undefined) {
      link.recategorize(input.category === null ? null : LinkCategory.create(input.category), now);
    }
    if (input.displayOrder !== undefined) {
      link.reorder(input.displayOrder, now);
    }
    if (input.isActive !== undefined) {
      if (input.isActive) {
        link.activate(now);
      } else {
        link.deactivate(now);
      }
    }

    await this.linkRepo.save(link);
    return link;
  }
}
