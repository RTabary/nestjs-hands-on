# Workshop "winks" audit (US5)

**Purpose**: catalog the deliberately playful elements in the codebase
so a reviewer can verify they survive future edits. Per
[research.md R12](../specs/001-nestjs-workshop/research.md#r12-fun-naming-inventory-principle-iii--fr-013),
the workshop targets **about five fun touches across the whole curriculum** —
rare enough that each one lands when an attendee notices it.

The constitution's Principle III ([Fun, Cohesive Auto Domain](../.specify/memory/constitution.md))
calls for at least **3 winks**. We ship **7**.

| # | Element | Type | Where it lives | First appears in |
|---|---------|------|----------------|------------------|
| 1 | **`/vroom` endpoint** | Route | [src/app.controller.ts:13](../src/app.controller.ts) (handler) + [src/app.service.ts:11](../src/app.service.ts) (`VROOM_FACTS` constant) | Step 01 |
| 2 | **Aston Martin DB5 (1964)** | Seed entry V008 | [src/seed/vehicles.seed.ts](../src/seed/vehicles.seed.ts) — line for V008 | Step 02 |
| 3 | **DeLorean DMC-12 (1981)** | Seed entry V009 | [src/seed/vehicles.seed.ts](../src/seed/vehicles.seed.ts) — line for V009 | Step 02 |
| 4 | **Reliant Robin (1976)** | Seed entry V010 | [src/seed/vehicles.seed.ts](../src/seed/vehicles.seed.ts) — line for V010 | Step 02 |
| 5 | **Flux capacitor (Mk II)** | Seed part P020 priced at €88,888.88 | [src/seed/spare-parts.seed.ts](../src/seed/spare-parts.seed.ts) — last entry, only compatible with V009 (DeLorean) | Step 03 |
| 6 | **`MissingFluxCapacitorException`** | Domain exception | [src/common/exceptions/missing-flux-capacitor.exception.ts](../src/common/exceptions/missing-flux-capacitor.exception.ts); thrown by [src/maintenance-orders/maintenance-orders.service.ts](../src/maintenance-orders/maintenance-orders.service.ts) when V009's maintenance order is transitioned to "completed" without P020 in `partIds` | Step 05 |
| 7 | **`PitCrewModule`** (renamed from `AuthModule`) | Module class | [src/auth/pit-crew.module.ts](../src/auth/pit-crew.module.ts), imported by [src/app.module.ts](../src/app.module.ts) | Step 06 (with the auth-themed rename happening in the US5 audit pass) |

## How the winks layer pedagogically

Three of these are **load-bearing**, not just decoration:

- **The DeLorean (V009) + the flux capacitor (P020)** seed the failure case for `MissingFluxCapacitorException` (step 05). The exception is the most memorable single moment in the workshop; the seed wink + the exception name combine to make the teaching point ("custom domain exceptions ride the unified envelope") stick.
- **The `/vroom` endpoint** in step 01 signals the workshop's tone within the first ten minutes — before any attendee has implemented anything. Sets the "this is going to be fun" expectation for the subsequent four hours of code.
- **`PitCrewModule`** is the smallest possible touch: a single class rename in step 06 that gives the auth subsystem some personality without altering its idiomatic NestJS shape. .NET attendees still parse it instantly as "the AuthorizationHandler module".

The other four (Reliant Robin, Aston Martin DB5, the Reliant Robin's three completed maintenance orders, the playful note text in [src/seed/maintenance-orders.seed.ts](../src/seed/maintenance-orders.seed.ts)) are pure ambience — they reward an attendee who pauses to read the seed data, but the workshop functions identically without them.

## Reviewer checklist

When reviewing a future PR that touches the workshop content, verify:

- [ ] `/vroom` still returns one of the seeded fact strings ([test/01-bootstrap.e2e-spec.ts](../test/01-bootstrap.e2e-spec.ts) covers this).
- [ ] Vehicles seed has at least one entry per "wink" (DB5 / DeLorean / Reliant Robin) — a seed entry being deleted should be a deliberate decision, not a drive-by cleanup.
- [ ] Spare-parts seed has `partNumber: 'FLUX-CAP-MK2'` priced at `88_888.88`, compatible only with `V009`.
- [ ] `MissingFluxCapacitorException` test in [test/05-exceptions.e2e-spec.ts](../test/05-exceptions.e2e-spec.ts) still asserts on `409 Conflict` and `'FLUX-CAP-MK2'` in the message.
- [ ] [src/auth/pit-crew.module.ts](../src/auth/pit-crew.module.ts) still exports `PitCrewModule` (not `AuthModule`).

If any of these break, that's a regression on the workshop's personality — file an issue.
