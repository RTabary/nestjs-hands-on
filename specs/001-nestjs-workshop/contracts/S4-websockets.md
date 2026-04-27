# Contract: Stretch S4 — WebSockets

**Branch pair**: `start/S4-websockets` ↔ `solution/S4-websockets`
(branched from `solution/08-testing`)

Adds a WebSocket gateway alongside the HTTP API.

## WS namespace `/dyno`

- **Connection**: `ws://localhost:3000/dyno` (using socket.io
  defaults).
- **Auth**: optional `?apiKey=pit-pass` query param. If present,
  validated; if absent, the connection is allowed (read-only events
  only).

### Server → client events

- **`'maintenance.completed'`** — emitted whenever a
  `MaintenanceOrder` transitions to `'completed'` (i.e., on every
  successful `POST /maintenance-orders/:id/transition` with
  `status: 'completed'`).
  Payload:
  ```json
  {
    "orderId": "MO007",
    "vehicleId": "V008",
    "mechanicId": "MEC001",
    "completedAt": "2026-04-27T15:11:42.000Z"
  }
  ```

### Client → server events

- None (server-push only in this stretch).

## What changes structurally

- `package.json` adds `@nestjs/websockets` + `@nestjs/platform-socket.io`.
- New `src/dyno/dyno.gateway.ts` decorated with
  `@WebSocketGateway({ namespace: 'dyno' })` + `@SubscribeMessage`
  (just one connection-handler hook).
- `MaintenanceOrdersService` gains a `DynoGateway` constructor injection
  and calls `gateway.broadcastCompleted(order)` on transition.
- A trivial `public/dyno.html` test client is included so attendees
  can open it in a browser and watch events fire when they POST a
  transition. The static-files middleware to serve `public/` is wired
  in `main.ts`.

## .NET parallel called out

`@WebSocketGateway` ≈ SignalR `Hub`; `@SubscribeMessage('foo')` ≈
hub method named `Foo`. The .NET framework integrates this directly
into `IServiceCollection.AddSignalR()`.

## Checkpoint test (`test/S4-websockets.e2e-spec.ts`)

- Boots the full app.
- Connects a `socket.io-client` to `ws://localhost:3000/dyno`.
- Posts a maintenance-order transition to `'completed'` via HTTP.
- Asserts the `'maintenance.completed'` event fires within 1 second
  with the expected payload shape.
- ≤ 60 lines total.
