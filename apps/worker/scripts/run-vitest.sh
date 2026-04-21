#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
WORKER_ROOT="$ROOT/apps/worker"

TEST_FILES=(
  "src/services/account-context.test.ts"
  "src/services/delivery-account-scope.test.ts"
  "src/services/public-base-url.test.ts"
  "src/routes/manual-enroll-account-consistency.test.ts"
  "src/routes/fugue-bridge-contract.test.ts"
  "src/routes/incoming-webhook-receive-auth.test.ts"
)

pnpm --dir "$ROOT" --filter @line-harness/sdk exec vitest \
  --root "$WORKER_ROOT" \
  --config "$WORKER_ROOT/vitest.config.ts" \
  "$@" \
  "${TEST_FILES[@]}"
