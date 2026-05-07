import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extendZodWithOpenApi, OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { HeadersObject } from '@asteasolutions/zod-to-openapi/dist/types.js';
import { z } from 'zod';
import yaml from 'yaml';

extendZodWithOpenApi(z);

import {
  CreateLinkBody,
  LinkIdParam,
  LinkListQuery,
  LinkListResponse,
  LinkResponse,
  UpdateLinkBody,
} from '../src/interfaces/http/schemas/link.schema.js';
import { LoginBody, LoginResponse } from '../src/interfaces/http/schemas/auth.schema.js';

const ErrorResponse = z
  .object({
    code: z.string(),
    message: z.string(),
    issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  })
  .openapi('ErrorResponse');

const HealthResponse = z.object({ status: z.string() }).openapi('HealthResponse');

const registry = new OpenAPIRegistry();

const Link = registry.register('Link', LinkResponse.openapi('Link'));
const LinkList = registry.register('LinkList', LinkListResponse.openapi('LinkList'));
const ErrorRef = registry.register('Error', ErrorResponse);
const HealthRef = registry.register('Health', HealthResponse);
const CreateLink = registry.register('CreateLinkBody', CreateLinkBody.openapi('CreateLinkBody'));
const UpdateLink = registry.register('UpdateLinkBody', UpdateLinkBody.openapi('UpdateLinkBody'));
const LoginReq = registry.register('LoginBody', LoginBody.openapi('LoginBody'));
const LoginRes = registry.register('LoginResponse', LoginResponse.openapi('LoginResponse'));

registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

const idParam = LinkIdParam.shape.id.openapi({
  description: 'UUID v4 of the link',
  example: '550e8400-e29b-41d4-a716-446655440000',
});

interface JsonResponse {
  description: string;
  content: { 'application/json': { schema: z.ZodTypeAny } };
  headers?: HeadersObject;
}

function jsonResponse(
  description: string,
  schema: z.ZodTypeAny,
  headers?: HeadersObject,
): JsonResponse {
  return {
    description,
    content: { 'application/json': { schema } },
    ...(headers ? { headers } : {}),
  };
}

const errorJson = (description: string): JsonResponse => jsonResponse(description, ErrorRef);

const totalCountHeader: HeadersObject = {
  'x-total-count': {
    description: 'Total number of records matching the query (independent of limit/offset)',
    schema: { type: 'integer', minimum: 0 },
  },
};

