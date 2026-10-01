import { APP_JS } from "./app";
type Stmt={all<T>():Promise<{results:T[]}>;bind(...x:unknown[]):{first<T>():Promise<T|null>;run():Promise<unknown>}};
type DB={prepare(q:string):Stmt;batch(x:unknown[]):Promise<unknown>};
type Env={DB:DB;AI:{run(m:string,x:unknown):Promise<{response:string}>}};
type Raw={title:string;excerpt:string;display_name:string;url:string;source_platform:string;source_type_hint:string};
const id=()=>crypto.randomUUID(),now=()=>new Date().toISOString(),day=()=>now().slice(0,10),json=(x:unknown,s=200)=>Response.json(x,{status:s}),LIMIT=10;
const clean=(s:string)=>s.replace(/^\x60\x60\x60json\s*|\s*\x60\x60\x60$/g,"");
const needLabels:{[k:string]:string}={find:"日本で商品を探してほしい",buy:"日本で代理購入してほしい",supplier:"日本の仕入先を探している",receive:"日本国内で商品を受け取ってほしい",consolidate:"複数商品をまとめて発送してほしい",partner:"日本側の継続的な調達パートナーを探している"};

const html=[
"<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Sunplain Growth Engine</title>",
"<style>body{margin:0;background:#f5f7f8;color:#1e2930;font:15px system-ui,-apple-system,sans-serif}main{max-width:1100px;margin:auto;padding:30px 18px 60px}h1{margin:4px 0 6px;font-size:32px}h2{margin-top:0}.tag{color:#415d73;font-weight:800;letter-spacing:.04em}.lead{color:#56636d}.small{font-size:13px;color:#6d7981}section{background:#fff;border:1px solid #dce3e7;border-radius:14px;padding:20px;margin:16px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 16px}.opt{border:1px solid #d8e0e5;border-radius:9px;padding:10px;background:#fafbfc}select{width:100%;padding:10px;border:1px solid #cfd8de;border-radius:8px;background:white;font:inherit}button{background:#405f76;color:white;border:0;border-radius:8px;padding:11px 15px;font-weight:750;cursor:pointer}.secondary{background:#eef2f4;color:#2c414f;border:1px solid #cfdae0}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0}.stat,.stage{background:#f4f7f9;border:1px solid #dbe3e8;border-radius:10px;padding:12px}.stat b,.stage b{display:block;font-size:22px}.card{border:1px solid #d8e1e6;border-radius:12px;padding:16px;margin:12px 0}.card h3{margin:2px 0 8px}.chip{display:inline-block;border:1px solid #cfdbe1;background:#f7f9fa;border-radius:20px;padding:4px 8px;margin:2px;font-size:12px}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}.meta div{background:#f8fafb;border-radius:8px;padding:8px}.pipeline{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.stage{text-align:center}a{color:#315f7d}@media(max-width:760px){.grid,.checks,.stats,.pipeline,.meta{grid-template-columns:1fr}}</style>",
"<main><div class=tag>JAPAN SOURCING DEMAND FINDER</div><h1>Sunplain Growth Engine</h1><p class=lead>日本から商品を調達・購入・受取・発送してくれる相手を探している公開情報を見つけ、接触候補として整理します。</p><p class=small>公開情報のみを使用します。最終判断は人が行います。</p>",
"<section><h2>1. どんな需要を探しますか？</h2><div class=grid><div><b>対象地域</b><select id=region><option value=global>Global</option><option>North America</option><option>Latin America & Caribbean</option><option>Europe</option><option>East Asia</option><option>Southeast Asia</option><option>South Asia</option><option>Middle East</option><option>Africa</option><option>Central Asia</option><option>Oceania</option></select></div><div><b>対象</b><select id=target><option value=business_priority>法人・事業者を優先</option><option value=include_individual>個人を含む</option></select></div></div><p><b>探す需要</b></p><div class=checks>",
"<label class=opt><input type=checkbox name=need value=find checked> 日本で商品を探してほしい</label><label class=opt><input type=checkbox name=need value=buy checked> 日本で代理購入してほしい</label><label class=opt><input type=checkbox name=need value=supplier checked> 日本の仕入先を探している</label><label class=opt><input type=checkbox name=need value=receive checked> 日本国内で商品を受け取ってほしい</label><label class=opt><input type=checkbox name=need value=consolidate checked> 複数商品をまとめて発送してほしい</label><label class=opt><input type=checkbox name=need value=partner checked> 日本側の継続的な調達パートナーを探している</label>",
"</div><button id=search>現在の需要を探す</button><p id=msg class=small></p></section>",
"<section><h2>2. 発見した需要</h2><div id=stats class=stats><div class=stat><span>直接需要</span><b>0</b></div><div class=stat><span>買付案件</span><b>0</b></div><div class=stat><span>既存輸入企業</span><b>0</b></div><div class=stat><span>接触経路あり</span><b>0</b></div></div><div id=results><p class=small>まだ検索していません。</p></div></section>",
"<section><h2>3. 接触候補</h2><div id=pipeline class=pipeline></div><div id=leads></div></section></main>",
"<script>const $=s=>document.querySelector(s),E=s=>{const d=document.createElement('div');d.textContent=String(s??'');return d.innerHTML};let found=[];const typeLabel={explicit_demand:'直接需要',buying_lead:'買付案件',existing_importer:'既存輸入企業'},stageLabel={reviewed:'確認済み',contact_ready:'接触可能',contacted:'接触済み',replied:'返信あり',sourcing_request:'調達依頼',quote:'見積提示',paid:'入金',repeat:'再注文',larger_order:'取引拡大'},stages=Object.keys(stageLabel);",
"function stats(cs){const n=t=>cs.filter(x=>x.source_type===t).length,contact=cs.filter(x=>x.contact_route&&x.contact_route!=='不明').length;$('#stats').innerHTML=[['直接需要',n('explicit_demand')],['買付案件',n('buying_lead')],['既存輸入企業',n('existing_importer')],['接触経路あり',contact]].map(x=>'<div class=stat><span>'+x[0]+'</span><b>'+x[1]+'</b></div>').join('')}",
"function render(cs){found=cs;stats(cs);$('#results').innerHTML=cs.length?cs.map((c,i)=>'<div class=card><div class=small>'+E(c.source_platform)+' · '+E(typeLabel[c.source_type]||c.source_type)+'</div><h3>'+E(c.country||'地域不明')+'｜'+E(c.requested_item||c.title)+'</h3><p><b>公開情報から確認できる内容</b><br>'+E(c.evidence_summary||c.excerpt)+'</p><div>'+(c.need_types||[]).map(x=>'<span class=chip>'+E(x)+'</span>').join('')+'<span class=chip>'+E(c.repeat_signal||'継続性不明')+'</span><span class=chip>'+E(c.commercial_scale||'規模不明')+'</span></div><div class=meta><div><b>相手</b><br>'+E(c.buyer_type||'不明')+'</div><div><b>接触方法</b><br>'+E(c.contact_route||'不明')+'</div><div><b>公開日</b><br>'+E(c.published_at||'不明')+'</div><div><b>Evidence</b><br>'+E(c.evidence_status||'要確認')+'</div></div><a target=_blank rel=noopener href=\\\"'+E(c.url)+'\\\">元の情報を確認</a>　<button class=secondary onclick=\\\"addLead('+i+')\\\">接触候補に追加</button></div>').join(''):'<p class=small>根拠のある候補は見つかりませんでした。</p>'}",
"$('#search').onclick=async()=>{const needs=[...document.querySelectorAll('input[name=need]:checked')].map(x=>x.value);$('#msg').textContent='公開情報を検索し、内容を整理しています…';$('#results').innerHTML='<p class=small>検索中です。</p>';const r=await fetch('/api/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({region:$('#region').value,target:$('#target').value,needs})}),x=await r.json();$('#msg').textContent=r.ok?('検索完了。Web検索残り：'+(x.remaining_searches??'-')+' / 10'):x.error;if(r.ok)render(x.candidates||[])};",
"async function addLead(i){const r=await fetch('/api/leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(found[i])}),x=await r.json();alert(r.ok?'接触候補に追加しました。':x.error);load()}async function setStage(id,stage){if(!stage)return;await fetch('/api/leads/'+id+'/stage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({stage})});load()}",
"async function load(){const x=await(await fetch('/api/leads')).json();$('#pipeline').innerHTML=stages.map(s=>'<div class=stage><span>'+stageLabel[s]+'</span><b>'+x.filter(v=>v.stage===s).length+'</b></div>').join('');$('#leads').innerHTML=x.length?x.map(v=>'<div class=card><h3>'+E(v.country||'地域不明')+'｜'+E(v.requested_item||v.display_name)+'</h3><p>'+E(v.evidence_summary||v.evidence_excerpt)+'</p><a target=_blank rel=noopener href=\\\"'+E(v.public_url)+'\\\">元情報</a><p><b>現在：</b>'+E(stageLabel[v.stage]||v.stage)+'</p><select onchange=\\\"setStage(\\\\''+E(v.id)+'\\\\',this.value)\\\"><option value=\\\"\\\">ステージ変更</option>'+stages.map(s=>'<option value=\\\"'+s+'\\\">'+stageLabel[s]+'</option>').join('')+'</select></div>').join(''):'<p class=small>まだ接触候補はありません。</p>'}load();</script>",
"<script src=/app.js></script>"
].join("");

