# Phase 1 Data Model: NestJS Hands-On Workshop

**Feature**: 001-nestjs-workshop · **Date**: 2026-04-27 · **Source**: spec.md "Key Entities" + research.md R10

This document captures the **conceptual** entity model the workshop
materials will implement. Concrete TypeScript shapes will be authored
on the appropriate step branches; the model below is the contract
between spec.md, the per-step controllers/DTOs, and the seed roster.

Cardinality, identity strategy, and validation rules are pinned here
so each step's code stays consistent with the rest.

---

## Identity & invariants (cross-cutting)

- **ID strategy**: every entity carries a string `id` field that is a
  zero-padded numeric (e.g., `"V001"`, `"P001"`, `"M001"`). Picked over
  UUIDs because it's recognisable in test output and copy-paste-able
  in `curl` examples. The prefix encodes the entity type (V = Vehicle,
  P = SparePart, MFR = Manufacturer, G = Garage, MEC = Mechanic,
  MO = MaintenanceOrder).
- **Timestamps**: every entity has `createdAt: Date` and `updatedAt:
  Date`. Step 2 (Controllers) uses them as a forcing function for the
  service to actually return *something* meaningful; later steps test
  immutability of `createdAt`.
- **Storage** (core): in-memory `Map<string, Entity>` keyed by `id`,
  inside a `@Injectable()` provider with an `@Module`-scoped lifetime.
  Service providers wrap the maps (no direct map access from
  controllers).
- **Storage** (S2 stretch): TypeORM `@Entity` classes, same fields,
  SQLite-backed. The S2 step authors swap-in a TypeORM-backed provider
  for the same `IRepository<T>` interface introduced in step 3.

---

## E1. Vehicle

**Represents**: A car, truck, or motorcycle in the workshop's domain.

| Field | Type | Constraints | Introduced |
|-------|------|-------------|------------|
| `id` | `string` | matches `/^V\d{3}$/`; immutable | step 2 |
| `make` | `string` | non-empty, ≤ 50 chars | step 2 |
| `model` | `string` | non-empty, ≤ 50 chars | step 2 |
| `year` | `number` | integer, 1900 ≤ year ≤ current year + 1 | step 2 |
| `vin` | `string` | exactly 17 chars, uppercase A–Z 0–9, validated step 4 | step 2 (no validation) → step 4 (validated) |
| `mileageKm` | `number` | integer ≥ 0 | step 2 |
| `manufacturerId` | `string` | matches `/^MFR\d{3}$/`; FK to Manufacturer | step 4 |
| `createdAt` | `Date` | set at creation, never modified | step 2 |
| `updatedAt` | `Date` | set on any field change | step 2 |

**Relationships**:
- `Vehicle.manufacturerId` → `Manufacturer.id` (many-to-one).
- `MaintenanceOrder.vehicleId` → `Vehicle.id` (many-to-one).

**State**: stateless (no lifecycle transitions on the vehicle itself;
mileage and registration update freely).

**Validation rules** (introduced step 4):
- `vin` must be unique across all vehicles in the system → 409 Conflict
  on POST /vehicles if violated (step 5 demonstrates the exception
  filter handling this).
- `year` upper bound enforced at creation time, not on update (an
  attendee can move year to past).
- `mileageKm` may only increase, never decrease, on PATCH (step 5
  demonstrates the exception filter for `BadRequestException` on
  decreasing mileage).

---

## E2. SparePart

**Represents**: A discrete part (engine, brake pad, tire, headlight,
etc.).

| Field | Type | Constraints | Introduced |
|-------|------|-------------|------------|
| `id` | `string` | matches `/^P\d{3}$/`; immutable | step 3 |
| `partNumber` | `string` | non-empty, ≤ 30 chars; unique | step 3 |
| `name` | `string` | non-empty, ≤ 80 chars | step 3 |
| `category` | `'engine' \| 'brakes' \| 'tires' \| 'electrical' \| 'body' \| 'misc'` | enum | step 3 |
| `priceEur` | `number` | non-negative; ≤ 2 decimal places | step 3 |
| `stock` | `number` | non-negative integer | step 3 |
| `compatibleVehicleIds` | `string[]` | each entry matches `/^V\d{3}$/` | step 3 |
| `createdAt` | `Date` | | step 3 |
| `updatedAt` | `Date` | | step 3 |

