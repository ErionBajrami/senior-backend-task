import type { Admin } from '../entities/admin.js';
import type { AdminId } from '../value-objects/admin-id.js';
import type { Username } from '../value-objects/username.js';
import type { Repository } from './repository.js';


export interface AdminRepository extends Repository<Admin, AdminId> {
  findByUsername(username: Username): Promise<Admin | null>;
}
