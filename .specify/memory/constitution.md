<!--
SYNC IMPACT REPORT
==================
Version change: (initial template) → 1.0.0
Bump rationale: First ratified constitution for the project; introduces the full set
of governing principles, technology constraints, and workshop workflow rules.

Modified principles:
  - [PRINCIPLE_1_NAME] → I. Pedagogy First (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] → II. Branch-Per-Feature Workflow
  - [PRINCIPLE_3_NAME] → III. Fun, Cohesive Auto Domain
  - [PRINCIPLE_4_NAME] → IV. Idiomatic NestJS
  - [PRINCIPLE_5_NAME] → V. Self-Contained, Runnable Steps

Added sections:
  - Technology Stack & Domain Constraints (was [SECTION_2_NAME])
  - Workshop Workflow & Quality Gates (was [SECTION_3_NAME])
  - Governance (filled)

Removed sections: none

Templates requiring updates:
  - ✅ .specify/memory/constitution.md (this file)
  - ⚠ .specify/templates/plan-template.md — Constitution Check gates should be
    updated when /speckit-plan is next run (must reference Principles I–V).
  - ⚠ .specify/templates/spec-template.md — no structural change required, but
    spec authors should ensure the auto-domain framing (Principle III) when
    naming entities (e.g., Vehicle, SparePart, Mechanic).
  - ⚠ .specify/templates/tasks-template.md — task generation must reflect the
    branch-per-feature model (Principle II) and the per-step markdown deliverable
    (Principle I); currently uses generic Python paths in examples.
  - ⚠ README.md / docs/quickstart.md — not yet present; should be created to
    point attendees at the branch-switching workflow.

Follow-up TODOs: none — all placeholders resolved.
-->

# Hands-On NestJS Constitution

## Core Principles

### I. Pedagogy First (NON-NEGOTIABLE)

This project exists to teach NestJS to workshop attendees, not to ship a production
service. Every feature, branch, and code change MUST optimize for learning outcomes
over engineering elegance.

Rules:

- Every feature step MUST ship with a companion markdown file under `docs/steps/`
  named after the step (e.g., `docs/steps/03-providers-and-di.md`). The markdown
  MUST explain: (a) the NestJS principle being introduced, (b) why it exists, and
  (c) a "How to" walkthrough an attendee can follow with no prior context.
- Code MUST favor clarity over cleverness. If a more idiomatic but less obvious
  pattern exists, prefer the obvious one and link to the idiomatic alternative
  in the step markdown.
- No step may rely on knowledge introduced only in a later step.

Rationale: Attendees come from diverse backgrounds. Skipping the explanatory
markdown turns the repo into a black box — defeating the entire purpose.

### II. Branch-Per-Feature Workflow

Each NestJS feature (modules, controllers, providers/DI, pipes, guards,
interceptors, exception filters, middleware, configuration, validation,
persistence, testing, OpenAPI, websockets, etc.) lives on its own dedicated
pair of branches.

Rules:

- For every feature `<feature>`, two branches MUST exist:
  - `start/<feature>` — the starting point an attendee checks out to begin work
    (skeleton, TODO markers, failing or absent tests).
  - `solution/<feature>` — the reference implementation an attendee can diff
    against or check out if they get stuck.
- Branch names MUST use kebab-case for `<feature>` (e.g.,
  `start/04-validation-pipes`, `solution/04-validation-pipes`).
- Step ordering MUST be encoded as a numeric prefix in `<feature>` so attendees
  can follow the curriculum linearly (`01-…`, `02-…`).
- `main` MUST stay green and represent the canonical, fully-completed workshop
  walkthrough — never a half-finished step.
- Switching from any `start/<feature>` to its `solution/<feature>` MUST require
  nothing more than `git checkout` and a re-run of `npm install` if dependencies
  changed.

Rationale: A predictable, reversible branch model is what makes the workshop
work in a room of 20 people on different machines.

### III. Fun, Cohesive Auto Domain

The API domain is cars and auto parts. Every example, entity, route, and seed
fixture MUST live inside this domain — no `Foo`, `Bar`, generic `User`, or
"todo list" placeholders.

Rules:

- Domain entities MUST be drawn from the auto world: `Vehicle`, `Car`, `Engine`,
  `SparePart`, `Manufacturer`, `Mechanic`, `Garage`, `Order`, `Invoice`,
  `MaintenanceRecord`, etc.
- Naming SHOULD lean playful where it does not hurt clarity (e.g.,
  `PitCrewModule`, `TurboBoostInterceptor`) — fun is a feature, not a luxury.
- Seed data MUST be plausible (real makes, models, part numbers when feasible)
  so attendees can recognize what they are working with.
- A new step MAY introduce a new auto-domain entity, but MUST NOT rename or
  break entities established in earlier steps.

Rationale: A coherent, slightly silly domain keeps attendees engaged and makes
the framework concepts memorable. "User CRUD" workshops are forgotten by
Monday.

### IV. Idiomatic NestJS

The project teaches NestJS the way the NestJS team teaches it. Code MUST follow
official NestJS conventions and use built-in primitives in preference to custom
ones.

Rules:

- Features MUST be organized as `@Module()`s with explicit `imports`,
  `controllers`, `providers`, and `exports`. Cross-module access MUST go through
  exported providers, never deep imports.
- Dependency injection MUST use constructor injection with NestJS decorators.
  Manual `new` of providers in business code is forbidden.
- HTTP concerns MUST use the framework: `@Controller`, `@Get/@Post/...`,
  `ValidationPipe`, `@UseGuards`, `@UseInterceptors`, `HttpException`/exception
  filters. Do not hand-roll Express handlers unless the step explicitly teaches
  the underlying platform.
