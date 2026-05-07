import type { AdminId } from '../value-objects/admin-id.js';
import type { Username } from '../value-objects/username.js';
import type { PasswordHash } from '../value-objects/password-hash.js';

export interface AdminProps {
  id: AdminId;
  username: Username;
  passwordHash: PasswordHash;
  createdAt: Date;
}

export interface AdminCreationInput {
  id: AdminId;
  username: Username;
  passwordHash: PasswordHash;
  now: Date;
}

export class Admin {
  private constructor(private readonly props: AdminProps) {}

  static create(input: AdminCreationInput): Admin {
    return new Admin({
      id: input.id,
      username: input.username,
      passwordHash: input.passwordHash,
      createdAt: input.now,
    });
  }

  static restore(props: AdminProps): Admin {
    return new Admin({ ...props });
  }

  get id(): AdminId {
    return this.props.id;
  }

  get username(): Username {
    return this.props.username;
  }

  get passwordHash(): PasswordHash {
    return this.props.passwordHash;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  changePassword(newHash: PasswordHash): void {
    this.props.passwordHash = newHash;
  }
}
