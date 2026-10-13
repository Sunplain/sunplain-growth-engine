import { parseTradeLead } from "./buyer_leads.mjs";

export const BUYER_FEEDS = Object.freeze([
  {region:"North America",market:"United States",url:"https://www.go4worldbusiness.com/buyers/united-states/juice.html"},
  {region:"Southeast Asia",market:"Viet Nam",url:"https://www.go4worldbusiness.com/buyers/viet-nam/construction-equipment-machinery.html"},
  {region:"Africa",market:"Egypt",url:"https://www.go4worldbusiness.com/buyers/egypt/frozen-fish.html"},
  {region:"Oceania",market:"Australia",url:"https://www.go4worldbusiness.com/buyers/australia/japanese-clothes.html"},
  {region:"Africa",market:"Egypt",url:"https://www.go4worldbusiness.com/buyers/egypt/seafood.html"}
]);

export function textFromHtml(html){
  return String(html||"")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi," ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi," ")
    .replace(/<!--[\s\S]*?-->/g," ")
    .replace(/<[^>]*>/g," ")
    .replace(/&nbsp;|&#160;|&#xA0;/gi," ")
    .replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
    .replace(/\s+/g," ").trim();
}
export function detailEvidence(url,html){
  const titleMatch=String(html||"").match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);
  const title=textFromHtml(titleMatch?.[1]||"").split(/\s+Buyer\s+from\s+/i)[0].trim();
  return {url,title,excerpt:textFromHtml(html).slice(0,9500),source_platform:"go4WorldBusiness",source_type_hint:"buying_lead"};
}
export function listCandidates(listUrl,html,{region="global",today}={}){
  const output=[],seen=new Set(),rejected={};
  const re=/\bhref\s*=\s*["']([^"']*\/buylead\/view\/\d+\/[^"']+)["']/gi;
  for(const match of String(html||"").matchAll(re)){
    let url;
    try { url=new URL(match[1].replace(/&amp;/g,"&"),listUrl).href; } catch { continue; }
    if(seen.has(url))continue;
    seen.add(url);
    // Buyer data is displayed immediately after the title link in the list.
    // Keep a short local slice: never classify the whole list as one buyer.
    const snippet=textFromHtml(html.slice(match.index,match.index+4300));
    const titleMatch=snippet.match(/\bWanted\s*:\s*(.{4,240}?)\s+Buyer\s+From\b/i);
    if(!titleMatch){rejected.no_title=(rejected.no_title||0)+1;continue;}
    const evidence={url,title:"Wanted : "+titleMatch[1].trim(),excerpt:snippet.slice(0,3200),source_platform:"go4WorldBusiness",source_type_hint:"buying_lead"};
    const gate=parseTradeLead(evidence,{region,today});
    if(gate.candidate)output.push(evidence);
    else rejected[gate.reason||"unqualified"]=(rejected[gate.reason||"unqualified"]||0)+1;
  }
  return {candidates:output,links_seen:seen.size,excluded:rejected};
}
export function eligibleFeeds(region){
  if(region==="global"||!region)return BUYER_FEEDS;
  return BUYER_FEEDS.filter(f=>f.region===region);
}
