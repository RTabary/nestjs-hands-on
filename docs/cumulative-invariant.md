# Cumulative-invariant validation evidence (US4)

**Run date**: 2026-04-27
**Run command**: `bash scripts/validate-cumulative.sh`
**Repo state**: `main` at `d86f3f3` (`chore: extend manifest + publish step 08 — core curriculum complete`)

The cumulative invariant defined by [FR-009](../specs/001-nestjs-workshop/spec.md) and [FR-017](../specs/001-nestjs-workshop/spec.md):
on every `solution/<NN>-*` branch, the step `<NN>` checkpoint test must pass green. This evidence file is the captured output of the validate script confirming the invariant holds across all 8 published core branches.

## Output

```text
[validate-cumulative] checking solution/01-bootstrap-modules (pattern: 01-)
[validate-cumulative] PASS solution/01-bootstrap-modules
[validate-cumulative] checking solution/02-controllers-routing (pattern: 02-)
[validate-cumulative] PASS solution/02-controllers-routing
[validate-cumulative] checking solution/03-providers-dependency-injection (pattern: 03-)
[validate-cumulative] PASS solution/03-providers-dependency-injection
[validate-cumulative] checking solution/04-dtos-validation-pipes (pattern: 04-)
[validate-cumulative] PASS solution/04-dtos-validation-pipes
[validate-cumulative] checking solution/05-exception-filters (pattern: 05-)
[validate-cumulative] PASS solution/05-exception-filters
[validate-cumulative] checking solution/06-guards (pattern: 06-)
[validate-cumulative] PASS solution/06-guards
[validate-cumulative] checking solution/07-configuration (pattern: 07-)
[validate-cumulative] PASS solution/07-configuration
[validate-cumulative] checking solution/08-testing (pattern: 08-)
[validate-cumulative] PASS solution/08-testing

[validate-cumulative] summary
  passed: 8
  failed: 0
```

## Re-running the validation

```bash
# Working tree must be clean before the script runs (it switches branches).
git stash --include-untracked          # if needed
bash scripts/validate-cumulative.sh    # ~30s for the full run
git stash pop                          # restore working state
```

The script switches each `solution/*` branch in turn, runs `npm run test:e2e -- <NN>-` (only that step's checkpoint test, not the next step's red target), and exits non-zero if any branch fails.

## Time-budget verification (US4 paired requirement)

Per [research.md R2](../specs/001-nestjs-workshop/research.md#r2-per-step-time-budget-allocation-does-120-min-hold), the eight core steps' stated estimates sum to exactly 115 min, leaving 5 min of slack within the 120-min window:

| Step | Estimated time |
|------|---------------:|
| 01 — Bootstrap & Modules         |  8 min |
| 02 — Controllers & Routing       | 15 min |
| 03 — Providers & DI              | 15 min |
| 04 — DTOs & Validation Pipes     | 18 min |
| 05 — Exception Filters           | 12 min |
| 06 — Guards                      | 15 min |
| 07 — Configuration               | 12 min |
| 08 — Testing                     | 20 min |
| **Total**                        | **115 min** |

Verified via `grep 'Estimated time' docs/steps/0[1-8]*.md` summed → 115 min.
