import type { Link } from '../../domain/entities/link.js';
import type { LinkRepository, ListOptions } from '../../domain/repositories/link.repository.js';

export interface ListLinksOutput {
  items: readonly Link[];
  total: number;
}

export class ListAllLinks {
  constructor(private readonly linkRepo: LinkRepository) {}

  async execute(opts?: ListOptions): Promise<ListLinksOutput> {
    if (opts?.limit !== undefined || opts?.offset !== undefined) {
      const [items, total] = await Promise.all([this.linkRepo.findAll(opts), this.linkRepo.countAll()]);
      return { items, total };
    }
    const items = await this.linkRepo.findAll();
    return { items, total: items.length };
  }
}
