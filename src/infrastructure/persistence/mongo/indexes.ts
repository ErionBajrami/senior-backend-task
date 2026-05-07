import type { Db } from 'mongodb';
import { LINKS_COLLECTION } from './link.mongo-repository.js';
import { ADMINS_COLLECTION } from './admin.mongo-repository.js';


export async function ensureIndexes(db: Db): Promise<void> {
  await db.collection(LINKS_COLLECTION).createIndex({ isActive: 1 }, { name: 'links_isActive' });
  await db
    .collection(ADMINS_COLLECTION)
    .createIndex({ username: 1 }, { unique: true, name: 'admins_username_unique' });
}
