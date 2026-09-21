CREATE TABLE IF NOT EXISTS sales_search_usage (
  usage_day TEXT PRIMARY KEY,
  runs INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
