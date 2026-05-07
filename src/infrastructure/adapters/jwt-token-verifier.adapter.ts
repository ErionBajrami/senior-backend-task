import jwt from 'jsonwebtoken';
import type { Logger } from 'pino';
import { AdminId } from '../../domain/value-objects/admin-id.js';
import type { TokenVerifier } from '../../application/ports/out/token-verifier.port.js';

export interface JwtVerifierConfig {
  secret: string;
  issuer: string;
  audience: string;
  logger?: Logger;
}

export class JwtTokenVerifier implements TokenVerifier {
  constructor(private readonly config: JwtVerifierConfig) {}

  verify(token: string): Promise<AdminId | null> {
    try {
      const payload = jwt.verify(token, this.config.secret, {
        algorithms: ['HS256'],
        issuer: this.config.issuer,
        audience: this.config.audience,
      });
      if (typeof payload !== 'object') {
        this.config.logger?.warn({ reason: 'malformed_payload' }, 'jwt verify failed');
        return Promise.resolve(null);
      }
      const sub = payload.sub;
      if (typeof sub !== 'string') {
        this.config.logger?.warn({ reason: 'missing_sub' }, 'jwt verify failed');
        return Promise.resolve(null);
      }
      return Promise.resolve(AdminId.fromString(sub));
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        this.config.logger?.warn({ reason: 'expired' }, 'jwt verify failed');
        return Promise.resolve(null);
      }
      if (err instanceof jwt.NotBeforeError) {
        this.config.logger?.warn({ reason: 'not_before' }, 'jwt verify failed');
        return Promise.resolve(null);
      }
      if (err instanceof jwt.JsonWebTokenError) {
        this.config.logger?.warn({ reason: 'invalid', message: err.message }, 'jwt verify failed');
        return Promise.resolve(null);
      }
      throw err;
    }
  }
}
