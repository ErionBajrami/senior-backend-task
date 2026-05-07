import { Admin } from '../../../domain/entities/admin.js';
import { AdminId } from '../../../domain/value-objects/admin-id.js';
import { Username } from '../../../domain/value-objects/username.js';
import { PasswordHash } from '../../../domain/value-objects/password-hash.js';

export interface AdminDoc {
  _id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

export function adminToDoc(admin: Admin): AdminDoc {
  return {
    _id: admin.id.value,
    username: admin.username.value,
    passwordHash: admin.passwordHash.reveal(),
    createdAt: admin.createdAt,
  };
}

export function docToAdmin(doc: AdminDoc): Admin {
  return Admin.restore({
    id: AdminId.fromString(doc._id),
    username: Username.create(doc.username),
    passwordHash: PasswordHash.fromHash(doc.passwordHash),
    createdAt: doc.createdAt,
  });
}
