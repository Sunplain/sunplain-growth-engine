import assert from "node:assert/strict";
import {listCandidates,detailEvidence,eligibleFeeds} from "../worker/rfq_catalog.mjs";
import {parseTradeLead} from "../worker/buyer_leads.mjs";
const examples=[
 {market:"United States",id:"1322302",item:/drinks/i},
 {market:"Viet Nam",id:"1324201",item:/machine/i},
 {market:"Egypt",id:"1314539",item:/mackerel|fish/i}
];
let verified=0;
for(const x of examples){
 const feed=eligibleFeeds("global").find(f=>f.market===x.market&&(/frozen-fish|juice|construction/.test(f.url)));
 assert.ok(feed,"Source listing not configured: "+x.market);
 const res=await fetch(feed.url,{headers:{accept:"text/html"}});
 assert.equal(res.status,200,"Catalog page unavailable "+x.market);
 const list=listCandidates(feed.url,await res.text(),{region:"global",today:"2026-10-13"});
 const hit=list.candidates.find(v=>v.url.includes("/"+x.id+"/"));
 console.log("MARKET",x.market,"links",list.links_seen,"shortlist",list.candidates.length,"target_found",!!hit);
 assert.ok(hit,"Expected RFQ missing from listing "+x.market);
 const detail=await fetch(hit.url,{headers:{accept:"text/html"}});
 assert.equal(detail.status,200);
 const result=parseTradeLead(detailEvidence(hit.url,await detail.text()),{region:"global",today:"2026-10-13"});
 console.log("LEAD",x.market,JSON.stringify({ok:!!result.candidate,reason:result.reason,
   buyer:result.candidate?.country,quantity:result.candidate?.commercial_scale,
   product:result.candidate?.requested_item,url:hit.url}));
 assert.ok(result.candidate,"Candidate failed detail verification for "+x.market+": "+result.reason);
 assert.match(result.candidate.requested_item,x.item);
 verified++;
}
console.log("LIVE_SOURCE_SMOKE_OK",verified);
