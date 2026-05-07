import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class AdminId {
  private constructor(public readonly value: string) {}

  static generate(): AdminId {
    return new AdminId(uuidv4());
  }

  static fromString(raw: string): AdminId {
    if (!uuidValidate(raw)) {
      throw new Error(`Invalid AdminId UUID: ${raw}`);
    }
    return new AdminId(raw);
  }

  equals(other: AdminId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
