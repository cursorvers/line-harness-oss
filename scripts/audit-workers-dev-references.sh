#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STRICT_RUNTIME=0
STRICT_DOCS=0

for arg in "$@"; do
  case "$arg" in
    --strict-runtime)
      STRICT_RUNTIME=1
      ;;
    --strict-docs)
      STRICT_DOCS=1
      ;;
    --strict-all)
      STRICT_RUNTIME=1
      STRICT_DOCS=1
      ;;
    *)
      echo "unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

runtime_patterns=(
  'apps/worker/wrangler.toml'
  'apps/web/src'
  'packages/sdk/src'
  'docs/.env.example'
  'README.md'
)

runtime_refs=()
doc_refs=()

echo "== Runtime / config references =="
for target in "${runtime_patterns[@]}"; do
  while IFS= read -r line; do
    runtime_refs+=("$line")
    printf '%s\n' "$line"
  done < <(rg -n 'workers\.dev|masa-stage1\.workers\.dev' "$ROOT/$target" || true)
done

echo
echo "== Documentation references =="
while IFS= read -r line; do
  doc_refs+=("$line")
  printf '%s\n' "$line"
done < <(
  rg -n 'workers\.dev|masa-stage1\.workers\.dev' \
    "$ROOT/docs" \
    "$ROOT/packages/sdk/README.md" \
    --glob '!wiki/Home.md' || true
)

echo
echo "Runtime reference count: ${#runtime_refs[@]}"
echo "Documentation reference count: ${#doc_refs[@]}"

if [[ "$STRICT_RUNTIME" -eq 1 && "${#runtime_refs[@]}" -gt 0 ]]; then
  echo "audit failed: runtime/config references to workers.dev remain" >&2
  exit 1
fi

if [[ "$STRICT_DOCS" -eq 1 && "${#doc_refs[@]}" -gt 0 ]]; then
  echo "audit failed: documentation references to workers.dev remain" >&2
  exit 1
fi
