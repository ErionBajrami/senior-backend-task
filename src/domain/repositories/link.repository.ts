import type { Link } from '../entities/link.js';
import type { LinkId } from '../value-objects/link-id.js';
import type { Repository } from './repository.js';

export interface ListOptions {
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface LinkRepository extends Repository<Link, LinkId> {
  findAll(opts?: ListOptions): Promise<readonly Link[]>;
  findAllActive(opts?: ListOptions): Promise<readonly Link[]>;
  findActiveById(id: LinkId): Promise<Link | null>;
  countAll(): Promise<number>;
  countAllActive(): Promise<number>;
  incrementClickCount(id: LinkId): Promise<void>;
}
