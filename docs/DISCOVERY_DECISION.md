# Discovery decision: evidence-gated three-lane search

## Decision

Sunplain Growth Engine must not turn a search snippet into a sales lead.
It will classify every public result into exactly one of these lanes:

| Lane | Meaning | Can enter the human contact queue? |
| --- | --- | --- |
| `direct_demand` | A verified, current request to buy, import, tender, or receive a quotation | Yes, after human review |
| `purchase_intent` | A trigger such as expansion, new menu, new location, or a procurement role; demand is not proven | No |
| `company_map` | A company matches country, category, and buyer profile; current demand is unknown | No |
| `rejected` | Commentary, training, job ad, supplier promotion, third-party article, or insufficient evidence | No |

`sales_leads` is reserved for a human-approved `direct_demand`. The other lanes are research records, not leads and must never be labelled as current demand.

## Direct-demand gate

All six conditions are required before a result can enter the human contact queue:

1. A public, normalized evidence URL and an exact supporting quote.
2. A concrete purchase request: RFQ, tender, quotation request, supplier wanted, looking to import, or an equivalent localized expression.
3. Product and origin/category evidence matching the brief.
4. Target-country evidence.
5. Identified buyer organization and buyer role or company type.
6. A public contact route: tender contact, official supplier form, official company inquiry page, or a publicly listed business contact.

Evidence must also be current: published within 90 days, or an RFQ/tender deadline that is still valid. A missing gate produces `purchase_intent`, `company_map`, or `rejected` with a reason; it never produces a lead.

## Search budget

Do not exhaust ten requests by searching the same broad phrase on multiple social networks.

Each run executes two jobs only, records the hypothesis and outcome, then lets the human choose the next step.

1. `official_rfq`: official RFQ, tender, or quotation request.
2. `b2b_buy_lead`: a public buy lead that can be corroborated with the buyer's official domain/contact route.

Jobs are one country, one language, and one intent at a time. Search priority is:

`official RFQ/procurement → B2B buy lead → official company source → registered importer / event list → social post`

If two direct-demand jobs produce no qualified result, move to `purchase_intent` or `company_map`; do not broaden a generic `procurement` or `sourcing` query. The result is "no verified public direct demand in this test", never "there are no buyers".

## First implementation scope

Implement only the following before adding crawlers, connectors, or more channels:

- Replace `search_phrases` with persisted `SearchJob` records: country, language, channel, intent, query, status, result count, acceptance count, and rejection reasons.
- Execute and charge one job at a time when it is dispatched; show the next two jobs and remaining daily budget.
- Return a structured classification (`direct_demand`, `purchase_intent`, `company_map`, `rejected`) with gate results and reasons, rather than one keyword score.
- Prevent map and intent results from calling the lead-creation API.
- Show separate tabs for direct demand, purchase intent, company map, and rejected results. The human contact action appears only on a direct-demand card with all gates present.
- Persist evidence URL, quote, published date, buyer organization, organization-confirmation URL, and public contact-route URL separately.
- Add regression tests for procurement commentary, job ads, supplier promotions, third-party articles, stale RFQs, and a valid official RFQ.

## Explicitly out of scope for this increment

- Automated messaging or sending.
- Guessed email addresses or treating a LinkedIn profile as a verified route.
- Site-specific crawling or bypassing logins/paywalls.
- LLM-generated free-form search syntax.
- Automatic promotion from company map or intent signal to a sales lead.
- Broad all-country, all-language searching in one run.

## Acceptance criteria

- No commentary, job ad, supplier self-promotion, or company-unknown social post can appear as `direct_demand`.
- Every direct-demand card has all six gates, evidence URL, quote, freshness, and a public contact route.
- Each search request has a persisted job/outcome record and cannot silently spend the remaining daily budget.
- A zero-result demand test still leaves a usable next action: the next country/language/source hypothesis or a company-map pivot.
