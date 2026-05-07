import type { Link } from '../../domain/entities/link.js';
import type { LinkRepository, ListOptions } from '../../domain/repositories/link.repository.js';

export interface ListLinksOutput {
  items: readonly Link[];
  total: number;
}

export class ListActiveLinks {
  constructor(private readonly linkRepo: LinkRepository) {}

  async execute(opts?: ListOptions): Promise<ListLinksOutput> {
    if (opts?.limit !== undefined || opts?.offset !== undefined) {
      const [items, total] = await Promise.all([
        this.linkRepo.findAllActive(opts),
        this.linkRepo.countAllActive(),
      ]);
      return { items, total };
    }
    const items = await this.linkRepo.findAllActive();
    return { items, total: items.length };
  }
}
