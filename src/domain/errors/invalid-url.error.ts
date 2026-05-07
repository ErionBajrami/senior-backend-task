import { DomainError } from './domain-error.js';

export class InvalidUrlError extends DomainError {
  readonly code = 'INVALID_URL';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidUrlError';
  }
}
