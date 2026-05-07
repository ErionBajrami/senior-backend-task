import { InvalidCategoryError } from '../errors/invalid-category.error.js';

export class LinkCategory {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 50;

  private constructor(public readonly value: string) {}

  static create(raw: string): LinkCategory {
    if (typeof raw !== 'string') {
      throw new InvalidCategoryError('Category must be a string');
    }
    const trimmed = raw.trim();
    if (trimmed.length < LinkCategory.MIN_LENGTH) {
      throw new InvalidCategoryError('Category must not be empty when provided; pass null to omit');
    }
    if (trimmed.length > LinkCategory.MAX_LENGTH) {
      throw new InvalidCategoryError(
        `Category must not exceed ${LinkCategory.MAX_LENGTH} chars (got ${trimmed.length})`,
      );
    }
    return new LinkCategory(trimmed);
  }

  equals(other: LinkCategory): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
