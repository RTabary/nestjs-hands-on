# Implementation Plan: NestJS Hands-On Workshop — "The Auto-Parts API"

**Branch**: `001-nestjs-workshop` | **Date**: 2026-04-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-nestjs-workshop/spec.md`

## Summary

A 2-hour hands-on NestJS workshop for C#/.NET developers, delivered as a
GitHub-hosted repository whose **branches are the curriculum**. Eight
numbered core steps (`start/01-…` ↔ `solution/01-…` … through 08) cover
the foundational NestJS surface — Bootstrap & Modules, Controllers &
Routing, Providers & DI, DTOs & Validation Pipes, Exception Filters,
Guards, Configuration, Testing — over a cars / auto-parts web API
domain. Five stretch step pairs (`start/S1-…` through `start/S5-…`)
branch off `solution/08-testing` independently for post-workshop
exploration: Interceptors, Persistence (TypeORM + SQLite), OpenAPI,
WebSockets, Microservices.

Pacing is pure self-paced (per FR-016): no synchronized checkpoints,
instructor reactive only. Each step's "done" signal is an HTTP-level
e2e test (per FR-017) that sits red on `start/<step>` and green on
`solution/<step>`. Each step has a companion markdown under
`docs/steps/` with a mandatory ".NET parallel" callout (FR-006) so the
audience can map every concept onto the ASP.NET Core / .NET construct
they already know.

The technical approach for the workshop content itself is straightforward
NestJS-default: `@nestjs/cli` scaffold, `class-validator` /
`class-transformer` DTOs, Jest + supertest for the checkpoint tests,
`@nestjs/config` for configuration, in-memory repository providers for
the core (no DB until the Persistence stretch). The non-trivial work is
the **branch topology**: 13 step pairs (26 branches) plus `main`, each
internally consistent and each step's start branch carrying every prior
core solution. Phase 0 research below addresses the authoring + branch-
maintenance strategy that makes that tractable.

## Technical Context

**Language/Version**: TypeScript 5.x with `strict: true` (NestJS default), targeting Node.js 22 LTS (current LTS at workshop date).
**Primary Dependencies**: `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `class-validator`, `class-transformer`, `reflect-metadata`, `rxjs`. Step-specific additions land at the step they teach: `@nestjs/config` (step 7), `@nestjs/swagger` (S3), `@nestjs/typeorm` + `typeorm` + `sqlite3` (S2), `@nestjs/websockets` + `@nestjs/platform-socket.io` (S4), `@nestjs/microservices` (S5).
**Storage**: In-memory `Map`-backed repositories for the entire core curriculum (no external dependencies for steps 01–08). The Persistence stretch step (S2) introduces TypeORM with a file-backed SQLite database (`./data/workshop.sqlite`) so it works offline.
**Testing**: Jest (`@nestjs/testing` for the test module) + `supertest` for the HTTP-level checkpoint tests in `test/*.e2e-spec.ts`. Step 8 introduces `*.spec.ts` unit tests in addition.
**Target Platform**: Cross-platform Node.js 22 LTS running locally on attendee laptops (macOS, Linux, Windows). No deployment target; the workshop API runs on `localhost:3000` only.
**Project Type**: Single web service (NestJS application). One `src/` tree; no frontend, no monorepo.
**Performance Goals**: Workshop-facing, not API-facing. Boot time ≤ 30 s on a typical laptop (FR-001 / SC-001). `npm install` ≤ 5 min on typical workshop-venue broadband. Each step's checkpoint test suite runs in ≤ 10 s so attendees get a fast green/red loop.
**Constraints**:
- Total `start/<step>` → `solution/<step>` diff readable in < 3 min (SC-009) — caps the line count of any one step's solution patch.
- Every documented command must work on macOS, Linux, and Windows (FR-015), or note a platform variant.
- Core curriculum may not depend on Docker, an external database, or any cloud service (FR-001 + the in-memory storage decision).
- Each step's test suite must run from a clean clone in ≤ 30 s end-to-end (`npm install` + `npm test`).
- Summed core step time budget ≤ 120 min (FR-008); planning will validate per-step estimates against this and flag any over-runs.

**Scale/Scope**: Authoring scope is **13 step branch pairs (26 branches) + `main` = 27 branches** plus 13 step markdowns under `docs/steps/` and one root README. Code volume is intentionally small: target ≤ 800 LOC total in the final `solution/08-testing` (excluding tests and configs); each step's diff against its predecessor in the 30–120 LOC range. Workshop audience for the first run: **2 attendees** (per Q5 clarification); materials are still authored to support 10–25 unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Each principle from `.specify/memory/constitution.md` v1.0.0 is evaluated
against this plan:

