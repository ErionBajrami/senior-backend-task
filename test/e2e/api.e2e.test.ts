import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Db } from 'mongodb';
import { buildTestApp, clearLinks, TEST_CREDENTIALS } from './helpers/build-test-app.js';

describe('Quanos E2E', () => {
  let app: FastifyInstance;
  let db: Db;
  let teardown: () => Promise<void>;
  let token: string;

  beforeAll(async () => {
    const built = await buildTestApp();
    app = built.app;
    db = built.db;
    teardown = built.shutdown;

    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: TEST_CREDENTIALS,
    });
    expect(loginRes.statusCode).toBe(200);
    token = loginRes.json<{ token: string }>().token;
  }, 90_000);

  afterAll(async () => {
    await teardown();
  });

  beforeEach(async () => {
    await clearLinks(db);
  });

  function authHeader(): { authorization: string } {
    return { authorization: `Bearer ${token}` };
  }

  describe('public read', () => {
    it('GET /v1/links is empty initially', async () => {
      const res = await app.inject({ method: 'GET', url: '/v1/links' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });

    it('GET /v1/links/:id returns 404 for missing id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/links/00000000-0000-4000-8000-000000000000',
      });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toMatchObject({ code: 'LINK_NOT_FOUND' });
    });

    it('GET /v1/links/:id with malformed UUID returns 422', async () => {
      const res = await app.inject({ method: 'GET', url: '/v1/links/not-a-uuid' });
      expect(res.statusCode).toBe(422);
      expect(res.json<{ code: string }>().code).toBe('VALIDATION_ERROR');
    });
  });

  describe('auth', () => {
    it('login with the right credentials returns a JWT', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: TEST_CREDENTIALS,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ token: string; expiresAt: string }>();
      expect(body.token.split('.')).toHaveLength(3);
      expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('login with wrong password returns 401 (no enumeration leak)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { username: TEST_CREDENTIALS.username, password: 'WRONG-PASSWORD-99' },
      });
      expect(res.statusCode).toBe(401);
      expect(res.json()).toEqual({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    });

    it('login with non-existent user returns 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { username: 'ghost', password: 'whatever-12345' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('admin endpoint without Authorization header returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/v1/admin/links' });
      expect(res.statusCode).toBe(401);
    });

    it('admin endpoint with garbage token returns 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/admin/links',
        headers: { authorization: 'Bearer not.a.real.jwt' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('admin CRUD', () => {
    it('POST creates and returns 201 + full link', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/links',
        headers: authHeader(),
        payload: {
          title: 'Anthropic',
          url: 'https://anthropic.com',
          description: 'AI safety company',
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json<{
        id: string;
        title: string;
        url: string;
        description: string | null;
        isActive: boolean;
        clickCount: number;
      }>();
      expect(body.title).toBe('Anthropic');
      expect(body.url).toBe('https://anthropic.com');
      expect(body.description).toBe('AI safety company');
      expect(body.isActive).toBe(true);
      expect(body.clickCount).toBe(0);
    });

    it('POST + GET round-trips iconUrl, category, displayOrder', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/v1/admin/links',
        headers: authHeader(),
        payload: {
          title: 'GitHub',
          url: 'https://github.com',
          iconUrl: 'https://cdn.example.com/github.png',
          category: 'CI/CD',
          displayOrder: 7,
        },
      });
      expect(create.statusCode).toBe(201);
      const body = create.json<{
        id: string;
        iconUrl: string | null;
        category: string | null;
        displayOrder: number;
      }>();
      expect(body.iconUrl).toBe('https://cdn.example.com/github.png');
      expect(body.category).toBe('CI/CD');
      expect(body.displayOrder).toBe(7);

      // Public list shows the same values
      const list = await app.inject({ method: 'GET', url: '/v1/links' });
      const arr = list.json<{ iconUrl: string | null; category: string | null; displayOrder: number }[]>();
      expect(arr[0]).toMatchObject({
        iconUrl: 'https://cdn.example.com/github.png',
        category: 'CI/CD',
        displayOrder: 7,
      });
    });

    it('public list is sorted by displayOrder ascending', async () => {
      const make = async (title: string, order: number): Promise<void> => {
        await app.inject({
          method: 'POST',
          url: '/v1/admin/links',
          headers: authHeader(),
          payload: { title, url: `https://${title.toLowerCase()}.com`, displayOrder: order },
        });
      };
      await make('Third', 30);
      await make('First', 10);
      await make('Second', 20);

      const list = await app.inject({ method: 'GET', url: '/v1/links' });
      const titles = list.json<{ title: string }[]>().map((l) => l.title);
      expect(titles).toEqual(['First', 'Second', 'Third']);
    });

    it('POST with invalid iconUrl returns 422', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/links',
        headers: authHeader(),
        payload: { title: 'X', url: 'https://x.com', iconUrl: 'not-a-url' },
      });
      expect(res.statusCode).toBe(422);
    });

    it('POST with too-long category returns 422', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/links',
        headers: authHeader(),
        payload: { title: 'X', url: 'https://x.com', category: 'a'.repeat(51) },
      });
      expect(res.statusCode).toBe(422);
    });

    it('PUT can change icon and category, and clear them via null', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/v1/admin/links',
        headers: authHeader(),
        payload: {
          title: 'X',
          url: 'https://x.com',
          iconUrl: 'https://cdn.example.com/old.png',
          category: 'Old',
        },
      });
      const id = create.json<{ id: string }>().id;

      const upd = await app.inject({
        method: 'PUT',
        url: `/v1/admin/links/${id}`,
        headers: authHeader(),
        payload: {
          iconUrl: 'https://cdn.example.com/new.png',
          category: 'New',
        },
      });
      expect(upd.json<{ iconUrl: string; category: string }>().iconUrl).toBe(
        'https://cdn.example.com/new.png',
      );
      expect(upd.json<{ category: string }>().category).toBe('New');

      const clear = await app.inject({
        method: 'PUT',
        url: `/v1/admin/links/${id}`,
        headers: authHeader(),
        payload: { iconUrl: null, category: null },
      });
      expect(clear.json<{ iconUrl: string | null }>().iconUrl).toBeNull();
      expect(clear.json<{ category: string | null }>().category).toBeNull();
    });

    it('POST with invalid URL returns 422', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/links',
        headers: authHeader(),
        payload: { title: 'X', url: 'not-a-url' },
      });
      expect(res.statusCode).toBe(422);
    });

    it('POST with empty title returns 422', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/links',
        headers: authHeader(),
        payload: { title: '', url: 'https://x.com' },
      });
      expect(res.statusCode).toBe(422);
    });

    it('PUT applies a partial update; untouched fields stay', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/v1/admin/links',
        headers: authHeader(),
        payload: { title: 'Old title', url: 'https://old.com' },
      });
      const id = create.json<{ id: string }>().id;

      const put = await app.inject({
        method: 'PUT',
        url: `/v1/admin/links/${id}`,
        headers: authHeader(),
        payload: { title: 'New title' },
      });
      expect(put.statusCode).toBe(200);
      const updated = put.json<{ title: string; url: string }>();
      expect(updated.title).toBe('New title');
      expect(updated.url).toBe('https://old.com');
    });

    it('DELETE soft-deletes; public list hides it; admin list keeps it inactive', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/v1/admin/links',
        headers: authHeader(),
        payload: { title: 'Goner', url: 'https://goner.com' },
      });
      const id = create.json<{ id: string }>().id;

      const del = await app.inject({
        method: 'DELETE',
        url: `/v1/admin/links/${id}`,
        headers: authHeader(),
      });
      expect(del.statusCode).toBe(204);

      const publicList = await app.inject({ method: 'GET', url: '/v1/links' });
      expect(publicList.json<unknown[]>()).toHaveLength(0);

      const adminList = await app.inject({
        method: 'GET',
        url: '/v1/admin/links',
        headers: authHeader(),
      });
      const links = adminList.json<{ isActive: boolean }[]>();
      expect(links).toHaveLength(1);
      expect(links[0]?.isActive).toBe(false);
    });

    it('GET admin /:id returns inactive links too', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/v1/admin/links',
        headers: authHeader(),
        payload: { title: 'X', url: 'https://x.com' },
      });
      const id = create.json<{ id: string }>().id;
      await app.inject({
        method: 'DELETE',
        url: `/v1/admin/links/${id}`,
        headers: authHeader(),
      });

      const adminGet = await app.inject({
        method: 'GET',
        url: `/v1/admin/links/${id}`,
        headers: authHeader(),
      });
      expect(adminGet.statusCode).toBe(200);
      expect(adminGet.json<{ isActive: boolean }>().isActive).toBe(false);

      const publicGet = await app.inject({ method: 'GET', url: `/v1/links/${id}` });
      expect(publicGet.statusCode).toBe(404);
    });
  });

  describe('jump /go/:id', () => {
    it('redirects with 302, sets Cache-Control: no-store, increments click count', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/v1/admin/links',
        headers: authHeader(),
        payload: { title: 'X', url: 'https://example.com' },
      });
      const id = create.json<{ id: string }>().id;

      const jump = await app.inject({ method: 'GET', url: `/go/${id}` });
      expect(jump.statusCode).toBe(302);
      expect(jump.headers.location).toBe('https://example.com');
      expect(jump.headers['cache-control']).toBe('no-store');

      await app.inject({ method: 'GET', url: `/go/${id}` });
      await app.inject({ method: 'GET', url: `/go/${id}` });

      const after = await app.inject({
        method: 'GET',
        url: `/v1/admin/links/${id}`,
        headers: authHeader(),
      });
      expect(after.json<{ clickCount: number }>().clickCount).toBe(3);
    });

    it('returns 404 for an inactive link (no redirect, no click counted)', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/v1/admin/links',
        headers: authHeader(),
        payload: { title: 'X', url: 'https://example.com' },
      });
      const id = create.json<{ id: string }>().id;
      await app.inject({
        method: 'DELETE',
        url: `/v1/admin/links/${id}`,
        headers: authHeader(),
      });

      const jump = await app.inject({ method: 'GET', url: `/go/${id}` });
      expect(jump.statusCode).toBe(404);

      const adminGet = await app.inject({
        method: 'GET',
        url: `/v1/admin/links/${id}`,
        headers: authHeader(),
      });
      expect(adminGet.json<{ clickCount: number }>().clickCount).toBe(0);
    });
  });

  describe('request id', () => {
    it('echoes a client-supplied X-Request-Id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/links',
        headers: { 'x-request-id': 'caller-supplied-xyz' },
      });
      expect(res.headers['x-request-id']).toBe('caller-supplied-xyz');
    });

    it('generates an X-Request-Id when the client does not supply one', async () => {
      const res = await app.inject({ method: 'GET', url: '/v1/links' });
      expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });
  });
});
