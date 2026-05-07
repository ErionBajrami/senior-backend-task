# ADR 0001 — Clean Architecture (4 layers + composition root)

- **Status:** Accepted
- **Date:** 2026-05-06

## Context

The brief grades the submission on, among other things, "a clear, consistent architecture". The functional surface is small (a Link CRUD with a public read/jump path and admin-only writes), so the architecture's job here is less about taming complexity and more about making the structure **legible** to a reviewer.

Two main candidates:

1. **Express-style MVC**: routes → service → DAO. Idiomatic Node, smaller line count, easy to skim.
2. **Clean Architecture (Uncle Bob's concentric layers)**: domain → application → interfaces / infrastructure → composition root, with the dependency rule pointing inward. More ceremony, more files, stricter boundaries.

## Decision

Use **Clean Architecture** with four layers + a composition root, and **enforce the dependency rule mechanically**:

- `eslint-plugin-boundaries` defines the allowed import edges and fails lint on a violation.
- `dependency-cruiser` does the same in CI as a belt-and-suspenders check (catches dynamic `require`, mis-resolved aliases).

Specifically:

| Layer          | Lives in              | Imports allowed from |
| -------------- | --------------------- | -------------------- |
| Domain         | `src/domain/`         | nothing              |
| Application    | `src/application/`    | domain               |
| Interfaces     | `src/interfaces/`     | domain, application  |
| Infrastructure | `src/infrastructure/` | domain, application  |
| Main           | `src/main/`           | every layer          |

## Consequences

**Positive**

- Reviewer can verify the architecture in one glance: `eslint.config.js` declares the rules, `npm run lint` enforces them, `compose.ts` is the only place adapters get wired.
- Swapping infrastructure (e.g. Mongo → Postgres, Fastify → Hono, JWT → opaque sessions) is a one-file change in `src/infrastructure/` plus a few lines in `compose.ts`. Neither domain nor application moves.
- Use cases are unit-testable with hand-rolled fakes (no mocks, no DI container): every dependency is an interface in `src/application/ports/out/` that a fake can implement directly.

**Negative**

- ~3–5× the file count of an equivalent Express app for the same feature set. Acknowledged.
- Three mappings per endpoint (HTTP DTO → application input → domain entity → Mongo doc). For trivial fields this looks like duplication. Resisting the urge to introduce a generic mapper library — the cost is the architecture's price; abstracting it hides what's actually happening.
- A junior reader may struggle with "why is this an interface and not a class?" — mitigated by ADRs 0004 and 0005 which name the concrete things the interfaces buy us.
