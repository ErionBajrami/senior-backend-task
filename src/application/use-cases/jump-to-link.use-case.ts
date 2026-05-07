import type { LinkRepository } from '../../domain/repositories/link.repository.js';
import { LinkId } from '../../domain/value-objects/link-id.js';
import { LinkNotFoundError } from '../../domain/errors/link-not-found.error.js';

export interface JumpToLinkInput {
  id: string;
}

export interface JumpToLinkOutput {
  url: string;
  title: string;
}

export class JumpToLink {
  constructor(private readonly linkRepo: LinkRepository) {}

  async execute(input: JumpToLinkInput): Promise<JumpToLinkOutput> {
    const id = LinkId.fromString(input.id);
    const link = await this.linkRepo.findActiveById(id);
    if (!link) {
      throw new LinkNotFoundError(input.id);
    }
    await this.linkRepo.incrementClickCount(id);
    return { url: link.url.value, title: link.title.value };
  }
}
