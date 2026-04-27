# Step 02 — Controllers & Routing

> **Estimated time: 15 min** &nbsp;·&nbsp; **Branch start**: `start/02-controllers-routing` &nbsp;·&nbsp; **Branch solution**: `solution/02-controllers-routing`

## Learning objectives

By the end of this step you will be able to:

1. Build a feature **module** containing a controller, a service, and the DTOs the controller binds.
2. Use NestJS's HTTP-method decorators (`@Get`, `@Post`, `@Patch`, `@Delete`) and parameter decorators (`@Body`, `@Param`).
3. Wire an in-memory repository into a service so the API has data to return — using the workshop's `SeedService` rather than re-rolling the Map yourself.

## Principle

A NestJS **controller** is "just a class" decorated with `@Controller('vehicles')`. The path argument fixes the route prefix; each method decorated with `@Get`, `@Post` etc. adds a route relative to that prefix. Method parameters are bound to the request via further decorators — `@Param('id') id: string` reads the path segment, `@Body() dto: CreateVehicleDto` reads the parsed JSON body.

The data layer for this step is intentionally **boring**: an in-memory `Map<string, Vehicle>` inside `VehiclesService`. The seed roster is registered with the global `SeedService` (introduced as foundational infrastructure) so the data survives app reloads in dev mode and is shared with later step modules. Persistence — making this survive a server restart — arrives in stretch step S2.

