import { beforeEach, describe, expect, it } from 'vitest';
import { JwtTokenSigner } from '../../../src/infrastructure/adapters/jwt-token-signer.adapter.js';
import { JwtTokenVerifier } from '../../../src/infrastructure/adapters/jwt-token-verifier.adapter.js';
import { AdminId } from '../../../src/domain/value-objects/admin-id.js';
import type { Clock } from '../../../src/application/ports/out/clock.port.js';

class FixedClock implements Clock {
  constructor(private current: Date) {}
  now(): Date {
    return new Date(this.current);
  }
}

describe('JwtTokenSigner + JwtTokenVerifier (integration)', () => {
  const SECRET = 'super-secret-key-at-least-32-chars-long';
  const ISSUER = 'quanos';

  let T0: Date;
  let signer: JwtTokenSigner;
  let verifier: JwtTokenVerifier;

  beforeEach(() => {
    T0 = new Date();
    signer = new JwtTokenSigner({ secret: SECRET, ttlSeconds: 3600, issuer: ISSUER }, new FixedClock(T0));
    verifier = new JwtTokenVerifier({ secret: SECRET, issuer: ISSUER });
  });

  it('signs a token the verifier accepts and recovers the AdminId', async () => {
    const adminId = AdminId.generate();
    const { token, expiresAt } = await signer.sign(adminId);

    expect(token.split('.')).toHaveLength(3);
    expect(expiresAt.getTime()).toBe(T0.getTime() + 3_600_000);

    const recovered = await verifier.verify(token);
    expect(recovered?.equals(adminId)).toBe(true);
  });

  it('rejects a token signed with a different secret (forgery)', async () => {
    const { token } = await signer.sign(AdminId.generate());
    const wrong = new JwtTokenVerifier({ secret: 'different-secret', issuer: ISSUER });
    expect(await wrong.verify(token)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const pastClock = new FixedClock(new Date(Date.now() - 1_000_000));
    const pastSigner = new JwtTokenSigner({ secret: SECRET, ttlSeconds: 1, issuer: ISSUER }, pastClock);
    const { token } = await pastSigner.sign(AdminId.generate());
    expect(await verifier.verify(token)).toBeNull();
  });
});
