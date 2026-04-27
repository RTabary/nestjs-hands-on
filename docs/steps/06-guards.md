# Step 06 — Guards

> **Estimated time: 15 min** &nbsp;·&nbsp; **Branch start**: `start/06-guards`  &nbsp;·&nbsp; **Branch solution**: `solution/06-guards`

## Learning objectives

By the end of this step you will be able to:

1. Implement a `CanActivate` guard that authenticates / authorises a request before it reaches the controller.
2. Use `Reflector` + `SetMetadata` to attach an opt-out marker (`@Public()`) to specific routes — turning a global guard into a default-on-with-exceptions policy.
3. Register the guard globally via the `APP_GUARD` token so it applies to **every** route in the application without per-controller wiring.
4. Reason about NestJS's request-lifecycle ordering: **guard → pipe → handler → interceptor → filter** (and how that affects the error you'd see for a malformed request without the right header).

## Principle

A NestJS **guard** is a class implementing `CanActivate` whose `canActivate(context)` method returns a boolean (or a Promise/Observable thereof). Returning `false` (or throwing) blocks the request from reaching the controller; returning `true` lets it through. This is the workshop's first taste of *cross-cutting concerns* expressed as decorators rather than scattered `if (!auth) return res.status(401)` checks.

The model in this step is deliberately simple: a constant `WORKSHOP_API_KEY = 'pit-pass'` and an `x-api-key` header. The guard reads the header and either returns true or throws `UnauthorizedException` (which becomes 401 — and gets formatted by the step 05 filter).

The interesting twist is the **opt-out**. We register the guard *globally* (every route is protected by default) and then use a `@Public()` decorator to mark exceptions:

```ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Inside the guard, `Reflector.getAllAndOverride` reads metadata from either the route handler **or** the controller class. So you can mark a single route public, or a whole controller. The workshop uses both: `@Public()` on the `AppController` (covers `/health` + `/vroom`) and on every `@Get(...)` of the resource controllers (read access stays open).

Why default-on-with-exceptions instead of default-off-with-`@Auth()`? Because the failure modes differ. With default-off, you can ship a new endpoint and **forget** to protect it — silent leakage. With default-on, you can ship a new endpoint and forget to mark it public — loud breakage during testing. The latter is the better default.

## .NET parallel

| NestJS construct | ASP.NET Core counterpart | Where the analogy breaks |
|------------------|--------------------------|--------------------------|
| `CanActivate` (Guards) | `AuthorizationHandler` + `[Authorize]` policy | NestJS guards run before pipes; .NET authorization runs in a different middleware stage. |

If you've used ASP.NET Core's `[Authorize]` / `[AllowAnonymous]` pair plus a custom `IAuthorizationHandler`, this is the same idea with the names swapped:

| ASP.NET Core | NestJS |
|---|---|
| `[Authorize(Policy = "ApiKey")]` (default-on by global filter) | `APP_GUARD` registration (default-on) |
| `[AllowAnonymous]` | `@Public()` |
| `IAuthorizationHandler.HandleRequirementAsync` | `CanActivate.canActivate` |
| `context.HttpContext.Request.Headers["X-Api-Key"]` | `request.headers['x-api-key']` |

The lifecycle ordering is different though, and worth knowing:

- **NestJS**: middleware → guards → pipes → handler → interceptors (post) → exception filter
- **.NET**: middleware → authentication → authorization → model binding (≈ pipes) → action filter → handler

The practical impact: in NestJS, a request with no `x-api-key` AND a malformed body returns 401 (the guard throws first; the validation pipe never runs). In .NET it depends on filter ordering, but typically also 401 first.

The full mapping is at [docs/dotnet-parallels.md](../dotnet-parallels.md).

## How to

You are on `start/06-guards`. Step 05's exception filter machinery is in place.

1. Author **`src/auth/public.decorator.ts`** with `IS_PUBLIC_KEY = 'isPublic'` and `Public()` exporting `SetMetadata(IS_PUBLIC_KEY, true)`.
2. Author **`src/auth/api-key.guard.ts`**:
   - `@Injectable()` class implementing `CanActivate`.
   - Inject `Reflector` via the constructor.
   - In `canActivate(context)`:
     - Use `reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])`. If `true`, return `true`.
     - Read `request.headers['x-api-key']`. If it equals `WORKSHOP_API_KEY` (the constant exported from this file — `'pit-pass'` for now; relocated to env in step 07), return `true`.
     - Otherwise throw `new UnauthorizedException('Missing or invalid x-api-key header')`.
3. Author **`src/auth/auth.module.ts`** that registers and exports `ApiKeyGuard`.
4. Apply `@Public()` to:
   - The `AppController` class (covers `/health` and `/vroom`).
   - Every `@Get(...)` route on `VehiclesController`, `SparePartsController`, `ManufacturersController`, `GaragesController`, `MechanicsController`, `MaintenanceOrdersController`. Read access stays open; write access (POST/PATCH/DELETE) requires the header.
5. In `AppModule.providers`, register the guard:
   ```ts
   import { APP_GUARD } from '@nestjs/core';
   // …
   { provide: APP_GUARD, useClass: ApiKeyGuard }
   ```
   And add `AuthModule` to `imports`.

The Reflector is provided by `@nestjs/core` — you don't need to register it.

## Try it

```bash
npm run start:dev
```

```bash
# GETs stay open
curl -s http://localhost:3000/vehicles | jq 'length'
# → 12

