# Contract: Step 03 — Providers & Dependency Injection

**Branch pair**: `start/03-providers-dependency-injection` ↔ `solution/03-providers-dependency-injection`
**Cumulative API surface after this step**: 11 endpoints (5 new + 6 from steps 01–02).

Introduces SparePart CRUD plus a derived endpoint that demonstrates DI
across two services (Vehicles + SpareParts → CompatibilityService).

## `GET /spare-parts`

- **Auth**: public · **Response (200)**: `SparePart[]` — full seed list.

## `GET /spare-parts/:id`

- **Auth**: public · **Response (200)**: `SparePart`. **404** if missing.

## `POST /spare-parts`

- **Auth**: public · **Request**: `CreateSparePartDto`. **Response (201)**: created `SparePart`.

## `PATCH /spare-parts/:id`

- **Auth**: public · **Request**: `UpdateSparePartDto`. **Response (200)**: updated `SparePart`. **404** if missing.

## `DELETE /spare-parts/:id`

- **Auth**: public · **Response (204)**.

## `GET /vehicles/:id/compatible-parts`

- **Auth**: public
- **Response (200)**: `SparePart[]` filtered to entries whose
  `compatibleVehicleIds` contains the `:id` path param.
- **404** if no vehicle with that `id`.
- **Why this endpoint exists**: it's the teaching moment for DI. The
  `CompatibilityService` is `@Injectable()` and is constructed with
  both `VehiclesService` and `SparePartsService` injected — the
  classic "service-to-service constructor injection" demo. The .NET
  parallel is the natural one (`services.AddScoped<>` + ctor params).

## Example

```bash
curl -s http://localhost:3000/vehicles/V008/compatible-parts | jq
# → SpareParts compatible with the DeLorean (incl. P-FLUX-CAP-MK2 if seeded)
```

## Checkpoint test (`test/03-spare-parts.e2e-spec.ts`)

- Asserts `GET /spare-parts` returns ≥ 20 entries (incl. flux capacitor).
- Asserts `GET /vehicles/V008/compatible-parts` returns the flux
  capacitor in its result.
- Asserts a 404 for `GET /vehicles/V999/compatible-parts`.
- ≤ 35 lines total.
