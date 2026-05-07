# ADR 0006 — Distroless `nodejs22-debian12:nonroot` runtime image

- **Status:** Accepted
- **Date:** 2026-05-06

## Context

The runtime base image determines the image size, the attack surface, the patch cadence, and how operators debug a running pod. Three serious candidates:

- **`node:22-alpine`** (~50 MB) — musl libc; tiny; large package ecosystem.
- **`node:22-slim`** (~150 MB) — Debian-based glibc; ships a shell, package manager, ~80 MB of tooling we don't run.
- **`gcr.io/distroless/nodejs22-debian12:nonroot`** (~110 MB but lighter on attack surface) — Debian-based glibc; **no shell, no package manager, nothing not strictly needed for `node`**; default user is `nonroot` (UID 65532).

## Decision

Runtime: **`gcr.io/distroless/nodejs22-debian12:nonroot`**, with `tini` copied in as PID 1.

Build stages (`deps`, `build`, `prod-deps`) use **`node:22-slim`** (NOT alpine). The reason is libc compatibility: `@node-rs/argon2` ships per-libc native binaries. Building deps on alpine pulls the **musl** variant; the **glibc** distroless runtime would then crash on first hash. Slim → distroless is libc-consistent.

## Consequences

**Positive**

- No shell in the runtime image: `kubectl exec -it pod -- sh` doesn't work, which is a feature. Production debugging happens via structured logs, metrics, and `kubectl debug --image=busybox --target=…` ephemeral containers — never via a foothold in the production pod.
- `nonroot` user is enforced by the image, not just by the K8s `SecurityContext`. Belt and suspenders.
- Debian base means well-maintained package versions and predictable CVE patch cadence; Alpine's musl has occasional surprises with native modules and DNS under load.
- `tini` as PID 1 forwards SIGTERM cleanly and reaps zombies even though we don't fork — 24 KB of insurance.

**Negative**

- Final image is **~10 MB heavier than alpine** (~61 MB ours vs ~50 MB hypothetical alpine). Acceptable trade for fewer libc surprises.
- A reviewer may flag the lack of shell. We document the `kubectl debug` ephemeral container alternative in the README.
- Trivy scans find upstream CVEs in distroless's bundled glibc/openssl that we can't fix from this repo. Renovate/Dependabot are configured to PR Docker base-image updates weekly so the fixes flow through; the CI image scan is informational (`exit-code: 0`) rather than gating.
