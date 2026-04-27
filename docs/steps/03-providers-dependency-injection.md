# Step 03 — Providers & Dependency Injection

> **Estimated time: 15 min** &nbsp;·&nbsp; **Branch start**: `start/03-providers-dependency-injection` &nbsp;·&nbsp; **Branch solution**: `solution/03-providers-dependency-injection`

## Learning objectives

By the end of this step you will be able to:

1. Compose business logic across multiple modules by **injecting one service into another**.
2. Resolve a circular module dependency by registering a provider in the "consumer" module rather than the "owner" module.
3. Recognise when a service belongs to its own module versus when it should ride alongside the module that uses it.

## Principle

A NestJS **provider** is any class registered in a `@Module`'s `providers` array. By default each provider is a **singleton** scoped to the module — there's exactly one instance, created lazily, shared by every consumer. Constructor parameters typed as classes are resolved by the DI container at instantiation: this is the *exact* mechanism ASP.NET Core's `IServiceProvider` uses, just expressed via TypeScript decorators instead of explicit `services.AddScoped<T>()` calls.

This step introduces a brand-new feature module — `SparePartsModule` with its own controller, service, and DTOs — and a third service, `CompatibilityService`, that **injects both** `VehiclesService` and `SparePartsService`. The CompatibilityService answers a question that's not naturally owned by either feature alone: "given a vehicle, which parts fit it?". That's the bread-and-butter use case for service-to-service composition.

There's a small architectural puzzle to solve: where does CompatibilityService **live**? If it sat in `SparePartsModule`, then SparePartsModule would need to import VehiclesModule (to inject VehiclesService), AND VehiclesModule would need to import SparePartsModule (to expose the new compatibility route). That's a circular module import — NestJS hates it.

The fix: **register CompatibilityService in `VehiclesModule`** (which already imports SparePartsModule). The dependency direction stays one-way (`vehicles → spare-parts`), no cycle. The service file itself can live wherever makes architectural sense; in this codebase we put it under `src/spare-parts/` because compatibility is conceptually about parts.

## .NET parallel

| NestJS construct | ASP.NET Core counterpart | Where the analogy breaks |
|------------------|--------------------------|--------------------------|
| `@Injectable()` provider (default scope) | `services.AddScoped<T>()` | NestJS default is **singleton**, not scoped; the per-request scope is opt-in via `{ scope: Scope.REQUEST }`. |
| Constructor injection in NestJS | Constructor injection in .NET | Identical pattern; only difference is decorator metadata vs source generators. |

If you wrote a "compatibility lookup" in ASP.NET Core, it would look almost identical:

```csharp
public class CompatibilityService {
    private readonly IVehiclesService _vehicles;
    private readonly ISparePartsService _spareParts;
    public CompatibilityService(IVehiclesService v, ISparePartsService s) {
        _vehicles = v; _spareParts = s;
    }
    public IEnumerable<SparePart> FindCompatible(string vehicleId) =>
        _spareParts.FindAll().Where(p => p.CompatibleVehicleIds.Contains(vehicleId));
}
```

The only translations: `[Injectable]` becomes `@Injectable()`; you don't need an `IXxxService` interface (NestJS resolves by class identity); and module ownership has to be explicit because there's no "single root container" the way `WebApplicationBuilder.Services` is.

The full mapping is at [docs/dotnet-parallels.md](../dotnet-parallels.md).

## How to

You are on `start/03-providers-dependency-injection`. The vehicles CRUD from step 02 is in place.

1. Create a new module at `src/spare-parts/` mirroring the vehicles structure:
   - `entities/spare-part.entity.ts` with fields `id, partNumber, name, category, priceEur, stock, compatibleVehicleIds, createdAt, updatedAt`. `category` is a union literal type: `'engine' | 'brakes' | 'tires' | 'electrical' | 'body' | 'misc'`.
   - `dto/create-spare-part.dto.ts`, `dto/update-spare-part.dto.ts` — same fields as the entity minus the server-set ones; no validation yet.
   - `spare-parts.service.ts` — same shape as `VehiclesService`: in-memory `Map`, `onModuleInit` registers and reads the seed, ID format `'P' + nextNum.padStart(3, '0')`.
   - `spare-parts.controller.ts` — five CRUD routes mirroring vehicles, prefix `'spare-parts'`.
   - `spare-parts.module.ts` — declares the controller, registers + **exports** `SparePartsService` so other modules can inject it.
