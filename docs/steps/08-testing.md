# Step 08 — Testing

> **Estimated time: 20 min** &nbsp;·&nbsp; **Branch start**: `start/08-testing`  &nbsp;·&nbsp; **Branch solution**: `solution/08-testing`

## Learning objectives

By the end of this step you will be able to:

1. Read and write a NestJS **unit test** using `Test.createTestingModule`, mocking only the dependencies the unit-under-test actually consumes.
2. Read and write an **end-to-end test** with `supertest` against the full `AppModule`, exercising HTTP behaviour the same way a real client would.
3. Decide which test type a new piece of code deserves — service-level rules vs. cross-cutting flows — and place the file under the right convention (`*.spec.ts` next to the source vs. `*.e2e-spec.ts` under `test/`).
4. Recognise the `Test.createTestingModule` pattern in your day job: it's the one tool that's been silently powering the checkpoint test of every prior step.

## Principle

NestJS distinguishes two flavours of test by **convention** (filename) and **scope**:

- **Unit tests** (`<thing>.spec.ts` next to the source file) construct the smallest possible NestJS module that contains the class under test, replacing every dependency with a mock. They run in milliseconds and pin one concern at a time.
- **End-to-end tests** (`<thing>.e2e-spec.ts` under `test/`) boot the full `AppModule` via `Test.createTestingModule({ imports: [AppModule] }).createNestApplication()` and exercise it with `supertest` over HTTP. Slower (a few hundred ms per test) but they catch wiring bugs no unit test can see — pipes, guards, filters, interceptors, module composition.

The single-most-load-bearing class is `Test` from `@nestjs/testing`. `Test.createTestingModule({ providers, controllers, imports })` returns a builder that compiles into a `TestingModule`. From that you can:

- `module.get(SomeService)` — same DI resolution as runtime; you get the wired-up instance.
- `module.createNestApplication()` — boot a real `INestApplication` for HTTP testing. The `APP_PIPE`, `APP_FILTER`, and `APP_GUARD` providers from `AppModule` register automatically (this is exactly why steps 04, 05, and 06 used module-level registration).

For unit tests, override expensive dependencies with `useValue` or `useFactory` mocks. For e2e tests, the whole point is **not** to mock — you want real wiring.

The two exemplars in this step show both:

- **`src/spare-parts/spare-parts.service.spec.ts`** unit-tests `SparePartsService` against a hand-rolled stub of `SeedService`. Five short cases, total runtime ≈ 10 ms.
- **`test/08-full-flow.e2e-spec.ts`** drives a full user journey: create a vehicle, create a maintenance order, transition it to completion, verify the stock decremented. Plus a negative case for the state machine returning the unified envelope.

## .NET parallel

| NestJS construct | ASP.NET Core counterpart | Where the analogy breaks |
|------------------|--------------------------|--------------------------|
| Jest + `@nestjs/testing` `Test.createTestingModule` | xUnit / NUnit + `WebApplicationFactory<TStartup>` | Direct parallel; "testing module" plays the same role as the test factory. |

If you've used the `WebApplicationFactory<Program>` pattern in ASP.NET Core integration tests:

```csharp
public class OrderFlowTests : IClassFixture<WebApplicationFactory<Program>> {
    private readonly HttpClient _client;
    public OrderFlowTests(WebApplicationFactory<Program> factory) {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task FullFlow() {
        var resp = await _client.PostAsJsonAsync("/vehicles", new {...});
        resp.EnsureSuccessStatusCode();
        // ...
    }
}
```

…then the NestJS equivalent reads almost the same:

```ts
let app: INestApplication;
beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  await app.init();
});

it('full flow', async () => {
  await request(app.getHttpServer()).post('/vehicles').send({...}).expect(201);
});
```

Same factory pattern, same "real DI graph" semantics, different transport library (`supertest` vs. `HttpClient`). The main translation: NestJS overrides via `.overrideProvider(...).useValue(...)` on the testing-module builder; .NET overrides via `factory.WithWebHostBuilder(b => b.ConfigureServices(s => ...))`.

The full mapping is at [docs/dotnet-parallels.md](../dotnet-parallels.md).

## How to

You are on `start/08-testing`. Step 07's configuration machinery is in place. The "checkpoint test" for this step is itself: you are authoring the test files.

1. Author **`src/spare-parts/spare-parts.service.spec.ts`** — unit test:
   - Use `Test.createTestingModule({ providers: [SparePartsService, { provide: SeedService, useValue: { has: () => true, get: () => SPARE_PARTS_SEED } }] })`.
   - Compile, then `module.get(SparePartsService)` and call `service.onModuleInit()` so the seed loads.
   - Five tests covering: `findOne` returns a known seed; `findOne` throws `NotFoundException`; `findAll` ≥ 20 entries; `decrementStock` reduces by 1; `decrementStock` floors at 0.
