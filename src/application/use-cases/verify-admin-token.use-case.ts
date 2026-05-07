import type { Admin } from '../../domain/entities/admin.js';
import type { AdminRepository } from '../../domain/repositories/admin.repository.js';
import type { TokenVerifier } from '../ports/out/token-verifier.port.js';

export interface VerifyAdminTokenInput {
  token: string;
}

export class VerifyAdminToken {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly tokenVerifier: TokenVerifier,
  ) {}

  async execute(input: VerifyAdminTokenInput): Promise<Admin | null> {
    const adminId = await this.tokenVerifier.verify(input.token);
    if (!adminId) {
      return null;
    }
    return this.adminRepo.findById(adminId);
  }
}
