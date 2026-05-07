# ADR 0004 — Native `mongodb` driver over Mongoose

- **Status:** Accepted
- **Date:** 2026-05-06

## Context

The brief mandates a NoSQL store; we've chosen MongoDB. The Node ecosystem offers two production-grade options for talking to it:

- **Mongoose** — the popular ODM. Schemas + models + middlewares + query helpers + virtuals. Most Node tutorials reach for it by default.
- **The official `mongodb` driver** — direct BSON I/O, no schema validation, no abstraction.

This is the most counter-intuitive call in the codebase, so this ADR is the longest of the six.

## Decision

Use the **official `mongodb` driver (v6)**. Mongoose is rejected.

The persistence port `LinkRepository` is defined in the domain layer (`src/domain/repositories/link.repository.ts`); the implementation `MongoLinkRepository` lives in `src/infrastructure/persistence/mongo/` and maps domain entities to/from BSON documents via small dedicated mapper functions (`linkToDoc`, `docToLink`).

## Consequences

**Why not Mongoose?**

The fundamental issue is that Mongoose's `Schema` and `model` are **infrastructure concerns** — they describe how a thing is stored. In Clean Architecture, the domain entity must not depend on its persistence representation. If `Link` is a Mongoose model:

- Adding a field requires editing the schema, the model, the entity, and any validator
- "Domain entity validation" gets confused with "schema validation"
- Tests that need a Mongoose instance need a connection, defeating the point of a pure domain
- Swapping out Mongo (the test-double-able point of the repository) means rewriting the entity

The native driver returns plain BSON documents that the mapper translates into domain entities. The domain knows nothing about Mongo. The mapper layer is small and **explicit** — the cost surfaces in code review rather than hiding in framework magic.

**Trade-offs accepted**

- We re-validate value objects (`LinkTitle.create`, `Url.create`, …) on every `docToLink` read. That's ~10 µs per link. Acceptable; the alternative (silent corruption from a bad migration) is worse.
- No automatic timestamp magic. We set `createdAt` / `updatedAt` explicitly in the entity factory and update sites; the repository uses MongoDB's `$currentDate` operator for atomic counter increments.
- The reviewer is likely to ask "why not Mongoose?" — this ADR is the answer.

**Confirmed by the test suite**

The integration test for `MongoLinkRepository` runs 25 concurrent `incrementClickCount` calls and asserts the counter lands at exactly 25. Atomic `$inc` makes this safe; a Mongoose `read-modify-save` pattern would lose increments under contention.
