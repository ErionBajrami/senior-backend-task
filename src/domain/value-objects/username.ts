import { InvalidUsernameError } from '../errors/invalid-username.error.js';

export class Username {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 50;
  private static readonly PATTERN = /^[a-z0-9._-]+$/;

  private constructor(public readonly value: string) {}

  static create(raw: string): Username {
    if (typeof raw !== 'string') {
      throw new InvalidUsernameError('Username must be a string');
    }
    const normalized = raw.trim().toLowerCase();
    if (normalized.length < Username.MIN_LENGTH || normalized.length > Username.MAX_LENGTH) {
      throw new InvalidUsernameError(
        `Username length must be ${Username.MIN_LENGTH}..${Username.MAX_LENGTH} (got ${normalized.length})`,
      );
    }
    if (!Username.PATTERN.test(normalized)) {
      throw new InvalidUsernameError(`Username must match ${Username.PATTERN.source}`);
    }
    return new Username(normalized);
  }

  equals(other: Username): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
