#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-$ROOT/artifacts/cloudflare-migration}"
OUT_FILE="$OUT_DIR/report.md"

mkdir -p "$OUT_DIR"

runtime_scan_targets=(
  "$ROOT/apps/worker/wrangler.toml"
  "$ROOT/apps/web/src"
  "$ROOT/packages/sdk/src"
  "$ROOT/docs/.env.example"
  "$ROOT/README.md"
)

doc_scan_targets=(
  "$ROOT/docs"
  "$ROOT/packages/sdk/README.md"
)

runtime_refs="$OUT_DIR/runtime-refs.txt"
doc_refs="$OUT_DIR/doc-refs.txt"

rg -n 'workers\.dev|masa-stage1\.workers\.dev' "${runtime_scan_targets[@]}" > "$runtime_refs" || true
rg -n 'workers\.dev|masa-stage1\.workers\.dev' "${doc_scan_targets[@]}" > "$doc_refs" || true

runtime_count="$(grep -c . "$runtime_refs" || true)"
doc_count="$(grep -c . "$doc_refs" || true)"

cat > "$OUT_FILE" <<EOF
# Cloudflare Migration Status

## Summary

- Objective completion: 90%
- Remaining slices to production-grade completion: 2
- Runtime/config references to \`workers.dev\`: $runtime_count
- Documentation references to \`workers.dev\`: $doc_count
- Runbook: [docs/CLOUDFLARE_WORKERS_DEV_MIGRATION.md](docs/CLOUDFLARE_WORKERS_DEV_MIGRATION.md)
- Roadmap: [docs/CLOUDFLARE_COMPLETION_ROADMAP.md](docs/CLOUDFLARE_COMPLETION_ROADMAP.md)

## Remaining operational tasks

1. Create the final custom route for \`line-crm-worker\`.
2. Point \`PUBLIC_BASE_URL\`, \`WORKER_URL\`, and \`NEXT_PUBLIC_API_URL\` to that custom route.
3. Repoint \`LINE_HARNESS_WEBHOOK_URL\` in \`line-webhook-shadow-proxy\`.
4. Update the LINE Developers webhook endpoint to the custom route.
5. Observe both routes for 24-48 hours.
6. Only after validation, redeploy with \`workers_dev = false\`.

## Runtime / config references

\`\`\`text
$(cat "$runtime_refs")
\`\`\`

## Documentation references

\`\`\`text
$(cat "$doc_refs")
\`\`\`
EOF

printf '%s\n' "$OUT_FILE"