async function usageToday(db:DB){const x=await db.prepare("SELECT runs FROM sales_search_usage WHERE usage_day=?").bind(day()).first<{runs:number}>();return x?.runs??0}\nasync function countAvailable(db:DB){const x=await db.prepare("SELECT runs FROM sales_search_usage WHERE usage_day=?").bind(day()).first<{runs:number}>();return LIMIT-(x?.runs??0)}
async function addUsage(db:DB,runs:number){await db.prepare("INSERT INTO sales_search_usage (usage_day,runs,updated_at) VALUES (?,?,?) ON CONFLICT(usage_day) DO UPDATE SET runs=runs+excluded.runs,updated_at=excluded.updated_at").bind(day(),runs,now()).run()}
function intentQueries(region:string,needs:string[]){const geo=region&&region!=="global"?' "'+region+'"':"",neg=' -"I offer" -"we offer" -"our service" -"proxy service" -"personal shopper" -fiverr',q:string[]=[];const add=(x:string)=>{if(!q.includes(x))q.push(x+neg)};if(needs.includes("partner")){add('"looking for someone in Japan" sourcing'+geo);add('"looking for" "Japan sourcing partner"'+geo);add('"long term" "looking for" Japan proxy'+geo)}if(needs.includes("supplier")){add('"looking for Japanese supplier"'+geo);add('"need supplier in Japan"'+geo);add('"supplier wanted" Japan'+geo)}if(needs.includes("buy")){add('"need someone in Japan" buy purchase'+geo);add('"looking for" "Japan purchasing agent"'+geo)}if(needs.includes("find"))add('"looking for" "in Japan" source product'+geo);if(needs.includes("receive")||needs.includes("consolidate")){add('"looking for" "Japan proxy" consolidate ship'+geo);add('"need someone in Japan" receive ship'+geo)}if(!q.length){add('"looking for someone in Japan" sourcing'+geo);add('"looking for" "Japan sourcing agent"'+geo)}return q.slice(0,8)}
function platform(url:string){try{const u=new URL(url),h=u.hostname.toLowerCase(),p=u.pathname;if(h.includes("reddit.com"))return"Reddit";if(h.endsWith("linkedin.com")&&p.startsWith("/posts/"))return"LinkedIn 公開投稿";if((h==="x.com"||h.endsWith("twitter.com"))&&p.includes("/status/"))return"X 公開投稿"}catch{}return"Web"}
async function tavily(query:string,hint:string){const r=await fetch("https://api.tavily.com/search",{method:"POST",headers:{"content-type":"application/json","X-Tavily-Access-Mode":"keyless"},body:JSON.stringify({query,max_results:8,search_depth:"advanced"})});if(!r.ok)throw Error("search");const x=await r.json()as{results?:Array<{title?:string;content?:string;url?:string}>};return(x.results??[]).filter(v=>v.url).map(v=>({title:v.title??"公開情報",excerpt:(v.content??v.title??"").slice(0,900),display_name:(v.title??"公開情報").slice(0,180),url:v.url!,source_platform:platform(v.url!),source_type_hint:hint}as Raw))}
async function reddit(q:string){
  try{
    const r=await fetch("https://www.reddit.com/search.json?sort=new&limit=15&q="+encodeURIComponent(q),{headers:{"user-agent":"SunplainGrowthEngine/2.0"}});
    const x:any=await r.json();
    return (x?.data?.children??[]).map((v:any)=>({
      title:v?.data?.title??"",
      excerpt:(v?.data?.selftext||v?.data?.title||"").slice(0,900),
      display_name:v?.data?.author||"公開投稿者",
      url:"https://www.reddit.com"+(v?.data?.permalink||""),
      source_platform:"Reddit",
      source_type_hint:"explicit_demand"
    } as Raw)).filter((v:Raw)=>v.url!=="https://www.reddit.com");
  }catch{
    return[];
  }
}
async function judge(e:Env,items:Raw[],target:string){
  if(!items.length)return[];
  const payload=items.slice(0,30).map((x,i)=>({i,title:x.title,excerpt:x.excerpt,url:x.url,source_platform:x.source_platform,source_type_hint:x.source_type_hint}));
  try{
    const prompt=[
      "Return JSON only with a candidates array.",
      "This engine is looking for BUYER-SIDE demand, not companies offering the same sourcing/proxy/shipping service.",
      "Use only the supplied title, excerpt and URL. Never invent facts.",
      "HARD EXCLUDE any record where the poster/page is mainly offering, advertising, selling, or promoting: proxy buying, personal shopping, sourcing-agent services, buying-agent services, forwarding, consolidation, export support, shipping services, marketplace assistance, or similar services.",
      "Also exclude Fiverr/service listings, agency landing pages, supplier self-promotion, 'we can help', 'I offer', 'our service', 'contact us for sourcing', and comments/replies from providers when the original post itself is not buyer demand.",
      "KEEP only when the original source itself shows a buyer/principal asking for help, a supplier, a Japan-side partner, purchasing, receiving, consolidation, inspection or shipping; OR a concrete buyer/RFQ lead.",
      "For explicit_demand, require an actual request such as looking for / seeking / need / wanted / searching for / can someone help, together with a Japan-related buying or sourcing action.",
      "Existing-importer evidence alone is NOT current demand; do not return existing_importer unless the source also contains a current request or procurement need.",
      "If role is ambiguous, EXCLUDE it rather than guessing.",
      "For each kept record return: i, source_type(explicit_demand|buying_lead), country, buyer_type, need_types(Japanese array), requested_item, repeat_signal, commercial_scale, contact_route, published_at, evidence_summary, evidence_status.",
      "evidence_summary must say what the buyer is asking for, not what a service provider offers.",
      "evidence_status must be 確認候補 or 要注意.",
      target==="business_priority" ? "Prefer commercial/business buyers when the source explicitly supports that." : ""
    ].filter(Boolean).join(" ");
    const a=await e.AI.run("@cf/meta/llama-3.1-8b-instruct",{messages:[{role:"system",content:prompt},{role:"user",content:JSON.stringify(payload)}],response_format:{type:"json_object"}});
    const out=JSON.parse(clean(a.response))as{candidates?:Array<any>};
    return(out.candidates??[]).map(c=>items[c.i]?{...items[c.i],...c}:null).filter(Boolean)as any[];
  }catch{
    return[];
  }
}
async function searchAll(r:Request,e:Env){
  const b=await r.json()as{region?:string;target?:string;needs?:string[]};
  const qs=intentQueries(b.region||"global",b.needs||Object.keys(needLabels));
  const available=await countAvailable(e.DB);
  if(available<1)return json({error:"本日のWeb検索上限（10回）に達しました。明日また実行できます。"},429);

  const usedToday=await usageToday(e.DB);
  const maxWeb=Math.min(3,available);
  const startAt=qs.length?usedToday%qs.length:0;
  const selected:string[]=[];
  for(let i=0;i<maxWeb&&i<qs.length;i++)selected.push(qs[(startAt+i)%qs.length]);

  const all:Raw[]=[];
  for(const q of selected)all.push(...await tavily(q,"explicit_demand"));
  if(selected.length)await addUsage(e.DB,selected.length);

  // Reddit uses its own public search endpoint and does not consume the Tavily daily counter.
  for(const q of selected.slice(0,2))all.push(...await reddit(q));

  // Every second run, use one of the 3 Web slots for a concrete B2B buying lead query.
  // This keeps total Web usage capped at 3 per click.
  if(usedToday>=3 && selected.length>0){
    const buying=await tavily('site:exporthub.com OR site:tradekey.com OR site:ec21.com OR site:go4worldbusiness.com "Japan" ("looking to buy" OR "buying requirement" OR RFQ)',"buying_lead");
    all.push(...buying);
    // Count the extra buying-lead query only if there is remaining allowance.
    if(await countAvailable(e.DB)>0)await addUsage(e.DB,1);
  }

  const seen=new Set<string>();
  const dedup=all.filter(x=>x.url&&!seen.has(x.url)&&seen.add(x.url));
  const candidates=await judge(e,dedup,b.target||"business_priority");
  return json({
    candidates,
    remaining_searches:Math.max(0,await countAvailable(e.DB)),
    query_rotation:{used:selected.length,start:startAt}
  })
}
async function createLead(r:Request,e:Env){const b=await r.json()as any;if(!b.url||!b.excerpt)return json({error:"候補情報が不足しています。"},400);const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(b.url)),key=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,"0")).join("");if(await e.DB.prepare("SELECT id FROM sourcing_leads WHERE duplicate_key=?").bind(key).first())return json({error:"この情報は既に接触候補へ追加されています。"},409);const t=now(),signal=id(),lead=id();await e.DB.batch([e.DB.prepare("INSERT INTO sourcing_signals (id,public_url,source_platform,source_type,published_at,display_name,evidence_excerpt,country,buyer_type,need_types,requested_item,repeat_signal,commercial_scale,contact_route,evidence_summary,evidence_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(signal,b.url,b.source_platform||"Web",b.source_type||"explicit_demand",b.published_at||"不明",b.display_name||b.title||"公開情報",b.excerpt,b.country||"不明",b.buyer_type||"不明",JSON.stringify(b.need_types||[]),b.requested_item||"不明",b.repeat_signal||"不明",b.commercial_scale||"不明",b.contact_route||"不明",b.evidence_summary||b.excerpt,b.evidence_status||"要確認",t,t),e.DB.prepare("INSERT INTO sourcing_leads (id,signal_id,display_name,country,public_url,evidence_excerpt,evidence_summary,requested_item,contact_route,duplicate_key,stage,human_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,'reviewed','awaiting_review',?,?)").bind(lead,signal,b.display_name||b.title||"公開情報",b.country||"不明",b.url,b.excerpt,b.evidence_summary||b.excerpt,b.requested_item||"不明",b.contact_route||"不明",key,t,t),e.DB.prepare("INSERT INTO sourcing_events (id,lead_id,event_type,from_stage,to_stage,occurred_at) VALUES (?,?,'lead_created','signal_discovered','reviewed',?)").bind(id(),lead,t)]);return json({id:lead},201)}
async function setStage(r:Request,e:Env,leadId:string){const b=await r.json()as{stage?:string},allowed=["reviewed","contact_ready","contacted","replied","sourcing_request","quote","paid","repeat","larger_order"];if(!b.stage||!allowed.includes(b.stage))return json({error:"無効なステージです。"},400);const old=await e.DB.prepare("SELECT stage FROM sourcing_leads WHERE id=?").bind(leadId).first<{stage:string}>();if(!old)return json({error:"候補が見つかりません。"},404);const t=now();await e.DB.batch([e.DB.prepare("UPDATE sourcing_leads SET stage=?,updated_at=? WHERE id=?").bind(b.stage,t,leadId),e.DB.prepare("INSERT INTO sourcing_events (id,lead_id,event_type,from_stage,to_stage,occurred_at) VALUES (?,?,'stage_changed',?,?,?)").bind(id(),leadId,old.stage,b.stage,t)]);return json({ok:true})}
export default{async fetch(r:Request,e:Env){const u=new URL(r.url);if(r.method==="GET"&&u.pathname==="/")return new Response(html,{headers:{"content-type":"text/html;charset=utf-8"}});if(r.method==="GET"&&u.pathname==="/app.js")return new Response(APP_JS,{headers:{"content-type":"application/javascript;charset=utf-8","cache-control":"no-store"}});if(r.method==="POST"&&u.pathname==="/api/search"){try{return await searchAll(r,e)}catch{return json({error:"公開情報検索を実行できませんでした。"},503)}}if(r.method==="GET"&&u.pathname==="/api/leads"){const x=await e.DB.prepare("SELECT id,display_name,country,public_url,evidence_excerpt,evidence_summary,requested_item,contact_route,stage FROM sourcing_leads ORDER BY updated_at DESC LIMIT 100").all();return json(x.results)}if(r.method==="POST"&&u.pathname==="/api/leads")return createLead(r,e);const m=u.pathname.match(/^\/api\/leads\/([^/]+)\/stage$/);if(r.method==="POST"&&m)return setStage(r,e,m[1]);return json({error:"not_found"},404)}};