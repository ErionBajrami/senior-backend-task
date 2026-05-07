import type { AdminRepository } from '../../domain/repositories/admin.repository.js';
import { Username } from '../../domain/value-objects/username.js';
import type { PasswordHash } from '../../domain/value-objects/password-hash.js';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error.js';
import { InvalidUsernameError } from '../../domain/errors/invalid-username.error.js';
import type { PasswordHasher } from '../ports/out/password-hasher.port.js';
import type { SignedToken, TokenSigner } from '../ports/out/token-signer.port.js';

export interface AuthenticateAdminInput {
  username: string;
  password: string;
}

export class AuthenticateAdmin {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenSigner: TokenSigner,
    private readonly dummyPasswordHash: PasswordHash,
  ) {}

  async execute(input: AuthenticateAdminInput): Promise<SignedToken> {
    let username: Username;
    try {
      username = Username.create(input.username);
    } catch (err) {
      if (err instanceof InvalidUsernameError) {
        throw new InvalidCredentialsError();
      }
      throw err;
    }

    const admin = await this.adminRepo.findByUsername(username);

    if (!admin) {
      await this.passwordHasher.verify(input.password, this.dummyPasswordHash);
      throw new InvalidCredentialsError();
    }

    const isValid = await this.passwordHasher.verify(input.password, admin.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    return this.tokenSigner.sign(admin.id);
  }
}
