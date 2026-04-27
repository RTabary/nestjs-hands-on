# Contract: Step 02 — Controllers & Routing

**Branch pair**: `start/02-controllers-routing` ↔ `solution/02-controllers-routing`
**Cumulative API surface after this step**: 6 endpoints (4 new + 2 from step 01).

The Vehicle CRUD set. No DTO validation yet (intentional — that lands
in step 04). The seed roster (R10) provides 12 vehicles at boot.

## `GET /vehicles`

- **Auth**: public
- **Response (200)**: `Vehicle[]` — the full seed list.

## `GET /vehicles/:id`

- **Auth**: public
- **Response (200)**: `Vehicle`.
- **404** if no vehicle with that `id`.

## `POST /vehicles`

- **Auth**: public
- **Request body**: `CreateVehicleDto` (no validation yet — accepts any
  shape with the right field names).
- **Response (201)**: created `Vehicle` with server-set `id`,
  `createdAt`, `updatedAt`.

## `PATCH /vehicles/:id`

- **Auth**: public
- **Request body**: `UpdateVehicleDto` (partial; no validation yet).
- **Response (200)**: updated `Vehicle` with bumped `updatedAt`.
- **404** if no vehicle with that `id`.

## `DELETE /vehicles/:id`

- **Auth**: public
- **Response (204)**: empty body.
- **404** if no vehicle with that `id`.

## Example

```bash
curl -s http://localhost:3000/vehicles | jq '.[0]'
# → { "id": "V001", "make": "Renault", "model": "Clio", ... }

curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -d '{"make":"Mini","model":"Cooper","year":2020,"vin":"WBA1234567890ABCD","mileageKm":42000}'
```

## Checkpoint test (`test/02-vehicles.e2e-spec.ts`)

- Asserts `GET /vehicles` returns ≥ 12 entries.
- Asserts `POST /vehicles` returns 201 with a server-assigned `id`.
- Asserts `GET /vehicles/:id` round-trips the POSTed vehicle.
- ≤ 35 lines total.
