#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKER_TOML="${ROOT_DIR}/apps/worker/wrangler.toml"
AUTH_FILE="${ROOT_DIR}/apps/worker/src/middleware/auth.ts"

grep -q '^workers_dev = true$' "${WORKER_TOML}" || {
  echo "line-harness guardrail failed: current deployment still expects workers_dev = true until route migration is complete" >&2
  exit 1
}

grep -q '^crons = \["\*/5 \* \* \* \*"\]$' "${WORKER_TOML}" || {
  echo "line-harness guardrail failed: worker cron schedule drifted from the approved */5 cadence" >&2
  exit 1
}

grep -q "authHeader.startsWith('Bearer ')" "${AUTH_FILE}" || {
  echo "line-harness guardrail failed: bearer auth middleware is missing" >&2
  exit 1
}

echo "line-harness Cloudflare surface verified"