A few things this step does **not** introduce yet (and that's deliberate):

- **Validation**: the `CreateVehicleDto` is just a class with field declarations, no `class-validator` decorators yet. `POST /vehicles` will happily accept any shape with the right field names. This is fixed in step 04.
- **Manufacturers**: vehicles don't yet reference a manufacturer. The `manufacturerId` foreign key is added in step 04 when manufacturers themselves are introduced.
- **Auth**: every route is open. Step 06 retrofits authorization.

## .NET parallel

| NestJS construct | ASP.NET Core counterpart | Where the analogy breaks |
|------------------|--------------------------|--------------------------|
| `@Controller('vehicles')` | `[ApiController] [Route("vehicles")]` | NestJS routing is purely decorator-driven; .NET has both attribute and conventional routing. |
| `@Get()` / `@Post()` / `@Body()` / `@Param()` | `[HttpGet] [HttpPost] [FromBody] [FromRoute]` | Direct one-to-one. |

`VehiclesController` plays the same role as a `[ApiController] VehiclesController : ControllerBase`. The closest .NET pattern is:

```csharp
[ApiController]
[Route("vehicles")]
public class VehiclesController : ControllerBase {
    private readonly VehiclesService _vehicles;
    public VehiclesController(VehiclesService vehicles) { _vehicles = vehicles; }

    [HttpGet] public IActionResult GetAll() => Ok(_vehicles.FindAll());
    [HttpGet("{id}")] public IActionResult GetOne(string id) => Ok(_vehicles.FindOne(id));
    [HttpPost] public IActionResult Create([FromBody] CreateVehicleDto dto) => Created(...);
    // …
}
```

Same constructor injection, same per-method routing, same parameter binding. The only translation is that `[FromBody]` becomes `@Body()` and you put the route prefix in the class decorator instead of `[Route(...)]`.

The full mapping is at [docs/dotnet-parallels.md](../dotnet-parallels.md).

## How to

You are on `start/02-controllers-routing`. The step 01 deliverable (`/health`, `/vroom`) is already in place. Your job is to add `/vehicles` CRUD.

1. Create a new feature module at `src/vehicles/` with:
   - `entities/vehicle.entity.ts` — a plain class with `id, make, model, year, vin, mileageKm, createdAt, updatedAt` (use `!` field initializers since these are populated at construction, not at declaration).
   - `dto/create-vehicle.dto.ts` — `make, model, year, vin, mileageKm` (no validation yet).
   - `dto/update-vehicle.dto.ts` — same fields, all optional.
2. Author `vehicles.service.ts` (`@Injectable()`):
   - Hold a `private readonly store = new Map<string, Vehicle>()`.
   - In `onModuleInit()`: register the workshop's vehicle seed roster with `SeedService` (the seed file lives at `src/seed/vehicles.seed.ts`), then copy each entry into your `store`.
   - Implement `findAll()`, `findOne(id)`, `create(dto)`, `update(id, dto)`, `remove(id)`. `findOne` and `remove` throw `NotFoundException` for unknown IDs (NestJS turns this into a 404 automatically).
   - For `create`, generate the next ID as `'V' + nextNum.padStart(3, '0')` — keep a `nextNum` counter that starts past the highest seed ID.
3. Author `vehicles.controller.ts` (`@Controller('vehicles')`):
   - Inject `VehiclesService`.
   - Five routes: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`.
   - On `DELETE`, set the response status to `204 No Content` via `@HttpCode(HttpStatus.NO_CONTENT)`.
4. Author `vehicles.module.ts` declaring the controller and service.
5. Wire `VehiclesModule` into `AppModule`'s `imports` array.

## Try it

```bash
npm run start:dev
```

```bash
# 12 seeded vehicles
curl -s http://localhost:3000/vehicles | jq 'length'
# → 12

# A specific vehicle
curl -s http://localhost:3000/vehicles/V008 | jq
# → { "id": "V008", "make": "Aston Martin", "model": "DB5", "year": 1964, ... }

# 404 for unknown ID
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/vehicles/V999
# → 404

# Create a new vehicle (no validation yet — try a malformed body to see)
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -d '{"make":"Mini","model":"Cooper","year":2020,"vin":"WMWXM5C50K2T12345","mileageKm":42000}' \
| jq

# Update it (use the ID returned above)
curl -s -X PATCH http://localhost:3000/vehicles/V013 \
  -H 'content-type: application/json' \
  -d '{"mileageKm":43500}' \
| jq

# Delete it
curl -s -X DELETE -o /dev/null -w "%{http_code}\n" http://localhost:3000/vehicles/V013
# → 204
```

## Checkpoint

```bash
npm run test:e2e -- 02-vehicles
```

Three passing tests:

```
PASS test/02-vehicles.e2e-spec.ts
  Step 02 — Controllers & Routing (e2e)
    ✓ GET /vehicles returns the seeded roster (≥ 12 entries)
    ✓ POST /vehicles creates a vehicle and round-trips via GET /:id
    ✓ GET /vehicles/:id returns 404 for an unknown id
```

Move on to step 03 with `git checkout start/03-providers-dependency-injection` (once that branch lands — for the MVP delivery, the workshop currently ends here, with vehicles only).

## Going further

- Inspect the seed roster at `src/seed/vehicles.seed.ts`. There are three deliberate winks — can you spot them? (Hint: 1964, 1981, 1976.)
- Try creating a vehicle with `mileageKm: -1` or `year: 1700`. The API accepts it. That's because validation hasn't been wired in yet — step 04 fixes this.
- Try the `Reliant Robin` (`V010`) — its mileage is suspiciously low for a 1976 vehicle. Maybe the previous owner only drove it on Sundays.

## Common pitfalls

- **`Cannot find module './vehicles/vehicles.module'`** when starting the app: you forgot to add `VehiclesModule` to `AppModule.imports`. NestJS doesn't auto-discover modules.
- **`Nest can't resolve dependencies of the VehiclesService`** at boot: `SeedService` is injected from `SeedModule`. `SeedModule` is `@Global` so you don't need to add it to `VehiclesModule.imports` — but it still must be in `AppModule.imports` (which it already is from step 01).
- **`POST /vehicles` returns 200 instead of 201**: NestJS defaults to 201 for `@Post`-decorated methods automatically — but if you forgot the decorator and used `@Get` by mistake, you'd get 200. Re-check.
- **`DELETE /vehicles/:id` returns 200 instead of 204**: add `@HttpCode(HttpStatus.NO_CONTENT)` to the controller method. The default is 200.
- **The created vehicle has `id: undefined`**: you forgot the `nextNum` counter, or you're using `Map.size + 1` (which collides after deletes). Track `nextNum` separately and increment in `create`.
