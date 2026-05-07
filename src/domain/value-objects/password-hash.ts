export class PasswordHash {
  private static readonly REDACTED = '<password-hash:redacted>';

  private constructor(private readonly hash: string) {}

  static fromHash(hash: string): PasswordHash {
    if (typeof hash !== 'string' || hash.length === 0) {
      throw new Error('PasswordHash requires a non-empty string');
    }
    return new PasswordHash(hash);
  }

  reveal(): string {
    return this.hash;
  }

  toString(): string {
    return PasswordHash.REDACTED;
  }

  toJSON(): string {
    return PasswordHash.REDACTED;
  }

  equals(other: PasswordHash): boolean {
    return this.hash === other.hash;
  }
}
