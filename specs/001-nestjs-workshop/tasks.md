---

description: "Task list for 001-nestjs-workshop (the Auto-Parts API)"
---

# Tasks: NestJS Hands-On Workshop — "The Auto-Parts API"

**Input**: Design documents from `/specs/001-nestjs-workshop/`
**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (user stories US1–US5), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Tests are **REQUIRED** for this feature (FR-017 mandates an HTTP-level checkpoint e2e test per step; FR-005 mandates the test command appear in every step markdown).

**Organization**: Tasks are grouped by user story so each can be independently demoed (per spec template guidance). However, this is fundamentally a *content authoring* project — many "implementation" tasks are markdown writing and branch publishing rather than feature code. The user-story phases reflect the order in which a meaningful slice of the workshop becomes deliverable, not artificial silos.

## Open question resolved

Research [R13](./research.md#r13-open-question-deferred-to-phase-2--speckittasks) asked whether seed data lands at A0 or grows step-by-step. **Resolution: seed data lands at the same step that introduces its entity** (Vehicle seeds at step 02, SparePart seeds at step 03, etc., per [data-model.md's "Entity introduction timeline"](./data-model.md)). Reasons:

1. Each step's diff stays focused on one concept — no "wait, why are there 30 spare-parts at step 01?" confusion.
2. By A8 (= `main`) the seed roster is fully populated, so quickstart.md's `curl /vehicles | jq 'length'` returns 12 as expected.
3. `start/01-…` (= A0 scaffold) has zero entity data, but step 01's checkpoint is `/health` and `/vroom` only — so no contradiction.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story tag (US1 / US2 / US3 / US4 / US5). Setup, Foundational, Stretch (Phase 8), and Polish phases have no story tag.
- All file paths are repository-relative.

## Path Conventions

- **App source**: `src/` (NestJS application — single web service per [plan.md](./plan.md))
- **Tests**: `test/` (Jest e2e per FR-017) and `src/**/*.spec.ts` (unit tests, introduced step 08)
- **Step markdowns**: `docs/steps/<NN>-<slug>.md` (per FR-005)
- **Authoring tooling**: `scripts/`
- **Specs (this dir, read-only)**: `specs/001-nestjs-workshop/`

> **Branch topology reminder**: All authoring happens on a single linear backbone (commits A0 → A8). The 26 step branches (`start/<step>`, `solution/<step>`) are *published* from those commits via `scripts/publish-branches.sh` — not authored directly. See [research.md R1](./research.md#r1-branch-authoring-strategy-the-26-branches-problem).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization. Lands as commit **A0** on the authoring backbone (which is, by design, also `start/01-bootstrap-modules`).

- [X] T001 Scaffold the NestJS application at the repo root: `npx @nestjs/cli new . --strict --skip-git --package-manager npm`. Resolve any conflicts with the existing `specs/`, `.specify/`, `.claude/` directories by keeping them out of the scaffold. *(Hand-authored at A0 — `0882cb0` — instead of using `nest new` to keep the `.specify/`/`.claude/` directories untouched and to pin NestJS 11 / TS 5.7 directly.)*
- [X] T002 [P] Pin Node engine in `package.json`: `"engines": { "node": ">=22.0.0" }`. Verify `tsconfig.json` has `"strict": true` and `"target": "ES2022"`. *(Done in A0.)*
- [X] T003 [P] Configure Jest test scripts in `package.json`: ensure `test`, `test:watch`, `test:cov`, `test:e2e` scripts exist; ensure `test/jest-e2e.json` exists with `testRegex: '.e2e-spec.ts$'`. *(Done in A0.)*
- [X] T004 [P] Author `.gitignore` covering `node_modules/`, `dist/`, `.env`, `data/` (the SQLite directory used by the S2 stretch), `coverage/`. *(Done in A0.)*
- [X] T005 [P] Author `.env.example` (empty placeholder; populated for real in step 07). *(Done in A0.)*
- [X] T006 [P] Create `docs/steps/` directory with 13 empty placeholder files (`01-bootstrap-modules.md` through `08-testing.md` and `S1-interceptors.md` through `S5-microservices.md`). Placeholder content: a single-line title only — full content lands in per-step tasks. *(Done in A0.)*
- [X] T007 [P] Create the branch-authoring tooling: `scripts/branches.yml` (manifest mapping logical step names → authoring commits) and `scripts/publish-branches.sh` (idempotent `git branch -f` runner per [research.md R1](./research.md#r1-branch-authoring-strategy-the-26-branches-problem)). Initial manifest may be empty — entries are appended as each Ax commit lands. *(Done in A0; manifest is empty `branches: []` until A1 lands.)*
- [X] T008 [P] Author `scripts/validate-cumulative.sh` — checks out each `solution/<step>`, runs the matching checkpoint test, and exits non-zero if any one fails. Used in T070 (US4 audit). *(Done in A0.)*
- [X] T009 Commit the scaffold as **A0** (commit message `feat: A0 — workshop scaffold (start/01-bootstrap-modules entry)`). Tag implicitly = `start/01-bootstrap-modules` once T056 publishes it. *(Commit `0882cb0`.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cross-cutting infrastructure that every user-story phase relies on. NO step content yet — just enabling work.

**⚠️ CRITICAL**: No user-story phase can begin until Phase 2 is complete.

- [ ] T010 Author the canonical .NET ↔ NestJS parallels reference at `docs/dotnet-parallels.md` using [research.md R11's table](./research.md#r11-net-↔-nestjs-parallels-reference-table-for-fr-006) verbatim. This file is the single source of truth that every step markdown's ".NET parallel" callout pulls from.
- [ ] T011 [P] Author the seed-data scaffolding at `src/seed/seed.module.ts` and `src/seed/seed.service.ts` — empty `Map`-backed in-memory provider that per-entity seed files will register data into. Wired into `app.module.ts` so `OnApplicationBootstrap` invokes it. (No actual seed entries yet — those land per step.)
- [ ] T012 [P] Author `test/utils/test-app.factory.ts` — a small helper that boots a `Test.createTestingModule({ imports: [AppModule] })` and returns the `INestApplication`. Used by every checkpoint test. Goal: keep each `*.e2e-spec.ts` file under its target line budget.
- [ ] T013 [P] Author `README.md` skeleton with section headers only: Prerequisites, First 5 minutes, The workshop loop, Stretch steps, "I'm stuck" protocol, Branch cheat sheet. Section bodies fill in across user-story phases.
- [ ] T014 Commit the foundational artifacts (still on A0 — these are scaffolding, not a step deliverable). The publish-branches manifest at this point lists no published branches yet.

**Checkpoint**: Foundation ready — User Story phases can now proceed sequentially (the linear-history backbone enforces ordering A0 → A1 → … → A8).

---

## Phase 3: User Story 1 (Priority: P1) 🎯 MVP

**Goal** (US1): A workshop attendee can clone the repo, install dependencies, start the server, and `curl /vehicles` to see demo data within 10 minutes — i.e., `main` is in a runnable state with the engine running and seed vehicles visible.

**Independent Test**: From a fresh clone on `main`, run the commands in [quickstart.md "First 5 minutes"](./quickstart.md#first-5-minutes-boot-the-starter); reach a `200 OK` from `GET /vehicles` returning ≥ 1 vehicle, in under 10 minutes.

> **MVP scope**: This phase produces commits **A1** (step 01 done) and **A2** (step 02 done) and points `main` at A2. The downstream curriculum (steps 03–08) is incomplete after this phase, but the "engine runs" promise of US1 is fulfilled. US2 advances `main` to A8.

### Step 01 — Bootstrap & Modules (A1)

- [ ] T015 [US1] Implement `GET /health` and `GET /vroom` per [contracts/01-bootstrap.md](./contracts/01-bootstrap.md) in `src/app.controller.ts` and `src/app.service.ts`. The `/vroom` fact list is hard-coded in `src/app.service.ts`.
- [X] T016 [P] [US1] Author the checkpoint test at `test/01-bootstrap.e2e-spec.ts` (≤ 25 lines) — passes on A1, fails on A0. *(Pulled into A0 — `0882cb0` — because FR-017 requires the checkpoint test to exist on `start/<step>`, which is A0 for step 01. Verified failing locally with two 404s on /health and /vroom.)*
- [ ] T017 [P] [US1] Author `docs/steps/01-bootstrap-modules.md` with all 7 mandated sections (Learning objectives, Principle, **.NET parallel** quoting `docs/dotnet-parallels.md` rows for `@Module` + `@Injectable()`, How to, Try it, Checkpoint, Going further, Common pitfalls). Front-matter must include `Estimated time: 8 min` (per [R2](./research.md#r2-per-step-time-budget-allocation-does-120-min-hold)).
- [ ] T018 [US1] Commit as **A1** (`feat: A1 — step 01 bootstrap & modules`). Append `01-bootstrap-modules` entry to `scripts/branches.yml` mapping start→A0, solution→A1.

### Step 02 — Controllers & Routing (A2)

- [ ] T019 [US1] Implement Vehicle CRUD per [contracts/02-controllers.md](./contracts/02-controllers.md) in `src/vehicles/` (`vehicles.module.ts`, `vehicles.controller.ts`, `vehicles.service.ts`, `entities/vehicle.entity.ts`, `dto/create-vehicle.dto.ts`, `dto/update-vehicle.dto.ts`). No validation yet (lands step 04). Wire `VehiclesModule` into `AppModule`.
- [ ] T020 [P] [US1] Author the Vehicle seed at `src/seed/vehicles.seed.ts` — 12 entries from [research.md R10](./research.md#r10-seed-data-roster-the-fun--plausible-balance) (incl. DB5, DeLorean, Reliant Robin winks). Register with `SeedService` in `vehicles.module.ts` via `OnApplicationBootstrap`.
- [ ] T021 [P] [US1] Author `test/02-vehicles.e2e-spec.ts` (≤ 35 lines) — passes on A2, fails on A1.
- [ ] T022 [P] [US1] Author `docs/steps/02-controllers-routing.md` (Estimated time: 15 min). `.NET parallel` callout quotes `@Controller`, `@Get/@Post/...`, `@Body`, `@Param` rows from `docs/dotnet-parallels.md`.
- [ ] T023 [US1] Commit as **A2** (`feat: A2 — step 02 controllers & routing`). Append `02-controllers-routing` entry to `scripts/branches.yml` (start→A1, solution→A2).

### MVP wrap-up

- [ ] T024 [US1] Fill `README.md` "Prerequisites" + "First 5 minutes" sections with the contents of [quickstart.md "Prerequisites"](./quickstart.md#prerequisites-sanity-check-before-the-workshop) and ["First 5 minutes"](./quickstart.md#first-5-minutes-boot-the-starter). Reference exists steps 01 + 02 only at this point.
- [ ] T025 [US1] Run `bash scripts/publish-branches.sh` to publish `start/01-bootstrap-modules`, `solution/01-bootstrap-modules`, `start/02-controllers-routing`, `solution/02-controllers-routing`.
- [ ] T026 [US1] Move `main` to A2 (`git branch -f main A2`). Verify quickstart.md's "First 5 minutes" path completes end-to-end on a fresh clone.

**Checkpoint**: US1 MVP delivered. The engine runs; an attendee can curl /vehicles. The workshop content past step 02 is incomplete — proceed to US2.

---

## Phase 4: User Story 2 (Priority: P1) — Walk a step from start to solution

**Goal** (US2): For every core step (03 through 08), the `start/<step>` branch ships a failing checkpoint test plus the cumulative prior solution, and `solution/<step>` ships a passing checkpoint test plus complete implementation. An attendee can do the full 2-hour workshop end to end.

**Independent Test**: Pick any step from 03–08. From its `start/<step>` branch on a fresh clone, follow only the step's markdown; reach a green checkpoint test within the step's stated budget. Verified by running [`scripts/validate-cumulative.sh`](./research.md#r1-branch-authoring-strategy-the-26-branches-problem) → exit 0.

### Step 03 — Providers & Dependency Injection (A3)

- [ ] T027 [US2] Implement SparePart CRUD per [contracts/03-providers.md](./contracts/03-providers.md) in `src/spare-parts/`. Add `CompatibilityService` in `src/spare-parts/compatibility.service.ts` injecting both `VehiclesService` and `SparePartsService`. Wire `GET /vehicles/:id/compatible-parts` into `VehiclesController`.
- [ ] T028 [P] [US2] Author SparePart seed at `src/seed/spare-parts.seed.ts` — ~20 entries including `partNumber: "FLUX-CAP-MK2"` priced at €88,888.88 ([R10 wink](./research.md#r10-seed-data-roster-the-fun--plausible-balance)) and `compatibleVehicleIds: ['V008']`.
- [ ] T029 [P] [US2] Author `test/03-spare-parts.e2e-spec.ts` (≤ 35 lines).
- [ ] T030 [P] [US2] Author `docs/steps/03-providers-dependency-injection.md` (Estimated time: 15 min). `.NET parallel` quotes the constructor-injection + `services.AddScoped` rows.
- [ ] T031 [US2] Commit as **A3** + update `scripts/branches.yml`.

### Step 04 — DTOs & Validation Pipes (A4)

- [ ] T032 [US2] Implement Manufacturer CRUD per [contracts/04-validation.md](./contracts/04-validation.md) in `src/manufacturers/`.
- [ ] T033 [P] [US2] Author Manufacturer seed at `src/seed/manufacturers.seed.ts` — Renault, Toyota, Ford, BMW, Aston Martin (R10).
- [ ] T034 [P] [US2] Add `class-validator` decorators to existing Vehicle DTOs (`src/vehicles/dto/*.dto.ts`) per [data-model.md E1's validation rules](./data-model.md#e1-vehicle). Add `manufacturerId` field to Vehicle entity + DTOs (FK).
- [ ] T035 [US2] Register `ValidationPipe` globally in `src/main.ts` with `{ whitelist: true, transform: true, forbidNonWhitelisted: true }`.
- [ ] T036 [P] [US2] Author `test/04-validation.e2e-spec.ts` (≤ 45 lines) — covers VIN regex, country regex, valid 201, invalid 400.
- [ ] T037 [P] [US2] Author `docs/steps/04-dtos-validation-pipes.md` (Estimated time: 18 min). `.NET parallel` quotes the `[ApiController]` + `IValidator<T>` row.
- [ ] T038 [US2] Commit as **A4** + update `scripts/branches.yml`.

### Step 05 — Exception Filters (A5)

- [ ] T039 [US2] Implement Garage / Mechanic / MaintenanceOrder CRUD per [contracts/05-exceptions.md](./contracts/05-exceptions.md) in `src/garages/`, `src/mechanics/`, `src/maintenance-orders/`. Implement state-machine in `MaintenanceOrdersService.transition` per [data-model.md E6](./data-model.md#e6-maintenanceorder).
- [ ] T040 [P] [US2] Author seeds: `src/seed/garages.seed.ts` ("Pit Stop Garage", "Doc Brown's Repair", "Q-Branch Workshop"), `src/seed/mechanics.seed.ts` (5 entries), `src/seed/maintenance-orders.seed.ts` (~6 entries — Reliant Robin gets 4 completed orders per the wink).
- [ ] T041 [P] [US2] Implement custom exceptions in `src/common/exceptions/`: `MissingFluxCapacitorException`, `OutOfStockException`. Throw the flux-capacitor exception from `MaintenanceOrdersService.transition` when `vehicleId === 'V008'` and target is `completed` and `partIds` lacks `FLUX-CAP-MK2`.
- [ ] T042 [P] [US2] Author the global filter at `src/common/filters/all-exceptions.filter.ts` per the unified envelope shape in [contracts/05-exceptions.md](./contracts/05-exceptions.md). Register in `src/main.ts` via `app.useGlobalFilters(...)`.
- [ ] T043 [P] [US2] Author `test/05-exceptions.e2e-spec.ts` (≤ 60 lines).
- [ ] T044 [P] [US2] Author `docs/steps/05-exception-filters.md` (Estimated time: 12 min). Highlight `MissingFluxCapacitorException` as the wink-driven teaching moment. `.NET parallel` quotes the `IExceptionFilter` + `ProblemDetails` row.
- [ ] T045 [US2] Commit as **A5** + update `scripts/branches.yml`.

### Step 06 — Guards (A6)

- [ ] T046 [US2] Implement `ApiKeyGuard` in `src/auth/api-key.guard.ts` and `@Public()` decorator + `PublicMetadataKey` in `src/auth/public.decorator.ts`. The guard hard-codes `WORKSHOP_API_KEY = 'pit-pass'` (relocated to `.env` in step 07). Register globally in `src/main.ts` via `app.useGlobalGuards(new ApiKeyGuard(reflector))`.
- [ ] T047 [P] [US2] Apply `@Public()` to `AppController` (covers `/health` + `/vroom`) and to every `@Get(...)` route across vehicles/spare-parts/manufacturers/garages/mechanics/maintenance-orders. Leave `@Post`/`@Patch`/`@Delete` protected.
- [ ] T048 [P] [US2] Author `test/06-guards.e2e-spec.ts` (≤ 40 lines).
- [ ] T049 [P] [US2] Author `docs/steps/06-guards.md` (Estimated time: 15 min). `.NET parallel` quotes the `CanActivate` ↔ `[Authorize] AuthorizationHandler` row.
- [ ] T050 [US2] Commit as **A6** + update `scripts/branches.yml`.

### Step 07 — Configuration (A7)

- [ ] T051 [US2] Install `@nestjs/config` + `joi` (`npm install @nestjs/config joi`). Implement `src/config/configuration.ts` and `src/config/app-config.service.ts` per [contracts/07-configuration.md](./contracts/07-configuration.md). Register `ConfigModule.forRoot({ isGlobal: true, cache: true, validationSchema })` in `src/app.module.ts`.
- [ ] T052 [P] [US2] Refactor `ApiKeyGuard` to read the key via `AppConfigService.getApiKey()` instead of the hard-coded constant.
- [ ] T053 [P] [US2] Implement maintenance-queue limit in `MaintenanceOrdersService.create()` reading `getMaintenanceQueueLimit()`. Throw `MaintenanceQueueFullException` (409) when exceeded.
- [ ] T054 [P] [US2] Update `.env.example` with the three values from [R9](./research.md#r9-configuration-step-07--what-to-actually-configure): `PORT=3000`, `WORKSHOP_API_KEY=pit-pass`, `MAINTENANCE_QUEUE_LIMIT=10`.
- [ ] T055 [P] [US2] Author `test/07-configuration.e2e-spec.ts` (≤ 50 lines) — uses `.env.test` to override values, asserts on queue-full exception and config-driven API key.
- [ ] T056 [P] [US2] Author `docs/steps/07-configuration.md` (Estimated time: 12 min). `.NET parallel` quotes the `IConfiguration` + `IOptions<T>` row.
- [ ] T057 [US2] Commit as **A7** + update `scripts/branches.yml`.

### Step 08 — Testing (A8 — terminal core commit)

- [ ] T058 [US2] Author the unit-test exemplar at `src/spare-parts/spare-parts.service.spec.ts` per [contracts/08-testing.md](./contracts/08-testing.md). Uses `Test.createTestingModule()` to construct a minimal module; covers `findCompatible` and `decrementStock`.
- [ ] T059 [P] [US2] Author the full-flow e2e exemplar at `test/08-full-flow.e2e-spec.ts` — POST vehicle → POST maintenance order → transition queued → in_progress → completed → verify stock decremented.
- [ ] T060 [P] [US2] Author `docs/steps/08-testing.md` (Estimated time: 20 min). `.NET parallel` quotes the `Test.createTestingModule` ↔ `WebApplicationFactory<TStartup>` row. This is the step where the `test:e2e -- <pattern>` mechanism the previous 7 steps used silently is finally explained.
- [ ] T061 [US2] Commit as **A8** + update `scripts/branches.yml`.

### Branch publication and main advancement

- [ ] T062 [US2] Run `bash scripts/publish-branches.sh` to publish all 8 core start/solution pairs (16 branches). Manifest now lists 8 entries.
- [ ] T063 [US2] Move `main` from A2 to **A8** (`git branch -f main A8`). Verify on a fresh clone of `main`: `npm install && npm run start:dev` boots and the entire seed roster (vehicles, spare-parts, manufacturers, garages, mechanics, maintenance-orders) is loaded.
- [ ] T064 [US2] Run `bash scripts/validate-cumulative.sh` to confirm every `solution/<step>` passes its checkpoint test. Exit code 0 required.
- [ ] T065 [US2] Update `README.md` "The workshop loop" section to include all 8 steps (per [quickstart.md "The workshop loop"](./quickstart.md#the-workshop-loop-repeat-8-times-for-the-core-curriculum)).

**Checkpoint**: Core curriculum delivered. An attendee can clone main, walk start/01 → solution/01 → start/02 → … → solution/08 in 2 hours. US3, US4, US5 polish phases follow.

---

## Phase 5: User Story 3 (Priority: P2) — .NET parallels recognition

**Goal** (US3): Every step markdown has a ".NET parallel" callout that names ≥ 1 .NET / ASP.NET Core construct and notes ≥ 1 point where the analogy breaks (per FR-006).

**Independent Test**: Open any of the 13 step markdowns; locate the ".NET parallel" section; verify it names a .NET construct and includes an "analogy break" note.

> Most of this work was done inline during US2's per-step authoring tasks. This phase is the **audit + remediation** slice.

- [ ] T066 [US3] Audit `docs/steps/01-bootstrap-modules.md` through `docs/steps/08-testing.md`: each has a ".NET parallel" section, names ≥ 1 .NET construct, includes ≥ 1 "where the analogy breaks" note. Cross-reference each callout against `docs/dotnet-parallels.md`. File any remediation patches as separate per-step Ax++ commits or amend the relevant Ax (preferring amend to keep the manifest clean).
- [ ] T067 [P] [US3] Add a "Open this if you're new to NestJS but fluent in .NET" callout block at the top of `README.md` that links to `docs/dotnet-parallels.md` (the canonical reference table).

---

## Phase 6: User Story 4 (Priority: P2) — Finish in 2 hours

**Goal** (US4): Each step markdown declares its time budget; the cumulative summed budget for steps 01–08 is ≤ 120 minutes; the cumulative-invariant ([R1](./research.md#r1-branch-authoring-strategy-the-26-branches-problem)) holds; the "I'm falling behind" protocol from FR-016 is documented in the README.

**Independent Test**: Sum the `Estimated time:` headers across the 8 core step markdowns → ≤ 120 min. Run `scripts/validate-cumulative.sh` → exit 0. Open README.md → find the "I'm stuck" / "I'm falling behind" protocol matching [quickstart.md](./quickstart.md#im-stuck-protocol-self-paced-no-instructor-required).

- [ ] T068 [US4] Audit each `docs/steps/0X-*.md` has `Estimated time: X min` in its front matter, with X matching [R2's per-step budget table](./research.md#r2-per-step-time-budget-allocation-does-120-min-hold). Sum all 8 → must equal 115 min.
- [ ] T069 [P] [US4] Add the "I'm falling behind" protocol section to `README.md`, sourced from [quickstart.md "I'm stuck protocol"](./quickstart.md#im-stuck-protocol-self-paced-no-instructor-required).
- [ ] T070 [US4] Run `bash scripts/validate-cumulative.sh` once more from `main`. Capture and commit a short `docs/cumulative-invariant.md` showing the green output as evidence.

---

## Phase 7: User Story 5 (Priority: P3) — Have fun

**Goal** (US5): The workshop has personality. A neutral reviewer skimming the seed roster, controller names, and step markdowns finds ≥ 3 deliberately playful elements.

**Independent Test**: Reviewer audit. Required findings: the DeLorean (V008) in vehicles seed, the flux capacitor in spare-parts seed, the Reliant Robin's 0-star maintenance record, the `/vroom` endpoint, the `MissingFluxCapacitorException` in step 05, and the playful module name (`PitCrewModule` chosen for auth in step 06).

> Most of these are baked into US2's tasks. This phase is the verification + the one remaining playful name.

- [ ] T071 [US5] Rename `AuthModule` → `PitCrewModule` in `src/auth/` (file: `src/auth/pit-crew.module.ts`, exports updated). Verify all imports across the codebase. (Per [research.md R12](./research.md#r12-fun-naming-inventory-principle-iii--fr-013).)
- [ ] T072 [P] [US5] Audit checklist in `docs/winks-audit.md`: list each wink (DB5, DeLorean, Reliant Robin, flux capacitor, `/vroom`, `MissingFluxCapacitorException`, `PitCrewModule`) with file path + line reference. Commit alongside the audit.

---

## Phase 8: Stretch Curriculum (post-user-story authoring)

**Purpose**: Author the 5 stretch step pairs per FR-007. Each branches off **A8** (= `solution/08-testing`) independently; they are NOT chained. No story label — these are post-user-story content.

> All 5 stretch pairs are authored in parallel (different src/ subtrees, different markdowns, different test files). The publish step runs once at the end.

### S1 — Interceptors

- [ ] T073 [P] Implement `TurboBoostInterceptor` in `src/common/interceptors/turbo-boost.interceptor.ts` per [contracts/S1-interceptors.md](./contracts/S1-interceptors.md). Register globally in a stretch-only branch — i.e., the change is only on `solution/S1-interceptors`, not on `main`/A8.
- [ ] T074 [P] Author `test/S1-interceptors.e2e-spec.ts` (≤ 25 lines).
- [ ] T075 [P] Author `docs/steps/S1-interceptors.md`. `.NET parallel` quotes the interceptor row from `docs/dotnet-parallels.md`.

### S2 — Persistence (TypeORM + SQLite)

- [ ] T076 [P] Install `@nestjs/typeorm typeorm sqlite3`. Author `src/database/typeorm-config.factory.ts` per [contracts/S2-persistence.md](./contracts/S2-persistence.md). Decorate every existing `*.entity.ts` with `@Entity` / `@PrimaryColumn` / `@Column`.
- [ ] T077 [P] Swap each `*Service`'s in-memory `Map` for an injected `Repository<Entity>`. Public method shapes unchanged.
- [ ] T078 [P] Author `test/S2-persistence.e2e-spec.ts` covering the post-restart persistence assertion.
- [ ] T079 [P] Author `docs/steps/S2-persistence.md`. `.NET parallel` quotes the TypeORM ↔ EF Core row.

### S3 — OpenAPI

- [ ] T080 [P] Install `@nestjs/swagger`. Wire SwaggerModule in `src/main.ts` per [contracts/S3-openapi.md](./contracts/S3-openapi.md). Add `@ApiProperty()` decorators across all DTOs in `src/**/dto/*.ts`. Add `@ApiOperation()` / `@ApiResponse()` / `@ApiSecurity('workshop-key')` across controllers.
- [ ] T081 [P] Author `test/S3-openapi.e2e-spec.ts` (≤ 35 lines) — asserts on `paths` and `components.securitySchemes` in `GET /api-json`.
- [ ] T082 [P] Author `docs/steps/S3-openapi.md`. `.NET parallel` quotes Swashbuckle / NSwag.

### S4 — WebSockets

- [ ] T083 [P] Install `@nestjs/websockets @nestjs/platform-socket.io socket.io`. Author `src/dyno/dyno.gateway.ts` per [contracts/S4-websockets.md](./contracts/S4-websockets.md). Inject the gateway into `MaintenanceOrdersService.transition` to emit on completion.
- [ ] T084 [P] Author the test client at `public/dyno.html` (~30 lines vanilla JS).
- [ ] T085 [P] Author `test/S4-websockets.e2e-spec.ts` (≤ 60 lines) using `socket.io-client`.
- [ ] T086 [P] Author `docs/steps/S4-websockets.md`. `.NET parallel` quotes the SignalR `Hub` row.

### S5 — Microservices

- [ ] T087 [P] Install `@nestjs/microservices`. Refactor `src/main.ts` to a hybrid bootstrap (HTTP + TCP loopback on :4001) per [contracts/S5-microservices.md](./contracts/S5-microservices.md). Author `src/dyno/dyno.controller.ts` (HTTP) + `src/dyno/maintenance.controller.ts` (`@MessagePattern`) + `src/dyno/dyno.module.ts` (`ClientsModule.register`).
- [ ] T088 [P] Author `test/S5-microservices.e2e-spec.ts` (≤ 60 lines) booting hybrid app on random ports.
- [ ] T089 [P] Author `docs/steps/S5-microservices.md`. `.NET parallel` quotes the MassTransit / NServiceBus row.

### Stretch publication

- [ ] T090 Commit each stretch pair as a separate non-chained authoring branch (e.g., `authoring/S1`, `authoring/S2`, etc.) all forked from A8. Each authoring branch contains *one* commit (the stretch deliverable) so the start/SX branch = A8 and the solution/SX branch = the stretch commit.
- [ ] T091 Append all 5 stretch entries to `scripts/branches.yml`. Run `bash scripts/publish-branches.sh` to publish `start/S1-interceptors`, `solution/S1-interceptors`, … through `start/S5-microservices`, `solution/S5-microservices` (10 branches).
- [ ] T092 Update `README.md` "Stretch steps" section per [quickstart.md "Stretch steps"](./quickstart.md#stretch-steps-post-workshop-or-fast-finishers).

**Checkpoint**: All 26 step branches published. Workshop content is complete.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation, cleanup, and release readiness.

- [ ] T093 [P] Final lint + format pass: `npm run lint -- --fix && npm run format` on `main`. Cherry-pick or amend per Ax if any commit needs it (preferring amend to preserve the manifest).
- [ ] T094 [P] Documentation pass on `README.md`: cross-link table of contents at the top linking each step markdown; verify every `docs/steps/<step>.md` has a "back to README" link at the bottom.
- [ ] T095 Run the full quickstart.md "Plan validation checklist" end to end. Tick each box. Capture the output / screenshot in `docs/release-validation.md`.
- [ ] T096 Tag the `main` HEAD as `v1.0.0-workshop` (`git tag -a v1.0.0-workshop -m "First runnable workshop"`). Don't push the tag to the remote unless explicitly asked.
- [ ] T097 Run `bash scripts/validate-cumulative.sh` one final time on `main`. Capture exit 0.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** — no deps. Lands as A0.
- **Phase 2 (Foundational)** — depends on Phase 1. Stays on A0.
- **Phase 3 (US1 MVP)** — depends on Phase 2. Lands A1, A2; advances `main` to A2.
- **Phase 4 (US2 core)** — depends on Phase 3 (continues the linear backbone A2 → A3 → … → A8). Advances `main` to A8.
- **Phase 5 (US3 .NET parallels audit)** — depends on Phase 4 (markdowns must exist).
- **Phase 6 (US4 budget audit)** — depends on Phase 4 (markdowns must exist).
- **Phase 7 (US5 fun audit)** — depends on Phase 4 (winks are baked into US2's per-step seeds and exceptions).
- **Phase 8 (Stretch)** — depends on Phase 4 (forks off A8). All 5 stretch branches independent of each other.
- **Phase N (Polish)** — depends on all previous.

### Within-phase dependencies (US2 example)

- For step N: `Implement deliverable (T-impl)` → `Author checkpoint test (T-test)` → `Commit as Ax (T-commit)`. Markdown authoring (T-md) and seed authoring (T-seed) are parallelizable with each other and with implementation (different files).
- Across steps within US2: **strictly sequential** because each Ax is built on Ax-1 of the linear backbone. No parallelism across steps in US2.

### Parallel Opportunities

- **Within Phase 1**: T002–T008 are all `[P]`.
- **Within Phase 2**: T011–T013 are `[P]`.
- **Within each US2 step**: 3 of 4 tasks per step are `[P]` (markdown, seed, test) — only the implementation + the commit are sequential.
- **Within Phase 8**: ALL 17 stretch tasks (T073–T089) are `[P]` because the 5 stretch features touch disjoint parts of the codebase. Only T090–T092 (the publish + README update) are sequential.
- **US3 / US4 / US5 audits**: T066, T067, T068, T069 are mutually `[P]`.

### MVP boundary

User Story 1 alone (Phases 1 + 2 + 3 = T001–T026) is a deployable increment: `main` boots, `curl /vehicles` works. Useful for testing the linear-history + branch-publish tooling end to end before committing to the full curriculum.

---

## Parallel Example: Step 03 authoring

```bash
# After T026 lands (start/01 + solution/01 + start/02 + solution/02 published; main on A2)
# Three tasks can run in parallel during step 03:

# Task: T028 — Author SparePart seed in src/seed/spare-parts.seed.ts
# Task: T029 — Author test/03-spare-parts.e2e-spec.ts
# Task: T030 — Author docs/steps/03-providers-dependency-injection.md

# Then sequentially:
# Task: T027 — Implement SparePart CRUD in src/spare-parts/ (depends on the entity definitions, but the seed and test scaffolding can be done before)
# Task: T031 — Commit as A3
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 (Setup) — T001–T009.
2. Phase 2 (Foundational) — T010–T014.
3. Phase 3 (US1) — T015–T026.
4. **STOP and VALIDATE** — clone main on a different machine, run quickstart.md "First 5 minutes", verify the engine runs.
5. Demo / commit.

### Incremental Delivery (the realistic path)

1. MVP → US1 deliverable (above).
2. Phase 4 (US2 core) — T027–T065. Ship the full workshop.
3. Phase 5–7 (US3 / US4 / US5 audits) — can run in parallel by separate authors. Mostly verification + targeted patches.
4. Phase 8 (Stretch) — T073–T092. Five subtrees authored independently then published in one batch.
5. Phase N (Polish) — T093–T097.

### Parallel Author Strategy

For Phase 8 specifically: with multiple authors / sessions, each can claim one stretch (S1 / S2 / S3 / S4 / S5) and work on it independently from `authoring/SX` branches all forked from A8. T090–T092 (the publication batch) is a single coordinated step.

---

## Notes

- `[P]` = different files, no dependencies.
- `[Story]` = traceability tag; absent on Setup, Foundational, Stretch (Phase 8), and Polish phases.
- Every step's `start/<step>` carries **the cumulative solution of all prior core steps** (FR-009). The linear-history backbone makes this automatic — `start/N` *is* `solution/N-1` (same commit, two names).
- **Stretch branches are exempt from the cumulative chain** (FR-007). Each `start/SX` = A8, full stop.
- Commit the canonical workshop scaffolding files (`.specify/`, `.claude/skills/git-*`) on a separate branch (probably `main`) before `/speckit-implement` so they don't get mixed into the linear backbone.
- `scripts/publish-branches.sh` is idempotent; re-run any time the manifest changes.
- If a step's authoring needs a fix mid-curriculum, prefer rebasing the linear backbone over cherry-picking — the manifest + `publish-branches.sh` will re-stamp every downstream branch in one shot.
