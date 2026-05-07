import type { AdminId } from '../../../domain/value-objects/admin-id.js';

export interface TokenVerifier {
  verify(token: string): Promise<AdminId | null>;
}