registry.registerPath({
  method: 'get',
  path: '/v1/links',
  summary: 'List active links (public)',
  tags: ['Public'],
  request: { query: LinkListQuery },
  responses: {
    200: jsonResponse('Active links', LinkList, totalCountHeader),
    422: errorJson('Invalid limit or offset'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/links/{id}',
  summary: 'Get one active link by id (public)',
  tags: ['Public'],
  request: { params: z.object({ id: idParam }) },
  responses: {
    200: jsonResponse('Link', Link),
    404: errorJson('Link not found or inactive'),
    422: errorJson('Invalid id format'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/go/{id}',
  summary: 'Jump (302 redirect + click count)',
  description:
    'Increments the click counter atomically and 302-redirects to the link URL. ' +
    'Returns 404 if the link is missing or has been soft-deleted.',
  tags: ['Public'],
  request: { params: z.object({ id: idParam }) },
  responses: {
    302: { description: 'Redirect to the configured URL' },
    404: errorJson('Link not found or inactive'),
    422: errorJson('Invalid id format'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/auth/login',
  summary: 'Authenticate as the admin and receive a JWT',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: LoginReq } }, required: true },
  },
  responses: {
    200: jsonResponse('Signed token + expiry', LoginRes),
    401: errorJson('Invalid credentials'),
    422: errorJson('Malformed body'),
  },
});

const bearerSecurity = [{ BearerAuth: [] as string[] }];

registry.registerPath({
  method: 'get',
  path: '/v1/admin/links',
  summary: 'List ALL links, including soft-deleted (admin)',
  tags: ['Admin'],
  security: bearerSecurity,
  request: { query: LinkListQuery },
  responses: {
    200: jsonResponse('Every link, regardless of isActive', LinkList, totalCountHeader),
    401: errorJson('Missing or invalid Bearer token'),
    422: errorJson('Invalid limit or offset'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/admin/links/{id}',
  summary: 'Get a link by id, regardless of isActive (admin)',
  tags: ['Admin'],
  security: bearerSecurity,
  request: { params: z.object({ id: idParam }) },
  responses: {
    200: jsonResponse('Link', Link),
    401: errorJson('Missing or invalid Bearer token'),
    404: errorJson('Link not found'),
    422: errorJson('Invalid id format'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/admin/links',
  summary: 'Create a link (admin)',
  tags: ['Admin'],
  security: bearerSecurity,
  request: {
    body: { content: { 'application/json': { schema: CreateLink } }, required: true },
  },
  responses: {
    201: jsonResponse('Created link', Link),
    401: errorJson('Missing or invalid Bearer token'),
    422: errorJson('Validation failed (title, url, or description)'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/v1/admin/links/{id}',
  summary: 'Partial update of a link (admin)',
  description:
    'Each field is optional. Sending `description: null` clears it. Setting `isActive: false` is the same as DELETE.',
  tags: ['Admin'],
  security: bearerSecurity,
  request: {
    params: z.object({ id: idParam }),
    body: { content: { 'application/json': { schema: UpdateLink } }, required: true },
  },
  responses: {
    200: jsonResponse('Updated link', Link),
    401: errorJson('Missing or invalid Bearer token'),
    404: errorJson('Link not found'),
    422: errorJson('Validation failed'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/v1/admin/links/{id}',
  summary: 'Soft-delete a link (admin)',
  description:
    'Marks `isActive=false`. The row is preserved; the click count and timestamps are kept. ' +
    'Re-activate by PUT-ing `{ "isActive": true }`.',
  tags: ['Admin'],
  security: bearerSecurity,
  request: { params: z.object({ id: idParam }) },
  responses: {
    204: { description: 'Soft-deleted (no body)' },
    401: errorJson('Missing or invalid Bearer token'),
    404: errorJson('Link not found'),
    422: errorJson('Invalid id format'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/healthz',
  summary: 'Liveness probe (ops port)',
  description:
    'Returns 200 unconditionally. Does NOT touch Mongo — kubelet must not SIGKILL the pod for transient DB outages.',
  tags: ['Ops'],
  responses: {
    200: jsonResponse('Always healthy', HealthRef),
  },
});

registry.registerPath({
  method: 'get',
  path: '/readyz',
  summary: 'Readiness probe (ops port)',
  description:
    'Pings Mongo with a hard timeout. 503 means the pod will be removed from the Service endpoints until it recovers — without a container restart.',
  tags: ['Ops'],
  responses: {
    200: jsonResponse('Mongo reachable', HealthRef),
    503: jsonResponse('Mongo unreachable or slow', HealthRef),
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);
const doc = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: 'Quanos API',
    version: '0.1.0',
    description:
      'Public + admin API for managing and following configured links. ' +
      'Built with Node.js + TypeScript on a Clean Architecture layout, MongoDB-backed, JWT auth.',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'local API' },
    { url: 'http://localhost:3001', description: 'local ops (health endpoints only)' },
  ],
  tags: [
    { name: 'Public', description: 'Routes any visitor can call' },
    { name: 'Auth', description: 'Login + token issuance' },
    { name: 'Admin', description: 'CRUD over links — Bearer JWT required' },
    { name: 'Ops', description: 'Liveness + readiness probes (port 3001)' },
  ],
});

const yamlContent = yaml.stringify(doc);
const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'docs', 'openapi.yaml');

const args = process.argv.slice(2);
if (args.includes('--check')) {
  let existing: string;
  try {
    existing = readFileSync(outputPath, 'utf-8');
  } catch {
    console.error(`docs/openapi.yaml is missing. Run \`npm run openapi:generate\`.`);
    process.exit(1);
  }
  if (existing.trim() !== yamlContent.trim()) {
    console.error('docs/openapi.yaml is stale. Run `npm run openapi:generate` and commit the result.');
    process.exit(1);
  }
  console.log('docs/openapi.yaml is up to date.');
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, yamlContent);
  console.log(`OpenAPI spec written to ${outputPath} (${yamlContent.length} bytes)`);
}
