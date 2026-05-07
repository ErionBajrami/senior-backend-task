import type { Collection, Db } from 'mongodb';
import type { Admin } from '../../../domain/entities/admin.js';
import type { AdminRepository } from '../../../domain/repositories/admin.repository.js';
import type { AdminId } from '../../../domain/value-objects/admin-id.js';
import type { Username } from '../../../domain/value-objects/username.js';
import { adminToDoc, docToAdmin, type AdminDoc } from './admin.mongo-mapper.js';

export const ADMINS_COLLECTION = 'admins';

export class MongoAdminRepository implements AdminRepository {
  private readonly collection: Collection<AdminDoc>;

  constructor(db: Db) {
    this.collection = db.collection<AdminDoc>(ADMINS_COLLECTION);
  }

  async findById(id: AdminId): Promise<Admin | null> {
    const doc = await this.collection.findOne({ _id: id.value });
    return doc ? docToAdmin(doc) : null;
  }

  async findByUsername(username: Username): Promise<Admin | null> {
    const doc = await this.collection.findOne({ username: username.value });
    return doc ? docToAdmin(doc) : null;
  }

  async save(admin: Admin): Promise<void> {
    const doc = adminToDoc(admin);
    await this.collection.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }
}
