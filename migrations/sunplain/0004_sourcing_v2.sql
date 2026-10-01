-- Sunplain Growth Engine V2: Japan sourcing demand finder
-- Additive only. Existing sales_* tables and production data are not modified.

CREATE TABLE IF NOT EXISTS sourcing_signals (
  id TEXT PRIMARY KEY,
  public_url TEXT NOT NULL,
  source_platform TEXT NOT NULL,
  source_type TEXT NOT NULL,
  published_at TEXT,
  display_name TEXT NOT NULL,
  evidence_excerpt TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '不明',
  buyer_type TEXT NOT NULL DEFAULT '不明',
  need_types TEXT NOT NULL DEFAULT '[]',
  requested_item TEXT NOT NULL DEFAULT '不明',
  repeat_signal TEXT NOT NULL DEFAULT '不明',
  commercial_scale TEXT NOT NULL DEFAULT '不明',
  contact_route TEXT NOT NULL DEFAULT '不明',
  evidence_summary TEXT NOT NULL,
  evidence_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sourcing_leads (
  id TEXT PRIMARY KEY,
  signal_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '不明',
  public_url TEXT NOT NULL,
  evidence_excerpt TEXT NOT NULL,
  evidence_summary TEXT NOT NULL,
  requested_item TEXT NOT NULL DEFAULT '不明',
  contact_route TEXT NOT NULL DEFAULT '不明',
  duplicate_key TEXT NOT NULL UNIQUE,
  stage TEXT NOT NULL,
  human_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (signal_id) REFERENCES sourcing_signals(id)
);

CREATE TABLE IF NOT EXISTS sourcing_events (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  note TEXT,
  occurred_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES sourcing_leads(id)
);

CREATE INDEX IF NOT EXISTS idx_sourcing_signals_type ON sourcing_signals(source_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sourcing_leads_stage ON sourcing_leads(stage, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sourcing_events_lead ON sourcing_events(lead_id, occurred_at DESC);
