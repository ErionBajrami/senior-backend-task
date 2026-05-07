import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class LinkId {
  private constructor(public readonly value: string) {}

  static generate(): LinkId {
    return new LinkId(uuidv4());
  }

  static fromString(raw: string): LinkId {
    if (!uuidValidate(raw)) {
      throw new Error(`Invalid LinkId UUID: ${raw}`);
    }
    return new LinkId(raw);
  }

  equals(other: LinkId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
