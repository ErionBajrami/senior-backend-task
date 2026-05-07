# ADR 0002 — TypeScript strict + native ESM via NodeNext

- **Status:** Accepted
- **Date:** 2026-05-06

## Context

Node 22 has fully native ES modules; Node 24 will be LTS later in 2026. We need a TypeScript configuration that is:

1. Strict enough to catch the bugs Clean Architecture's layering can't catch on its own.
2. Compatible with our build chain (tsup bundling, vitest tests, tsx watch dev).
3. Free of compatibility shims (no `esbuild + commonjs` hybrid).

## Decision

- **TypeScript 5.7**, `"strict": true` plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`. Relative imports include the `.js` extension because Node ESM requires it (TypeScript honours that even though source is `.ts`).
- `"type": "module"` in `package.json`.
- Path aliases configured in `tsconfig.json` (`@domain/*`, `@application/*`, etc.) but **not used** in source files — relative imports keep the dependency graph greppable, the path aliases exist only so test/build tooling has them registered.

## Consequences

**Positive**

- `exactOptionalPropertyTypes` caught a real bug in the HTTP controller before it shipped: passing Zod-parsed `string | undefined` straight into a use case input typed `?: string` is rejected (the use case would have silently treated `undefined` as a value rather than as "field missing").
- `noUncheckedIndexedAccess` makes array/map access return `T | undefined`. Verbose, but it caught one off-by-one in the FakeTokenVerifier during the application-layer tests.
- ESM-native means no `__dirname` shims; we use `import.meta.url` where needed.

**Negative**

- The `.js`-extension-on-`.ts`-source convention is initially weird. Documented in this ADR and inline in the codebase the first time it appears.
- Hits two small rough edges in the wider ecosystem: (a) Fastify v5's `FastifyBaseLogger` doesn't satisfy pino v9's `BaseLogger` (missing `msgPrefix`), forcing one `as unknown as FastifyInstance` cast in each Fastify factory — documented in `fastify-server.ts`; (b) `@node-rs/argon2` exports `Algorithm` as a `const enum` which `isolatedModules: true` forbids importing, so we omit the option (argon2id is the package default) — documented in `argon2-password-hasher.adapter.ts`.
- `exactOptionalPropertyTypes` is genuinely strict. Without it, controllers could pass Zod-parsed bodies directly. With it, we explicitly type optional update fields as `?: T | undefined`. Net positive but visible cost.
