import { DomainError } from './domain-error.js';

export class InvalidTitleError extends DomainError {
  readonly code = 'INVALID_TITLE';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidTitleError';
  }
}
