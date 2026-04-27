# Contract: Step 07 — Configuration

**Branch pair**: `start/07-configuration` ↔ `solution/07-configuration`
**Cumulative API surface after this step**: 28 endpoints (no new routes).

No new HTTP routes. This step relocates configuration values from
hard-coded constants to `@nestjs/config`-loaded environment variables.

## Configuration surface

`.env.example` (checked in):
```
PORT=3000
WORKSHOP_API_KEY=pit-pass
MAINTENANCE_QUEUE_LIMIT=10
```

`.env` (gitignored; attendees copy `.env.example`).

`ConfigModule` registered in `app.module.ts` with:
- `isGlobal: true`
- `cache: true`
- `validationSchema` (Joi) requiring `WORKSHOP_API_KEY` and validating
  number coercion for `PORT` and `MAINTENANCE_QUEUE_LIMIT`.

A typed `AppConfigService` wraps `ConfigService` and exposes:
```ts
getPort(): number
getApiKey(): string
getMaintenanceQueueLimit(): number
```

## Behavioral changes

- `main.ts` reads `app.get(AppConfigService).getPort()` instead of the
  literal `3000`.
- `ApiKeyGuard` reads `getApiKey()` instead of the constant from step 06.
- `MaintenanceOrdersService` enforces a max queued-order count using
  `getMaintenanceQueueLimit()` — over-limit `POST /maintenance-orders`
  returns 409 with a new `MaintenanceQueueFullException` (still routed
  through the global filter from step 05).

## Boot-time validation

If `WORKSHOP_API_KEY` is missing from the environment, the server
**fails to boot** with a Joi validation error (intentional teaching
moment — fail fast on missing config).

## Example

```bash
# Without .env: boot fails
rm -f .env
npm run start:dev
# → Error: "WORKSHOP_API_KEY" is required

# With .env: boot succeeds, key still required on protected routes
cp .env.example .env
npm run start:dev
```

## Checkpoint test (`test/07-configuration.e2e-spec.ts`)

- Asserts the test bootstrap reads the API key from a test `.env` file
  (not the dev `.env`) and the protected routes still gate on it.
- Asserts that `getMaintenanceQueueLimit()` is the value from
  `.env.test` (not the default).
- Asserts the queue-full exception fires once the limit is exceeded.
- ≤ 50 lines total.
