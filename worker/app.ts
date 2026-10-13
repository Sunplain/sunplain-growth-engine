export const APP_JS = String.raw`(() => {
  "use strict";
  const q = s => document.querySelector(s);
  const qa = s => Array.from(document.querySelectorAll(s));
  const typeLabel = { explicit_demand:"直接需要", buying_lead:"買付案件", existing_importer:"既存輸入企業" };
  const stageLabel = {
    reviewed:"確認済み", contact_ready:"接触可能", contacted:"接触済み",
    replied:"返信あり", sourcing_request:"調達依頼", quote:"見積提示",
    paid:"入金", repeat:"再注文", larger_order:"取引拡大"
  };
  const stages = Object.keys(stageLabel);
  let found = [];
  let searching = false;

  function node(tag, value, cls) {
    const el = document.createElement(tag);
    if(cls) el.className=cls;
    if(value!==undefined && value!==null) el.textContent=String(value);
    return el;
  }
  function metaField(parent, label, value) {
    const el = node("div");
    el.append(node("b",label),document.createElement("br"),document.createTextNode(String(value || "不明")));
    parent.append(el);
  }
  function safeUrl(value){
    const s=String(value||"").trim();
    return s.startsWith("https://") || s.startsWith("http://") ? s : null;
  }
  function sourceLink(url,label){
    const v=safeUrl(url);
    if(!v)return node("span","元URL未確認","small");
    const a=node("a",label);
    a.href=v;a.target="_blank";a.rel="noopener noreferrer";
    return a;
  }
  function stats(list) {
    const data=[
      ["合格した買付案件",list.length],
      ["元URLあり",list.filter(x=>safeUrl(x.url)).length],
      ["継続発注の記載",list.filter(x=>String(x.repeat_signal||"").includes("言及")).length],
      ["確認待ち",list.length]
    ];
    const root=q("#stats");if(!root)return;
    root.replaceChildren();
    data.forEach(([name,n])=>{
      const cell=node("div",undefined,"stat");
      cell.append(node("span",name),node("b",n));
      root.append(cell);
    });
  }
  function render(list) {
    found=list;stats(list);
    const root=q("#results");if(!root)return;
    root.replaceChildren();
    if(!list.length){root.append(node("p","条件を満たす買付案件は見つかりませんでした。","small"));return;}
    list.forEach((c,i)=>{
      const card=node("div",undefined,"card");
      card.append(node("div", (c.source_platform||"Web")+" · "+(typeLabel[c.source_type]||"確認候補"),"small"));
      card.append(node("h3",(c.country||"地域不明")+"｜"+(c.requested_item||c.title||"内容不明")));
      const detail=node("p");
      detail.append(node("b","公開情報から確認できる内容"),document.createElement("br"),document.createTextNode(String(c.evidence_summary||c.excerpt||"")));
      card.append(detail);
      const chips=node("div");
      const needs=Array.isArray(c.need_types)?c.need_types:[];
      [...needs,c.repeat_signal||"継続性不明",c.commercial_scale||"規模不明"].forEach(v=>chips.append(node("span",v,"chip")));
      card.append(chips);
      const meta=node("div",undefined,"meta");
      metaField(meta,"相手",c.buyer_type);
      metaField(meta,"接触方法",c.contact_route);
      metaField(meta,"公開日",c.published_at);
      metaField(meta,"Evidence",c.evidence_status);
      card.append(meta);
      card.append(sourceLink(c.url,"元の情報を確認"),document.createTextNode("　"));
      const button=node("button","接触候補に追加","secondary");
      button.addEventListener("click",()=>addLead(i));
      card.append(button);
      root.append(card);
    });
  }
  async function jsonResponse(r) {
    const x=await r.json().catch(()=>({error:"サーバーから正しい応答を取得できませんでした。"}));
    if(!r.ok)throw Error(x.error||"通信に失敗しました。");
    return x;
  }
  async function runSearch(){
    if(searching)return;
    searching=true;
    const btn=q("#search"),msg=q("#msg"),results=q("#results");
    if(btn)btn.disabled=true;
    if(msg)msg.textContent="公開買付案件を検索しています…";
    if(results)results.replaceChildren(node("p","検索中です。","small"));
    try{
      const r=await fetch("/api/search",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({region:q("#region")?.value||"global",target:q("#target")?.value||"business_priority",needs:["supplier"]})
      });
      const x=await jsonResponse(r), d=x.diagnostics||{};
      const list=Array.isArray(x.candidates)?x.candidates:[];
      if(msg){
        const warning=d.source_coverage_missing?"。この地域の情報源は未登録です。":d.source_errors?.length?"。取得に失敗した情報源があります。":"";
        msg.textContent="検索完了。個別案件URL "+(d.individual_links??0)+"件 / 原文確認 "+(d.detail_checked??0)+
          "件 / 合格 "+list.length+"件。Web検索枠残り："+(x.remaining_searches??"-")+" / 10（今回消費0）"+warning;
      }
      render(list);
    }catch(error){
      if(msg)msg.textContent=error?.message||"検索できませんでした。";
      if(results)results.replaceChildren(node("p","検索は完了していません。","small"));
    }finally{
      searching=false;
      if(btn)btn.disabled=false;
    }
  }
  async function addLead(i){
    try{
      const r=await fetch("/api/leads",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify(found[i])
      });
      await jsonResponse(r);
      alert("接触候補に追加しました。");
      await loadLeads();
    }catch(error){alert(error?.message||"接触候補を追加できませんでした。");}
  }
  async function changeStage(id,stage){
    if(!stage)return;
    try{
      const r=await fetch("/api/leads/"+encodeURIComponent(id)+"/stage",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({stage})
      });
      await jsonResponse(r);await loadLeads();
    }catch(error){alert(error?.message||"ステージの変更に失敗しました。");}
  }
  async function loadLeads(){
    const leadRoot=q("#leads"),pipeRoot=q("#pipeline");
    if(!leadRoot||!pipeRoot)return;
    try{
      const r=await fetch("/api/leads");
      const records=await jsonResponse(r);
      if(!Array.isArray(records))throw Error("接触候補データが不正です。");
      pipeRoot.replaceChildren();
      stages.forEach(stage=>{
        const el=node("div",undefined,"stage");
        el.append(node("span",stageLabel[stage]),node("b",records.filter(x=>x.stage===stage).length));
        pipeRoot.append(el);
      });
      leadRoot.replaceChildren();
      if(!records.length)leadRoot.append(node("p","まだ接触候補はありません。","small"));
      records.forEach(c=>{
        const card=node("div",undefined,"card");
        card.append(node("h3",(c.country||"地域不明")+"｜"+(c.requested_item||c.display_name||"内容不明")));
        card.append(node("p",c.evidence_summary||c.evidence_excerpt||""));
        card.append(sourceLink(c.public_url,"元情報を確認"));
        card.append(node("p","現在："+(stageLabel[c.stage]||c.stage||"要確認")));
        const select=node("select");
        select.append(node("option","ステージ変更"));
        select.options[0].value="";
        stages.forEach(s=>{const opt=node("option",stageLabel[s]);opt.value=s;select.append(opt);});
        select.addEventListener("change",()=>changeStage(c.id,select.value));
        card.append(select);leadRoot.append(card);
      });
    }catch(error){
      leadRoot.replaceChildren(node("p","接触候補の読み込みに失敗しました："+(error?.message||"通信エラー"),"small"));
    }
  }
  const btn=q("#search");
  if(btn){btn.disabled=false;btn.addEventListener("click",runSearch);}
  loadLeads();
})();`;
