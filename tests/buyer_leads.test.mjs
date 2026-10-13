import test from "node:test";
import assert from "node:assert/strict";
import { parseTradeLead } from "../worker/buyer_leads.mjs";
const base="https://www.go4worldbusiness.com/buylead/view/";
const today="2026-10-13";
function check(title,excerpt,id){return parseTradeLead({title,excerpt,url:base+id+"/wanted-sample.html"},{today});}
test("US Japanese drinks, 5–10 pallets: buyer lead",()=>{
 const r=check("Wanted : Japanese Drinks Like Juice Drinks, Ramune",
  "Buyer From United States. Date: Sep 09 2026 Destination: United States Quantity Required: 5 - 10 pallets Payment Terms: Bank Transfer Looking for suppliers from: Japan",1322302);
 assert.ok(r.candidate);assert.match(r.candidate.commercial_scale,/5 - 10 pallets/);
});
test("Vietnam used machines: buyer lead",()=>{
 const r=check("Wanted : Used Machine Like Excavator, Road Roller",
  "Buyer From Viet Nam. Date: Sep 17 2026 Destination: Viet Nam Quantity Required: 1 Unit Payment Terms: TT/LC Looking for suppliers from: Japan",1324201);
 assert.ok(r.candidate);assert.match(r.candidate.country,/Viet Nam/);
});
test("Egypt Japanese mackerel, container: buyer lead",()=>{
 const r=check("Wanted : Frozen Fish Like Japanese Mackerel Fish",
  "Buyer From Egypt. Date: Aug 03 2026 Destination: Egypt Quantity Required: 1 Forty-Foot Container Payment Terms: L/C Looking for suppliers from: Taiwan, Japan",1314539);
 assert.ok(r.candidate);assert.match(r.candidate.commercial_scale,/Container/);
});
test("Japan-side import buyer excluded",()=>{
 const r=check("Wanted : Bauxite Ore","Buyer From Japan Destination: Japan Quantity Required: 200000 MT Looking for suppliers from: Worldwide",11);
 assert.equal(r.candidate,undefined);
});
test("Goods going into Japan excluded",()=>{
 const r=check("Wanted : Iron Ore","Buyer From Indonesia Destination: Japan Quantity Required: 450000 MT Looking for suppliers from: Japan",12);
 assert.equal(r.reason,"inbound_to_japan");
});
test("Supplier advertisements cannot become buyer leads",()=>{
 const r=parseTradeLead({title:"JEPRA Your Sourcing Partner",excerpt:"We offer Japan sourcing services.",url:"https://jepra.com/services"}, {today});
 assert.equal(r.reason,"not_individual_buylead");
});
test("Aggregated listing pages cannot become one lead",()=>{
 const r=parseTradeLead({title:"Wanted : Frozen Fish",excerpt:"Buyer From Egypt Destination: Egypt Quantity Required: 1 Container Looking for suppliers from: Japan",url:"https://www.go4worldbusiness.com/find?BuyersOrSuppliers=buyers"}, {today});
 assert.equal(r.reason,"not_individual_buylead");
});
test("Buyer seeking non-Japan supplier excluded",()=>{
 const r=check("Wanted : Steel", "Buyer From Egypt Destination: Egypt Quantity Required: 10 tons Looking for suppliers from: China",14);
 assert.equal(r.reason,"not_japan_supplier");
});
test("Unknown quantity excluded",()=>{
 const r=check("Wanted : Steel", "Buyer From Egypt Destination: Egypt Looking for suppliers from: Japan",15);
 assert.equal(r.reason,"quantity_missing");
});
test("Region filter uses buyer country",()=>{
 const r=check("Wanted : Japanese Drinks", "Buyer From United States Destination: United States Quantity Required: 10 pallets Looking for suppliers from: Japan",16);
 assert.equal(parseTradeLead({title:"Wanted : Japanese Drinks",excerpt:"Buyer From United States Destination: United States Quantity Required: 10 pallets Looking for suppliers from: Japan",url:base+"16/foo.html"},{today,region:"Southeast Asia"}).reason,"wrong_region");
 assert.ok(r.candidate);
});
test("Stale RFQ excluded",()=>{
 const r=check("Wanted : Machines", "Buyer From Egypt Date: Jan 01 2024 Destination: Egypt Quantity Required: 1 Container Looking for suppliers from: Japan",16);
 assert.equal(r.reason,"stale_lead");
});
