# Quickstart: NestJS Hands-On Workshop — "The Auto-Parts API"

**Feature**: 001-nestjs-workshop · **Date**: 2026-04-27

This is the **plan-validation quickstart** — the exact path a workshop
attendee will follow once the implementation lands. It doubles as the
acceptance test for plan.md / research.md / data-model.md /
contracts/: if every command in this file works after `/speckit-implement`
runs, the plan was sound. The eventual root `README.md` (FR-011) will
be derived from this file.

---

## Prerequisites (sanity check before the workshop)

Run each command. Each must produce a version string, not an error.

```bash
node --version    # → v22.x.y or newer (Node.js 22 LTS)
npm --version     # → 10.x or newer
git --version     # → any 2.x
```

**Windows attendees**: prefer **Git Bash** as your terminal. PowerShell
aliases `curl` to `Invoke-WebRequest`, which uses incompatible syntax
(see research.md R3).

A code editor — VS Code recommended — with TypeScript syntax
highlighting.

---

## First 5 minutes (boot the starter)

```bash
git clone <repo-url> hands-on-nestjs
cd hands-on-nestjs
git checkout main          # main = the canonical, fully-completed workshop
npm install                # ~2-3 min on typical broadband
npm run start:dev          # boots on :3000
```

In a second terminal:

```bash
curl -s http://localhost:3000/vroom | jq
# → { "fact": "..." }
curl -s http://localhost:3000/vehicles | jq 'length'
# → 12
```

If both work, your environment is good. Stop the server (`Ctrl+C`)
and continue.

---

## The workshop loop (repeat 8 times for the core curriculum)

For each step `NN-<feature>` from `01-bootstrap-modules` through
`08-testing`:

```bash
# 1. Switch to the step's start branch
git checkout start/NN-<feature>
npm install                # only needed if package.json changed since last step
                           # (steps 04, 07, 08 introduce new deps)

# 2. Read the step's markdown
$EDITOR docs/steps/NN-<feature>.md   # or open it on GitHub

# 3. Run the checkpoint test — it should be RED on a start branch
npm run test:e2e -- NN-<feature>
# → 1 failing test (this is your target)

# 4. Implement what the markdown asks for in src/

# 5. Run the checkpoint test again — it should be GREEN
npm run test:e2e -- NN-<feature>
# → 1 passing test

# 6. (Optional) Compare your work against the reference solution
git diff solution/NN-<feature>

# 7. Move to the next step
git checkout start/NN+1-<next-feature>
```

If you fall behind on a step (stated budget exceeded), per FR-016:
**check out `start/NN+1-<next-feature>`** and continue. The next
start branch carries the cumulative solution of all prior steps, so
you will not lose progress on later steps. You can always come back
to the missed step later by `git checkout solution/NN-<feature>` and
diffing.

---

## Stretch steps (post-workshop or fast-finishers)

Each stretch branches off `solution/08-testing` independently. **Pick
any in any order**:

```bash
git checkout solution/08-testing       # canonical workshop end-state
npm install

# Then for any stretch:
git checkout start/S1-interceptors     # or S2-persistence, S3-openapi, S4-websockets, S5-microservices
npm install                            # stretch deps land here
$EDITOR docs/steps/S1-interceptors.md
npm run test:e2e -- S1-interceptors
# implement, then re-run for green
```

You can return to a different stretch by `git checkout
start/Sx-<other>` — they share the same starting point.

---

## "I'm stuck" protocol (self-paced, no instructor required)

In order, try:

1. Re-read the step markdown's **Common pitfalls** section.
2. Run `git diff solution/NN-<feature>` and look at just the file the
   markdown said to edit.
3. Check out `solution/NN-<feature>`, run the test (it must be green),
   then `git checkout start/NN+1-<next-feature>` to keep moving.
4. Ask the instructor.

---

## Plan validation checklist

If you are validating the plan (not running the workshop), verify:

- [ ] After `/speckit-implement`, on `main`, `npm install && npm run
      start:dev` boots in under 30 seconds (FR-001).
- [ ] On `main`, `curl /vehicles` returns ≥ 12 entries (seed roster
      from research.md R10).
- [ ] On `main`, `curl /spare-parts | grep FLUX-CAP-MK2` finds the
      flux capacitor (research.md R10 wink).
- [ ] On `main`, `npm run test:e2e` runs all step tests and they all
      pass.
- [ ] `git branch -a | grep -E '^  (remotes/origin/)?(start|solution)/'`
      lists exactly **26** step branches (13 start + 13 solution).
- [ ] Each `start/<step>` branch fails its checkpoint test
      (`npm run test:e2e -- <step>` returns non-zero).
- [ ] Each `solution/<step>` branch passes its checkpoint test.
- [ ] On `solution/05-exception-filters`, hitting the DeLorean
      flux-capacitor scenario from contracts/05-exceptions.md returns
      409 with the unified envelope.
- [ ] On `solution/06-guards`, `POST /vehicles` without `x-api-key`
      returns 401.
- [ ] On `solution/S2-persistence`, restarting the server preserves
      data (insert → restart → re-fetch returns the inserted row).
- [ ] Switching from any `start/<step>` to its `solution/<step>` and
      back takes < 15 seconds (SC-003).
- [ ] Each step's markdown contains a ".NET parallel" callout naming
      at least one .NET / ASP.NET Core construct (FR-006).
- [ ] All 13 step markdowns exist under `docs/steps/`.

---

## What "done" looks like (for the plan, not the workshop)

The plan is implementation-ready when:

1. `tasks.md` exists (output of `/speckit-tasks`).
2. The tasks reference the contracts/ files for what each step's
   implementation must produce.
3. The tasks include a "publish branches" task that runs the
   `scripts/publish-branches.sh` from research.md R1.
4. Re-running this quickstart's checklist after `/speckit-implement`
   ticks every box.
