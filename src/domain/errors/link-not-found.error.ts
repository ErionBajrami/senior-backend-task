import { DomainError } from './domain-error.js';

export class LinkNotFoundError extends DomainError {
  readonly code = 'LINK_NOT_FOUND';

  constructor(linkId: string) {
    super(`Link not found: ${linkId}`);
    this.name = 'LinkNotFoundError';
  }
}
