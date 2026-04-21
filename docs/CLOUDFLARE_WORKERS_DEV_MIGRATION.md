# Cloudflare workers.dev Retirement Runbook

## Scope

This runbook covers the safe retirement of `workers.dev` exposure for `line-crm-worker`.
Do not set `workers_dev = false` until every runtime dependency below has been cut over.

## Current blockers

1. Worker runtime still publishes `WORKER_URL = "https://line-crm-worker.line-crm-api.workers.dev"` in [apps/worker/wrangler.toml](/Users/masayuki_otawara/Dev/line-harness-oss/apps/worker/wrangler.toml:1).
2. The dashboard still depends on `NEXT_PUBLIC_API_URL` for browser calls and demo auth links.
3. The shadow proxy forwards follow events to `https://line-crm-worker.masa-stage1.workers.dev`.
4. Documentation and examples still assume `workers.dev` URLs in many wiki pages.

## Runtime cutover order

1. Provision a custom route for the worker, for example `https://api.example.com`.
2. Set `PUBLIC_BASE_URL` and `WORKER_URL` to the custom route in Wrangler vars.
3. Set `NEXT_PUBLIC_API_URL` for the dashboard and LIFF apps to the same custom route.
4. Generate the cutover variable set with [scripts/prepare-cloudflare-cutover.sh](/Users/masayuki_otawara/Dev/line-harness-oss/scripts/prepare-cloudflare-cutover.sh:1).
5. Update `LINE_HARNESS_WEBHOOK_URL` in `line-webhook-shadow-proxy` to the custom route.
6. Update the LINE Developers webhook endpoint to the custom route.
7. Verify the following paths on the new route:
   - `/webhook`
   - `/auth/line`
   - `/api/friends/count`
   - `/openapi.json`
   - `/t/{linkId}`
8. Monitor for 24-48 hours with both old and new routes available.
9. Only then set `workers_dev = false` and redeploy `line-crm-worker`.

## Validation checklist

- Browser dashboard works with `NEXT_PUBLIC_API_URL` pointing at the custom route.
- Worker-generated auth URLs use `PUBLIC_BASE_URL` when it is configured.
- `FUGUE_BRIDGE_TOKEN` is configured on both `line-webhook-shadow-proxy` and `line-crm-worker` before follow-event federation is relied on.
- SDK clients use the custom route, not `workers.dev`.
- Tracked links redirect correctly from the custom route.
- LINE webhook signature validation still succeeds after endpoint change.
- Shadow proxy follow-event federation reaches `/webhooks/line/fugue-bridge` on the new route.
- Cron jobs still execute after redeploy.

## Inventory refresh

Use [scripts/audit-workers-dev-references.sh](/Users/masayuki_otawara/Dev/line-harness-oss/scripts/audit-workers-dev-references.sh:1) before and after cutover.
Use [scripts/simulate-cloudflare-cutover.sh](/Users/masayuki_otawara/Dev/line-harness-oss/scripts/simulate-cloudflare-cutover.sh:1) to validate the route-ready configuration before changing external webhooks.
The target state is:

- No runtime or config reference to `workers.dev`
- Documentation may retain historical mentions temporarily, but examples should be updated to the custom route before public release
