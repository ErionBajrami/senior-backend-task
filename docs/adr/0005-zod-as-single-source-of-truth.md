# ADR 0005 — Zod as the single source of truth (validation + types + OpenAPI)

- **Status:** Accepted
- **Date:** 2026-05-06

## Context

Three things at the HTTP boundary that must agree:

1. **Runtime request validation** — does the body have `title: string`?
2. **Compile-time types** — what does the controller signature look like?
3. **OpenAPI documentation** — what does the spec say the body shape is?

The naïve approach is to write each one separately and pray they don't drift. They will drift; the spec rots within two PRs.

## Decision

**Zod is the single source of truth.** Each schema is declared once in `src/interfaces/http/schemas/` and provides:

1. Runtime validation via `Schema.parse(req.body)` in the controller. A failure throws `ZodError`, which the error handler maps to `422` with a structured `issues` array.
2. Compile-time type via `z.infer<typeof Schema>` — exported as `…Dto` types alongside the schemas.
3. OpenAPI fragments via `@asteasolutions/zod-to-openapi`. The build script `scripts/generate-openapi.ts` registers each schema with metadata and emits `docs/openapi.yaml`.

CI runs `npm run openapi:check`: regenerate in memory and compare against the file on disk. **A schema change without `npm run openapi:generate` fails the workflow.**

The user requested "FluentValidation" (a .NET library); Zod is the idiomatic Node-ecosystem equivalent and the `.method().chain().like()` style covers the same ergonomics with the bonus of static type inference.

## Consequences

**Positive**

- One file (e.g. `link.schema.ts`) defines `CreateLinkBody` and the runtime validator, the typed controller input, and the OpenAPI request body — they cannot drift.
- Removing a field is a single-line edit. Adding a constraint (`.max(2048)`) is also a single-line edit. The ESLint + tsc + OpenAPI-check pipeline catches all three places automatically.
- Login schema is intentionally **lenient** (`min(1).max(...)`); the strict username regex lives only in the `Username` value object inside the domain. Zod validation at the edge can't be used to enumerate valid username formats.

**Negative**

- Zod has a measurable cold-start cost on the first parse of each schema. Negligible at our scale; would matter on a 1000-rps cold-start microservice.
- Tooling around Zod-to-OpenAPI is still maturing; some richer OpenAPI features (discriminated unions with full schema refs, `oneOf` patterns) require manual `.openapi(...)` annotations. Acknowledged; not a blocker for our routes.