2. Author **`test/08-full-flow.e2e-spec.ts`** — e2e test:
   - Boot the full app with `createTestApp()` from `test/utils/test-app.factory.ts`.
   - Test 1 (positive flow): POST a fresh vehicle; capture P017's current stock; POST a maintenance order with that vehicle and `partIds: ['P017']`; transition queued → in_progress (200); transition → completed (200); GET `/spare-parts/P017` and assert `stock` decremented by 1.
   - Test 2 (negative flow): POST another fresh vehicle and order; attempt the illegal `queued → completed` transition; assert 400 with the unified envelope shape (`statusCode: 400, error: 'Bad Request', message: /Illegal transition/`).
3. The `package.json` already exposes `test`, `test:watch`, `test:cov`, and `test:e2e` scripts — no changes needed; check the script definitions to see what each one runs.

## Try it

```bash
# All unit tests (five of them, all from spare-parts.service.spec.ts).
# Runs in ~1 second.
npm test

# All e2e tests (every step's checkpoint plus the new full-flow exemplar).
# Runs in ~5 seconds.
npm run test:e2e

# A single suite by pattern:
npm run test:e2e -- 08-

# Watch mode for TDD: re-runs the unit tests on every save.
npm run test:watch
```

Open `src/spare-parts/spare-parts.service.spec.ts` and `test/08-full-flow.e2e-spec.ts` side-by-side. Notice how the unit test file is a third the length of the e2e test, and how its setup (`beforeEach` with mocked SeedService) is what gives it its speed.

## Checkpoint

```bash
npm run test:e2e -- 08-
```

Three passing tests:

```
PASS test/08-meta.e2e-spec.ts          # the FR-017 red→green check that the exemplar files exist
  ✓ introduces src/spare-parts/spare-parts.service.spec.ts
  ✓ introduces test/08-full-flow.e2e-spec.ts

PASS test/08-full-flow.e2e-spec.ts
  ✓ creates a vehicle, runs a maintenance order to completion, and decrements stock
  ✓ rejects an illegal transition (queued → completed) with 400 in the unified envelope
```

Plus the unit-test suite via `npm test`:

```
PASS src/spare-parts/spare-parts.service.spec.ts
  ✓ findOne returns a seeded part by id
  ✓ findOne throws NotFoundException for an unknown id
  ✓ findAll returns at least the seed roster
  ✓ decrementStock reduces stock by 1
  ✓ decrementStock floors at 0 (never goes negative)
```

This is the end of the **core curriculum**. From here, jump into any of the five stretch branches (`start/S1-interceptors` through `start/S5-microservices`) — they each branch off `solution/08-testing` independently.

## Going further

- **Coverage report**: `npm run test:cov` produces an HTML report at `coverage/lcov-report/index.html`. Open it. Notice gaps you haven't covered (e.g., `MaintenanceOrdersService.assertQueueHasRoom`).
- **Override providers in e2e**: `Test.createTestingModule({ imports: [AppModule] }).overrideProvider(AppConfigService).useValue({ getApiKey: () => 'test-only', ... })` — useful when an e2e test needs different config without touching `.env.test`.
- **Custom matchers**: write a Jest matcher that asserts the unified-error-envelope shape in one line: `expect(res.body).toBeUnifiedError(404)`. The pattern is in the Jest docs under "Expect.extend".
- **Snapshot tests**: `expect(res.body).toMatchSnapshot()` is great for response-shape regression detection. Used judiciously, it can replace verbose `toMatchObject` assertions.

## Common pitfalls

- **`Nest can't resolve dependencies of the SparePartsService`** in the unit test: you forgot to provide `SeedService` (or your mock object is missing the methods the service actually calls — `has` and `get`).
- **The unit test passes but the e2e test fails the same operation**: this almost always means a global pipe/filter/guard registered via `APP_*` is involved, and your unit test is bypassing it. That's by design — the e2e is what catches the integration. Don't try to "fix" the unit test by adding the global thing; let the e2e own that.
- **`createNestApplication()` calls `app.init()` already**: don't call `app.init()` a second time in your test, you'll get a "Nest application has already been initialized" error.
- **Forgot `app.close()` in `afterAll`**: tests still pass, but Jest hangs at the end ("Jest did not exit one second after the test run completed"). Always pair `await createTestApp()` in `beforeAll` with `await app.close()` in `afterAll`.
- **Tests share state across files**: they don't, by default. Each `*.e2e-spec.ts` boots its own app instance with its own in-memory store. If you want shared fixtures, use Jest's `globalSetup` — but think hard before you do; isolated test state is usually worth its weight.
- **Stale package-lock after adding deps**: if a teammate adds `@nestjs/swagger` (S3 stretch) and pushes, `npm ci` can fail mid-test with "lockfile does not match package.json". Run `npm install` once after pulling.
