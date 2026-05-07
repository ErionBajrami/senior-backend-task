import type { Link } from '../../domain/entities/link.js';
import type { LinkRepository } from '../../domain/repositories/link.repository.js';

export class ListAllLinks {
  constructor(private readonly linkRepo: LinkRepository) {}

  async execute(): Promise<readonly Link[]> {
    return this.linkRepo.findAll();
  }
}
