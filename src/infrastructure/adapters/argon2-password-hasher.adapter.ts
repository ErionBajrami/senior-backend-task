import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { PasswordHash } from '../../domain/value-objects/password-hash.js';
import type { PasswordHasher } from '../../application/ports/out/password-hasher.port.js';

export class Argon2PasswordHasher implements PasswordHasher {
  private static readonly OPTIONS = {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  } as const;

  async hash(plain: string): Promise<PasswordHash> {
    const encoded = await argonHash(plain, Argon2PasswordHasher.OPTIONS);
    return PasswordHash.fromHash(encoded);
  }

  async verify(plain: string, hash: PasswordHash): Promise<boolean> {
    try {
      return await argonVerify(hash.reveal(), plain);
    } catch {
      return false;
    }
  }
}