### I. Pedagogy First (NON-NEGOTIABLE)

- **Step markdowns**: FR-005 mandates the exact 7-section structure
  (Learning objectives → Principle → .NET parallel → How to → Try it →
  Checkpoint → Going further → Common pitfalls). All 13 step markdowns
  will follow it. ✅ PASS.
- **Clarity over cleverness**: Plan favors NestJS-default patterns
  (constructor DI, `@Module` boundaries, `class-validator`); no custom
  abstractions in any step. ✅ PASS.
- **Forward references**: FR-014 enforces; planning will sequence steps
  so `@Injectable` is not used in step 1 even though it appears in the
  scaffolded skeleton. ✅ PASS.

### II. Branch-Per-Feature Workflow

- **Pair per feature**: FR-003 + FR-007 mandate; 13 pairs planned. ✅ PASS.
- **Numeric prefix for ordering**: Core steps use `01`–`08`. Stretch
  uses `S1`–`S5`. ⚠️ **Minor deviation** — see Complexity Tracking.
- **Switch via `git checkout` only**: FR-004 enforces; in-memory storage
  means no DB reset needed; the `npm install` re-run is gated on
  `package.json` actually changing (which only happens at Step 4
  validation, Step 7 config, Step 8 testing, and each stretch). ✅ PASS.
- **`main` always green**: FR-010 enforces. `main` will be set to
  `solution/08-testing` after authoring is complete. ✅ PASS.

### III. Fun, Cohesive Auto Domain

- All 6 baseline entities (Vehicle, SparePart, Manufacturer, Garage,
  Mechanic, MaintenanceOrder) are auto-domain. Module names will lean
  playful (e.g., `PitCrewModule`, `TurboBoostInterceptor`) where it
  doesn't hurt clarity (Principle III + FR-013). ✅ PASS.
- Seed data plan: ~12 vehicles (real makes/models including ≥ 2 winks
  to car culture per FR-013), ~30 parts, ~3 garages, ~5 mechanics. See
  research.md for the chosen seed roster. ✅ PASS.

### IV. Idiomatic NestJS

- All controllers use `@Controller` + HTTP method decorators; all
  providers are constructor-injected `@Injectable()` classes; all DTOs
  use `class-validator` once Step 4 introduces them; configuration uses
  `@nestjs/config` once Step 7 introduces it; Persistence stretch uses
  `@nestjs/typeorm` (canonical per constitution). ✅ PASS.
- No hand-rolled Express middleware — only NestJS guards, interceptors,
  and exception filters. ✅ PASS.

### V. Self-Contained, Runnable Steps

- Boot sequence on every step: `npm install` → `npm run start:dev` →
  API on `:3000`. ✅ PASS.
- Each step's checkpoint test runnable via `npm test` (FR-017). ✅ PASS.
- No external services required for any **core** step. The Persistence
  stretch (S2) uses file-backed SQLite, also no external service. The
  Microservices stretch (S5) uses NestJS's in-process `Transport.TCP`
  loopback so a second container is not required. ✅ PASS.

**Initial gate result**: PASS, with one minor deviation (stretch
numbering prefix `S1`–`S5` instead of pure numeric) tracked below.

### Post-design re-check (after Phase 1)

After authoring research.md, data-model.md, contracts/, and
quickstart.md, every principle was re-evaluated against the now-concrete
design:

- **I. Pedagogy First**: research.md R11 (the .NET-parallels reference
  table) and R12 (fun-naming inventory) are exactly the kind of
  authored-once, used-13-times artifact the principle calls for. The
  data-model.md "Entity introduction timeline" makes the
  no-forward-references rule (FR-014) mechanically checkable. ✅ STILL PASS.
- **II. Branch-Per-Feature Workflow**: research.md R1 (linear-history-+-
  publish-branches) makes the "fix step 3, propagate to all later
  steps" workflow tractable. The 26-branch + 1-main topology in
  quickstart.md's plan-validation checklist is concrete. ✅ STILL PASS,
  with the same `S` deviation noted in Complexity Tracking.
- **III. Fun, Cohesive Auto Domain**: data-model.md formally bakes the
  flux-capacitor wink into the seed shape; contracts/05-exceptions.md
  makes it the centerpiece of the exception-filter teaching moment.
  ✅ STILL PASS.
- **IV. Idiomatic NestJS**: research.md R5 (API-key guard via
  `Reflector`), R6 (TypeORM canonical for S2), R7 (`Transport.TCP` in
  S5), R8 (socket.io for S4), R9 (`@nestjs/config` + Joi schema in
  step 7) all align with the constitution's mandated stack.
  ✅ STILL PASS.