curl -s http://localhost:3000/health | jq
# → { "status": "ok", "uptimeSec": 3 }

# POST without the header gets a 401 in the unified envelope
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -d '{"make":"Mini","model":"Cooper","year":2020,"vin":"WMWXM5C50K2T12345","mileageKm":42000,"manufacturerId":"MFR003"}' \
| jq
# → { "statusCode": 401, "error": "Unauthorized", "message": "Missing or invalid x-api-key header", ... }

# POST with the right key succeeds
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -H 'x-api-key: pit-pass' \
  -d '{"make":"Mini","model":"Cooper","year":2020,"vin":"WMWXM5C50K2T12345","mileageKm":42000,"manufacturerId":"MFR003"}' \
| jq

# Wrong key → 401
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -H 'x-api-key: nope' \
  -d '{}' | jq
# → 401 (and you'll never see a validation error for the empty body —
#   the guard runs before the pipe)
```

## Checkpoint

```bash
npm run test:e2e -- 06-guards
```

Five passing tests covering: GET stays public, POST without header → 401, POST with correct header → 201, POST with wrong header → 401.

## Going further

- Build a `RolesGuard` that reads `@Roles('admin')` metadata and gates writes by role. The `Reflector` pattern from this step is the same — only the metadata key changes.
- Switch from a static API key to JWT: write a `JwtGuard` that validates `Authorization: Bearer <token>` using `@nestjs/jwt`. The lifecycle and decorator pattern stay identical; only the token-validation logic changes.
- Try **scoped** guards (`@UseGuards(SomeOtherGuard)` on a single controller, on top of the global guard). Notice that ALL applicable guards must return true for the request to proceed — guards stack with AND semantics.

## Common pitfalls

- **`Cannot read properties of undefined (reading 'getAllAndOverride')`** at boot: you forgot to `constructor(private readonly reflector: Reflector) {}` — the Reflector isn't a property you set, it's an injected dependency.
- **Every request returns 401 — even GETs**: you forgot to apply `@Public()` to a controller or its GET routes. Quick check: `grep -r '@Public' src/` should show one line per public route plus the `AppController` class decorator.
- **`@Public()` on a controller class doesn't propagate to its routes**: it does, but only via `getAllAndOverride([handler, class])` (in that order). Using `reflector.get(IS_PUBLIC_KEY, context.getHandler())` alone WON'T see class-level metadata.
- **Test app silently bypasses the guard**: same trap as the validation pipe in step 04. Solution: register via `APP_GUARD` in `AppModule.providers`, NOT via `app.useGlobalGuards()` in `main.ts`.
- **Validation 400 turns into auth 401 unexpectedly**: not a bug — it's NestJS's lifecycle ordering. Guards run before pipes, so an unauthorized request never reaches the validator. If you actually want validation errors visible to unauthenticated callers, you'd need the validation logic to live in a guard or middleware (rare in practice; the 401-first behaviour is usually what you want).
