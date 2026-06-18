# CLAUDE.md

Open-source LINE Official Account CRM and marketing automation platform.
Replaces paid LINE CRM services (L-Message, UTAGEなど) with a zero-cost Cloudflare-hosted alternative.

## Tech Stack

- Runtime: Cloudflare Workers (Hono) + D1 (SQLite)
- Web dashboard: Next.js 15 / React 19 / Tailwind CSS 4, deployed via OpenNext for Cloudflare
- LIFF app: Vite + TypeScript (forms, calendar booking inside LINE)
- Monorepo: pnpm workspaces
- Language: TypeScript (ES2022, strict, bundler module resolution)
- Cron: Workers scheduled trigger every 15 minutes (step delivery, broadcasts, reminders, health checks)

## Directory Layout

- apps/worker/ -- Cloudflare Worker: webhook handler, REST API, cron jobs
- apps/web/ -- Next.js admin dashboard
- apps/liff/ -- LINE Front-end Framework mini-apps (forms, calendar)
- packages/db/ -- D1 schema and migrations
- packages/sdk/ -- TypeScript client SDK for the Worker API (has vitest tests)
- packages/line-sdk/ -- LINE Messaging API wrapper
- packages/mcp-server/ -- MCP server for Claude Code integration
- packages/shared/ -- Shared types and utilities
- packages/create-line-harness/ -- CLI setup wizard (npx create-line-harness)
- packages/plugin-template/ -- Scaffold for custom plugins
- docs/ -- Specs, changelog, wiki
- scripts/sync-oss.sh -- Sync script

## Commands

- `pnpm install` -- install dependencies
- `pnpm dev:worker` -- start Worker locally (wrangler dev)
- `pnpm dev:web` -- start Next.js dashboard on port 3001
- `pnpm build` -- build all packages
- `pnpm deploy:worker` -- deploy Worker to Cloudflare
- `pnpm deploy:web` -- build web for Cloudflare Pages
- `pnpm db:migrate` -- apply D1 schema (remote)
- `pnpm db:migrate:local` -- apply D1 schema (local)
- `pnpm --filter sdk test` -- run SDK tests (vitest)
- `pnpm --filter worker typecheck` -- typecheck worker

## Environment Variables (Worker Bindings)

DB, LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN, API_KEY,
LIFF_URL, LINE_CHANNEL_ID, LINE_LOGIN_CHANNEL_ID, LINE_LOGIN_CHANNEL_SECRET,
WORKER_URL, X_HARNESS_URL (optional), TELEGRAM_BOT_TOKEN (optional),
TELEGRAM_CHAT_ID (optional), NEXT_PUBLIC_API_URL (web)

## Conventions

- Worker env is typed as `Env` in apps/worker/src/index.ts; all bindings accessed via Hono context.
- Multi-account support: one Worker serves multiple LINE accounts, routed by webhook signature.
- DB schema lives in packages/db/schema.sql; migrations in packages/db/migrations/.
- SDK tests use vitest; no test framework in worker or web currently.
- MIT licensed.
