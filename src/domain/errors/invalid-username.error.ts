import { DomainError } from './domain-error.js';

export class InvalidUsernameError extends DomainError {
  readonly code = 'INVALID_USERNAME';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidUsernameError';
  }
}
