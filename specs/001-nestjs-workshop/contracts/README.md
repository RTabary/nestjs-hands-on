# API Contracts: NestJS Hands-On Workshop

**Feature**: 001-nestjs-workshop · **Date**: 2026-04-27

This directory documents the **HTTP surface** of the workshop API,
sliced by the step that introduces each route. Each step's file
contains the routes, request shapes, response shapes, and HTTP status
codes that should be in place by the end of that step's
`solution/<step>` branch.

## Why contracts per step (not one big OpenAPI doc)

Per FR-007 + FR-009, every `start/<step>` branch carries the cumulative
solution of all prior steps. That means the API surface **grows
monotonically** through the core curriculum. Pinning what each step
adds (vs. modifies) makes it trivial to:

1. Author the checkpoint test for each step (FR-017): the test asserts
   on the routes listed in that step's contract.
2. Spot regressions: if the cumulative `solution/05-…` API surface
   doesn't equal `(01) ∪ (02) ∪ (03) ∪ (04) ∪ (05)`, something is wrong
   in the authoring backbone.
3. Drive the OpenAPI stretch step (S3): the contracts here are the
   ground truth that `@nestjs/swagger` reflects on.

## Index

### Core curriculum (cumulative)

| Step | File | Adds | Modifies |
|------|------|------|----------|
| 01 | [01-bootstrap.md](./01-bootstrap.md) | `GET /vroom`, `GET /health` | — |
| 02 | [02-controllers.md](./02-controllers.md) | `GET/POST/PATCH/DELETE /vehicles` | — |
| 03 | [03-providers.md](./03-providers.md) | `GET/POST/PATCH/DELETE /spare-parts`, `GET /vehicles/:id/compatible-parts` | — |
| 04 | [04-validation.md](./04-validation.md) | `GET/POST/PATCH/DELETE /manufacturers` | All POST/PATCH endpoints from steps 02–03 now reject invalid bodies with `400 Bad Request`. Vehicle responses include `manufacturerId`. |
| 05 | [05-exceptions.md](./05-exceptions.md) | `GET/POST/PATCH/DELETE /garages`, `GET/POST/PATCH/DELETE /mechanics`, `GET/POST/PATCH/DELETE /maintenance-orders`, `POST /maintenance-orders/:id/transition` | All endpoints now return error responses in the unified `{ statusCode, error, message, timestamp, path }` shape. Specific exceptions added: `MissingFluxCapacitorException` (409), `OutOfStockException` (409). |
| 06 | [06-guards.md](./06-guards.md) | — | All `POST/PATCH/DELETE` endpoints now require `x-api-key: <constant>` header → `401 Unauthorized` if missing/wrong. `GET` endpoints stay public. `/vroom` and `/health` stay public via `@Public()`. |
| 07 | [07-configuration.md](./07-configuration.md) | — | API key is now read from `WORKSHOP_API_KEY` env var instead of a hard-coded constant. Server fails to boot if the env var is missing. |
| 08 | [08-testing.md](./08-testing.md) | — | No HTTP-surface change. This step only adds tests. |

### Stretch steps (each branches off `solution/08-testing` independently)

| Step | File | Adds |
|------|------|------|
| S1 | [S1-interceptors.md](./S1-interceptors.md) | All responses gain `X-Response-Time` header logged by `TurboBoostInterceptor`. |
| S2 | [S2-persistence.md](./S2-persistence.md) | No new HTTP routes; data persists across restarts (file-backed SQLite at `./data/workshop.sqlite`). |
| S3 | [S3-openapi.md](./S3-openapi.md) | `GET /api` (Swagger UI), `GET /api-json` (OpenAPI document). |
| S4 | [S4-websockets.md](./S4-websockets.md) | WS namespace `/dyno`: server-pushed `'maintenance.completed'` events when an order transitions to `completed`. |
| S5 | [S5-microservices.md](./S5-microservices.md) | TCP message pattern `'maintenance.queue'` consumed by an in-process microservice; HTTP route `/dyno/queue` triggers it. |

## Conventions used in every contract file

- **Method + path** as the heading.
- **Auth**: `public` (no header required) or `protected` (requires
  `x-api-key`). Steps 01–05 are all `public`; protection is added
  uniformly in step 06.
- **Request body**: shape only (field types + constraints), referencing
  the matching DTO in [data-model.md](../data-model.md).
- **Response body**: shape only, referencing the matching entity.
- **Status codes**: 2xx success codes, plus the relevant 4xx/5xx codes
  the step is responsible for.
- **Example**: a single `curl` invocation that an attendee can paste,
  producing a representative response.

## Where the actual TypeScript lives

Nowhere yet — the controllers and DTOs are authored on the step
branches during `/speckit-implement`. These contracts are the
authoring brief, not the implementation.
