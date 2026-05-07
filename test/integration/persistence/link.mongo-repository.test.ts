import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { MongoClient, type Db } from 'mongodb';
import {
  LINKS_COLLECTION,
  MongoLinkRepository,
} from '../../../src/infrastructure/persistence/mongo/link.mongo-repository.js';
import { ensureIndexes } from '../../../src/infrastructure/persistence/mongo/indexes.js';
import { Link } from '../../../src/domain/entities/link.js';
import { LinkId } from '../../../src/domain/value-objects/link-id.js';
import { LinkTitle } from '../../../src/domain/value-objects/link-title.js';
import { Url } from '../../../src/domain/value-objects/url.js';
import { LinkDescription } from '../../../src/domain/value-objects/link-description.js';

describe('MongoLinkRepository (integration)', () => {
  const T0 = new Date('2026-05-06T10:00:00.000Z');
  let container: StartedTestContainer;
  let client: MongoClient;
  let db: Db;
  let repo: MongoLinkRepository;

  beforeAll(async () => {
    container = await new GenericContainer('mongo:7').withExposedPorts(27017).start();
    const uri = `mongodb://${container.getHost()}:${container.getMappedPort(27017).toString()}`;
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('quanos_test');
    repo = new MongoLinkRepository(db);
    await ensureIndexes(db);
  }, 90_000);

  afterAll(async () => {
    await client.close();
    await container.stop();
  });

  beforeEach(async () => {
    await db.collection(LINKS_COLLECTION).deleteMany({});
  });

  function makeLink(
    opts: {
      title?: string;
      url?: string;
      description?: string | null;
      isActive?: boolean;
    } = {},
  ): Link {
    const link = Link.create({
      id: LinkId.generate(),
      title: LinkTitle.create(opts.title ?? 'Title'),
      url: Url.create(opts.url ?? 'https://example.com'),
      description:
        opts.description === undefined || opts.description === null
          ? null
          : LinkDescription.create(opts.description),
      now: T0,
    });
    if (opts.isActive === false) {
      link.deactivate(T0);
    }
    return link;
  }

  it('saves and retrieves a link by id, preserving all fields', async () => {
    const link = makeLink({
      title: 'Anthropic',
      url: 'https://anthropic.com',
      description: 'AI safety company',
    });
    await repo.save(link);

    const found = await repo.findById(link.id);
    expect(found?.title.value).toBe('Anthropic');
    expect(found?.url.value).toBe('https://anthropic.com');
    expect(found?.description?.value).toBe('AI safety company');
    expect(found?.isActive).toBe(true);
    expect(found?.clickCount).toBe(0);
  });

  it('findActiveById excludes deactivated links while findById still returns them', async () => {
    const link = makeLink({ isActive: false });
    await repo.save(link);

    expect(await repo.findActiveById(link.id)).toBeNull();
    expect(await repo.findById(link.id)).not.toBeNull();
  });

  it('survives concurrent click increments without losing any (atomicity)', async () => {
    const link = makeLink();
    await repo.save(link);

    await Promise.all(Array.from({ length: 25 }, () => repo.incrementClickCount(link.id)));

    const found = await repo.findById(link.id);
    expect(found?.clickCount).toBe(25);
  });
});
