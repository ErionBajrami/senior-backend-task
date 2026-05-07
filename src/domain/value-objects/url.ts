import { InvalidUrlError } from '../errors/invalid-url.error.js';

export class Url {
  private static readonly MAX_LENGTH = 2048;

  private constructor(public readonly value: string) {}

  static create(raw: string): Url {
    if (typeof raw !== 'string') {
      throw new InvalidUrlError('URL must be a string');
    }
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new InvalidUrlError('URL must not be empty');
    }
    if (trimmed.length > Url.MAX_LENGTH) {
      throw new InvalidUrlError(`URL must not exceed ${Url.MAX_LENGTH} chars (got ${trimmed.length})`);
    }
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new InvalidUrlError(`Not a valid URL: ${trimmed}`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new InvalidUrlError(`URL must use http(s) (got ${parsed.protocol})`);
    }
    return new Url(trimmed);
  }

  equals(other: Url): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
