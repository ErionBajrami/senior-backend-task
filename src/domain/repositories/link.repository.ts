import type { Link } from '../entities/link.js';
import type { LinkId } from '../value-objects/link-id.js';
import type { Repository } from './repository.js';

export interface LinkRepository extends Repository<Link, LinkId> {
  findAll(): Promise<readonly Link[]>;
  findAllActive(): Promise<readonly Link[]>;
  findActiveById(id: LinkId): Promise<Link | null>;
  incrementClickCount(id: LinkId): Promise<void>;
}
