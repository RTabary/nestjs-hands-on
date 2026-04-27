# Auto-Parts API — Hands-On NestJS Workshop

A 2-hour hands-on workshop for **C#/.NET developers** discovering the
NestJS framework, framed as a cars / auto-parts web API. Eight core
steps + five stretch features, each living on its own pair of git
branches that you can switch between with a single `git checkout`.

**Eight core steps cover the NestJS framework end to end** — Bootstrap & Modules, Controllers & Routing, Providers & DI, DTOs & Validation, Exception Filters, Guards, Configuration, and Testing. Five stretch features (Interceptors, Persistence, OpenAPI, WebSockets, Microservices) are planned for a future expansion of this repo.

## Open this if you're new to NestJS but fluent in .NET

NestJS leans heavily on patterns C#/.NET developers already know:
modules, dependency injection, decorator-driven controllers, exception
filters, configuration via typed sections. Each step's markdown
includes a `.NET parallel` callout. The canonical mapping table —
`@Module` ≈ `IServiceCollection` registration scope, `ValidationPipe`
≈ `[ApiController]` + `IValidator<T>`, `CanActivate` ≈
`AuthorizationHandler`, etc. — lives at
[docs/dotnet-parallels.md](./docs/dotnet-parallels.md).

## Prerequisites

Run each command. Each must produce a version string, not an error:

```bash
node --version    # → v22.x.y or newer (Node.js 22 LTS)
npm --version     # → 10.x or newer
git --version     # → any 2.x
```

A code editor with TypeScript syntax highlighting (VS Code recommended).

**Windows attendees**: prefer **Git Bash** as your terminal. PowerShell aliases `curl` to `Invoke-WebRequest`, which uses incompatible syntax.

## First 5 minutes

```bash
git clone <repo-url> hands-on-nestjs
cd hands-on-nestjs
git checkout main
npm install                # ~2-3 min on typical broadband
npm run start:dev          # boots on :3000
```

In a second terminal, verify the engine runs:

```bash
curl -s http://localhost:3000/health | jq
# → { "status": "ok", "uptimeSec": 12 }

curl -s http://localhost:3000/vroom | jq
# → { "fact": "..." }     (a different fact each call)

curl -s http://localhost:3000/vehicles | jq 'length'
# → 12
```

If those three commands work, your environment is good. Stop the server (`Ctrl+C`) and continue with the workshop loop below.

## The workshop loop

For each of the 8 core steps (`01-bootstrap-modules` through `08-testing`):

```bash
# 1. Switch to the step's start branch
git checkout start/<NN>-<feature>
npm install                 # only when package.json changed (steps 04, 05, 07)

# 2. Read the step's markdown
$EDITOR docs/steps/<NN>-<feature>.md

# 3. Run the checkpoint test — RED on a start branch
npm run test:e2e -- <NN>-

# 4. Implement what the markdown asks for in src/

# 5. Re-run the test — GREEN
npm run test:e2e -- <NN>-

# 6. (Optional) Compare against the reference solution
git diff solution/<NN>-<feature>

# 7. Move on
git checkout start/<NN+1>-<next-feature>
```

Estimated time per step is shown at the top of each markdown; the eight steps sum to **115 min** within the 120-min workshop window.

## "I'm stuck" protocol

You are on a self-paced workshop — no instructor narration, no synchronised checkpoints. If a step is taking longer than its stated budget, in order:

1. **Re-read the step's "Common pitfalls" section** at the bottom of the markdown. Most stalls are a known pitfall.
2. **Run `git diff solution/<NN>-<feature>`** and look at just the file the markdown said to edit. The diff should be small enough to read in under 3 minutes.
3. **Skip ahead**: `git checkout start/<NN+1>-<next-feature>`. The next start branch carries the cumulative solution of every prior core step, so you do **not** lose progress on the remaining steps. You can come back later via `git checkout solution/<NN>-<feature>` to study what you missed.
4. **Ask the instructor** as a last resort.

This is by design: the curriculum is self-service so you can work it at your own pace, in person or alone. (See [FR-016](./specs/001-nestjs-workshop/spec.md) for the spec rationale.)

## Branch cheat sheet

```bash
git branch -a | grep -E '^  (start|solution)/'
# 16 branches: 8 start/* + 8 solution/*

git checkout main                                  # canonical end-state (= solution/08-testing)
git checkout start/01-bootstrap-modules            # begin the workshop here
git checkout solution/05-exception-filters         # peek at any solution as reference

# Discard local edits before switching branches:
git restore .

# Run a single step's checkpoint test:
npm run test:e2e -- 03-

# Run the full e2e suite (whatever branch you're on):
npm run test:e2e

# Run the unit tests (only step 08 ships unit tests):
npm test
```

## Stretch steps

Five stretch features (Interceptors, Persistence/TypeORM, OpenAPI, WebSockets, Microservices) are planned for a future expansion. They will branch off `solution/08-testing` independently — pick any in any order. Not yet authored in this repo.

---

## For implementers (not for workshop attendees)

The workshop's design lives under [specs/001-nestjs-workshop/](./specs/001-nestjs-workshop/):

- [spec.md](./specs/001-nestjs-workshop/spec.md) — what the workshop is, who it's for
- [plan.md](./specs/001-nestjs-workshop/plan.md) — tech stack, structure, gates
- [research.md](./specs/001-nestjs-workshop/research.md) — design trade-offs
- [data-model.md](./specs/001-nestjs-workshop/data-model.md) — entities and timing
- [contracts/](./specs/001-nestjs-workshop/contracts/) — per-step HTTP surface
- [tasks.md](./specs/001-nestjs-workshop/tasks.md) — implementation task list
- [quickstart.md](./specs/001-nestjs-workshop/quickstart.md) — plan-validation checklist

The constitution governing the workshop's design is at
[.specify/memory/constitution.md](./.specify/memory/constitution.md).
