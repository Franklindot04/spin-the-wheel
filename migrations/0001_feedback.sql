CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  what_happened TEXT NOT NULL,
  what_i_did TEXT NOT NULL DEFAULT '',
  what_i_expected TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at);
