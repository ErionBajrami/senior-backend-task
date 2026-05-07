import { DomainError } from './domain-error.js';

export class InvalidCategoryError extends DomainError {
  readonly code = 'INVALID_CATEGORY';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidCategoryError';
  }
}
