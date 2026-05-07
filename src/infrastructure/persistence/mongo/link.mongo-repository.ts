import type { Collection, Db, Filter } from 'mongodb';
import type { Link } from '../../../domain/entities/link.js';
import type { LinkRepository, ListOptions } from '../../../domain/repositories/link.repository.js';
import type { LinkId } from '../../../domain/value-objects/link-id.js';
import { docToLink, linkToDoc, type LinkDoc } from './link.mongo-mapper.js';

export const LINKS_COLLECTION = 'links';

const DISPLAY_SORT = { displayOrder: 1, createdAt: 1, _id: 1 } as const;

export class MongoLinkRepository implements LinkRepository {
  private readonly collection: Collection<LinkDoc>;

  constructor(db: Db) {
    this.collection = db.collection<LinkDoc>(LINKS_COLLECTION);
  }

  async findAll(opts?: ListOptions): Promise<readonly Link[]> {
    return this.findWithOptions({}, opts);
  }

  async findAllActive(opts?: ListOptions): Promise<readonly Link[]> {
    return this.findWithOptions({ isActive: true }, opts);
  }

  private async findWithOptions(filter: Filter<LinkDoc>, opts?: ListOptions): Promise<readonly Link[]> {
    let cursor = this.collection.find(filter).sort(DISPLAY_SORT);
    if (opts?.offset !== undefined) {
      cursor = cursor.skip(opts.offset);
    }
    if (opts?.limit !== undefined) {
      cursor = cursor.limit(opts.limit);
    }
    const docs = await cursor.toArray();
    return docs.map(docToLink);
  }

  async countAll(): Promise<number> {
    return this.collection.countDocuments({});
  }

  async countAllActive(): Promise<number> {
    return this.collection.countDocuments({ isActive: true });
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
      { _id: id.value, isActive: true },
      {
        $inc: { clickCount: 1 },
        $currentDate: { updatedAt: true },
      },
    );
  }
}
