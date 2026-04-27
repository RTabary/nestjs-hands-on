# Step 04 — DTOs & Validation Pipes

> **Estimated time: 18 min** &nbsp;·&nbsp; **Branch start**: `start/04-dtos-validation-pipes` &nbsp;·&nbsp; **Branch solution**: `solution/04-dtos-validation-pipes`

## Learning objectives

By the end of this step you will be able to:

1. Annotate a DTO class with `class-validator` decorators and have NestJS reject malformed bodies with **400 Bad Request** automatically.
2. Register `ValidationPipe` globally so the same rules apply to **every** `@Body()` across the API — without per-controller wiring.
3. Derive an "all-fields-optional" update DTO from a create DTO via `PartialType` from `@nestjs/mapped-types`, keeping validation rules in one place.
4. Cross-check a foreign-key reference (here: `Vehicle.manufacturerId → Manufacturer.id`) at the service layer.

## Principle

A **DTO** ("data transfer object") is the typed contract for what the API accepts as input. In NestJS the convention is one class per shape, decorated with `class-validator` rules; `class-transformer` materialises the incoming JSON into instances of that class so the decorators fire. The `ValidationPipe` is the seam that runs both libraries on every `@Body()`-bound parameter.

Three flags on the global `ValidationPipe` carry their weight:

- **`whitelist: true`** strips unknown fields from the input. Defends against payload-pollution attacks.
- **`transform: true`** converts plain JSON into actual DTO instances. Required for the decorators to run; also coerces e.g. `"42"` to `42` if a field is typed `number`.
- **`forbidNonWhitelisted: true`** turns "unknown field" into a 400 error rather than silently dropping it. Helpful in development.

A subtle wrinkle: NestJS pipes registered via `app.useGlobalPipes()` in `main.ts` only fire when the app is bootstrapped through `NestFactory.create(...).listen()`. Tests that boot the app via `Test.createTestingModule(...).createNestApplication()` skip `main.ts` entirely and would silently miss the pipe. The fix this codebase uses: register `ValidationPipe` as a **module-level provider** under the `APP_PIPE` token. Same effect at runtime, but it's part of the AppModule's compiled DI graph, so tests pick it up automatically.

This step also introduces the **Manufacturer** entity and adds a `manufacturerId` foreign key to `Vehicle`. The validation only checks the *format* of `manufacturerId`; existence ("does manufacturer MFR003 actually exist?") is checked in `VehiclesService.create()` because that's a business rule, not a syntax rule.

## .NET parallel

| NestJS construct | ASP.NET Core counterpart | Where the analogy breaks |
|------------------|--------------------------|--------------------------|
| `ValidationPipe` + `class-validator` DTOs | `[ApiController]` auto-validation + `IValidator<T>` (FluentValidation) | NestJS pipes also **transform** (via `class-transformer`); .NET model binding is separate from validation. |
| `PartialType(CreateXxxDto)` from `@nestjs/mapped-types` | `[ApiController]`-aware partial models (e.g., `JsonPatchDocument<T>` in lieu of, or hand-rolled "Update" DTOs) | The "all properties optional" derivation is a single-line construct in NestJS; .NET typically duplicates the class or relies on JSON Patch / Merge Patch. |

If you write `[ApiController]` ASP.NET Core APIs with FluentValidation, the conceptual mapping is one-to-one: `[Required]` ≈ `@IsNotEmpty()`, `[StringLength(50)]` ≈ `@MaxLength(50)`, `[RegularExpression(...)]` ≈ `@Matches(...)`. The differences are mostly cosmetic — TypeScript decorators vs C# attributes — and the runtime behaviour (binding succeeds or fails before your action method runs) is identical.

## How to

You are on `start/04-dtos-validation-pipes`. The vehicles + spare-parts CRUD from steps 02-03 is in place.

1. Create a new feature module at `src/manufacturers/`:
   - `entities/manufacturer.entity.ts` with fields `id, name, country, foundedYear, createdAt, updatedAt`.
   - `dto/create-manufacturer.dto.ts` decorated with `@IsString()`, `@IsNotEmpty()`, `@Length(1, 60)` on `name`; `@Length(2, 2)` + `@Matches(/^[A-Z]{2}$/)` on `country`; `@IsInt()` + `@Min(1850)` + `@Max(2027)` on `foundedYear`.
   - `dto/update-manufacturer.dto.ts` extending `PartialType(CreateManufacturerDto)`.
   - `manufacturers.service.ts` — same shape as the other services. Add an `exists(id: string): boolean` method that VehiclesService will call.
   - `manufacturers.controller.ts` — five CRUD routes prefixed `'manufacturers'`.
   - `manufacturers.module.ts` — declares the controller, exports the service.
