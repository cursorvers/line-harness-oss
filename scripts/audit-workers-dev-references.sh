#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

runtime_patterns=(
  'apps/worker/wrangler.toml'
  'apps/web/src'
  'packages/sdk/src'
  'docs/.env.example'
  'README.md'
)

echo "== Runtime / config references =="
for target in "${runtime_patterns[@]}"; do
  rg -n 'workers\.dev|masa-stage1\.workers\.dev' "$ROOT/$target" || true
done

echo
echo "== Documentation references =="
rg -n 'workers\.dev|masa-stage1\.workers\.dev' \
  "$ROOT/docs" \
  "$ROOT/packages/sdk/README.md" \
  --glob '!wiki/Home.md' || true
