CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  api_key_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime("now")),
  expires_at TEXT NOT NULL,
  last_active_at TEXT NOT NULL DEFAULT (datetime("now"))
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
