-- Migration 012: delivery claims + schema sync for fresh installs
-- Run: wrangler d1 execute line-crm --file=packages/db/migrations/012_delivery_claims_and_schema_sync.sql --remote

CREATE TABLE IF NOT EXISTS scenario_step_deliveries (
  id                 TEXT PRIMARY KEY,
  friend_scenario_id TEXT NOT NULL REFERENCES friend_scenarios (id) ON DELETE CASCADE,
  scenario_step_id   TEXT NOT NULL REFERENCES scenario_steps (id) ON DELETE CASCADE,
  delivered_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now', '+9 hours')),
  UNIQUE (friend_scenario_id, scenario_step_id)
);
