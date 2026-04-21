#!/usr/bin/env bash
set -euo pipefail

CUSTOM_ROUTE="${1:-}"

if [[ -z "$CUSTOM_ROUTE" ]]; then
  echo "usage: $0 https://api.example.com" >&2
  exit 1
fi

if [[ ! "$CUSTOM_ROUTE" =~ ^https:// ]]; then
  echo "custom route must be https://..." >&2
  exit 1
fi

cat <<EOF
# Cloudflare cutover preflight

## line-harness-oss
PUBLIC_BASE_URL=$CUSTOM_ROUTE
WORKER_URL=$CUSTOM_ROUTE
NEXT_PUBLIC_API_URL=$CUSTOM_ROUTE

## line-webhook-shadow-proxy
LINE_HARNESS_WEBHOOK_URL=$CUSTOM_ROUTE

## External webhook endpoint
LINE Developers webhook URL:
$CUSTOM_ROUTE/webhook

## Validation targets
- $CUSTOM_ROUTE/webhook
- $CUSTOM_ROUTE/auth/line
- $CUSTOM_ROUTE/api/friends/count
- $CUSTOM_ROUTE/openapi.json
- $CUSTOM_ROUTE/t/{linkId}
EOF
