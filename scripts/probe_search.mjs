const links=[
 ["USA","https://www.go4worldbusiness.com/buyers/united-states/juice.html","1322302"],
 ["VIETNAM","https://www.go4worldbusiness.com/buyers/viet-nam/construction-equipment-machinery.html","1324201"],
 ["EGYPT","https://www.go4worldbusiness.com/buyers/egypt/frozen-fish.html","1314539"]
];
function markupContext(src,id){
 const mark="/buylead/view/"+id+"/",pos=src.indexOf(mark);
 return {index:pos,before:src.slice(Math.max(0,pos-850),pos).replace(/<[^>]*>/g," ").replace(/\s+/g," ").slice(-500),
 after:src.slice(pos,pos+3700).replace(/<[^>]*>/g," ").replace(/\s+/g," ").slice(0,1600),
 rawAnchor:src.slice(Math.max(0,pos-95),pos+240)};
}
for(const [name,url,id] of links) {
 const r=await fetch(url);
 const h=await r.text();
 const total=[...new Set([...h.matchAll(/\/buylead\/view\/(\d+)\//g)].map(m=>m[1]))];
 console.log("CASE",name,"status",r.status,"total",total.length,"wantedID",id,"position",total.indexOf(id)+1,"context",JSON.stringify(markupContext(h,id)));
}
