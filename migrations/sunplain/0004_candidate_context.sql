-- Dedicated Sunplain Growth Engine enrichment. Founder Outreach tables are never referenced.
ALTER TABLE sales_signals ADD COLUMN discovery_mode TEXT NOT NULL DEFAULT 'demand';
ALTER TABLE sales_signals ADD COLUMN demand_summary TEXT;
ALTER TABLE sales_signals ADD COLUMN signal_date TEXT;
ALTER TABLE sales_leads ADD COLUMN company_name TEXT;
ALTER TABLE sales_leads ADD COLUMN company_type TEXT;
ALTER TABLE sales_leads ADD COLUMN demand_summary TEXT;
ALTER TABLE sales_leads ADD COLUMN signal_date TEXT;
ALTER TABLE sales_leads ADD COLUMN decision_maker TEXT;
ALTER TABLE sales_leads ADD COLUMN source TEXT;
ALTER TABLE sales_leads ADD COLUMN discovery_mode TEXT NOT NULL DEFAULT 'demand';
