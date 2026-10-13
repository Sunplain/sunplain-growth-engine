// Individual go4WorldBusiness buying-lead evidence gate; fail closed rather than invent buyer data.
export function parseTradeLead(raw,opts={}) {
 const url=String(raw.url||"");
 if(!/^https:\/\/(?:www\.)?go4worldbusiness\.com\/buylead\/view\/\d+(?:\/|$)/i.test(url)) return {reason:"not_individual_buylead"};
 const clean=v=>String(v||"").replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim();
 const text=clean((raw.title||"")+" "+(raw.excerpt||"")).slice(0,8500);
 if(!/^\s*Wanted\s*:/i.test(raw.title||""))return {reason:"not_wanted"};
 function field(pattern,n=110) {
   const m=pattern.exec(text);if(!m)return "";
   return text.slice(m.index+m[0].length,m.index+m[0].length+n)
    .split(/\b(?:Lead Id|Date|Dated|VERIFIED|Expires|Target Price|Product Description|Quantity Required|Shipping Terms|Payment Terms|Destination Port|Destination|Looking for suppliers from|Contact|Buyer Of|Buyer From|Wanted|Specifications)\b/i)[0]
    .split(/[;|]/)[0].trim().replace(/^[\s:.\-]+|[\s:.\-]+$/g,"");
 }
 const buyer=field(/\bBuyer From\s*:?\s*/i);
 if(!buyer)return{reason:"buyer_unknown"};
 if(/^(Japan|Tokyo|Osaka|Fukuoka|Kyoto)\b/i.test(buyer))return{reason:"buyer_in_japan"};
 const supplier=field(/\bLooking for suppliers from\s*:\s*/i,95);
 if(!/\bJapan\b/i.test(supplier))return{reason:"not_japan_supplier"};
 const destination=field(/\bDestination\s*:\s*/i,95)||field(/\bDestination Port\s*:\s*/i,95);
 if(/^(Japan|Tokyo|Osaka|Fukuoka|Kyoto)\b/i.test(destination))return{reason:"inbound_to_japan"};
 const quantity=field(/\bQuantity Required\s*:\s*/i,85);
 if(!quantity)return{reason:"quantity_missing"};
 const product=clean(raw.title).replace(/^Wanted\s*:\s*/i,"").split(/\bBuyer From\b/i)[0].trim();
 if(product.length<5)return{reason:"item_missing"};
 const regions={
 "Southeast Asia":/Viet\s?Nam|Vietnam|Thailand|Indonesia|Malaysia|Philippines|Singapore|Cambodia|Laos|Myanmar|Brunei|Timor/i,
 "South Asia":/India|Pakistan|Bangladesh|Sri Lanka|Nepal|Bhutan|Maldives/i,
 "Middle East":/Saudi Arabia|United Arab Emirates|UAE|Qatar|Oman|Kuwait|Bahrain|Jordan|Israel|Iran|Iraq|Lebanon|Turkey|Türkiye/i,
 "Africa":/Egypt|Morocco|Nigeria|Kenya|Algeria|Tunisia|South Africa|Ghana|Ethiopia|Tanzania|Uganda|Senegal/i,
 "North America":/United States|USA|Canada|Mexico/i,
 "Latin America & Caribbean":/Brazil|Argentina|Chile|Colombia|Peru|Venezuela|Ecuador|Costa Rica|Panama|Jamaica|Cuba|Dominican Republic/i,
 "Europe":/United Kingdom|UK|Germany|France|Italy|Spain|Sweden|Norway|Finland|Netherlands|Belgium|Poland|Portugal|Greece|Ireland|Switzerland|Austria|Romania|Ukraine/i,
 "East Asia":/China|Taiwan|South Korea|Korea|Hong Kong|Mongolia/i,
 "Central Asia":/Kazakhstan|Uzbekistan|Kyrgyzstan|Tajikistan|Turkmenistan/i,
 "Oceania":/Australia|New Zealand|Fiji|Papua New Guinea/i
 };
 if(opts.region&&opts.region!=="global"&&regions[opts.region]&&!regions[opts.region].test(buyer))return{reason:"wrong_region"};
 const dateMatch=text.match(/\b(?:Dated|Date)\s*:\s*([A-Z][a-z]{2}\s+\d{1,2},?\s+20\d{2})/i);
 if(dateMatch){const age=(new Date(opts.today||new Date().toISOString().slice(0,10))-new Date(dateMatch[1]))/86400000;if(age>180)return{reason:"stale_lead"};}
 const contact=field(/\bContact\s*:\s*/i,75);
 return{candidate:{
   title:product,excerpt:raw.excerpt,display_name:contact||"公開買付案件",url,
   source_platform:"go4WorldBusiness",source_type_hint:"buying_lead",source_type:"buying_lead",
   country:buyer,buyer_type:"公開買付案件の投稿者（法人属性は要確認）",
   need_types:["日本の供給者からの調達"],requested_item:product,
   repeat_signal:/repeat|regular|ongoing|later need more/i.test(text)?"追加・継続発注に言及":"不明",
   commercial_scale:quantity,contact_route:"買付案件ページ（問い合わせ条件要確認）",
   published_at:raw.published_at||dateMatch?.[1]||"不明",
   evidence_summary:`買い手：${buyer}。商品：${product}。数量：${quantity}。希望供給国：${supplier}。${destination?"仕向国："+destination+"。":""}`,
   evidence_status:"原文・接触可否の確認が必要"
 }};
}
