#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CUSTOM_ROUTE="${1:-https://api.example.com}"

if [[ ! "$CUSTOM_ROUTE" =~ ^https?:// ]]; then
  echo "custom route must start with http:// or https://" >&2
  exit 1
fi

echo "[simulate] custom route: $CUSTOM_ROUTE"

echo "[simulate] building workspace packages required by worker tests"
pnpm --dir "$ROOT" --filter @line-crm/shared --filter @line-crm/line-sdk build

PUBLIC_BASE_URL="$CUSTOM_ROUTE" \
  pnpm --dir "$ROOT/apps/worker" test

NEXT_PUBLIC_API_URL="$CUSTOM_ROUTE" \
  pnpm --dir "$ROOT" exec tsc -p "$ROOT/apps/web/tsconfig.json" --noEmit

bash "$ROOT/scripts/audit-workers-dev-references.sh" >/tmp/line-harness-workers-dev-audit.txt

echo "[simulate] audit snapshot:"
sed -n '1,40p' /tmp/line-harness-workers-dev-audit.txt
echo "[simulate] completed"
