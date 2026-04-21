# Cloudflare Completion Roadmap

## Objective

Finish Cloudflare remediation without breaking production integrations.

## Current completion estimate

- Objective completion: `78%`
- Remaining slices to production-grade completion: `3`

## Slices

1. `Done` — stop direct cost-growth paths in `x-auto` and lock down fail-open monitoring/canary behavior.
2. `Done` — add audit/reporting guardrails and route-cutover runbooks.
3. `In progress` — make runtime code custom-route-ready and add simulation coverage.
4. `Pending external ops` — switch custom route + webhook destinations + monitor 24-48h.
5. `Pending external ops` — disable `workers_dev` on `line-crm-worker` and `line-webhook-shadow-proxy`.

## Acceptance criteria

- `x-auto` no longer depends on public anonymous image reads by default.
- `cloudflare-workers-hub` monitoring is fail-closed and canary writes are blocked by default.
- `line-harness-oss` can generate public URLs from `PUBLIC_BASE_URL` instead of hard-coded `workers.dev`.
- `line-webhook-shadow-proxy` has request-cost controls for oversized or obviously invalid traffic.
- GitHub Actions emits a migration status report for remaining operational steps.

## Blocking external dependencies

- Final custom route hostname
- Cloudflare Notifications configuration
- LINE Developers webhook cutover
- Observation window before disabling `workers_dev`
