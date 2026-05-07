import { Link } from '../../domain/entities/link.js';
import type { LinkRepository } from '../../domain/repositories/link.repository.js';
import { LinkTitle } from '../../domain/value-objects/link-title.js';
import { Url } from '../../domain/value-objects/url.js';
import { LinkDescription } from '../../domain/value-objects/link-description.js';
import { LinkCategory } from '../../domain/value-objects/link-category.js';
import type { Clock } from '../ports/out/clock.port.js';
import type { IdGenerator } from '../ports/out/id-generator.port.js';

export interface CreateLinkInput {
  title: string;
  url: string;
  description: string | null;
  iconUrl?: string | null | undefined;
  category?: string | null | undefined;
  displayOrder?: number | undefined;
}

export class CreateLink {
  constructor(
    private readonly linkRepo: LinkRepository,
    private readonly idGen: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateLinkInput): Promise<Link> {
    const title = LinkTitle.create(input.title);
    const url = Url.create(input.url);
    const description = input.description === null ? null : LinkDescription.create(input.description);

    const iconUrlRaw = input.iconUrl ?? null;
    const iconUrl = iconUrlRaw === null ? null : Url.create(iconUrlRaw);

    const categoryRaw = input.category ?? null;
    const category = categoryRaw === null ? null : LinkCategory.create(categoryRaw);

    const displayOrder = input.displayOrder ?? 0;

    const link = Link.create({
      id: this.idGen.newLinkId(),
      title,
      url,
      description,
      iconUrl,
      category,
      displayOrder,
      now: this.clock.now(),
    });

    await this.linkRepo.save(link);
    return link;
  }
}
