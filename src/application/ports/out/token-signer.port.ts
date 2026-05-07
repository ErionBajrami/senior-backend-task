import type { AdminId } from '../../../domain/value-objects/admin-id.js';

export interface SignedToken {
  token: string;
  expiresAt: Date;
}

export interface TokenSigner {
  sign(adminId: AdminId): Promise<SignedToken>;
}
