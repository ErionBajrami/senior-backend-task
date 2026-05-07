import jwt from 'jsonwebtoken';
import { AdminId } from '../../domain/value-objects/admin-id.js';
import type { TokenVerifier } from '../../application/ports/out/token-verifier.port.js';

export interface JwtVerifierConfig {
  secret: string;
  issuer: string;
}

export class JwtTokenVerifier implements TokenVerifier {
  constructor(private readonly config: JwtVerifierConfig) {}

  verify(token: string): Promise<AdminId | null> {
    try {
      const payload = jwt.verify(token, this.config.secret, {
        algorithms: ['HS256'],
        issuer: this.config.issuer,
      });
      if (typeof payload !== 'object') {
        return Promise.resolve(null);
      }
      const sub = payload.sub;
      if (typeof sub !== 'string') {
        return Promise.resolve(null);
      }
      return Promise.resolve(AdminId.fromString(sub));
    } catch {
      return Promise.resolve(null);
    }
  }
}
