import { beforeEach, describe, expect, it } from 'vitest';
import { JwtTokenSigner } from '../../../src/infrastructure/adapters/jwt-token-signer.adapter.js';
import { JwtTokenVerifier } from '../../../src/infrastructure/adapters/jwt-token-verifier.adapter.js';
import { AdminId } from '../../../src/domain/value-objects/admin-id.js';
import type { Clock } from '../../../src/application/ports/out/clock.port.js';
import type { Logger } from 'pino';

class FixedClock implements Clock {
  constructor(private current: Date) {}
  now(): Date {
    return new Date(this.current);
  }
}

describe('JwtTokenSigner + JwtTokenVerifier (integration)', () => {
  const SECRET = 'super-secret-key-at-least-32-chars-long';
  const ISSUER = 'quanos';
  const AUDIENCE = 'quanos-admin';

  let T0: Date;
  let signer: JwtTokenSigner;
  let verifier: JwtTokenVerifier;

  beforeEach(() => {
    T0 = new Date();
    signer = new JwtTokenSigner(
      { secret: SECRET, ttlSeconds: 3600, issuer: ISSUER, audience: AUDIENCE },
      new FixedClock(T0),
    );
    verifier = new JwtTokenVerifier({ secret: SECRET, issuer: ISSUER, audience: AUDIENCE });
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
    const wrong = new JwtTokenVerifier({ secret: 'different-secret', issuer: ISSUER, audience: AUDIENCE });
    expect(await wrong.verify(token)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const pastClock = new FixedClock(new Date(Date.now() - 1_000_000));
    const pastSigner = new JwtTokenSigner(
      { secret: SECRET, ttlSeconds: 1, issuer: ISSUER, audience: AUDIENCE },
      pastClock,
    );
    const { token } = await pastSigner.sign(AdminId.generate());
    expect(await verifier.verify(token)).toBeNull();
  });

  it('rejects a token issued for a different audience', async () => {
    const { token } = await signer.sign(AdminId.generate());
    const wrongAudience = new JwtTokenVerifier({
      secret: SECRET,
      issuer: ISSUER,
      audience: 'some-other-audience',
    });
    expect(await wrongAudience.verify(token)).toBeNull();
  });

  it('emits a warn with reason="expired" when given an expired token (when logger is provided)', async () => {
    const calls: { obj: unknown; msg: string }[] = [];
    const fakeLogger = {
      warn: (obj: unknown, msg: string) => {
        calls.push({ obj, msg });
      },
    } as unknown as Logger;

    const verifierWithLog = new JwtTokenVerifier({
      secret: SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
      logger: fakeLogger,
    });

    const pastClock = new FixedClock(new Date(Date.now() - 1_000_000));
    const pastSigner = new JwtTokenSigner(
      { secret: SECRET, ttlSeconds: 1, issuer: ISSUER, audience: AUDIENCE },
      pastClock,
    );
    const { token } = await pastSigner.sign(AdminId.generate());

    expect(await verifierWithLog.verify(token)).toBeNull();
    expect(calls).toHaveLength(1);
    expect(calls[0]?.obj).toMatchObject({ reason: 'expired' });
  });
});
