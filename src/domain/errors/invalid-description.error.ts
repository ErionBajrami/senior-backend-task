import { DomainError } from './domain-error.js';

export class InvalidDescriptionError extends DomainError {
  readonly code = 'INVALID_DESCRIPTION';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidDescriptionError';
  }
}
