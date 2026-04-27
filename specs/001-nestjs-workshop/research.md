# Phase 0 Research: NestJS Hands-On Workshop

**Feature**: 001-nestjs-workshop · **Date**: 2026-04-27

This document resolves the open trade-offs and choices needed before
Phase 1 design can begin. Each entry follows: **Decision → Rationale →
Alternatives considered**.

---

## R1. Branch authoring strategy (the "26 branches" problem)

**Decision**: Author **a single linear history** on a private authoring
branch, then **publish each step as two named branches** via `git
branch start/<step> <commit-with-skeleton>` and `git branch
solution/<step> <commit-with-solution>`. Stretch branches are forked
off the published `solution/08-testing` commit.

Concretely, the authoring history looks like:

```
main
 ├─ A0  scaffold (Nest + auto domain skeleton)        ← start/01-bootstrap-modules
 ├─ A1  bootstrap & modules complete                   ← solution/01-… AND start/02-…
 ├─ A2  controllers & routing complete                 ← solution/02-… AND start/03-…
 ├─ A3  providers & DI complete                        ← solution/03-… AND start/04-…
 ├─ A4  validation pipes complete                      ← solution/04-… AND start/05-…
 ├─ A5  exception filters complete                     ← solution/05-… AND start/06-…
 ├─ A6  guards complete                                ← solution/06-… AND start/07-…
 ├─ A7  configuration complete                         ← solution/07-… AND start/08-…
 └─ A8  testing complete                               ← solution/08-testing AND main HEAD
                                                          and base for all stretch branches

stretch (each branched from A8 independently, NOT chained):
 ├─ A8 → SI1  interceptors skeleton                   ← start/S1-interceptors
 ├─ A8 → SI2  interceptors complete                   ← solution/S1-interceptors
 ├─ A8 → SP1  persistence skeleton                    ← start/S2-persistence
 ├─ A8 → SP2  persistence complete                    ← solution/S2-persistence
 …  (same for S3 OpenAPI, S4 WebSockets, S5 Microservices)
```

The trick: every `solution/<NN>-<step>` commit is *also* the
`start/<NN+1>-<next-step>` commit (with a tiny "TODO: …" patch on top
to introduce the next step's skeleton). This satisfies FR-009 (start
branch carries cumulative prior solutions) without duplicating files.

Authoring uses an automation script `scripts/publish-branches.sh` that
reads a manifest (`scripts/branches.yml`) mapping logical step names to
authoring commits, and idempotently `git branch -f`'s each named
branch. Re-runnable so a mid-curriculum fix only needs the manifest and
one `bash scripts/publish-branches.sh` to re-publish.

**Rationale**: Linear history + published branches is the only model
that makes "when I find a bug in step 3, I can fix it once and have
steps 4–13 inherit the fix" practical. A rebase on the authoring branch
re-stamps every downstream commit in one go; the branch-publish step
is then a single mechanical `git branch -f`. Without this, maintaining
26 branches by hand becomes a O(N²) nightmare.

**Alternatives considered**:
- **One real branch per step** (no rebase backbone): rejected — fixing
  step 3 means cherry-picking the fix into 10+ downstream branches,
  every time.
- **Tags instead of branches**: rejected — attendees already know
  `git checkout <branch>`; making them learn git tags adds friction
  for no upside.
- **A single `main` with files like `step01_solution.ts`**: rejected —
  destroys the "this is just a NestJS project" feel; the attendee's
  editor would be cluttered with unrelated step files.

---

## R2. Per-step time-budget allocation (does 120 min hold?)

**Decision**: Allocate the 120-minute body as follows, with built-in
"early stop" guidance per FR-008's mitigation clause. Times are the
stated budget displayed at the top of each step markdown.

| # | Step | Budget | Diff size (target) | Notes |
|---|------|--------|--------------------|-------|
| 01 | Bootstrap & Modules | **8 min** | ~30 LOC | Already mostly scaffolded; this step is reading + tweaking, not writing |
| 02 | Controllers & Routing | **15 min** | ~80 LOC | Most "from-scratch" of any step |
| 03 | Providers & DI | **15 min** | ~70 LOC | Includes the .NET-DI-parallel "aha" moment |
| 04 | DTOs & Validation Pipes | **18 min** | ~100 LOC | Two DTOs + global pipe wiring |
| 05 | Exception Filters | **12 min** | ~50 LOC | Single filter + a few thrown HttpExceptions |
| 06 | Guards | **15 min** | ~70 LOC | API-key guard + `@Public()` decorator |
| 07 | Configuration | **12 min** | ~50 LOC | `.env` + `ConfigModule.forRoot` + a typed config service |
| 08 | Testing | **20 min** | ~120 LOC | Unit test + e2e test; introduces the test framework explicitly |
| **Total** | | **115 min** | **~570 LOC** | leaves 5 min for setup + breathers |