- DTOs MUST use `class-validator` + `class-transformer` once the validation
  step has been introduced.
- Configuration MUST go through `@nestjs/config`, not raw `process.env` reads
  scattered across modules, after the configuration step is introduced.
- Steps that deliberately show an anti-pattern as a teaching contrast MUST
  label it as such in the step markdown and follow it up with the idiomatic
  fix in the same or the next step.

Rationale: Attendees should leave the workshop able to read any production
NestJS codebase. Teaching them bespoke patterns sets them up to fail on day
one of their next job.

### V. Self-Contained, Runnable Steps

Every `start/<feature>` and `solution/<feature>` branch MUST be runnable from a
clean clone with a fixed, documented set of commands.

Rules:

- From a fresh checkout, the following sequence MUST succeed without manual
  intervention: `npm install` → `npm run start:dev` → the API responds on its
  documented port.
- Each step's markdown MUST list the exact commands to run, the endpoints to
  hit (with `curl` or HTTPie examples), and the expected responses.
- Database/state requirements MUST be satisfied either in-memory or via a
  single `docker compose up` invocation documented in the step. No attendee
  should need to install a database manually.
- Tests, when present in a step, MUST be runnable via `npm test` and MUST pass
  on the `solution/<feature>` branch and either pass or fail with a clear
  pedagogical message on `start/<feature>`.
- A step branch MUST NOT depend on uncommitted local state, environment
  variables that are not documented, or external services that are not
  mockable.

Rationale: A workshop where 30% of attendees can't get the project running is
a workshop that taught nothing. Runnability is a hard prerequisite, not a
nice-to-have.

## Technology Stack & Domain Constraints

The following stack is mandated for the workshop. Deviations require an
amendment to this constitution.

- **Framework**: NestJS (latest stable major). Express adapter by default;
  Fastify only if a step explicitly teaches platform swapping.
- **Language**: TypeScript with `strict: true` in `tsconfig.json`.
- **Runtime**: Node.js LTS (current LTS at workshop date).
- **Package manager**: npm (chosen for the lowest-friction onboarding; pnpm/yarn
  would split attendee tooling).
- **Persistence**: Start with in-memory repositories. Introduce TypeORM (with
  SQLite for zero-config, then PostgreSQL via `docker compose`) in the
  persistence step. Prisma MAY appear as an optional alternative branch but
  MUST NOT replace TypeORM as the canonical path.
- **Validation**: `class-validator` + `class-transformer` via the global
  `ValidationPipe`.
- **Testing**: Jest (NestJS default). `supertest` for e2e HTTP tests.
- **API documentation**: `@nestjs/swagger` once the OpenAPI step is reached.
- **Domain scope**: The API surface MUST stay within the cars/auto-parts
  vertical (vehicles, parts, garages, mechanics, maintenance, orders,
  invoices). No unrelated demos (e-commerce-of-anything, blogs, social
  networks).

## Workshop Workflow & Quality Gates

These rules govern how steps are authored, reviewed, and delivered to
attendees.

- **Step authoring**: A new step MUST land as a pair of branches
  (`start/<n>-<feature>` and `solution/<n>-<feature>`) plus a step markdown
  under `docs/steps/`. All three artifacts MUST land together; partial step
  contributions are rejected.
- **Step markdown structure**: Each step markdown MUST contain, in order:
  (1) Learning objectives, (2) Principle / theory, (3) How to (step-by-step),
  (4) Try it (commands + expected output), (5) Going further (optional
  exercises), (6) Common pitfalls.
- **Review gates**: Before merging a new step into `main`, a reviewer MUST
  verify on a fresh clone: (a) `start/<feature>` runs and exposes the
  documented "starting state", (b) `solution/<feature>` runs and passes its
  tests, (c) the step markdown's commands reproduce the documented output
  verbatim.
- **Curriculum continuity**: When a step is added or reordered, all
  downstream `start/*` and `solution/*` branches MUST be rebased so their
  numeric prefixes stay contiguous and their starting state still reflects
  the cumulative progress of all prior steps.
- **Forbidden in step branches**: hard-coded secrets, attendee-specific
  paths, machine-specific config, references to a specific instructor's
  username, or commits with messages like "wip" / "fix".

## Governance

This constitution supersedes ad-hoc conventions. When this document and a
piece of code, doc, or PR disagree, the constitution wins until amended.

- **Amendments**: Any change to this file MUST be proposed via a PR that
  (a) updates the relevant section, (b) bumps the version per the policy
  below, (c) updates the Sync Impact Report at the top of this file, and
  (d) updates any dependent template (`.specify/templates/*`) flagged in
  that report.
- **Versioning policy** (semantic):
  - **MAJOR**: a principle is removed or its meaning is reversed; any
    backward-incompatible governance change.
  - **MINOR**: a new principle or section is added, or an existing one is
    materially expanded.
  - **PATCH**: wording, typos, clarifications, or non-semantic edits.
- **Compliance review**: Every PR that introduces a new step or modifies an
  existing one MUST include a one-line attestation in its description:
  "Constitution check: passes Principles I–V". A reviewer MUST verify this
  is true; an unverified attestation blocks the merge.
- **Runtime guidance**: Day-to-day "how do I do X in this repo" guidance
  lives in `README.md` and `docs/steps/*.md`. Those documents MUST defer to
  this constitution on any conflict.

**Version**: 1.0.0 | **Ratified**: 2026-04-27 | **Last Amended**: 2026-04-27
