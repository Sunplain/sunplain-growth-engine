export const APP_JS = String.raw`
(function(){
  const q=(s)=>document.querySelector(s);
  const qa=(s)=>Array.from(document.querySelectorAll(s));
  const typeLabels={explicit_demand:'直接需要',buying_lead:'買付案件',existing_importer:'既存輸入企業'};
  let current=[];
  function t(tag,value,cls){const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=value??'';return el}
  function field(parent,label,value){const box=document.createElement('div');box.appendChild(t('b',label));box.appendChild(document.createElement('br'));box.appendChild(document.createTextNode(value||'不明'));parent.appendChild(box)}
  function renderStats(list){
    const counts={explicit_demand:0,buying_lead:0,existing_importer:0,contact:0};
    list.forEach(c=>{if(counts[c.source_type]!==undefined)counts[c.source_type]++;if(c.contact_route&&c.contact_route!=='不明')counts.contact++});
    const data=[['直接需要',counts.explicit_demand],['買付案件',counts.buying_lead],['既存輸入企業',counts.existing_importer],['接触経路あり',counts.contact]];
    const root=q('#stats');root.innerHTML='';
    data.forEach(([name,n])=>{const box=document.createElement('div');box.className='stat';box.appendChild(t('span',name));box.appendChild(t('b',String(n)));root.appendChild(box)})
  }
  function render(list){
    current=list;renderStats(list);const root=q('#results');root.innerHTML='';
    if(!list.length){root.appendChild(t('p','根拠のある候補は見つかりませんでした。','small'));return}
    list.forEach((c,i)=>{
      const card=document.createElement('div');card.className='card';
      card.appendChild(t('div',(c.source_platform||'Web')+' · '+(typeLabels[c.source_type]||c.source_type||'要確認'),'small'));
      card.appendChild(t('h3',(c.country||'地域不明')+'｜'+(c.requested_item||c.title||'内容不明')));
      const p=document.createElement('p');p.appendChild(t('b','公開情報から確認できる内容'));p.appendChild(document.createElement('br'));p.appendChild(document.createTextNode(c.evidence_summary||c.excerpt||''));card.appendChild(p);
      const chips=document.createElement('div');(c.need_types||[]).concat([c.repeat_signal||'継続性不明',c.commercial_scale||'規模不明']).forEach(v=>chips.appendChild(t('span',v,'chip')));card.appendChild(chips);
      const meta=document.createElement('div');meta.className='meta';field(meta,'相手',c.buyer_type);field(meta,'接触方法',c.contact_route);field(meta,'公開日',c.published_at);field(meta,'Evidence',c.evidence_status);card.appendChild(meta);
      const a=t('a','元の情報を確認');a.href=c.url;a.target='_blank';a.rel='noopener';card.appendChild(a);card.appendChild(document.createTextNode('　'));
      const btn=t('button','接触候補に追加','secondary');btn.addEventListener('click',()=>addLead(i));card.appendChild(btn);root.appendChild(card);
    });
  }
  async function runSearch(){
    const btn=q('#search'),msg=q('#msg');const needs=qa('input[name=need]:checked').map(x=>x.value);
    btn.disabled=true;msg.textContent='公開情報を検索し、内容を整理しています…';q('#results').innerHTML='<p class="small">検索中です。</p>';
    try{
      const r=await fetch('/api/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({region:q('#region').value,target:q('#target').value,needs})});
      const x=await r.json();if(!r.ok)throw new Error(x.error||'検索に失敗しました。');
      msg.textContent='検索完了。Web検索残り：'+(x.remaining_searches??'-')+' / 10';render(x.candidates||[]);
    }catch(e){msg.textContent=e.message||'検索に失敗しました。';q('#results').innerHTML=''}finally{btn.disabled=false}
  }
  async function addLead(i){
    const r=await fetch('/api/leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(current[i])});
    const x=await r.json();alert(r.ok?'接触候補に追加しました。':(x.error||'追加できませんでした。'));
  }
  const btn=q('#search');if(btn){btn.addEventListener('click',runSearch);btn.style.pointerEvents='auto';btn.disabled=false}
})();
`;