# Step 01 — Bootstrap & Modules

> **Estimated time: 8 min** &nbsp;·&nbsp; **Branch start**: `start/01-bootstrap-modules` &nbsp;·&nbsp; **Branch solution**: `solution/01-bootstrap-modules`

## Learning objectives

By the end of this step you will be able to:

1. Identify the **three primitives** every NestJS application is built from: `@Module`, `@Controller`, `@Injectable()`.
2. Run a NestJS app from a clean clone with three commands: `npm install`, `npm run start:dev`, `curl`.
3. Add a new HTTP route by editing exactly two files (a controller method + a service method).

## Principle

A NestJS application is a graph of **modules**. Each module declares which **controllers** handle HTTP requests and which **providers** (typically services) carry the business logic. The framework wires everything together at boot time using **dependency injection**, exactly the way ASP.NET Core's `IServiceCollection` does — except the registration is implicit in the `@Module({ controllers, providers })` metadata rather than spelled out in `Program.cs`.

The bootstrap entry point is [src/main.ts](../../src/main.ts):

```ts
const app = await NestFactory.create(AppModule);
await app.listen(3000);
```

`AppModule` is the **root module**. It currently imports a single `SeedModule` (which provides the in-memory seed registry the workshop relies on) and declares one controller + one service. Every step from here on adds more modules to this graph.

## .NET parallel

| NestJS construct | ASP.NET Core counterpart | Where the analogy breaks |
|------------------|--------------------------|--------------------------|
| `@Module({ imports, controllers, providers, exports })` | `IServiceCollection` registrations + assembly boundary + a `ConfigureServices` per "module" | NestJS modules are explicit at the class level; .NET has no first-class "module" type — the convention is per-assembly. |
| `@Injectable()` provider (default scope) | `services.AddScoped<T>()` | NestJS default is **singleton**, not scoped; the per-request scope is opt-in via `{ scope: Scope.REQUEST }`. |

If you've ever wondered "where does ASP.NET Core actually decide which controllers handle which routes?" — in NestJS that decision lives entirely in the `@Controller('vehicles')` decorator and the `controllers: [VehiclesController]` array of its module. There is no `MapControllers()`-equivalent ceremony in the bootstrap file.

The full mapping table is at [docs/dotnet-parallels.md](../dotnet-parallels.md).

## How to

You are on `start/01-bootstrap-modules`. Run `npm install` if you haven't yet, then make the failing checkpoint test pass.

1. Open [src/app.controller.ts](../../src/app.controller.ts). The class exists but has zero routes — only the `@Controller()` decorator. Add **two** route methods, both decorated with `@Get(...)`:
   - `getHealth()` returning `this.appService.getHealth()` on `GET /health`.
   - `getVroom()` returning `this.appService.getVroom()` on `GET /vroom`.

   Don't forget to inject `AppService` via the constructor (`constructor(private readonly appService: AppService) {}`).

2. Open [src/app.service.ts](../../src/app.service.ts). Add the matching methods:
   - `getHealth()` returns `{ status: 'ok' as const, uptimeSec: <whole seconds since boot> }`. Track the boot time with a `private readonly bootedAt = Date.now()` field.
   - `getVroom()` returns `{ fact: <one of ~6 hard-coded car-fact strings, picked at random> }`. Hold the strings in a module-level `const VROOM_FACTS: ReadonlyArray<string> = [...]`.

That's it. Don't touch `src/main.ts`, `src/app.module.ts`, or anything in `src/seed/` — they're already wired correctly.

## Try it

In one terminal, start the app:

```bash
npm run start:dev
```

In another:

```bash
curl -s http://localhost:3000/health | jq
# → { "status": "ok", "uptimeSec": 12 }

curl -s http://localhost:3000/vroom | jq
# → { "fact": "The first speeding ticket was issued in 1896 — to a driver going 8 mph." }
```

`/vroom` returns a different fact each call.

## Checkpoint

Stop the dev server (`Ctrl+C`) and run:

```bash
npm run test:e2e -- 01-bootstrap
```

You should see **two passing tests** in `test/01-bootstrap.e2e-spec.ts`:

```
PASS test/01-bootstrap.e2e-spec.ts
  Step 01 — Bootstrap & Modules (e2e)
    ✓ GET /health returns ok
    ✓ GET /vroom returns a fun fact
```

Green = step done. Move on to step 02 with `git checkout start/02-controllers-routing`.

If the test fails, the error message names the file and line in `src/` that needs adjusting. You don't need to read the test file yet — step 08 covers that. If you're curious, [test/01-bootstrap.e2e-spec.ts](../../test/01-bootstrap.e2e-spec.ts) is short and open for inspection.

## Going further

- Add a third route — `GET /version` — that returns `{ version: '0.1.0' }`. The version string can be hard-coded for now; step 07 (Configuration) will show you how to read it from `package.json` properly.
- Open `src/app.module.ts` and notice `imports: [SeedModule]`. Run the app: the boot log includes a line `Seed roster ready (empty)`. The seed module is wired but no entity has registered any data with it yet — vehicles arrive in step 02.

## Common pitfalls

- **"`Cannot read properties of undefined (reading 'getHealth')`"**: you forgot to inject `AppService` in `AppController`'s constructor. NestJS uses constructor injection — the `private readonly appService: AppService` parameter shorthand creates the field automatically.
- **"`404 Not Found`" on `GET /health` even though you added the method**: check the `@Get('health')` decorator — without the `'health'` argument, the route would be `GET /` instead.
- **Boot succeeds but `/vroom` always returns the same fact**: you defined `VROOM_FACTS` *inside* the `getVroom()` method instead of at module level. That's not a correctness bug, just wasted work — pull it out so the array is only built once.
- **Editor warns about possible `undefined`**: this project has `strict: true` (constitution Principle IV). When picking a random fact, TypeScript thinks `array[index]` may be `undefined`; if your linter complains, either guard it or use `array[index]!` since you know `index` is in range.