- **V. Self-Contained, Runnable Steps**: quickstart.md's plan-validation
  checklist defines the exact criteria. Boot time, test runtime, and
  branch-switching latency all have measurable upper bounds.
  ✅ STILL PASS.

**Post-design gate result**: PASS. No new violations introduced by the
Phase 1 design; the single tracked deviation (stretch `S` prefix) is
unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/001-nestjs-workshop/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output — HTTP surface introduced per step
│   ├── README.md        # index of which endpoints land in which step
│   ├── 01-bootstrap.md
│   ├── 02-controllers.md
│   ├── 03-providers.md
│   ├── 04-validation.md
│   ├── 05-exceptions.md
│   ├── 06-guards.md
│   ├── 07-configuration.md
│   ├── 08-testing.md
│   ├── S1-interceptors.md
│   ├── S2-persistence.md
│   ├── S3-openapi.md
│   ├── S4-websockets.md
│   └── S5-microservices.md
├── checklists/
│   └── requirements.md  # spec quality checklist (already present)
└── tasks.md             # Phase 2 output (NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/                                # NestJS application source (cumulative across core)
├── main.ts                         # bootstrap (introduced step 1)
├── app.module.ts                   # root module composition
├── vehicles/                       # introduced step 2 (controllers/routing)
│   ├── vehicles.module.ts
│   ├── vehicles.controller.ts
│   ├── vehicles.service.ts
│   ├── dto/
│   │   ├── create-vehicle.dto.ts
│   │   └── update-vehicle.dto.ts
│   └── entities/
│       └── vehicle.entity.ts
├── spare-parts/                    # introduced step 3 (providers + DI showcase)
├── manufacturers/                  # introduced step 4 (validation showcase)
├── garages/                        # introduced step 5 (exception filters showcase)
├── mechanics/
├── maintenance-orders/
├── auth/                           # introduced step 6 (Guards)
│   ├── auth.module.ts
│   ├── api-key.guard.ts
│   └── current-user.decorator.ts
├── config/                         # introduced step 7
│   ├── configuration.ts
│   └── config.module.ts
└── common/                         # filters/interceptors/pipes used cross-cutting
    ├── filters/
    │   └── all-exceptions.filter.ts (introduced step 5)
    └── interceptors/
        └── turbo-boost.interceptor.ts (introduced S1)

test/                               # e2e checkpoint tests (FR-017)
├── 01-bootstrap.e2e-spec.ts
├── 02-vehicles.e2e-spec.ts
├── 03-spare-parts.e2e-spec.ts
├── 04-validation.e2e-spec.ts
├── 05-exceptions.e2e-spec.ts
├── 06-guards.e2e-spec.ts
├── 07-configuration.e2e-spec.ts
└── 08-testing.e2e-spec.ts          # plus *.spec.ts unit tests introduced this step
                                    # stretch tests live alongside in test/Sx-*.e2e-spec.ts

docs/
└── steps/
    ├── 01-bootstrap-modules.md
    ├── 02-controllers-routing.md
    ├── 03-providers-dependency-injection.md
    ├── 04-dtos-validation-pipes.md
    ├── 05-exception-filters.md
    ├── 06-guards.md
    ├── 07-configuration.md
    ├── 08-testing.md
    ├── S1-interceptors.md
    ├── S2-persistence.md
    ├── S3-openapi.md
    ├── S4-websockets.md
    └── S5-microservices.md

README.md                           # workshop entrypoint (FR-011)
package.json                        # NestJS deps; expanded per step
tsconfig.json                       # strict TS
nest-cli.json                       # NestJS CLI config
.gitignore                          # node_modules, dist, *.sqlite (S2)
```

**Structure Decision**: **Single web-service** layout (Option 1 from
the plan template, web-service variant). One Nest application; no
frontend, no monorepo. The `docs/steps/*.md` files are the curriculum;
the `test/*.e2e-spec.ts` files are the checkpoint tests that gate each
step (FR-017). The branch topology (`start/NN-…`, `solution/NN-…`,
`start/SN-…`, `solution/SN-…`) is the **time dimension** of this
otherwise single-tree project.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Stretch branch prefix is `S1`–`S5` instead of a continuous numeric `09`–`13` | Per FR-007 the stretch steps are explicitly **non-chained** — each branches off `solution/08-testing` independently and attendees may pick any in any order. A continuous numeric prefix (`09`, `10`, …) would imply an ordering that does not exist in stretch and would mislead self-paced attendees into doing them in sequence. | A continuous numeric prefix was rejected because it falsely signals chaining. A purely textual prefix (e.g., `interceptors`, `persistence`) was rejected because it loses the visual "stretch step" grouping that helps attendees scan the branch list. The `S` prefix preserves both visible grouping and the "no ordering" semantics. |
