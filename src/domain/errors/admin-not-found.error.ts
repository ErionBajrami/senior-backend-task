import { DomainError } from './domain-error.js';

export class AdminNotFoundError extends DomainError {
  readonly code = 'ADMIN_NOT_FOUND';

  constructor(identifier: string) {
    super(`Admin not found: ${identifier}`);
    this.name = 'AdminNotFoundError';
  }
}
