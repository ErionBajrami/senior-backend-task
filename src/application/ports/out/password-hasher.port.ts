import type { PasswordHash } from '../../../domain/value-objects/password-hash.js';

// uses argon2id
export interface PasswordHasher {
  hash(plain: string): Promise<PasswordHash>;
  verify(plain: string, hash: PasswordHash): Promise<boolean>;
}
