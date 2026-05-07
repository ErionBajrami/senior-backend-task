# Architecture

Quanos is a Clean Architecture implementation in Node.js + TypeScript. Four concentric layers + a composition root; the dependency rule (outer → inner only) is enforced both at lint-time (`eslint-plugin-boundaries`) and in CI (`dependency-cruiser`).

---

## Layers

```mermaid
graph LR
    subgraph "1. Domain (pure)"
      D["entities/<br/>value-objects/<br/>errors/<br/>repositories/ (interfaces)"]
    end
    subgraph "2. Application"
      A["use-cases/<br/>ports/out/"]
    end
    subgraph "3. Interfaces (HTTP)"
      I["controllers/<br/>schemas/ (Zod)<br/>presenters/<br/>middleware/"]
    end
    subgraph "4. Infrastructure"
      F["persistence/mongo/<br/>http/ (Fastify factories)<br/>adapters/ (argon2, JWT,<br/>Clock, IdGenerator)<br/>config/ (env, logger)"]
    end
    subgraph "Composition root"
      M["main/<br/>(compose, server, index, seed)"]
    end

    A --> D
    I --> A
    I --> D
    F --> A
    F --> D
    M --> A
    M --> I
    M --> F
    M --> D
```

| Layer                | What lives here                                                                                                                                         | Allowed imports      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **Domain**           | `Link`, `Admin`, value objects (`Url`, `LinkTitle`, `Username`, `PasswordHash`, …), domain errors, **repository interfaces**                            | nothing else         |
| **Application**      | Use cases (`CreateLink`, `JumpToLink`, `AuthenticateAdmin`, …), output ports (`Clock`, `IdGenerator`, `PasswordHasher`, `TokenSigner`, `TokenVerifier`) | domain               |
| **Interfaces**       | Fastify controllers, Zod request/response schemas, presenters, auth middleware                                                                          | application + domain |
| **Infrastructure**   | Mongo repository implementations, argon2id hasher, HS256 JWT signer/verifier, Fastify server factory, pino, env loader                                  | application + domain |
| **Composition root** | `compose.ts` wires everything; `server.ts` boots; `index.ts` is the entrypoint with graceful shutdown; `seed-admin.ts` is idempotent admin bootstrap    | every layer          |

### Why the application layer doesn't return DTOs

Use cases return **domain entities** (e.g. `Link`, `Admin`), not "application DTOs". The HTTP presenter does entity → JSON mapping at the edge. The trade-off: the interfaces layer can `import type { Link }` from the domain, which is fine because that import direction is allowed. Returning a separate plain DTO from every use case would be ~30% more code for negligible safety gain, given that the type system already guarantees the entity contract.

---

## A request through the layers

Sequence for `POST /v1/admin/links` (admin creates a link):

```mermaid
sequenceDiagram
    participant Client
    participant Fastify
    participant Auth as auth.middleware
    participant Verify as VerifyAdminToken
    participant Ctrl as link.controller
    participant UC as CreateLink
    participant Repo as MongoLinkRepository
    participant Mongo

    Client->>Fastify: POST /v1/admin/links<br/>Authorization: Bearer <jwt>
    Fastify->>Auth: preHandler
    Auth->>Verify: execute(token)
    Verify->>Verify: tokenVerifier.verify(token)
    Verify->>Repo: adminRepo.findById(adminId)
    Repo->>Mongo: findOne({ _id })
    Mongo-->>Repo: doc
    Repo-->>Verify: Admin
    Verify-->>Auth: Admin (or null → 401)
    Auth-->>Fastify: ok
    Fastify->>Ctrl: handler
    Ctrl->>Ctrl: CreateLinkBody.parse(body)<br/>(Zod)
    Ctrl->>UC: execute({ title, url, description })
    UC->>UC: LinkTitle.create(...)<br/>Url.create(...)<br/>LinkDescription.create(...)<br/>(VOs throw on invalid)
    UC->>UC: Link.create({ id, title, url, ... })
    UC->>Repo: save(link)
    Repo->>Mongo: replaceOne({_id}, doc, {upsert})
    Mongo-->>Repo: ok
    Repo-->>UC: void
    UC-->>Ctrl: Link
    Ctrl->>Ctrl: presentLink(link)
    Ctrl-->>Fastify: 201 + LinkDto
    Fastify->>Fastify: onSend hook<br/>echo X-Request-Id
    Fastify-->>Client: 201 + JSON
```

If any step throws a `DomainError` (`InvalidUrlError`, `InvalidTitleError`, …), Fastify's error handler maps the `code` field to a status (422 for invalid input, 401 for any auth-shaped error, 404 for not-found). `ZodError` from the body parse becomes 422 with a structured `issues` array.

### Click-tracking is atomic on the repository, not on the entity

`Link` deliberately does **not** expose `incrementClickCount()` on the entity. Concurrent jumps to the same link in a read-modify-write loop would race; the safe path is a single atomic write at the repository:

```ts
// MongoLinkRepository.incrementClickCount
await this.collection.updateOne(
  { _id: id.value },
  { $inc: { clickCount: 1 }, $currentDate: { updatedAt: true } },
);
```

Verified in the integration suite by 25 concurrent increments landing exactly 25.

---

## Deployment topology

```mermaid
graph TB
    Internet((Internet)) --> Ingress["Ingress<br/>nginx + cert-manager"]
    subgraph Cluster
      direction TB
      subgraph "ns: quanos"
        Ingress --> Svc["Service<br/>quanos:80 → 3000"]
        Svc --> Pod1["Pod app<br/>API :3000<br/>Ops :3001"]
        Svc --> Pod2["Pod app"]
        Svc --> Pod3["Pod app"]
        HPA["HPA<br/>cpu 70% / 2-10"] -.->|scale| Pod1
        PDB["PDB<br/>minAvail=1"] -.-> Pod1
        NP[NetworkPolicy] -.->|gate| Pod1
        Probes["kubelet"] -.->|/healthz, /readyz<br/>port 3001| Pod1
        Probes -.->|/healthz, /readyz| Pod2
      end
      subgraph "ns: kube-system"
        DNS[CoreDNS]
      end
    end
    Pod1 --> DNS
    Pod1 --> Mongo[(MongoDB<br/>Atlas / DocumentDB)]
    Pod2 --> Mongo
    Pod3 --> Mongo
```

The **ops port (3001)** is intentionally **not exposed via a Service** — kubelet probes hit the pod IP directly, so there's no need to route ops traffic through kube-proxy. If you want Prometheus-style metrics scraping later, add a separate `ClusterIP` for port 3001 with a `monitoring: true` label and let the NetworkPolicy ingress rule allow it.

---

## Where to look first

| Question                                              | File                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| "How does it all fit together?"                       | `src/main/compose.ts` — every adapter and use case is `new`-ed up here, top to bottom.           |
| "What's the canonical persistence contract?"          | `src/domain/repositories/link.repository.ts`                                                     |
| "What does the use-case shape look like?"             | `src/application/use-cases/create-link.use-case.ts` (every other use case follows this template) |
| "Where is the dependency rule mechanically enforced?" | `eslint.config.js` (`eslint-plugin-boundaries`) and `.dependency-cruiser.cjs`                    |
| "What does the production artifact look like?"        | `deploy/docker/Dockerfile` (4-stage, distroless + tini, non-root)                                |
| "How do probes/security/policy work in K8s?"          | `deploy/k8s/base/deployment.yaml`                                                                |
