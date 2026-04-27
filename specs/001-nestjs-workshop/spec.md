# Feature Specification: NestJS Hands-On Workshop — "The Auto-Parts API"

**Feature Branch**: `001-nestjs-workshop`
**Created**: 2026-04-27
**Status**: Draft
**Input**: User description: "this project is a hand on made to discover nestJS framework. It should cover all main features. Each nestjs feature lives on its own branch for start and an other branch target is also set. Attendees can switch branch easily to discover and implement features. The project should be a web API related to cars or auto parts. This should be fun for attendees. write a markdown file for each step and explain principles / how to. try to find some fun ways to discover the framework. Target is C# / .net devs so you can make parallells with this framework. hands on will last 2 hours."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get the engine running in under 10 minutes (Priority: P1)

A workshop attendee — a C#/.NET developer who has never touched NestJS — clones
the repo, follows the README's "First 5 minutes" section, and within ten minutes
has a running HTTP server responding to `GET /vehicles` with a small list of
demo cars. They have not yet learned a single NestJS concept; they have only
*seen the thing run*.

**Why this priority**: If attendees cannot get the project running, no
subsequent learning happens. This is the irreducible MVP of any workshop. It
also delivers an emotional hook ("oh, it's just an API like the ones I write
in ASP.NET Core") that primes the rest of the session.

**Independent Test**: On a fresh laptop with Node.js LTS and git already
installed, a developer follows the README from a clean clone and reaches a
`200 OK` response from `GET /vehicles` without instructor help. Pass = under
10 minutes wall-clock; fail = anything longer or any blocking error.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repo on `main`, **When** the attendee runs
   the documented setup commands, **Then** an HTTP server starts and a sample
   "vehicles" endpoint returns demo data.
2. **Given** the attendee has never used NestJS, **When** they read the
   README's first section, **Then** they understand which command to run and
   what response to expect, without being expected to understand how it works
   internally yet.

---

### User Story 2 - Walk a step from start to solution (Priority: P1)

The attendee checks out a step branch (e.g., `start/02-controllers-routing`),
reads the matching `docs/steps/02-controllers-routing.md`, implements the TODOs
in the code with the markdown as a guide, runs the API and sees their endpoint
respond, and — if they want to verify — checks out `solution/02-controllers-routing`
to compare. This is the core loop of the workshop, repeated once per feature.

**Why this priority**: This is the workshop. Without a smooth, predictable
start → implement → verify → next-step loop, attendees stall and the room
fragments. P1 because it must work for *every* step or the curriculum
collapses.

**Independent Test**: Pick any step in the curriculum at random. Starting
from its `start/<step>` branch on a fresh clone, an attendee follows only
the step's markdown and reaches a state functionally equivalent to
`solution/<step>` within the step's stated time budget.

**Acceptance Scenarios**:

1. **Given** the attendee is on `start/<NN>-<feature>`, **When** they read
   the step markdown and follow its "How to" section, **Then** they can run
   the API and observe the documented expected behavior.
2. **Given** the attendee is stuck on a step, **When** they `git checkout
   solution/<NN>-<feature>` and `git diff start/<NN>-<feature>`, **Then** the
   diff is small and readable enough to learn from (no unrelated churn).
3. **Given** an attendee skips ahead to step N, **When** they checkout
   `start/<N>-<feature>`, **Then** the branch contains the cumulative
   solutions of steps 1..N-1 already applied, so step N can be done in
   isolation.

---

### User Story 3 - Recognize NestJS concepts via .NET parallels (Priority: P2)

A C#/.NET developer reading a step markdown encounters a ".NET parallel"
callout that maps the NestJS concept onto its closest ASP.NET Core / .NET
counterpart (e.g., `@Module` ≈ `IServiceCollection` registration scope +
assembly boundary; `@Injectable()` provider ≈ `services.AddScoped<T>()`;
`ValidationPipe` ≈ `[ApiController]` model validation + `IValidator<T>`).
Each new concept lands faster because they can attach it to something they
already know.

**Why this priority**: The audience is explicitly defined as C#/.NET
developers. A workshop that taught NestJS in a vacuum would be technically
correct but slower to absorb. P2 because the workshop still functions
without the parallels — they accelerate it rather than enable it.

**Independent Test**: Open any step markdown. The ".NET parallel" section
exists, names the closest .NET construct, and a C#/.NET developer reading
it can answer "what is this concept similar to in my world?" in one
sentence.

**Acceptance Scenarios**:

1. **Given** a step markdown for any NestJS concept introduced in the
   workshop, **When** the attendee reads its ".NET parallel" section,
   **Then** they find at least one named .NET / ASP.NET Core construct
   the concept maps onto, with a one-line note on where the analogy
   breaks down.

---

### User Story 4 - Finish the core curriculum in two hours (Priority: P2)

The workshop runs in a single 2-hour block. An attendee progressing at the
median pace finishes the core (P1 + P2) curriculum steps within the
allotted time, with optional "stretch" steps available afterwards for
fast finishers or at-home practice.

**Why this priority**: A workshop that overruns turns into a sprint and
loses the "fun" goal. The 2-hour budget is a hard constraint from the
event, not a guideline. P2 because each individual story can still
deliver value if the timing slips; the timing constraint shapes scope
selection.

**Independent Test**: Three pilot attendees with prior C#/.NET API
experience, working in parallel, each reach the end of the last *core*
step within 120 minutes wall-clock excluding intro and Q&A.

**Acceptance Scenarios**:

1. **Given** the curriculum's core steps, **When** their time budgets
   are summed, **Then** the total is at most 110 minutes (leaving 10
   minutes of slack out of the 120).
2. **Given** an attendee falls behind on one step, **When** they reach
   the next step, **Then** they can re-sync by checking out the next
   `start/<step>` (which contains all prior solutions) without redoing
   the missed step.

---

### User Story 5 - Have fun (Priority: P3)

The attendee notices and smiles at: the auto-themed naming
(`PitCrewModule`, `TurboBoostInterceptor`, a `/vroom` endpoint that
returns a random car fact), the playful seed data (a DeLorean DMC-12
parked in the Doc Brown garage, a Reliant Robin with a suspicious 0-star
maintenance record), and the gentle in-jokes in the step markdowns. They
leave the workshop with a fond memory, not just a checklist.

**Why this priority**: Fun aids retention and word-of-mouth. P3 because
no individual joke is load-bearing — the workshop succeeds on technical
merit even if every easter egg is removed.

**Independent Test**: A neutral reviewer skims the seed data, controller
names, and step markdowns and identifies at least 3 deliberately playful
elements that would not appear in a production codebase.

**Acceptance Scenarios**:

1. **Given** the running API, **When** the attendee hits a "fun"
   endpoint, **Then** they get a domain-themed response that makes them
   smile (subjective — confirmed via post-workshop survey free-text).
2. **Given** any step's seed data, **When** the attendee inspects it,
   **Then** the entries are recognizable, plausible, and contain at
   least one wink to car culture.

---

### Edge Cases

- **Attendee falls behind**: They can skip a step by checking out the
  next `start/<NN>-<feature>` (which already contains the cumulative
  solution of all prior steps), so one slow step does not cascade.
- **Attendee accidentally commits to a step branch**: The step markdowns
  warn against committing locally; the README explains how to discard
  local work via `git restore .` so they can return to a clean step
  state.
- **Attendee gets a merge conflict when switching branches**: Because
  step branches are checked out, never merged, conflicts should not
  occur unless the attendee made local edits — covered by the previous
  bullet.
- **Attendee on Windows vs macOS vs Linux**: All commands documented in
  the README and step markdowns must work cross-platform, or have a
  noted platform variant.
- **Network flakiness during install**: The README documents an
  optional pre-warmed cache or offline fallback for live workshops in
  weak-connectivity rooms.
- **Attendee skips the prerequisites**: A "Day-of" prerequisites section
  in the README lists the required tools with a one-line check command
  per item.
- **Attendee tries to learn one feature in isolation post-workshop**:
  Each step's markdown is self-contained enough to be read on its own
  later, without re-reading the entire curriculum.
- **Attendee from non-.NET background wanders in**: The .NET parallels
  are presented as enrichment, not prerequisites — the core explanation
  works for anyone with general web-API experience.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST be runnable from a clean clone in at
  most three documented commands, producing a live HTTP API responding
  on a documented port within 30 seconds of starting.
- **FR-002**: The API MUST be a "cars / auto-parts" web service. All
  example entities, endpoints, and seed data MUST be drawn from that
  domain.
- **FR-003**: The workshop MUST be organized as numbered curriculum
  steps. Each step MUST exist as a pair of git branches:
  `start/<NN>-<feature-slug>` (skeleton with TODOs) and
  `solution/<NN>-<feature-slug>` (reference implementation).
- **FR-004**: Switching between `start/<step>` and `solution/<step>`
  MUST require nothing more than `git checkout` plus, at most, a single
  dependency-install command. No manual file edits, no environment
  setup, no database resets beyond a documented one-line command.
- **FR-005**: Each step MUST have a companion markdown file under
  `docs/steps/<NN>-<feature-slug>.md` containing, in order: Learning
  objectives, Principle / theory, ".NET parallel" callout, How to
  (step-by-step), Try it (commands + expected output), Going further
  (optional stretch), Common pitfalls.
- **FR-006**: Each step's ".NET parallel" callout MUST name at least
  one closest-equivalent ASP.NET Core or .NET construct and note one
  point where the analogy breaks.
- **FR-007**: The core curriculum MUST cover the foundational NestJS
  features needed to read and write a typical NestJS service. The
  selected core set is: (1) Bootstrap & Modules, (2) Controllers &
  Routing, (3) Providers & Dependency Injection, (4) DTOs & Validation
  Pipes, (5) Exception Filters, (6) Guards, (7) Configuration.
  Additional features (Interceptors, Persistence, Testing, OpenAPI,
  WebSockets, Microservices) MAY appear as optional stretch steps but
  MUST NOT be required to fit within the 2-hour budget.
- **FR-008**: The summed time budget of the core steps MUST be at most
  110 minutes, leaving at least 10 minutes of slack out of the 120-minute
  total.
- **FR-009**: Each `start/<step>` MUST contain the cumulative solutions
  of all prior steps, so an attendee who falls behind can re-join at
  any step without backfill.
- **FR-010**: The `main` branch MUST represent the canonical, fully
  completed workshop state — never a half-finished step or a
  work-in-progress.
- **FR-011**: A root README MUST exist with: prerequisites checklist,
  "First 5 minutes" quick-start, branch-switching cheat sheet, and an
  index linking each step's markdown.
- **FR-012**: Step markdowns MUST be readable standalone after the
  workshop ends — i.e., understandable without an instructor or live
  audio context.
- **FR-013**: Domain naming and seed data SHOULD include playful,
  car-culture-themed touches (entity names, seed records, occasional
  themed endpoints) that do not interfere with the learning goal of
  any step.
- **FR-014**: Any NestJS construct introduced in step N MUST NOT be
  required reading in any step earlier than N — the curriculum order
  is also the dependency order.
- **FR-015**: All commands shown in the README and step markdowns MUST
  work on macOS, Linux, and Windows, OR explicitly note the per-platform
  variant.

### Key Entities *(include if feature involves data)*

- **Vehicle**: A car, truck, or motorcycle in the system. Carries
  identifying information (make, model, year, VIN), state (mileage,
  registration), and references to its parts and maintenance history.
- **SparePart**: A discrete part (engine, brake pad, tire, headlight,
  etc.) with a part number, name, category, price, and stock count.
  May be associated with one or more vehicle models.
- **Manufacturer**: A maker of vehicles or parts (e.g., Ford, Bosch),
  with a name, country, and catalog of vehicles or parts.
- **Garage**: A workshop location where mechanics work and maintenance
  orders are processed. Has a name, address, and roster of mechanics.
- **Mechanic**: A staff member who performs maintenance. Has a name,
  specialty, and a list of completed maintenance orders.
- **MaintenanceOrder**: A recorded service event linking a vehicle, a
  mechanic, a date, parts used, and a status (queued / in-progress /
  completed).
- **WorkshopAttendee** *(meta-entity, not part of the API surface)*: A
  developer following the curriculum. Tracked only conceptually for
  scenario design — not modeled in code.

*Note: Steps may introduce additional entities (e.g., a User concept
for the Guards step) as the curriculum progresses. The list above is
the shared baseline.*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of attendees with the documented prerequisites
  installed reach a `200 OK` response from the starter API within 10
  minutes of cloning the repo.
- **SC-002**: 80% of attendees complete all *core* curriculum steps
  within the 2-hour workshop window.
- **SC-003**: 100% of step branches can be entered (`git checkout
  start/<step>`) and exited (`git checkout solution/<step>`) on a
  clean working tree with no manual reset, in under 15 seconds each.
- **SC-004**: Median time spent per core step is between 12 and 18
  minutes (so the curriculum neither rushes nor drags).
- **SC-005**: 90% of attendees, when post-quizzed, can correctly
  answer "what role does a NestJS module play?" and "name the .NET
  construct closest to a NestJS provider".
- **SC-006**: Post-workshop survey: 80% of attendees rate the
  experience "engaging" or "very engaging" (5-point scale, top-2 box).
- **SC-007**: 90% of attendees would recommend the workshop to a
  colleague (Net Promoter–style yes/no).
- **SC-008**: Zero attendees encounter a step that cannot be completed
  due to broken state inherited from a prior step.
- **SC-009**: Each step's `start/<step>` → `solution/<step>` diff is
  small enough to read in under 3 minutes (qualitative; reviewed
  during step authoring).

## Assumptions

- Attendees are practicing C#/.NET developers with prior ASP.NET Core
  Web API experience. The curriculum leans on that background and does
  not re-explain HTTP, REST, dependency injection, or controller-based
  routing from first principles.
- Attendees arrive with the required toolchain (a current Node.js LTS,
  npm, git, and a code editor) pre-installed; this is communicated as a
  workshop prerequisite in advance.
- Attendees have stable internet access at the venue, sufficient to
  install dependencies once. A pre-warmed cache or offline fallback is
  a contingency, not the default.
- The 2-hour duration covers the curriculum body only; an additional
  10–15 minutes for instructor intro, environment check, and Q&A is
  budgeted separately and is not counted against FR-008.
- "Cover all main NestJS features" is interpreted, given the 2-hour
  budget, as "cover the seven foundational features named in FR-007 in
  depth, and offer the remaining features as optional stretch
  branches" — rather than a shallow tour of every feature.
- Persistence is **out of scope** for the core curriculum (in-memory
  repositories only). A relational-persistence stretch step MAY be
  authored later but is not part of the 2-hour body.
- The Guards step uses a mocked authentication header (e.g., a static
  API key or a "logged-in user" stub), not a full JWT/OAuth2 flow,
  to keep within the time budget.
- A live instructor is available throughout the workshop to unblock
  individuals; the curriculum does not need to be 100% self-service,
  though step markdowns aim for it.
- Workshop format is in-person or live virtual with screen-sharing,
  not async / on-demand. Async use is a happy side-effect, not a
  design target.
- The repository is hosted on a Git provider (GitHub or equivalent)
  reachable by attendees; `git clone` over HTTPS is the supported
  fetch path.
