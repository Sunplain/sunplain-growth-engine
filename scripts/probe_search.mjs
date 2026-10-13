const queries=[
'"Wanted : Japanese Drinks Like Juice Drinks Ramune" "go4worldbusiness"',
'"Wanted : Used Machine Like Excavator Road Roller" "Buyer From" Japan',
'"Looking for suppliers from: Japan" "Buyer From United States" "Quantity Required"',
'"Looking for suppliers from: Japan" "Buyer From Viet Nam" "Quantity Required"',
'"Looking for suppliers from: Japan" "Buyer From Egypt" "Quantity Required"',
'"Wanted" "Buyer From United States" "Looking for suppliers from: Japan" site:go4worldbusiness.com',
'go4worldbusiness.com/buylead/view/ Wanted Japan suppliers buyer',
'"Japanese" "Looking for suppliers from: Japan" "-Buyer From Japan"'
];
for(const [i,query] of queries.entries()){
 try{
  const r=await fetch("https://api.tavily.com/search",{method:"POST",headers:{"content-type":"application/json","X-Tavily-Access-Mode":"keyless"},body:JSON.stringify({query,max_results:8,search_depth:"advanced",include_raw_content:true,include_domains:["go4worldbusiness.com"]})});
  console.log("Q",i,"http",r.status,"query",query);
  if(!r.ok){console.log("ERROR", (await r.text()).slice(0,200));continue;}
  const j=await r.json();let individual=0,buyerListing=0;
  for(const e of j.results||[]){
   const isInd=/go4worldbusiness\.com\/buylead\/view\/\d+/i.test(e.url||"");
   const raw=e.raw_content||"";let links=[...new Set((raw.match(/(?:https?:\/\/www\.go4worldbusiness\.com)?\/buylead\/view\/\d+\/[^\s)>\]]+/g)||[]))];
   if(isInd)individual++;if(links.length)buyerListing++;
   console.log("RESULT",i,JSON.stringify({url:e.url,title:(e.title||"").slice(0,110),individual:isInd,links:links.slice(0,2),raw_len:raw.length}));
  }
  console.log("SUMMARY",i,"count",(j.results||[]).length,"individual",individual,"listing-with-links",buyerListing);
 }catch(e){console.log("PROBE ERROR",i,String(e).slice(0,200));}
}
try{
 const target="https://www.go4worldbusiness.com/buylead/view/1322302/wanted-%3A-japanese-drinks-like-juice-drinks-ramune.html";
 const r=await fetch(target,{headers:{"user-agent":"Mozilla/5.0 (compatible; SunplainResearch/1.0)"}});
 const body=await r.text();
 console.log("DIRECT_FETCH",r.status,r.url,body.length,/Buyer From United States/i.test(body),/Quantity Required/i.test(body),body.slice(0,200).replace(/\s+/g," "));
}catch(e){console.log("DIRECT_FETCH_ERROR",String(e).slice(0,200));}
