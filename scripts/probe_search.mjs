const queries=[
'site:go4worldbusiness.com/buylead/view/ "Looking for suppliers from: Japan" "Quantity Required" "Wanted"',
'site:go4worldbusiness.com/buylead/view/ "Looking for suppliers from" "Japan" "Buyer From" "Japanese"'
];
for(const [i,query] of queries.entries()){
  try{
    const r=await fetch("https://api.tavily.com/search",{method:"POST",
      headers:{"content-type":"application/json","X-Tavily-Access-Mode":"keyless"},
      body:JSON.stringify({query,max_results:12,search_depth:"advanced",include_raw_content:true,include_domains:["go4worldbusiness.com"]})
    });
    console.log("PROBE",i,"HTTP",r.status);
    if(!r.ok){console.log((await r.text()).slice(0,500));continue;}
    const j=await r.json();console.log("COUNT",j.results?.length??0);
    for(const e of j.results||[]){
      const raw=e.raw_content||"",snip=e.content||"";
      console.log(JSON.stringify({url:e.url,title:e.title,
        is_individual:/go4worldbusiness\.com\/buylead\/view\/\d+/i.test(e.url||""),
        raw_len:raw.length,snip_len:snip.length,hasBuyer:/Buyer From/i.test(raw||snip),
        hasJapanSupplier:/Looking for suppliers from\s*:\s*[^.]{0,100}Japan/i.test(raw||snip),
        hasQuantity:/Quantity Required/i.test(raw||snip),first_raw:raw.slice(0,100).replace(/\s+/g," ")}));
    }
  }catch(e){console.log("PROBE ERROR",String(e).slice(0,500))}
}