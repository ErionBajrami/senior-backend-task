import type { LinkRepository } from '../../domain/repositories/link.repository.js';
import { LinkId } from '../../domain/value-objects/link-id.js';
import { LinkNotFoundError } from '../../domain/errors/link-not-found.error.js';
import type { Clock } from '../ports/out/clock.port.js';

export interface DeleteLinkInput {
  id: string;
}

export class DeleteLink {
  constructor(
    private readonly linkRepo: LinkRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: DeleteLinkInput): Promise<void> {
    const id = LinkId.fromString(input.id);
    const link = await this.linkRepo.findById(id);
    if (!link) {
      throw new LinkNotFoundError(input.id);
    }
    link.deactivate(this.clock.now());
    await this.linkRepo.save(link);
  }
}