**Relationships**:
- `SparePart.compatibleVehicleIds` → `Vehicle.id` (many-to-many; the
  array is the join).

**State**: stateless. `stock` is decremented when a `MaintenanceOrder`
in `completed` status references the part.

**Validation rules** (introduced step 4):
- `partNumber` unique → 409 Conflict on duplicate.
- `priceEur` ≥ 0 enforced at creation **and** update.
- `stock` ≥ 0 enforced; over-decrement throws (step 5 covers this with
  a custom `OutOfStockException`).

**Workshop wink** (R10): the seed roster includes `partNumber:
"FLUX-CAP-MK2"` priced at `88888.88` — the only entry above €1000.

---

## E3. Manufacturer

**Represents**: A maker of vehicles or parts (Renault, Ford, BMW,
Toyota, Aston Martin in the seed roster).

| Field | Type | Constraints | Introduced |
|-------|------|-------------|------------|
| `id` | `string` | matches `/^MFR\d{3}$/` | step 4 |
| `name` | `string` | non-empty, ≤ 60 chars; unique | step 4 |
| `country` | `string` | ISO 3166-1 alpha-2 (e.g., `'FR'`, `'DE'`, `'US'`, `'JP'`, `'GB'`); validated by `@Length(2,2)` + `@Matches(/^[A-Z]{2}$/)` | step 4 |
| `foundedYear` | `number` | integer, 1850 ≤ year ≤ current year | step 4 |
| `createdAt` | `Date` | | step 4 |
| `updatedAt` | `Date` | | step 4 |

**Relationships**:
- One Manufacturer ↔ many Vehicles (`Vehicle.manufacturerId`).
- One Manufacturer ↔ many SpareParts via `SparePart.manufacturerId`
  (introduced as a stretch field in S2 to demonstrate TypeORM eager
  loading; not present in core).

**Validation rules**:
- `country` regex enforced at the DTO level — primary teaching point
  for `class-validator`'s `@Matches`.

---

## E4. Garage

**Represents**: A physical workshop location.

| Field | Type | Constraints | Introduced |
|-------|------|-------------|------------|
| `id` | `string` | matches `/^G\d{3}$/` | step 5 |
| `name` | `string` | non-empty, ≤ 80 chars | step 5 |
| `address` | `string` | non-empty, ≤ 200 chars | step 5 |
| `mechanicIds` | `string[]` | each matches `/^MEC\d{3}$/` | step 5 |
| `createdAt` | `Date` | | step 5 |
| `updatedAt` | `Date` | | step 5 |

**Relationships**:
- One Garage ↔ many Mechanics (via `mechanicIds`). A Mechanic belongs
  to **exactly one** Garage at a time; this is enforced by
  `MechanicsService.assignToGarage` which removes the Mechanic from
  their previous Garage's roster.

**Workshop wink** (R10): seed roster includes "Pit Stop Garage", "Doc
Brown's Repair", "Q-Branch Workshop".

---

## E5. Mechanic

**Represents**: A staff member who performs maintenance.

| Field | Type | Constraints | Introduced |
|-------|------|-------------|------------|
| `id` | `string` | matches `/^MEC\d{3}$/` | step 5 |
| `firstName` | `string` | non-empty, ≤ 40 chars | step 5 |
| `lastName` | `string` | non-empty, ≤ 40 chars | step 5 |
| `specialty` | `'electrical' \| 'engine' \| 'body' \| 'general'` | enum | step 5 |
| `garageId` | `string` | matches `/^G\d{3}$/`; non-null | step 5 |
| `createdAt` | `Date` | | step 5 |
| `updatedAt` | `Date` | | step 5 |

**Relationships**:
- Many Mechanics ↔ one Garage.
- Many Mechanics ↔ many MaintenanceOrders (via
  `MaintenanceOrder.mechanicId`).

---

## E6. MaintenanceOrder

**Represents**: A recorded service event linking a vehicle, a mechanic,
a date, parts used, and a status.