The 5-min slack lives between steps (npm install re-runs, switching
branches) rather than within them. If an attendee is running over,
FR-016 says they jump to the next `start/<step>` and continue.

**Rationale**: Validation (FR-004 DTOs) earns the largest budget
because it's the single feature that adds the most LOC and surfaces
the most subtle wiring (global pipe, transform option). Testing earns
20 min because it's the only step with two distinct deliverables
(unit + e2e). Bootstrap is short because the scaffolded skeleton is
already on the `start/01-…` branch — this step is "tour the file
tree, learn what each file does", not "write code".

**Alternatives considered**:
- **Equal 14-min slots**: rejected — over-budgets cheap steps (01, 05,
  07) and under-budgets the Validation step where most attendees stall.
- **Trim Testing to 12 min**: rejected — Testing was added per Q1 with
  the express purpose of *teaching the test framework*, which doesn't
  fit in 12 min once you account for the unit-vs-e2e distinction.

---

## R3. Cross-platform commands (especially `curl` on Windows)

**Decision**: All step markdowns show **two** runnable forms for any
HTTP probe in the "Try it" section:

1. A `curl` command that works in macOS / Linux / Git Bash on Windows.
2. The `npm test -- <step-pattern>` command that runs the checkpoint
   test (FR-017) — which is the canonical "did it work" signal anyway.

The README's prerequisites section recommends Git Bash on Windows so
the `curl` form just works. Where a command genuinely differs by
platform (e.g., setting an env var inline), the markdown shows the
platform-specific variants in collapsible blocks.

**Rationale**: Powering `curl` on plain PowerShell aliases to
`Invoke-WebRequest` whose syntax is incompatible with the curl form —
a known pitfall that would burn 5 min per affected attendee. Git Bash
ships with MINGW's real curl. Recommending Git Bash is a one-line
prereq that eliminates this entire class of friction. The checkpoint
test (FR-017) is the actual checkpoint, so even if `curl` does fail on
some attendee's machine, they can still progress via `npm test`.

**Alternatives considered**:
- **PowerShell-native `Invoke-RestMethod` examples**: rejected —
  doubles the maintenance cost on every step markdown for an audience
  (.NET devs) who probably have Git Bash installed already.
- **HTTPie instead of curl**: rejected — yet another tool to install
  pre-workshop; curl is universal once Git Bash is recommended.
- **Use only `npm test`, no `curl`**: rejected — the `curl` line is
  pedagogically valuable: it shows attendees what their endpoint
  looks like to a real client, before they look at the test file.

---

## R4. Presenting tests to attendees who haven't seen tests yet (steps 1–7)

**Decision**: For every core step **before step 8**, the step markdown's
"Checkpoint" section shows exactly:

````markdown
### Checkpoint

Run:

```bash
npm run test:e2e -- 0X-<step-name>
```

You should see one passing test:
```
PASS test/0X-<step-name>.e2e-spec.ts
  GET /vehicles
    ✓ returns the seeded vehicles (24 ms)
```

If the test fails, the error message names the file and line in `src/`
where to look. You don't need to read the test file yet — Step 8 covers
that. If you're curious, `test/0X-<step-name>.e2e-spec.ts` is open for
inspection.
````

The test file is intentionally **kept short and human-readable** (10–25
lines) so a curious attendee who peeks at it before step 8 sees nothing
overwhelming.

