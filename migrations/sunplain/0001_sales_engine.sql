-- Dedicated Sunplain Growth Engine schema.
-- No Founder Outreach tables, candidates, deliveries, or historical data are touched.
CREATE TABLE IF NOT EXISTS sales_signals (
  id TEXT PRIMARY KEY,
  public_url TEXT NOT NULL,
  display_name TEXT NOT NULL,
  evidence_excerpt TEXT NOT NULL,
  region TEXT NOT NULL,
  contact_route TEXT,
  evidence_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sales_leads (
  id TEXT PRIMARY KEY,
  signal_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  region TEXT NOT NULL,
  public_url TEXT NOT NULL,
  evidence_excerpt TEXT NOT NULL,
  contact_route TEXT,
  duplicate_key TEXT NOT NULL UNIQUE,
  stage TEXT NOT NULL,
  human_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (signal_id) REFERENCES sales_signals(id)
);
CREATE TABLE IF NOT EXISTS sales_events (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  note TEXT,
  occurred_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES sales_leads(id)
);
CREATE INDEX IF NOT EXISTS idx_sales_leads_stage ON sales_leads(stage, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_events_lead ON sales_events(lead_id, occurred_at DESC);
