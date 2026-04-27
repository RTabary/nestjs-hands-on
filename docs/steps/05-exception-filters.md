# Step 05 — Exception Filters

> **Estimated time: 12 min** &nbsp;·&nbsp; **Branch start**: `start/05-exception-filters` &nbsp;·&nbsp; **Branch solution**: `solution/05-exception-filters`

## Learning objectives

By the end of this step you will be able to:

1. Throw a NestJS `HttpException` (and its subclasses) and rely on the framework to surface the right status code to the client.
2. Author a custom domain exception (`MissingFluxCapacitorException`) that extends `ConflictException` and carries the right semantics by name.
3. Register a **global exception filter** (`@Catch()` + `ExceptionFilter`) that wraps every uncaught error in a unified envelope shape.
4. Encode a small state machine in the service layer that throws on illegal transitions, and watch the global filter format the error consistently.

## Principle

NestJS gives you two complementary tools for error handling:

- **Throwing**: services and controllers throw `HttpException` (or any subclass like `NotFoundException`, `BadRequestException`, `ConflictException`). NestJS's default exception layer turns the thrown object into the matching HTTP response.
- **Catching**: an `ExceptionFilter` registered with `@Catch()` (no argument = catch everything) lets you customise that response — usually to enforce a uniform body shape across the API.

This step adds three more entities (`Garage`, `Mechanic`, `MaintenanceOrder`) and uses the **MaintenanceOrder transitions** as the teaching surface for both halves. The state machine `queued → in_progress → completed` is enforced in `MaintenanceOrdersService.transition()`. Illegal moves throw `BadRequestException`. Two domain-specific business rules each get their own exception class:

- **`MissingFluxCapacitorException`** (HTTP 409) — fires when a maintenance order on the DeLorean (V009) is transitioned to "completed" but the order's `partIds` doesn't include the flux capacitor (`P-FLUX-CAP-MK2`). This is the wink seeded back at step 03's `src/seed/spare-parts.seed.ts`, now load-bearing.
- **`OutOfStockException`** (HTTP 409) — fires when completing an order would push any referenced part's stock below zero.

Both extend `ConflictException`, which extends `HttpException` — so NestJS already knows to return 409 for them. The custom subclasses exist for **clarity at the throw site** ("we're throwing a domain rule, not just `new HttpException(409, ...)`") and for **filterable behaviour** if you wanted to (e.g., log all `OutOfStockException` separately).

The global filter's job is **uniform shape**:

```json
{ "statusCode": 409, "error": "Conflict", "message": "...", "timestamp": "...", "path": "..." }
```

Every error — validation 400s from step 04, NotFoundExceptions from `findOne`, the new domain exceptions, and even unexpected `Error` throws (which become 500) — get this envelope. Clients have one shape to parse.

## .NET parallel

| NestJS construct | ASP.NET Core counterpart | Where the analogy breaks |
|------------------|--------------------------|--------------------------|
| `HttpException` + `ExceptionFilter` | `IExceptionFilter` + `ProblemDetails` | Conceptually identical; .NET ships a richer `ProblemDetails` standard out of the box. |

If you've used `[ApiController]`'s automatic `ProblemDetails` mapping or written a custom `IExceptionFilter`, the mental model maps over directly:

```csharp
// .NET
public class AllExceptionsFilter : IExceptionFilter {
    public void OnException(ExceptionContext context) {
        context.Result = new ObjectResult(new {
            statusCode = ...,
            error = ...,
            message = ...,
            timestamp = DateTime.UtcNow,
            path = context.HttpContext.Request.Path
        }) { StatusCode = ... };
    }
}
```

In NestJS the same idea is decorator-driven (`@Catch()` on the class) and the context comes from `ArgumentsHost.switchToHttp()`. The "unified envelope" pattern is so common that the .NET ecosystem gave it a name (`ProblemDetails`); NestJS leaves the shape to you.

The full mapping is at [docs/dotnet-parallels.md](../dotnet-parallels.md).

## How to

You are on `start/05-exception-filters`. Steps 01-04's content is in place.

1. Create three new feature modules — `src/garages/`, `src/mechanics/`, `src/maintenance-orders/` — mirroring the structure of the previous steps. Each has an entity, a CRUD DTO pair, a service, a controller, and a module.
2. Author **`src/common/exceptions/missing-flux-capacitor.exception.ts`** extending `ConflictException`. Constructor takes the `vehicleId`; the message reads "Vehicle V009 cannot have a maintenance order completed without P-FLUX-CAP-MK2".
3. Author **`src/common/exceptions/out-of-stock.exception.ts`** extending `ConflictException`. Message: "SparePart P00X is out of stock".
4. Author **`src/common/filters/all-exceptions.filter.ts`** decorated with `@Catch()` (no argument). Implement `catch(exception, host)` to:
   - default `status = 500`, `error = 'Internal Server Error'`, `message = 'Internal server error'`;
   - if `exception instanceof HttpException`, extract status, then read `getResponse()` and pull `error` + `message` off it (handles both string and object responses);
   - return `response.status(status).json({ statusCode, error, message, timestamp, path })`.