2. Create `src/spare-parts/compatibility.service.ts`. Make it `@Injectable()` and inject **both** `VehiclesService` and `SparePartsService` via the constructor. Add one method:
   ```ts
   findCompatible(vehicleId: string): SparePart[] {
     this.vehicles.findOne(vehicleId); // throws 404 if unknown
     return this.spareParts
       .findAll()
       .filter((p) => p.compatibleVehicleIds.includes(vehicleId));
   }
   ```
3. Update `src/vehicles/vehicles.module.ts`:
   - `imports: [SparePartsModule]` (so SparePartsService is resolvable).
   - `providers: [VehiclesService, CompatibilityService]` (CompatibilityService is registered HERE, even though its file lives under `src/spare-parts/` — see Principle above for why).
4. Update `src/vehicles/vehicles.controller.ts`:
   - Add a second constructor parameter: `private readonly compatibility: CompatibilityService`.
   - Add a route `@Get(':id/compatible-parts') findCompatibleParts(@Param('id') id: string)` that returns `this.compatibility.findCompatible(id)`.
5. Wire `SparePartsModule` into `AppModule.imports` (alongside the existing `VehiclesModule`).
6. The seed lives at `src/seed/spare-parts.seed.ts`. Take a look — there are 20 parts spanning all six categories. **Spot the wink**: `partNumber: 'FLUX-CAP-MK2'`, priced at €88,888.88, compatible only with vehicle `V009`. Step 05 will use this for an exception-filter teaching moment.

## Try it

```bash
npm run start:dev
```

```bash
# Browse the catalog
curl -s http://localhost:3000/spare-parts | jq 'length'
# → 20

# Find parts that fit the Renault Clio (V001)
curl -s http://localhost:3000/vehicles/V001/compatible-parts | jq '. | length'
# → ~10

# Find parts that fit the DeLorean (V009) — the joke is right there
curl -s http://localhost:3000/vehicles/V009/compatible-parts | jq '.[].partNumber'
# → "BRK-FLD-008", "WPR-BLD-017", "FLUX-CAP-MK2"  (the universal fluid + wipers + the wink)

# Unknown vehicle returns 404 (the lookup goes through VehiclesService)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/vehicles/V999/compatible-parts
# → 404
```

## Checkpoint

```bash
npm run test:e2e -- 03-spare-parts
```

Three passing tests:

```
PASS test/03-spare-parts.e2e-spec.ts
  ✓ GET /spare-parts returns the seeded roster (≥ 20 entries)
  ✓ GET /vehicles/V009/compatible-parts includes the flux capacitor
  ✓ GET /vehicles/V999/compatible-parts returns 404 (vehicle unknown)
```

If the third test fails with a 404 message that mentions `SparePart V999` instead of `Vehicle V999`, you swapped the lookup order — `findCompatible` should call `vehicles.findOne` first, **then** filter the parts list.

## Going further

- Add a fourth route on the spare-parts side: `GET /spare-parts/by-category/:category` that returns all parts in a category. Practice using `@Param('category')` with the `SparePartCategory` union type.
- Try moving CompatibilityService **back** into `SparePartsModule` (with `imports: [VehiclesModule]`). Watch NestJS complain about the circular dependency. Then revert — that's the lived experience of the architectural rule.
- Look up `forwardRef()` in the NestJS docs. It's the escape hatch when circular dependencies are genuinely needed (rare in practice). Knowing it exists is enough; reaching for it should be your last resort.

## Common pitfalls

- **`Nest can't resolve dependencies of the CompatibilityService`** at boot: you registered CompatibilityService in `SparePartsModule.providers` instead of `VehiclesModule.providers`. SparePartsModule doesn't import VehiclesModule, so VehiclesService isn't visible there.
- **`Nest can't resolve dependencies of the VehiclesController. Please make sure that the argument CompatibilityService at index [1] is available`**: you forgot to add `CompatibilityService` to `VehiclesModule.providers`. Importing the file is not enough — the provider must be registered.
- **`Cannot find module './compatibility.service'`** errors: the file path is `src/spare-parts/compatibility.service.ts` but the imports in `vehicles.module.ts` and `vehicles.controller.ts` reference `'../spare-parts/compatibility.service'` (one folder up).
- **`/vehicles/:id/compatible-parts` returns the wrong shape**: a common typo is `findCompatible(id)` returning `Vehicle[]` instead of `SparePart[]`. Look at what your `filter` is iterating over.
