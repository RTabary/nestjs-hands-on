# Contract: Step 05 — Exception Filters

**Branch pair**: `start/05-exception-filters` ↔ `solution/05-exception-filters`
**Cumulative API surface after this step**: 28 endpoints (12 new + 16 from steps 01–04).

This step adds Garage / Mechanic / MaintenanceOrder CRUD plus the
`/maintenance-orders/:id/transition` route, AND introduces a global
exception filter that unifies the error response shape.

## New endpoints

Standard CRUD (`GET`, `GET :id`, `POST`, `PATCH :id`, `DELETE :id`)
for each of the three new entities, following the same conventions as
prior steps:

- `GET/POST/PATCH/DELETE /garages`
- `GET/POST/PATCH/DELETE /mechanics`
- `GET/POST/PATCH/DELETE /maintenance-orders`
- **`POST /maintenance-orders/:id/transition`** — body
  `{ "status": "in_progress" | "completed" | "cancelled" }`. Enforces
  the state-machine from data-model.md E6. Returns the updated order
  on success; throws on invalid transition.

## New / unified error envelope

`AllExceptionsFilter` (registered globally in `main.ts`) serializes
every uncaught exception (NestJS HttpException subclasses + unexpected
throws) into:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Vehicle V008 cannot have a maintenance order completed without P-FLUX-CAP-MK2",
  "timestamp": "2026-04-27T14:33:18.412Z",
  "path": "/maintenance-orders/MO007/transition"
}
```

This shape replaces the default Nest envelope **for every endpoint
across the API** — including the validation 400s introduced in step 04
(which become reformatted into this envelope without losing the
`message` array).

## New domain exceptions

Both extend `HttpException`:

- **`MissingFluxCapacitorException`** (HTTP 409):
  thrown by `MaintenanceOrdersService.transition()` when the target
  order is for a DeLorean (`vehicleId === 'V008'`), the new status is
  `'completed'`, and the order's `partIds` does not contain
  `'P-FLUX-CAP-MK2'`.
  Message text matches "Vehicle V008 cannot have a maintenance order
  completed without P-FLUX-CAP-MK2".
- **`OutOfStockException`** (HTTP 409):
  thrown when transitioning an order to `'completed'` would push any
  referenced part's `stock` below 0.

## Modified existing endpoints

- All previously-returned 4xx responses now use the unified envelope.
- Validation 400s gain `timestamp` and `path` fields.

## Example

```bash
# Trigger the flux-capacitor exception (assumes seed has the DeLorean)
curl -s -X POST http://localhost:3000/maintenance-orders \
  -H 'content-type: application/json' \
  -d '{"vehicleId":"V008","mechanicId":"MEC001","partIds":[],"scheduledFor":"2026-05-10T09:00:00Z"}' \
| jq .id  # → "MO007"

curl -s -X POST http://localhost:3000/maintenance-orders/MO007/transition \
  -H 'content-type: application/json' \
  -d '{"status":"in_progress"}'  # OK

curl -s -X POST http://localhost:3000/maintenance-orders/MO007/transition \
  -H 'content-type: application/json' \
  -d '{"status":"completed"}'
# → 409 with MissingFluxCapacitorException envelope
```

## Checkpoint test (`test/05-exceptions.e2e-spec.ts`)

- Asserts the unified envelope shape is returned on `GET /vehicles/V999`
  (404).
- Asserts `MissingFluxCapacitorException` returns 409 + matches the
  message text.
- Asserts a valid `queued → in_progress → completed` transition path
  on a non-DeLorean returns 200 each step.
- Asserts skipping `queued → completed` returns 400.
- ≤ 60 lines total.
