type Stmt = {
  all<T>(): Promise<{ results: T[] }>;
  bind(...x: unknown[]): {
    first<T>(): Promise<T | null>;
    run(): Promise<unknown>;
  };
};
type DB = { prepare(q: string): Stmt; batch(x: unknown[]): Promise<unknown> };
type Env = {
  DB: DB;
  AI: { run(m: string, x: unknown): Promise<{ response: string }> };
};
type Candidate = {
  title: string;
  excerpt: string;
  display_name: string;
  url: string;
  source: string;
  fit_score?: number;
};
const id = () => crypto.randomUUID(),
  now = () => new Date().toISOString(),
  day = () => now().slice(0, 10),
  json = (x: unknown, s = 200) => Response.json(x, { status: s }),
  limit = 10;
const clean = (s: string) => s.replace(/^\`\`\`json\s*|\s*\`\`\`$/g, "");
const source = (url: string) => {
  try {
    const u = new URL(url),
      h = u.hostname.toLowerCase(),
      p = u.pathname;
    if (h.endsWith("linkedin.com") && p.startsWith("/posts/"))
      return "LinkedIn の公開投稿";
    if (
      (h === "x.com" || h.endsWith(".x.com") || h.endsWith("twitter.com")) &&
      p.includes("/status/")
    )
      return "X の公開投稿";
  } catch {}
  return null;
};
function fallbackPlan(offer: string, target: "buyer" | "supplier") {
  const seafood = /水産|海産|魚介|seafood|fish|frozen/i.test(offer),
    japanese = /日本|japan|japanese/i.test(offer),
    southEastAsia =
      /東南アジア|southeast asia|singapore|malaysia|thailand|vietnam|indonesia|philippines/i.test(
        offer,
      );
  if (seafood && japanese) {
    const area = southEastAsia
      ? "Singapore OR Malaysia OR Thailand OR Vietnam OR Indonesia OR Philippines"
      : "";
    if (target === "supplier")
      return {
        offer,
        target_buyers:
          "日本産食品・水産物を扱うサプライヤー／輸出企業／メーカー",
        intent: "自社商品・輸出対応・供給可能品を公開している売り手側の発言",
        search_phrases: [
          `(\"Japanese seafood supplier\" OR \"Japanese food exporter\") ${area}`,
          `(\"we supply\" OR exporter OR manufacturer) (\"Japanese seafood\" OR \"Japanese food\") ${area}`,
          `(seafood supplier OR \"frozen food supplier\") ${area}`,
        ].map((x) => x.replace(/\s+/g, " ").trim()),
      };
    return {
      offer,
      target_buyers:
        "食品輸入業者・卸売企業・ホテル／レストランチェーン・食品加工会社の購買／調達担当者（売り手は除外）",
      intent: "自社の仕入先・輸入品を、いま探しているバイヤー側の公開発言",
      search_phrases: [
        `(\"looking for a supplier\" OR \"supplier wanted\" OR \"seeking supplier\") (\"Japanese seafood\" OR \"Japanese food\") ${area}`,
        `(\"looking to import\" OR \"seeking to import\" OR \"need to import\") (\"Japanese seafood\" OR \"Japanese food\") ${area}`,
        `(\"sourcing supplier\" OR \"procurement\" OR \"purchasing\") (seafood OR \"frozen food\") ${area}`,
        `(\"looking for a supplier\" OR \"supplier wanted\") seafood ${area}`,
      ].map((x) => x.replace(/\s+/g, " ").trim()),
    };
  }
  return {
    offer,
    target_buyers: "入力文に書かれた法人の購買・調達に関わる相手",
    intent: "いま必要としている、探している、仕入先を探している公開発言",
    search_phrases: [
      `${offer} \"looking for\"`,
      `${offer} seeking supplier`,
      `${offer} sourcing procurement`,
    ],
  };
}
function relevanceScore(
  title: string,
  excerpt: string,
  target: "buyer" | "supplier",
) {
  const t = `${title} ${excerpt}`.toLowerCase();
  const buyerSignals = [
    "looking for a supplier",
    "looking for supplier",
    "supplier wanted",
    "seeking supplier",
    "need a supplier",
    "need supplier",
    "sourcing supplier",
    "looking to import",
    "seeking to import",
    "need to import",
    "sourcing japanese",
    "procurement",
    "purchasing",
    "looking to buy",
  ];
  const sellerSignals = [
    "we supply",
    "we are a supplier",
    "we're a supplier",
    "we offer",
    "our products",
    "exporter",
    "manufacturer",
    "our factory",
    "become a distributor",
    "looking for distributors",
  ];
  const required = target === "buyer" ? buyerSignals : sellerSignals,
    opposite = target === "buyer" ? sellerSignals : buyerSignals;
  if (
    !required.some((x) => t.includes(x)) ||
    opposite.some((x) => t.includes(x))
  )
    return -100;
  let score = 4;
  for (const word of [
    "japanese",
    "seafood",
    "food",
    "frozen",
    "restaurant",
    "hotel",
    "wholesale",
    "import",
  ])
    if (t.includes(word)) score++;
  for (const word of [
    "support program",
    "export program",
    "job",
    "career",
    "chapter",
    "company profile",
    "press release",
    "志望動機",
    "支援プログラム",
    "輸出支援",
  ])
    if (t.includes(word)) score -= 10;
  return score;
}
const html = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Sunplain Growth Engine</title><style>body{margin:0;background:#f5f8f6;color:#17241f;font:15px system-ui}main{max-width:960px;margin:auto;padding:32px 18px}h1{margin:4px 0}.tag{color:#087a59;font-weight:700}section{background:#fff;border:1px solid #d8e7df;border-radius:12px;padding:20px;margin:16px 0}textarea{box-sizing:border-box;width:100%;padding:10px;margin:6px 0 12px;border:1px solid #bcd1c5;border-radius:7px;font:inherit;min-height:100px}button{background:#087a59;color:white;border:0;border-radius:7px;padding:10px 14px;font-weight:700;cursor:pointer;margin:3px}button:disabled{opacity:.5}.box{background:#edf8f2;padding:14px;border-radius:8px;margin-top:12px}.chip{display:inline-block;background:#fff;border:1px solid #c2dbcc;border-radius:30px;padding:5px 8px;margin:5px 4px 0 0}a{color:#0769a8}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #e3ece6;padding:10px;text-align:left;vertical-align:top}.muted{background:#e6f0ea;color:#214b3a}.small{color:#527064;font-size:13px}</style><main><span class=tag>FIND REAL OPPORTUNITY · HUMAN REVIEW REQUIRED</span><h1>Sunplain Growth Engine</h1><p>いま必要としている企業・決裁者を見つけ、接触・会話・商談化まで追います。</p><section><h2>1. 何を売りたいですか？</h2><p>商品・サービス・提供範囲・売り先のイメージを、そのまま書いてください。</p><textarea id=offer placeholder="例：北米のレストランへ、日本産冷凍ホタテを安定供給したい。新しい仕入先を探している購買担当者やオーナーと話したい。"></textarea><button id=plan>AIで「誰を、どんな言葉で探すか」を整理する</button><p id=msg></p><div id=planout></div></section><section><h2>2. 候補を探す</h2><p>公開投稿だけを探します。候補は必ず元の書き込みURLと一緒に表示します。</p><button id=web disabled>LinkedIn / X の投稿を探す</button><button id=reddit disabled>Redditで候補を探す</button><p id=searchmsg class=small></p><div id=candidates></div></section><section><h2>3. 人間が確認する候補</h2><table><thead><tr><th>元の書き込み</th><th>発言者</th><th>候補化</th></tr></thead><tbody id=rows></tbody></table></section></main><script>const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));let phrases=[];function planView(x){phrases=x.search_phrases;$("#planout").innerHTML="<div class=box><b>売るもの</b><p>"+esc(x.offer)+"</p><b>探す相手</b><p>"+esc(x.target_buyers)+"</p><b>必要としているサイン</b><p>"+esc(x.intent)+"</p><b>検索語</b><div>"+phrases.map(q=>"<span class=chip>"+esc(q)+"</span>").join("")+"</div></div>";$("#web").disabled=false;$("#reddit").disabled=false}$("#plan").onclick=async()=>{const offer=$("#offer").value.trim();if(!offer)return $("#msg").textContent="まず、売りたいものを書いてください。";$("#msg").textContent="AIが整理しています…";const r=await fetch("/api/plan",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({offer})}),x=await r.json();$("#msg").textContent=r.ok?"整理できました。次に候補を探します。":x.error;if(r.ok)planView(x)};function result(x){$("#searchmsg").textContent=x.remaining_searches===undefined?"":"本日の無料検索残り："+x.remaining_searches+" / 10";$("#candidates").innerHTML="<div class=box>"+(x.candidates.length?x.candidates.map((c,i)=>"<p><b>"+esc(c.title)+"</b><br><span class=small>"+esc(c.source)+"</span><br>"+esc(c.excerpt)+"<br><a target=_blank rel=noopener href='"+esc(c.url)+"'>元の書き込みを開く</a> <button class=muted onclick='add("+i+")'>候補に入れる</button></p>").join(""):"根拠のある候補は見つかりませんでした。")+"</div>";window.found=x.candidates}async function search(path,label){$("#candidates").textContent=label+"を検索しています…";const r=await fetch(path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({phrases})}),x=await r.json();if(!r.ok)return $("#candidates").textContent=x.error;result(x)}$("#web").onclick=()=>search("/api/search/web","公開投稿");$("#reddit").onclick=()=>search("/api/search/reddit","Reddit");async function add(i){const r=await fetch("/api/leads",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(window.found[i])}),x=await r.json();alert(r.ok?"人間確認待ちへ入れました。":x.error);load()}async function load(){const x=await(await fetch("/api/leads")).json();$("#rows").innerHTML=x.length?x.map(c=>"<tr><td><a target=_blank rel=noopener href='"+esc(c.public_url)+"'>元の書き込み</a><br>"+esc(c.evidence_excerpt)+"</td><td>"+esc(c.display_name)+"</td><td><b>"+esc(c.stage)+"</b></td></tr>").join(""):"<tr><td colspan=3>まだ候補はありません。</td></tr>"}load()</script>`;
const renderedHtml = html
  .replace(
    "textarea{box-sizing:border-box;width:100%;padding:10px;margin:6px 0 12px;border:1px solid #bcd1c5;border-radius:7px;font:inherit;min-height:100px}",
    "textarea,select{box-sizing:border-box;width:100%;padding:10px;margin:6px 0 12px;border:1px solid #bcd1c5;border-radius:7px;font:inherit}textarea{min-height:100px}",
  )
  .replace(
    "</textarea><button id=plan>",
    "</textarea><label for=target><b>探す相手</b></label><select id=target><option value=buyer>バイヤーを探す（仕入れ・輸入・調達したい人）</option><option value=supplier>サプライヤーを探す（供給・輸出したい会社）</option></select><button id=plan>",
  )
  .replace(
    "body:JSON.stringify({offer})",
    'body:JSON.stringify({offer,target:$("#target").value})',
  )
  .replaceAll(
    "body:JSON.stringify({phrases})",
    'body:JSON.stringify({phrases,target:$("#target").value})',
  );
async function countAvailable(db: DB) {
  const x = await db
    .prepare("SELECT runs FROM sales_search_usage WHERE usage_day=?")
    .bind(day())
    .first<{ runs: number }>();
  return limit - (x?.runs ?? 0);
}
async function addUsage(db: DB, runs: number) {
  await db
    .prepare(
      "INSERT INTO sales_search_usage (usage_day,runs,updated_at) VALUES (?,?,?) ON CONFLICT(usage_day) DO UPDATE SET runs=runs+excluded.runs,updated_at=excluded.updated_at",
    )
    .bind(day(), runs, now())
    .run();
}
async function publicPostSearch(
  db: DB,
  phrases: string[],
  target: "buyer" | "supplier",
) {
  const available = await countAvailable(db);
  if (available < 1)
    return {
      error: "本日の無料検索上限（10回）に達しました。明日また実行できます。",
      status: 429,
    };
  const phrase = phrases.find((x) => x.trim());
  if (!phrase) return { error: "先にAI整理を実行してください。", status: 400 };
  const queries = [
      `site:linkedin.com/posts ${phrase}`,
      `site:x.com ${phrase}`,
    ].slice(0, available),
    found: Candidate[] = [];
  for (const query of queries) {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Tavily-Access-Mode": "keyless",
      },
      body: JSON.stringify({
        query,
        max_results: 10,
        search_depth: "advanced",
      }),
    });
    if (!r.ok) throw Error("search");
    const x = (await r.json()) as {
      results?: Array<{ title?: string; content?: string; url?: string }>;
    };
    for (const item of x.results ?? []) {
      const s = item.url && source(item.url),
        title = item.title ?? "公開投稿",
        excerpt = (item.content ?? item.title ?? "").slice(0, 700),
        fit_score = relevanceScore(title, excerpt, target);
      if (item.url && s && fit_score >= 3)
        found.push({
          title,
          excerpt,
          display_name: title.slice(0, 160),
          url: item.url,
          source: s,
          fit_score,
        });
    }
  }
  await addUsage(db, queries.length);
  const seen = new Set<string>(),
    candidates = found
      .filter((x) => !seen.has(x.url) && seen.add(x.url))
      .sort((a, b) => (b.fit_score ?? 0) - (a.fit_score ?? 0));
  return {
    candidates: candidates.slice(0, 20),
    remaining_searches: Math.max(0, available - queries.length),
  };
}
async function createLead(r: Request, e: Env) {
  const b = (await r.json()) as {
    url?: string;
    display_name?: string;
    excerpt?: string;
  };
  if (!b.url || !b.display_name || !b.excerpt)
    return json({ error: "候補情報が不足しています。" }, 400);
  const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(b.url),
    ),
    key = Array.from(new Uint8Array(digest), (x) =>
      x.toString(16).padStart(2, "0"),
    ).join(""),
    t = now(),
    signal = id(),
    lead = id();
  if (
    await e.DB.prepare("SELECT id FROM sales_leads WHERE duplicate_key=?")
      .bind(key)
      .first()
  )
    return json({ error: "この投稿は既に候補化済みです。" }, 409);
  await e.DB.batch([
    e.DB.prepare(
      "INSERT INTO sales_signals (id,public_url,display_name,evidence_excerpt,region,evidence_status,created_at,updated_at) VALUES (?,?,?,?, 'global','public_source',?,?)",
    ).bind(signal, b.url, b.display_name, b.excerpt, t, t),
    e.DB.prepare(
      "INSERT INTO sales_leads (id,signal_id,display_name,region,public_url,evidence_excerpt,duplicate_key,stage,human_status,created_at,updated_at) VALUES (?,?,?,'global',?,?,?,'human_review','awaiting_review',?,?)",
    ).bind(lead, signal, b.display_name, b.url, b.excerpt, key, t, t),
    e.DB.prepare(
      "INSERT INTO sales_events (id,lead_id,event_type,from_stage,to_stage,occurred_at) VALUES (?,?,'lead_created','signal_discovered','human_review',?)",
    ).bind(id(), lead, t),
  ]);
  return json({ id: lead }, 201);
}
export default {
  async fetch(r: Request, e: Env) {
    const u = new URL(r.url);
    if (r.method === "GET" && u.pathname === "/")
      return new Response(renderedHtml, {
        headers: { "content-type": "text/html;charset=utf-8" },
      });
    if (r.method === "GET" && u.pathname === "/api/leads") {
      const x = await e.DB.prepare(
        "SELECT id,display_name,public_url,evidence_excerpt,stage FROM sales_leads ORDER BY updated_at DESC LIMIT 100",
      ).all();
      return json(x.results);
    }
    if (r.method === "POST" && u.pathname === "/api/plan") {
      const b = (await r.json()) as { offer?: string; target?: string };
      const target: "buyer" | "supplier" =
        b.target === "supplier" ? "supplier" : "buyer";
      if (!b.offer?.trim())
        return json({ error: "売りたいものを入力してください。" }, 400);
      let out;
      try {
        const a = await e.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [
              {
                role: "system",
                content:
                  target === "buyer"
                    ? "Return JSON only with offer,target_buyers,intent,search_phrases. Use only user input. Never invent facts, people, or companies. search_phrases must be 4 to 6 concise English-first public web queries. The target is a BUYER: require buyer-side language such as looking for a supplier, supplier wanted, looking to import, sourcing supplier, procurement or purchasing. Never produce seller-side phrases such as seafood supplier, exporter, manufacturer, we supply, or product promotion. If the user specifies a region, express its countries in English."
                    : "Return JSON only with offer,target_buyers,intent,search_phrases. Use only user input. Never invent facts, people, or companies. search_phrases must be 4 to 6 concise English-first public web queries. The target is a SUPPLIER: require seller-side language such as we supply, exporter, manufacturer, or distributor. Never produce buyer-side phrases such as looking for a supplier or looking to import. If the user specifies a region, express its countries in English.",
              },
              { role: "user", content: b.offer.trim() },
            ],
            response_format: { type: "json_object" },
          }),
          parsed = JSON.parse(clean(a.response));
        if (
          !Array.isArray(parsed.search_phrases) ||
          parsed.search_phrases.some((x: unknown) => typeof x !== "string")
        )
          throw Error();
        out = parsed;
      } catch {
        out = fallbackPlan(b.offer.trim(), target);
      }
      await e.DB.prepare(
        "INSERT INTO sales_search_briefs (id,offer_text,brief_json,created_at) VALUES (?,?,?,?)",
      )
        .bind(id(), b.offer.trim(), JSON.stringify(out), now())
        .run();
      return json(out);
    }
    if (r.method === "POST" && u.pathname === "/api/search/web") {
      const b = (await r.json()) as { phrases?: string[]; target?: string };
      try {
        const x = await publicPostSearch(
          e.DB,
          b.phrases ?? [],
          b.target === "supplier" ? "supplier" : "buyer",
        );
        return "error" in x ? json({ error: x.error }, x.status) : json(x);
      } catch {
        return json({ error: "公開投稿検索を実行できませんでした。" }, 503);
      }
    }
    if (r.method === "POST" && u.pathname === "/api/search/reddit") {
      const b = (await r.json()) as { phrases?: string[]; target?: string },
        q = b.phrases?.[0];
      if (!q) return json({ error: "先にAI整理を実行してください。" }, 400);
      try {
        const r = await fetch(
            "https://www.reddit.com/search.json?limit=12&q=" +
              encodeURIComponent(q),
            { headers: { "user-agent": "SunplainGrowthEngine/1.0" } },
          ),
          x = (await r.json()) as {
            data?: {
              children?: Array<{
                data: {
                  title?: string;
                  selftext?: string;
                  author?: string;
                  permalink?: string;
                };
              }>;
            };
          };
        const candidates = (x.data?.children ?? [])
          .map((v) => ({
            title: v.data.title ?? "",
            excerpt: (v.data.selftext || v.data.title || "").slice(0, 700),
            display_name: v.data.author || "公開投稿者",
            url: "https://www.reddit.com" + (v.data.permalink || ""),
            source: "Reddit",
          }))
          .filter(
            (v) =>
              v.url !== "https://www.reddit.com" &&
              relevanceScore(
                v.title,
                v.excerpt,
                b.target === "supplier" ? "supplier" : "buyer",
              ) >= 3,
          );
        return json({ candidates });
      } catch {
        return json({ error: "Reddit検索を実行できませんでした。" }, 503);
      }
    }
    if (r.method === "POST" && u.pathname === "/api/leads")
      return createLead(r, e);
    return json({ error: "not_found" }, 404);
  },
};
