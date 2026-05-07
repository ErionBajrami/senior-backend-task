import type { Link } from '../../domain/entities/link.js';
import type { LinkRepository } from '../../domain/repositories/link.repository.js';
import { LinkId } from '../../domain/value-objects/link-id.js';
import { LinkNotFoundError } from '../../domain/errors/link-not-found.error.js';

export interface GetLinkInput {
  id: string;
}

export class GetLink {
  constructor(private readonly linkRepo: LinkRepository) {}

  async execute(input: GetLinkInput): Promise<Link> {
    const id = LinkId.fromString(input.id);
    const link = await this.linkRepo.findById(id);
    if (!link) {
      throw new LinkNotFoundError(input.id);
    }
    return link;
  }
}
