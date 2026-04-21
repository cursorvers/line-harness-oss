#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKER_TOML="${ROOT_DIR}/apps/worker/wrangler.toml"
AUTH_FILE="${ROOT_DIR}/apps/worker/src/middleware/auth.ts"
WORKER_INDEX="${ROOT_DIR}/apps/worker/src/index.ts"
FUGUE_BRIDGE_FILE="${ROOT_DIR}/apps/worker/src/routes/fugue-bridge.ts"
WEBHOOKS_FILE="${ROOT_DIR}/apps/worker/src/routes/webhooks.ts"
MIGRATION_PHASE="${CLOUDFLARE_ROUTE_PHASE:-pre-cutover}"

case "${MIGRATION_PHASE}" in
  pre-cutover)
    grep -q '^workers_dev = true$' "${WORKER_TOML}" || {
      echo "line-harness guardrail failed: pre-cutover deployments still expect workers_dev = true" >&2
      exit 1
    }
    ;;
  post-cutover)
    grep -q '^workers_dev = false$' "${WORKER_TOML}" || {
      echo "line-harness guardrail failed: post-cutover deployments must set workers_dev = false" >&2
      exit 1
    }
    ;;
  *)
    echo "line-harness guardrail failed: unsupported CLOUDFLARE_ROUTE_PHASE=${MIGRATION_PHASE}" >&2
    exit 1
    ;;
esac

grep -q '^crons = \["\*/5 \* \* \* \*"\]$' "${WORKER_TOML}" || {
  echo "line-harness guardrail failed: worker cron schedule drifted from the approved */5 cadence" >&2
  exit 1
}

grep -q "authHeader.startsWith('Bearer ')" "${AUTH_FILE}" || {
  echo "line-harness guardrail failed: bearer auth middleware is missing" >&2
  exit 1
}

grep -q '^PUBLIC_WEBHOOK_MAX_BODY_BYTES = "65536"$' "${WORKER_TOML}" || {
  echo "line-harness guardrail failed: public webhook size guard is missing" >&2
  exit 1
}

grep -q 'FUGUE_BRIDGE_TOKEN' "${WORKER_INDEX}" || {
  echo "line-harness guardrail failed: fugue bridge token binding is missing" >&2
  exit 1
}

grep -q 'bridgeTokenAuthorized' "${FUGUE_BRIDGE_FILE}" || {
  echo "line-harness guardrail failed: fugue bridge token check is missing" >&2
  exit 1
}

grep -q 'Unauthorized webhook signature' "${WEBHOOKS_FILE}" || {
  echo "line-harness guardrail failed: incoming webhook HMAC guard is missing" >&2
  exit 1
}

echo "line-harness Cloudflare surface verified (${MIGRATION_PHASE})"