| Field | Type | Constraints | Introduced |
|-------|------|-------------|------------|
| `id` | `string` | matches `/^MO\d{3}$/` | step 5 |
| `vehicleId` | `string` | matches `/^V\d{3}$/`; FK | step 5 |
| `mechanicId` | `string` | matches `/^MEC\d{3}$/`; FK | step 5 |
| `partIds` | `string[]` | each matches `/^P\d{3}$/`; ≥ 0 entries | step 5 |
| `scheduledFor` | `Date` | not in the past at creation time | step 5 |
| `status` | `'queued' \| 'in_progress' \| 'completed' \| 'cancelled'` | enum; transitions below | step 5 |
| `notes` | `string?` | optional; ≤ 500 chars | step 5 |
| `createdAt` | `Date` | | step 5 |
| `updatedAt` | `Date` | | step 5 |

**State transitions** (enforced at the service level; violations throw
`BadRequestException` and are caught by the global filter from step 5):

```
queued ──► in_progress ──► completed
   │             │
   └─────────────┴────► cancelled (allowed from queued or in_progress only)
```

- A `completed` order MAY NOT transition further.
- A `cancelled` order MAY NOT transition further.
- A `queued` order cannot skip directly to `completed`.

**Side effects**:
- On transition `in_progress → completed`, each `partIds` entry's
  `SparePart.stock` is decremented by 1 atomically. If any decrement
  would push stock below 0, the transition fails with
  `OutOfStockException` (HTTP 409).

**Workshop wink** (R5/R10): a `POST /maintenance-orders` for
`vehicleId: V008` (the DeLorean) with no `partIds` containing
`P-FLUX-CAP-MK2` triggers a custom `MissingFluxCapacitorException` at
step 5 — both teaches the exception filter and rewards seed-data
inspection.

---

## Entity introduction timeline

This table maps "which step adds which entity to the running API" so
the cumulative-solution guarantee (FR-009) is unambiguous:

| Step | Entities materialised in HTTP surface |
|------|---------------------------------------|
| 01 Bootstrap | (none — `/vroom` is a constant fact-list endpoint, not entity-backed) |
| 02 Controllers | **Vehicle** (CRUD) |
| 03 Providers/DI | **SparePart** (CRUD) — demonstrated as a separate provider injected into a "compatibility" service |
| 04 Validation | **Manufacturer** (CRUD); Vehicle DTO gains validation; Vehicle gains `manufacturerId` FK |
| 05 Exceptions | **Garage**, **Mechanic**, **MaintenanceOrder** (CRUD with state transitions) |
| 06 Guards | (no new entities; existing endpoints become protected by `@UseGuards(ApiKeyGuard)`) |
| 07 Configuration | (no new entities; the API key value previously hard-coded is moved to `.env`) |
| 08 Testing | (no new entities; the test surface is the test code itself) |
| S1 Interceptors | (no new entities; logging interceptor across all routes) |
| S2 Persistence | (no new entities; same shapes, swapped to TypeORM/SQLite) |
| S3 OpenAPI | (no new entities; adds `@ApiProperty` decorators to existing DTOs) |
| S4 WebSockets | (no new entities; emits `'maintenance.completed'` events) |
| S5 Microservices | (no new entities; introduces a `MaintenanceQueue` message-pattern handler) |

---

## DTO ↔ entity mapping

For every entity (E1–E6), step 4 (or the introducing step before
validation, then revisited in step 4) introduces three DTOs:

- `Create<Entity>Dto` — input shape for `POST`. Excludes server-set
  fields (`id`, `createdAt`, `updatedAt`).
- `Update<Entity>Dto` — input shape for `PATCH`. All fields optional;
  excludes `id`, `createdAt`. `class-validator`'s `PartialType` from
  `@nestjs/mapped-types` is used to derive this from the create DTO —
  one of the explicit teaching moments of step 4.
- The entity itself is returned as the response shape (no separate
  response DTO; the workshop deliberately keeps this simple to avoid
  introducing a "view-model" concept that would expand step 4's
  budget).

---

## What this document is NOT

- It is not a TypeScript file. The entity classes / interfaces /
  DTOs are authored on the appropriate step branches as part of
  `/speckit-implement`.
- It is not a SQL schema. The S2 stretch step authors the TypeORM
  `@Entity` classes from this conceptual model; the SQL schema is
  derived by TypeORM's `synchronize: true` (acceptable for a workshop;
  flagged in the S2 markdown's "common pitfalls" as not-for-prod).
- It does not enumerate every API endpoint — see `contracts/` for that.
