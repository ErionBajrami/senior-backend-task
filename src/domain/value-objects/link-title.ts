import { InvalidTitleError } from '../errors/invalid-title.error.js';

export class LinkTitle {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 200;

  private constructor(public readonly value: string) {}

  static create(raw: string): LinkTitle {
    if (typeof raw !== 'string') {
      throw new InvalidTitleError('Title must be a string');
    }
    const trimmed = raw.trim();
    if (trimmed.length < LinkTitle.MIN_LENGTH) {
      throw new InvalidTitleError('Title must not be empty');
    }
    if (trimmed.length > LinkTitle.MAX_LENGTH) {
      throw new InvalidTitleError(
        `Title must not exceed ${LinkTitle.MAX_LENGTH} chars (got ${trimmed.length})`,
      );
    }
    return new LinkTitle(trimmed);
  }

  equals(other: LinkTitle): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