5. In `MaintenanceOrdersService.transition()`:
   - Walk the state-machine map: `{ queued: ['in_progress', 'cancelled'], in_progress: ['completed', 'cancelled'], completed: [], cancelled: [] }`. Illegal moves throw `BadRequestException`.
   - Before transitioning to `completed`, run the flux-capacitor check (V009 + missing P020 → throw `MissingFluxCapacitorException`).
   - Then dry-run a stock check (any part with `stock <= 0` → throw `OutOfStockException`), then commit the decrement.
6. Add `decrementStock(id)` to `SparePartsService` (single-line implementation: find, decrement, update timestamp).
7. The transition controller endpoint is `POST /maintenance-orders/:id/transition`. Decorate with `@HttpCode(HttpStatus.OK)` — semantically a state mutation, not a creation, so 200 is more accurate than NestJS's default 201 for `@Post`.
8. Wire all three new modules into `AppModule.imports`.
9. Register the filter via `APP_FILTER` in `AppModule.providers`:
   ```ts
   { provide: APP_FILTER, useClass: AllExceptionsFilter }
   ```
   Same module-level reasoning as step 04's `APP_PIPE` — tests pick it up automatically.

## Try it

```bash
npm run start:dev
```

```bash
# 404 in the unified envelope
curl -s http://localhost:3000/vehicles/V999 | jq
# → { "statusCode": 404, "error": "Not Found", "message": "Vehicle V999 not found", "timestamp": "...", "path": "/vehicles/V999" }

# Trigger the flux-capacitor exception
ORDER=$(curl -s -X POST http://localhost:3000/maintenance-orders \
  -H 'content-type: application/json' \
  -d '{"vehicleId":"V009","mechanicId":"MEC001","partIds":[],"scheduledFor":"2026-12-31T09:00:00Z"}' | jq -r .id)

curl -s -X POST http://localhost:3000/maintenance-orders/$ORDER/transition \
  -H 'content-type: application/json' \
  -d '{"status":"in_progress"}' | jq

curl -s -X POST http://localhost:3000/maintenance-orders/$ORDER/transition \
  -H 'content-type: application/json' \
  -d '{"status":"completed"}' | jq
# → 409 with the MissingFluxCapacitorException message

# An illegal transition (queued → completed without going through in_progress)
curl -s -X POST http://localhost:3000/maintenance-orders/MO001/transition \
  -H 'content-type: application/json' \
  -d '{"status":"completed"}' | jq
# → 400 "Illegal transition: queued → completed"
```

## Checkpoint

```bash
npm run test:e2e -- 05-exceptions
```

Two passing tests covering: unified envelope on 404, and the flux-capacitor exception flow on the DeLorean.

## Going further

- Add an exception filter scoped to ONE controller: decorate the controller with `@UseFilters(YourFilter)` and watch how it overrides the global one. Useful when, e.g., a third-party integration needs different error semantics.
- Look up `class-transformer`'s `Expose`/`Exclude` decorators. The global filter currently exposes the raw error message; in production you'd often want to redact stack traces and internal exception details. The pattern: a separate `ProductionExceptionFilter` that only fires when `process.env.NODE_ENV === 'production'`.
- The `MissingFluxCapacitorException` extends `ConflictException` (409). Try changing it to extend a different status — say, `BadRequestException` (400). Re-run the test. Notice that the assertion on `error: 'Conflict'` fails — good reminder that the HTTP status names are semantically load-bearing.

## Common pitfalls

- **`Cannot read properties of undefined (reading 'getStatus')`** in your filter: you forgot the `instanceof HttpException` guard. Plain `Error` objects don't have `.getStatus()`.
- **The validation 400s from step 04 lose their array message** after the filter is registered: you destructured `body` carelessly in the filter and dropped `message: string[]`. Make sure your filter falls through to `obj.message ?? exception.message`.
- **`POST /maintenance-orders` succeeds even for V999**: you forgot the FK check in `MaintenanceOrdersService.assertValidReferences`. Calling `vehicles.findOne(id)` (which throws `NotFoundException`) is the simplest way to validate.
- **Stock decrements partially before throwing**: dry-run THEN commit. If you decrement on the same loop where you check, an `OutOfStockException` thrown halfway through leaves the API in an inconsistent state.
- **Transition returns 201 instead of 200**: NestJS defaults `@Post` to 201. The transition is a state mutation, not a creation — use `@HttpCode(HttpStatus.OK)`.
