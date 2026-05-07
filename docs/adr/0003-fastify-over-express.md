# ADR 0003 — Fastify v5 over Express

- **Status:** Accepted
- **Date:** 2026-05-06

## Context

The HTTP framework choice for a Node service shapes performance, plugin ergonomics, type safety, and graceful shutdown. The realistic options are:

- **Express** — the default; massive ecosystem; minimal types; no built-in schema validation; `app.close()` doesn't drain in-flight requests.
- **Fastify** — schema-first, faster (~2× Express on simple routes), first-class TypeScript types, plugin lifecycle that maps cleanly to a composition root, reliable `app.close()` drain.
- **Hono** — modern, ESM-native, popular at the edge (Cloudflare Workers, Vercel), but its sweet spot is edge runtimes rather than long-lived Node processes.
- **NestJS** — opinionated framework with its own DI container; would conflict with the hand-rolled composition root we deliberately chose in ADR 0001.

## Decision

Use **Fastify v5**.

- The factory in `src/infrastructure/http/fastify-server.ts` registers `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit`, the error handler, and an `onSend` hook that echoes the request id back as a response header.
- Routes are registered by the composition root via `src/interfaces/http/routes.ts`; the factory itself ships no routes, which lets E2E tests reuse the same factory shape against a fresh Mongo testcontainer.

## Consequences

**Positive**

- `app.close()` on SIGTERM **drains** in-flight requests before resolving, with a configurable timeout we tie to K8s `terminationGracePeriodSeconds`.
- `fastify.inject()` lets the E2E suite hit the full app without binding a TCP port — tests are ~5× faster than supertest equivalents and don't fight for ports in CI.
- Per-request structured logging via the built-in pino integration; request IDs propagate to logs without a custom middleware.

**Negative**

- Fastify v5's typing for the logger has a known structural mismatch with pino v9's `BaseLogger` interface. Worked around with one `as unknown as FastifyInstance` cast per factory; the runtime is unaffected and the cast is documented inline.
- Fewer Stack Overflow hits than Express. The plugins we depend on (helmet, cors, rate-limit) are all officially maintained, so the surface that matters is well-documented.
