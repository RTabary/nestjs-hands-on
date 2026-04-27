# Contract: Step 06 — Guards

**Branch pair**: `start/06-guards` ↔ `solution/06-guards`
**Cumulative API surface after this step**: 28 endpoints (no new routes; auth applied to existing ones).

No new endpoints. This step retrofits authorization onto the existing
API surface.

## Auth model introduced

- A constant `WORKSHOP_API_KEY = 'pit-pass'` (relocated to env var in
  step 07).
- A global `ApiKeyGuard` (`CanActivate`) registered via
  `app.useGlobalGuards()` in `main.ts`.
- A `@Public()` decorator (custom; uses `Reflector.get` /
  `SetMetadata`) that opts out of the guard.

## Auth requirements per route

- **Public** (no header required, marked `@Public()`):
  - `GET /health`
  - `GET /vroom`
  - All `GET` routes on every resource (`GET /vehicles`, `GET
    /vehicles/:id`, `GET /spare-parts`, …, `GET /maintenance-orders/:id`).
    Read access is open in the workshop scenario.
- **Protected** (require `x-api-key: pit-pass` header):
  - All `POST` / `PATCH` / `DELETE` routes on every resource.
  - `POST /maintenance-orders/:id/transition`.

A protected request without (or with a wrong) `x-api-key` header
returns **401 Unauthorized** in the unified envelope from step 05.

## Example

```bash
# GET stays open
curl -s http://localhost:3000/vehicles | jq 'length'  # → 12

# POST needs the key
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -H 'x-api-key: pit-pass' \
  -d '{"make":"Mini","model":"Cooper","year":2020,"vin":"WBA1234567890ABCD","mileageKm":42000,"manufacturerId":"MFR003"}'
# → 201

curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -d '{"make":"Mini",...}'
# → 401 with envelope { "statusCode": 401, "error": "Unauthorized", ... }
```

## Checkpoint test (`test/06-guards.e2e-spec.ts`)

- Asserts `GET /vehicles` returns 200 without the header.
- Asserts `POST /vehicles` returns 401 without the header.
- Asserts `POST /vehicles` with `x-api-key: pit-pass` returns 201.
- Asserts `POST /vehicles` with `x-api-key: wrong` returns 401.
- ≤ 40 lines total.
