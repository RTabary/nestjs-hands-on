#!/usr/bin/env bash
# Publish the workshop's start/* and solution/* branches from the
# manifest at scripts/branches.yml.
#
# Idempotent: re-running with the same manifest is a no-op (uses
# `git branch -f`); re-running after a manifest change re-stamps every
# branch in one shot.
#
# Requires only standard tools: bash, git, awk. No yq dependency —
# the manifest format is parsed inline.
#
# Manifest format (scripts/branches.yml):
#
#   branches:
#     - name: 01-bootstrap-modules
#       start: <git-rev>
#       solution: <git-rev>
#     - name: 02-controllers-routing
#       start: <git-rev>
#       solution: <git-rev>
#     ...
#
# Manifest revisions can be commit SHAs, tags, or any rev-parseable string.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
MANIFEST="${REPO_ROOT}/scripts/branches.yml"

if [[ ! -f "${MANIFEST}" ]]; then
  echo "[publish-branches] no manifest at ${MANIFEST}; nothing to do" >&2
  exit 0
fi

# Parse the manifest into a stream of "<name>|<start>|<solution>" lines.
# Anything outside the `branches:` list is ignored.
parse_manifest() {
  awk '
    BEGIN { in_list = 0; name = ""; start = ""; solution = "" }
    /^branches:/ { in_list = 1; next }
    in_list == 0 { next }
    /^[[:space:]]*-[[:space:]]*name:/ {
      if (name != "" && start != "" && solution != "") {
        print name "|" start "|" solution
      }
      sub(/^[[:space:]]*-[[:space:]]*name:[[:space:]]*/, "")
      name = $0
      start = ""
      solution = ""
      next
    }
    /^[[:space:]]+start:/ {
      sub(/^[[:space:]]+start:[[:space:]]*/, "")
      start = $0
      next
    }
    /^[[:space:]]+solution:/ {
      sub(/^[[:space:]]+solution:[[:space:]]*/, "")
      solution = $0
      next
    }
    END {
      if (name != "" && start != "" && solution != "") {
        print name "|" start "|" solution
      }
    }
  ' "${MANIFEST}"
}

count=0
while IFS='|' read -r name start solution; do
  [[ -z "${name}" ]] && continue

  # Strip surrounding quotes if any.
  name="${name//\"/}"
  start="${start//\"/}"
  solution="${solution//\"/}"

  start_sha="$(git rev-parse --verify --quiet "${start}^{commit}" || true)"
  solution_sha="$(git rev-parse --verify --quiet "${solution}^{commit}" || true)"

  if [[ -z "${start_sha}" ]]; then
    echo "[publish-branches] WARN: cannot resolve start rev '${start}' for '${name}'; skipping" >&2
    continue
  fi
  if [[ -z "${solution_sha}" ]]; then
    echo "[publish-branches] WARN: cannot resolve solution rev '${solution}' for '${name}'; skipping" >&2
    continue
  fi

  git branch -f "start/${name}" "${start_sha}"
  git branch -f "solution/${name}" "${solution_sha}"
  echo "[publish-branches] published start/${name} -> ${start_sha:0:7}"
  echo "[publish-branches] published solution/${name} -> ${solution_sha:0:7}"
  count=$((count + 1))
done < <(parse_manifest)

echo "[publish-branches] done — ${count} step(s) published"
