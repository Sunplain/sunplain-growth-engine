const pages=[
 "https://www.go4worldbusiness.com/buyers/united-states/juice.html",
 "https://www.go4worldbusiness.com/buyers/viet-nam/construction-equipment-machinery.html",
 "https://www.go4worldbusiness.com/buyers/egypt/frozen-fish.html",
 "https://www.go4worldbusiness.com/buyers/egypt/seafood.html",
 "https://www.go4worldbusiness.com/buyers/united-kingdom/networking-devices.html",
 "https://www.go4worldbusiness.com/buyers/australia/japanese-clothes.html"
];
const clean=h=>h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
async function fetchPage(url) {
 const r=await fetch(url,{headers:{"user-agent":"Mozilla/5.0 (compatible; PWTRDPreview/1.0)"}});
 return {ok:r.ok,status:r.status,url:r.url,body:r.ok?await r.text():""};
}
for(const url of pages){
 try{
  const a=await fetchPage(url);
  const paths=[...new Set([...a.body.matchAll(/(?:https?:\/\/www\.go4worldbusiness\.com)?\/buylead\/view\/\d+\/[^"'\s<>)]*/gi)].map(m=>m[0].replace(/&amp;.*$/,"").replace(/^\/\//,"https://")))];
  console.log("LIST",JSON.stringify({url,status:a.status,body:a.body.length,link_count:paths.length,first:paths.slice(0,4)}));
  if(!paths.length)continue;
  const first=paths.find(x=>!x.includes('japan/'))||paths[0];
  const full=first.startsWith("http")?first:new URL(first,a.url).href;
  const d=await fetchPage(full),plain=clean(d.body);
  const fieldWords=["Wanted :", "Buyer From","Destination:","Quantity Required:","Looking for suppliers from:","Contact :"];
  console.log("DETAIL",JSON.stringify({url:full,status:d.status,htmlLength:d.body.length,
    title:(d.body.match(/<title[^>]*>([\s\S]{0,400}?)<\/title>/i)||[])[1],
    fields:fieldWords.map(w=>({field:w,index:plain.toLowerCase().indexOf(w.toLowerCase())})),
    buyerContext:plain.slice(Math.max(0,plain.indexOf("Buyer From")-130),plain.indexOf("Buyer From")+440),
    suppliersContext:plain.slice(Math.max(0,plain.indexOf("Looking for suppliers from")-160),plain.indexOf("Looking for suppliers from")+180)
  }));
 }catch(e){console.log("PAGE ERROR",url,String(e).slice(0,250))}
}
