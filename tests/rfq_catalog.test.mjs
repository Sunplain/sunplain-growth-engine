import test from "node:test";
import assert from "node:assert/strict";
import { listCandidates, detailEvidence, eligibleFeeds } from "../worker/rfq_catalog.mjs";
import { parseTradeLead } from "../worker/buyer_leads.mjs";
const origin="https://www.go4worldbusiness.com/buyers/united-states/juice.html";
const good='<span><a href="/buylead/view/1322302/wanted-:-japanese-drinks.html"><h2>Wanted : Japanese Drinks Like Ramune</h2></a></span><p>Buyer From United States</p><p>Quantity Required: 5 - 10 pallets</p><p>Destination: United States</p><p>Looking for suppliers from: Japan</p>';
const inbound='<a href="/buylead/view/1328920/wanted-:-bauxite-ore.html"><h2>Wanted : Bauxite Ore</h2></a><p>Buyer From Japan</p><p>Quantity Required: 250000 tons</p><p>Destination: Japan</p><p>Looking for suppliers from: Worldwide</p>';
const other='<a href="/buylead/view/1322500/wanted-:-engineering-parts.html"><h2>Wanted : Engineering Parts</h2></a><p>Buyer From United States</p><p>Quantity Required: 100 pieces</p><p>Destination: United States</p><p>Looking for suppliers from: China</p>';
test("discovery extracts only the Japan-facing individual RFQ",()=>{
 const result=listCandidates(origin,good+inbound+other,{region:"global",today:"2026-10-13"});
 assert.equal(result.links_seen,3);assert.equal(result.candidates.length,1);
 assert.match(result.candidates[0].url,/1322302/);
 assert.equal(result.excluded.buyer_in_japan,1);
 assert.equal(result.excluded.not_japan_supplier,1);
});
test("duplicate list links do not double-count a buyer",()=>{
 const result=listCandidates(origin,good+good,{region:"global",today:"2026-10-13"});
 assert.equal(result.links_seen,1);assert.equal(result.candidates.length,1);
});
test("detail HTML passes an individual Japan-supplier RFQ",()=>{
 const html='<html><head><title>Wanted : Japanese Drinks Like Ramune. Buyer from United States. Lead Id 1322302. Dated : Sep 09 2026</title></head><body><h1>Wanted : Japanese Drinks Like Ramune</h1> Buyer From United States VERIFIED Destination: United States Date: Sep 09, 2026 Quantity Required: 5 - 10 pallets Payment Terms: Bank Transfer Looking for suppliers from: Japan Contact: T N</body></html>';
 const lead=parseTradeLead(detailEvidence("https://www.go4worldbusiness.com/buylead/view/1322302/wanted-:-japanese-drinks.html",html),{today:"2026-10-13"});
 assert.ok(lead.candidate);assert.match(lead.candidate.commercial_scale,/pallets/i);
});
test("region selection controls source catalogs",()=>{
 assert.ok(eligibleFeeds("global").length>=3);
 assert.ok(eligibleFeeds("Africa").every(x=>x.region==="Africa"));
 assert.equal(eligibleFeeds("Europe").length,0);
});
test("aggregate list cannot be classified as one buyer",()=>{
 const result=listCandidates(origin,'<div>Buyer From Japan. Quantity Required: 100 tons. Looking for suppliers from Japan</div>',{region:"global",today:"2026-10-13"});
 assert.equal(result.candidates.length,0);
});