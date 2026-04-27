#!/usr/bin/env bash
# Validate the cumulative-solution invariant (FR-009 + FR-017):
# every solution/<step> branch's checkpoint test must pass.
#
# For each branch matching `solution/*` in the local repo:
#   1. checkout the branch
#   2. infer the test pattern from the step slug
#   3. run `npm run test:e2e -- <pattern>`
#   4. record pass/fail
#
# At the end:
#   - prints a summary table
#   - exits 0 if all branches pass
#   - exits non-zero if any branch fails
#
# Saves the original branch and returns to it on completion.

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "${REPO_ROOT}"

ORIGINAL_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[validate-cumulative] working tree has uncommitted changes; aborting." >&2
  echo "[validate-cumulative] commit or stash, then re-run." >&2
  exit 2
fi

BRANCHES=()
while IFS= read -r line; do
  line="${line## }"
  line="${line#\* }"
  line="${line## }"
  BRANCHES+=("${line}")
done < <(git for-each-ref --format='%(refname:short)' refs/heads/solution/)

if [[ ${#BRANCHES[@]} -eq 0 ]]; then
  echo "[validate-cumulative] no solution/* branches found; nothing to validate." >&2
  exit 0
fi

declare -a PASSES=()
declare -a FAILS=()
overall_exit=0

for branch in "${BRANCHES[@]}"; do
  step_slug="${branch#solution/}"
  # Extract the leading numeric prefix (e.g., "01" from
  # "01-bootstrap-modules"). Test files are named "<NN>-<short>.e2e-spec.ts"
  # so the leading "NN-" pattern matches the right test even when the
  # branch slug and test file's <short> don't match exactly (e.g., the
  # branch is "01-bootstrap-modules" but the test is "01-bootstrap").
  step_num="${step_slug%%-*}"
  echo "[validate-cumulative] checking ${branch} (pattern: ${step_num}-)"
  git checkout --quiet "${branch}" || {
    echo "[validate-cumulative] FAIL ${branch}: checkout failed"
    FAILS+=("${branch}")
    overall_exit=1
    continue
  }

  # The FR-017 invariant: on solution/<N>, the test for step N must
  # pass. The next step's test (which exists on this branch as the
  # cumulative red target for the next start branch) is intentionally
  # NOT included by this filter.
  if npm run test:e2e -- "${step_num}-" >/dev/null 2>&1; then
    PASSES+=("${branch}")
    echo "[validate-cumulative] PASS ${branch}"
  else
    FAILS+=("${branch}")
    overall_exit=1
    echo "[validate-cumulative] FAIL ${branch}"
  fi
done

git checkout --quiet "${ORIGINAL_BRANCH}"

echo
echo "[validate-cumulative] summary"
echo "  passed: ${#PASSES[@]}"
echo "  failed: ${#FAILS[@]}"
if [[ ${#FAILS[@]} -gt 0 ]]; then
  echo "  failing branches:"
  for b in "${FAILS[@]}"; do
    echo "    - ${b}"
  done
fi

exit "${overall_exit}"
