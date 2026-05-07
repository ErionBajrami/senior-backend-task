import { DomainError } from './domain-error.js';

export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Invalid username or password');
    this.name = 'InvalidCredentialsError';
  }
}
