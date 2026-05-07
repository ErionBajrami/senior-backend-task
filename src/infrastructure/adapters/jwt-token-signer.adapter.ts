import jwt from 'jsonwebtoken';
import type { AdminId } from '../../domain/value-objects/admin-id.js';
import type { Clock } from '../../application/ports/out/clock.port.js';
import type { SignedToken, TokenSigner } from '../../application/ports/out/token-signer.port.js';

export interface JwtSignerConfig {
  secret: string;
  ttlSeconds: number;
  issuer: string;
  audience: string;
}

export class JwtTokenSigner implements TokenSigner {
  constructor(
    private readonly config: JwtSignerConfig,
    private readonly clock: Clock,
  ) {}

  sign(adminId: AdminId): Promise<SignedToken> {
    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + this.config.ttlSeconds * 1000);
    const token = jwt.sign(
      {
        sub: adminId.value,
        iat: Math.floor(now.getTime() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000),
        iss: this.config.issuer,
        aud: this.config.audience,
      },
      this.config.secret,
      { algorithm: 'HS256' },
    );
    return Promise.resolve({ token, expiresAt });
  }
}