**Rationale**: This honors FR-017's "type this command and look for
green" framing without hiding the test from the curious. The `test:e2e
-- <pattern>` argument scopes Jest to one file, keeping the run fast
(SC-009: < 10 s).

**Alternatives considered**:
- **No tests until step 8**: rejected — contradicts FR-017.
- **Pass-through tests on early steps**: rejected — defeats the
  purpose of a "did this step work" signal.
- **Custom checkpoint tool that hides Jest**: rejected — contradicts
  Principle IV (idiomatic NestJS); Jest *is* the idiomatic tool.

---

## R5. Authentication approach for the Guards step (06)

**Decision**: Static **API key in `x-api-key` header**. The guard reads
the header, compares against a hard-coded constant `WORKSHOP_API_KEY`
exposed via the configuration module's pre-step (so step 7 also picks
up real value), and either lets the request through or throws
`UnauthorizedException`. A `@Public()` decorator + `Reflector` is
introduced so the GET /vehicles route can stay open while POST /vehicles
requires the header.

**Rationale**: API key auth captures the entire NestJS Guards machinery
(reflection, `Reflector`, `SetMetadata`, `CanActivate`, the
`ExecutionContext`) without the time cost of a JWT library, key
rotation, sign/verify ceremony, or a user store. The .NET parallel is
clean: `ApiKeyGuard ≈ AuthorizationHandler` + `[Authorize]` policy +
`[AllowAnonymous]`. Per the spec's Assumptions section, this was the
chosen default.

**Alternatives considered**:
- **JWT with `@nestjs/jwt`**: rejected for the time budget — adds at
  least 10 min for sign/verify mechanics, key configuration, and a
  login endpoint. Still a reasonable stretch idea (could become S6 in
  a future expansion).
- **HTTP Basic Auth**: rejected — the .NET parallel is murky (basic
  auth in ASP.NET Core is rare in modern projects), undercutting FR-006.

---

## R6. Persistence stretch (S2) — TypeORM vs Prisma

**Decision**: **TypeORM** with file-backed SQLite at `./data/workshop.sqlite`.
Constitution Section "Technology Stack" already mandates this as the
canonical choice; recording it here so research.md reflects the
decision the rest of the plan inherits.

**Rationale**: TypeORM is the choice the NestJS docs lead with, has
first-party `@nestjs/typeorm`, and the .NET parallel to **Entity
Framework Core** is essentially line-by-line — a huge teaching win for
this audience. SQLite means no Docker, no external service, no port
conflicts; the file lives in `./data/` (gitignored) and is recreated
from migrations on first run.

**Alternatives considered**:
- **Prisma**: rejected as canonical (ergonomic but the .NET parallel
  is fuzzier); MAY be authored as a future alternative branch but not
  in this delivery.
- **In-memory SQLite (`:memory:`)**: rejected — surviving a server
  restart is part of the persistence "aha"; in-memory steals that.

---

## R7. Microservices stretch (S5) transport choice

**Decision**: NestJS hybrid app with **`Transport.TCP`** loopback,
running both the HTTP gateway and the microservice in the same
process. The microservice exposes a `MaintenanceQueue` message handler
that the HTTP controller calls via a `ClientProxy`. No separate
process, no Docker, no NATS / Redis / RabbitMQ dependency.

**Rationale**: The pedagogical goal of S5 is "what does a NestJS
microservice **look like in code** (decorators, message patterns,
ClientProxy)" — not "deploy a real distributed system in 15 min". A
single-process hybrid with TCP loopback shows all the syntax with zero
infrastructure cost and runs from the same `npm run start:dev` an
attendee already used. The .NET parallel is **MassTransit / NServiceBus**
in-memory transport.

**Alternatives considered**:
- **Real broker (NATS / Redis Streams)**: rejected for the workshop —
  setup cost would dwarf the learning value within the stretch budget.
- **gRPC transport**: rejected — even more setup (proto files,
  codegen) and the .NET parallel is more niche.

---

## R8. WebSockets stretch (S4) approach

**Decision**: NestJS gateway with **`@WebSocketGateway()` +
`@SubscribeMessage()`** using the default `socket.io` adapter. The
gateway emits a `'maintenance.completed'` event whenever a
`MaintenanceOrder` transitions to `completed`, so any connected client
sees real-time updates. A trivial vanilla-JS test client is included
under `public/dyno.html` so attendees can open it in a browser and watch
events fire when they POST to the maintenance endpoint.

**Rationale**: socket.io is the NestJS default and works
out-of-the-box; the .NET parallel is **SignalR** which the audience
will recognize. `@WebSocketGateway()` shows the same "decorator on a
class" pattern the rest of the workshop has reinforced.

**Alternatives considered**:
- **Raw `ws` adapter**: rejected — closer to the protocol but loses
  the "hubs and method invocations" feel that maps to SignalR.
- **Server-Sent Events**: rejected — different feature, would be a
  separate (worthwhile) future stretch.

---

## R9. Configuration step (07) — what to actually configure

**Decision**: Three configuration values introduced in step 7, each
demonstrating a different `@nestjs/config` capability:

1. `PORT` (number, defaults to 3000) — basic env-var read with type
   coercion via Joi schema.
2. `WORKSHOP_API_KEY` (string, required) — required env-var validation;
   failure on boot if missing. Reused by the Guards code from step 6.
3. `MAINTENANCE_QUEUE_LIMIT` (number, defaults to 10) — namespaced
   under `maintenance.queueLimit` via `registerAs`, demonstrating
   feature-scoped config.

The `.env.example` file is checked in; `.env` is git-ignored. Step 6
(Guards) initially reads the API key from a hard-coded constant; step 7
relocates that read to `ConfigService`, which is presented as the "now
let's do this properly" payoff.

**Rationale**: Three values is enough to show all three idioms (basic
read, required + validated, namespaced) without bloating the step.
Reusing the API-key value across steps 6→7 gives the configuration
step a concrete refactor to perform, not just abstract "you could read
env vars" theory. The .NET parallel is `IConfiguration` +
`IOptions<T>` + DataAnnotations validation — clean mapping.

**Alternatives considered**:
- **Just `PORT`**: rejected — too thin to show why
  `@nestjs/config` exists at all.
- **A dozen values**: rejected — wastes the budget on noise.

---

## R10. Seed data roster (the "fun + plausible" balance)

**Decision**: Initial seed roster (in-memory, applied at module init):

**Manufacturers (5)**: Renault, Toyota, Ford, BMW, Aston Martin.

**Vehicles (12)**: Renault Clio (2018), Toyota Corolla (2021), Toyota
Hilux (2015), Ford Focus (2010), Ford Mustang (1969), BMW M3 (2008),
BMW i3 (2019), Aston Martin DB5 (1964 — *the "Bond" wink*), DeLorean
DMC-12 (1981 — *the "Doc Brown" wink*), Reliant Robin (1976 — *the
"three wheels" wink, 1-star reliability*), Tesla Roadster (2010), Smart
ForTwo (2014).

**Spare Parts (~20)**: pads, rotors, plugs, filters, lambda sensors,
turbo cartridges, alternators, EV battery cells, plus one absurd entry:
a "**flux capacitor (Mk II)**" priced at €88,888.88 to reward
attendees who actually inspect the seed data.

**Garages (3)**: "Pit Stop Garage", "Doc Brown's Repair", "Q-Branch
Workshop".

**Mechanics (5)**: realistic first names (Alice, Diego, Priya, Marco,
Yuki) — keeping the wink count contained to vehicles + parts so the
seed roster doesn't tip into "trying too hard".

**Maintenance Orders (~6)**: a mix of `queued`, `in-progress`,
`completed`. The `Reliant Robin` entry has 4 completed maintenance
orders in 2 months (the joke).

**Rationale**: ~3 winks (DB5, DeLorean, Reliant Robin, flux capacitor)
hit the "fun" mark from FR-013 / SC-006 without overwhelming. Real
makes/models grounded in plausible part categories make the API feel
like a real auto-parts service, which is the constitution's Principle
III intent.

**Alternatives considered**:
- **All-fictional / cartoon**: rejected — undermines the "plausible
  domain" half of FR-013.
- **All-real / no winks**: rejected — undermines the "fun" half.

---

## R11. .NET ↔ NestJS parallels reference table (for FR-006)

**Decision**: Each step markdown includes a ".NET parallel" callout
sourced from this canonical mapping (researched once here so step
markdowns stay consistent):

| NestJS construct | .NET / ASP.NET Core counterpart | Where the analogy breaks |
|------------------|--------------------------------|--------------------------|
| `@Module({ imports, controllers, providers, exports })` | `IServiceCollection` registrations + assembly boundary + a `ConfigureServices` per "module" | NestJS modules are explicit at the class level; .NET has no first-class "module" type — the convention is per-assembly |
| `@Injectable()` provider (default scope) | `services.AddScoped<T>()` | NestJS default is **singleton**, not scoped; the per-request scope is opt-in via `{ scope: Scope.REQUEST }` |
| Constructor injection in NestJS | Constructor injection in .NET | Identical pattern; only difference is decorator metadata vs source generators |
| `@Controller('vehicles')` | `[ApiController] [Route("vehicles")]` | NestJS routing is purely decorator-driven; .NET has both attribute and conventional routing |
| `@Get()` / `@Post()` / `@Body()` / `@Param()` | `[HttpGet] [HttpPost] [FromBody] [FromRoute]` | Direct one-to-one |
| `ValidationPipe` + `class-validator` DTOs | `[ApiController]` auto-validation + `IValidator<T>` (FluentValidation) | NestJS pipes also **transform** (via `class-transformer`); .NET model binding is separate from validation |
| `HttpException` + `ExceptionFilter` | `IExceptionFilter` + `ProblemDetails` | Conceptually identical; .NET ships a richer `ProblemDetails` standard out of the box |
| `CanActivate` (Guards) | `AuthorizationHandler` + `[Authorize]` policy | NestJS guards run before pipes; .NET authorization runs in a different middleware stage |
| `Interceptor` (NestInterceptor) | `IActionFilter` / middleware | NestJS interceptors are RxJS-based; .NET filters are sync/async TPL |
| `ConfigService` from `@nestjs/config` | `IConfiguration` + `IOptions<T>` | Direct parallel; both support strongly-typed sections |
| Jest + `@nestjs/testing` `Test.createTestingModule` | xUnit / NUnit + `WebApplicationFactory<TStartup>` | Direct parallel; "testing module" plays the same role as the test factory |
| `@WebSocketGateway()` (S4) | SignalR `Hub` | Direct parallel; both decorator/attribute-driven |
| TypeORM `@Entity` (S2) | EF Core `DbContext` + entity classes | Direct parallel; TypeORM repositories ≈ EF DbSet |

**Rationale**: Authoring this table once prevents drift across 13 step
markdowns. Each step pulls the relevant rows verbatim into its ".NET
parallel" callout.

**Alternatives considered**:
- **Per-step ad-hoc parallels**: rejected — drift risk is real; one
  authoritative table beats 13 individual inventories.

---

## R12. Fun naming inventory (Principle III + FR-013)

**Decision**: Reserved playful names, used in moderation (≤ 1 per
step's added code):

- **`PitCrewModule`** — used as the auth/guards module name (step 6).
- **`TurboBoostInterceptor`** — used as the example interceptor (S1) that
  logs request duration ("how fast did this go?").
- **`/vroom` endpoint** — added in step 1's bootstrap; returns a
  random fun car fact pulled from a small constant array. Keeps step 1
  light and signals "this workshop has personality" within the first
  minute.
- **`DynoController`** — used in S5 as the microservice consumer
  ("dyno" as in dynamometer; runs perf-style maintenance scenarios).
- **Step 5 deliberate exception**: `MissingFluxCapacitorException`
  thrown when an attendee hits a maintenance order for the DeLorean
  without the flux-capacitor part in stock — tests both the exception
  filter mechanic and rewards anyone who inspected the seed data.

The rest of the codebase uses straight names (`VehiclesController`,
`SparePartsService`, `MaintenanceOrdersModule`) — the playful names
land harder when they're rare.

**Rationale**: ~5 playful names across 13 steps is enough to surface
the workshop's personality without pushing into "trying too hard"
territory. The `MissingFluxCapacitorException` is the highest-leverage
joke because it ties the seed data wink to the exception-filter
teaching moment.

**Alternatives considered**:
- **Aggressive theming everywhere** (`VroomController`, `EnginePart`,
  `PitLaneRequest`): rejected — degrades clarity and Principle IV
  ("idiomatic NestJS") asks for boring class names.
- **Zero playful names**: rejected — defeats Principle III + FR-013.

---

## R13. Open question deferred to Phase 2 / `/speckit-tasks`

- **Authoring order on the linear backbone**: should the seed data be
  authored at A0 (so step 1 already has data to display) or grown
  step by step (step 1 has zero seed data; step 2 introduces the
  Vehicles seeds)? The plan currently assumes "all seed data lives at
  A0" because step 1's `/vehicles` endpoint expects it. But this means
  step 3's "providers" step doesn't *introduce* data — it only refactors
  how a service yields it. This is a tasks-level pacing decision and
  is flagged here for `/speckit-tasks` to resolve.

---

## Summary of resolved unknowns

All NEEDS-CLARIFICATION items in the Technical Context are resolved.
Phase 1 (data-model.md, contracts/, quickstart.md) can proceed with the
decisions above as inputs.
