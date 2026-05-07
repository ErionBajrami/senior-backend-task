import type { Collection, Db } from 'mongodb';
import type { Link } from '../../../domain/entities/link.js';
import type { LinkRepository } from '../../../domain/repositories/link.repository.js';
import type { LinkId } from '../../../domain/value-objects/link-id.js';
import { docToLink, linkToDoc, type LinkDoc } from './link.mongo-mapper.js';

export const LINKS_COLLECTION = 'links';

const DISPLAY_SORT = { displayOrder: 1, createdAt: 1, _id: 1 } as const;

export class MongoLinkRepository implements LinkRepository {
  private readonly collection: Collection<LinkDoc>;

  constructor(db: Db) {
    this.collection = db.collection<LinkDoc>(LINKS_COLLECTION);
  }

  async findAll(): Promise<readonly Link[]> {
    const docs = await this.collection.find().sort(DISPLAY_SORT).toArray();
    return docs.map(docToLink);
  }

  async findAllActive(): Promise<readonly Link[]> {
    const docs = await this.collection.find({ isActive: true }).sort(DISPLAY_SORT).toArray();
    return docs.map(docToLink);
  }

  async findById(id: LinkId): Promise<Link | null> {
    const doc = await this.collection.findOne({ _id: id.value });
    return doc ? docToLink(doc) : null;
  }

  async findActiveById(id: LinkId): Promise<Link | null> {
    const doc = await this.collection.findOne({ _id: id.value, isActive: true });
    return doc ? docToLink(doc) : null;
  }

  async save(link: Link): Promise<void> {
    const doc = linkToDoc(link);
    await this.collection.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }

  async incrementClickCount(id: LinkId): Promise<void> {
    await this.collection.updateOne(
      { _id: id.value },
      {
        $inc: { clickCount: 1 },
        $currentDate: { updatedAt: true },
      },
    );
  }
}
