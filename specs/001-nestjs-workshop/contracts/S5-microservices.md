# Contract: Stretch S5 — Microservices

**Branch pair**: `start/S5-microservices` ↔ `solution/S5-microservices`
(branched from `solution/08-testing`)

Adds an in-process NestJS microservice on the TCP transport (loopback)
and a single HTTP route that dispatches to it.

## In-process microservice

- **Transport**: `Transport.TCP` on `127.0.0.1:4001`.
- **Hybrid app**: the same Nest application boots BOTH the HTTP server
  on `:3000` and the microservice listener on `:4001`. No second
  process, no Docker, no external broker. (Per research.md R7.)

### Message pattern

- **`'maintenance.queue'`** — payload `{ vehicleId: string,
  scheduledFor: string }`. Handler creates a `MaintenanceOrder` in
  status `'queued'` and returns the new order's `id`.

## HTTP route added

### `POST /dyno/queue`

- **Auth**: protected (requires `x-api-key`).
- **Request body**:
  ```json
  { "vehicleId": "V003", "scheduledFor": "2026-05-10T09:00:00Z" }
  ```
- **Response (201)**:
  ```json
  { "orderId": "MO012", "queuedVia": "microservice" }
  ```
- **Implementation**: the `DynoController` is constructor-injected
  with a `ClientProxy` (TCP, `:4001`) and uses
  `client.send('maintenance.queue', body)` to dispatch. The `.send()`
  observable is awaited and the resolved `id` is wrapped in the
  response.

## What changes structurally

- `package.json` adds `@nestjs/microservices`.
- `main.ts` becomes a hybrid bootstrap:
  ```ts
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice({ transport: Transport.TCP, options: { host: '127.0.0.1', port: 4001 } });
  await app.startAllMicroservices();
  await app.listen(3000);
  ```
- New `src/dyno/dyno.controller.ts` for the HTTP route, plus
  `src/dyno/maintenance.controller.ts` (the microservice message
  handler — reusing the `Controller` decorator with `@MessagePattern`).
- New `src/dyno/dyno.module.ts` registers a `ClientsModule.register`
  pointing at the same TCP port.

## .NET parallel called out

NestJS microservice + `ClientProxy` ≈ MassTransit / NServiceBus
in-memory transport. `@MessagePattern('maintenance.queue')` ≈ a
MassTransit `IConsumer<MaintenanceQueue>` registered with the
in-memory bus. The "two ports, one process" pattern is a NestJS-ism
without a direct .NET equivalent.

## Checkpoint test (`test/S5-microservices.e2e-spec.ts`)

- Boots the hybrid app (HTTP on a random free port + microservice on
  another random free port).
- Asserts `POST /dyno/queue` with valid body returns 201 with an
  `orderId` matching `/^MO\d{3}$/`.
- Asserts the new order is also fetchable via `GET
  /maintenance-orders/:id` and is in status `'queued'`.
- ≤ 60 lines total.
