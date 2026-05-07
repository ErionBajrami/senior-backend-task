import { InvalidDescriptionError } from '../errors/invalid-description.error.js';


export class LinkDescription {
  private static readonly MAX_LENGTH = 2000;

  private constructor(public readonly value: string) {}

  static create(raw: string): LinkDescription {
    if (typeof raw !== 'string') {
      throw new InvalidDescriptionError('Description must be a string');
    }
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new InvalidDescriptionError('Description must not be empty when provided; pass null to omit');
    }
    if (trimmed.length > LinkDescription.MAX_LENGTH) {
      throw new InvalidDescriptionError(
        `Description must not exceed ${LinkDescription.MAX_LENGTH} chars (got ${trimmed.length})`,
      );
    }
    return new LinkDescription(trimmed);
  }

  equals(other: LinkDescription): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