2. Update `src/vehicles/dto/create-vehicle.dto.ts` with `class-validator` decorators on every field. The VIN regex is `/^[A-HJ-NPR-Z0-9]{17}$/` (real VIN charset — I, O, Q forbidden). Add a `manufacturerId` field with `@Matches(/^MFR\d{3}$/)`.
3. Replace `src/vehicles/dto/update-vehicle.dto.ts` with `class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}`.
4. Update `src/vehicles/entities/vehicle.entity.ts` to add the `manufacturerId` field.
5. Update `src/vehicles/vehicles.service.ts`:
   - Inject `ManufacturersService` via the constructor.
   - In `create()` and `update()`, call `manufacturers.exists(dto.manufacturerId)` and throw `BadRequestException` if false (a private `assertManufacturerExists` helper keeps it tidy).
6. Update `src/vehicles/vehicles.module.ts`:
   - Add `ManufacturersModule` to `imports`.
7. Register `ValidationPipe` as a module-level provider in `src/app.module.ts`:
   ```ts
   import { APP_PIPE } from '@nestjs/core';
   // …
   providers: [
     AppService,
     {
       provide: APP_PIPE,
       useValue: new ValidationPipe({
         whitelist: true,
         transform: true,
         forbidNonWhitelisted: true,
       }),
     },
   ],
   ```
   You can leave `main.ts` minimal — no `app.useGlobalPipes(...)` line is needed.
8. Add `ManufacturersModule` to `AppModule.imports`.
9. The seed lives at `src/seed/manufacturers.seed.ts` (9 entries covering every make in the vehicles seed). The vehicle seed has been updated with `manufacturerId` for each entry.

## Try it

```bash
npm run start:dev
```

```bash
# 9 seeded manufacturers
curl -s http://localhost:3000/manufacturers | jq 'length'
# → 9

# Validation rejects a malformed VIN — note the structured error body
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -d '{"make":"Mini","model":"Cooper","year":2020,"vin":"TOO_SHORT","mileageKm":42000,"manufacturerId":"MFR003"}' \
| jq
# → { "message": [ "vin must be a 17-character ISO 3779 VIN (no I/O/Q letters)" ], ... }

# Validation rejects a non-ISO country
curl -s -X POST http://localhost:3000/manufacturers \
  -H 'content-type: application/json' \
  -d '{"name":"Bogus","country":"France","foundedYear":1980}' \
| jq

# Forbidden extra field
curl -s -X POST http://localhost:3000/manufacturers \
  -H 'content-type: application/json' \
  -d '{"name":"Workshop Motors","country":"WS","foundedYear":2026,"colour":"red"}' \
| jq
# → { "message": [ "property colour should not exist" ], ... }

# Service-level FK check (manufacturer doesn't exist) — returns 400
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -d '{"make":"Mini","model":"Cooper","year":2020,"vin":"WMWXM5C50K2T12345","mileageKm":42000,"manufacturerId":"MFR999"}' \
| jq
```

## Checkpoint

```bash
npm run test:e2e -- 04-validation
```

Five passing tests covering: manufacturer seed roster, invalid VIN rejection, valid POST round-trip, country-code regex (both rejection and acceptance).

## Going further

- Add a custom validation decorator: `@IsAfter('foundedYear')` for a `Manufacturer` "lastReorganisedYear" field. The `class-validator` docs cover the `registerDecorator` API in ~30 lines.
- Try the equivalent of FluentValidation's `RuleSet` — applying different validation rules per HTTP method. Hint: `class-validator` has a `groups` parameter on every decorator.
- Look up `@nestjs/mapped-types`'s `PickType` and `OmitType`. They compose with `PartialType` for any "subset of fields" DTO.

## Common pitfalls

- **Validation never fires (POST accepts garbage)**: you registered `ValidationPipe` in `main.ts` only. Tests that bootstrap via `Test.createTestingModule` skip `main.ts` — use the `APP_PIPE` token in `AppModule.providers` instead, as shown above.
- **`Cannot find module '@nestjs/mapped-types'`**: install with `npm i @nestjs/mapped-types`. It's a small NestJS-team-maintained package, not part of `@nestjs/core`.
- **`property X should not exist`** on a request you thought was valid: you forgot to add the field to the DTO. `forbidNonWhitelisted: true` errors on any property that isn't declared.
- **Validation fires but fields are still strings on the controller side** (e.g., `year` is `"2020"` instead of `2020`): you forgot `transform: true` on the pipe. Without it, `class-transformer` doesn't coerce.
- **`manufacturerId` regex passes but the manufacturer doesn't actually exist**: the regex only checks the format. The "does it exist?" check is a service-level concern (`VehiclesService.assertManufacturerExists`). Don't try to push existence into a `class-validator` decorator — it would couple your DTO layer to the service layer.
- **`Test.createTestingModule` errors with `Nest can't resolve dependencies of the VehiclesService`**: you added `ManufacturersService` to the constructor but didn't import `ManufacturersModule` in `VehiclesModule.imports`.
