CREATE TABLE IF NOT EXISTS sales_search_briefs (
  id TEXT PRIMARY KEY,
  offer_text TEXT NOT NULL,
  brief_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
