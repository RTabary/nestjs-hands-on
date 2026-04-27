# Contract: Step 08 — Testing

**Branch pair**: `start/08-testing` ↔ `solution/08-testing`
**Cumulative API surface after this step**: 28 endpoints (no new routes).

No new HTTP routes. This step **explicitly teaches** the testing
mechanism that has been silently powering the checkpoint of every
prior step (FR-017).

## Two test types introduced

### 1. Unit tests (`*.spec.ts`)

A new file `src/spare-parts/spare-parts.service.spec.ts` is authored
on the `solution/08-testing` branch and covers:

- `findCompatible(vehicleId)` returns parts whose
  `compatibleVehicleIds` includes the input.
- `decrementStock(partIds)` throws `OutOfStockException` when any part
  would go below 0.

Uses `Test.createTestingModule()` from `@nestjs/testing` to construct
a minimal module with the service under test. No HTTP layer involved.

### 2. End-to-end tests (`*.e2e-spec.ts`)

A new file `test/08-full-flow.e2e-spec.ts` exercises a complete user
journey with `supertest`:
1. `POST /vehicles` (with API key) → 201
2. `POST /maintenance-orders` for the new vehicle → 201
3. `POST /maintenance-orders/:id/transition` to `in_progress` → 200
4. `POST /maintenance-orders/:id/transition` to `completed` → 200
5. `GET /spare-parts/:id` confirms `stock` decremented.

The pre-existing `test/01-…` through `test/07-…` files (the per-step
checkpoint tests) remain untouched — this step adds two new files and
adjusts `package.json`'s `test` and `test:e2e` scripts so attendees can
run the full suite.

## `package.json` script changes

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

## Checkpoint test (the meta-test)

`test/08-full-flow.e2e-spec.ts` itself is the checkpoint. The unit
test file in `src/` is also the checkpoint — both must pass.

- ≤ 70 LOC across both new files combined (per the budget in
  research.md R2).
