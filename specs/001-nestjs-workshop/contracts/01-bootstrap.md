# Contract: Step 01 — Bootstrap & Modules

**Branch pair**: `start/01-bootstrap-modules` ↔ `solution/01-bootstrap-modules`
**Cumulative API surface after this step**: 2 endpoints (both new).

## `GET /health`

- **Auth**: public
- **Request body**: —
- **Response (200)**:
  ```json
  { "status": "ok", "uptimeSec": 12 }
  ```
- **Status codes**: 200 only.
- **Example**:
  ```bash
  curl -s http://localhost:3000/health
  # → {"status":"ok","uptimeSec":12}
  ```

## `GET /vroom`

- **Auth**: public
- **Request body**: —
- **Response (200)**:
  ```json
  { "fact": "The first speeding ticket was issued in 1896, at 8 mph." }
  ```
  Server picks one of ~6 hard-coded fun-fact strings at random per request.
- **Status codes**: 200 only.
- **Example**:
  ```bash
  curl -s http://localhost:3000/vroom
  ```

## Checkpoint test (`test/01-bootstrap.e2e-spec.ts`)

- Asserts `GET /health` returns `200` with `status === 'ok'`.
- Asserts `GET /vroom` returns `200` with a non-empty `fact` string.
- ≤ 25 lines total.
