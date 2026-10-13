import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const scriptFile=readFileSync(new URL("../worker/app.ts",import.meta.url),"utf8");
const match=scriptFile.match(/String\.raw`([\s\S]*?)`;/);
assert.ok(match,"Expected APP_JS String.raw source");
const source=match[1];
const appFn=new Function("document","fetch","alert",source);

function element(tag="div"){
 return {
   tag,options:[],listeners:{},textContent:"",disabled:false,value:"",
   append(...children){for(const child of children)if(this.tag==="select"&&child?.tag==="option")this.options.push(child)},
   replaceChildren(){},
   addEventListener(name,cb){(this.listeners[name]??=[]).push(cb)},
 };
}
function fixture(){
 const ids={
  "#search":element("button"),"#msg":element(), "#results":element(),
  "#region":element("select"),"#target":element("select"),
  "#leads":element(), "#pipeline":element(), "#stats":element()
 };
 ids["#region"].value="global";ids["#target"].value="business_priority";
 const document={
   querySelector:s=>ids[s]??null,
   querySelectorAll:()=>[],
   createElement:tag=>element(tag),
   createTextNode:t=>({textContent:t})
 };
 let searches=0,leads=0;
 let resolveSearch;
 const fetch=(url,options)=>{
  if(url==="/api/leads"){leads++;return Promise.resolve({ok:true,json:async()=>[]});}
  if(url==="/api/search"){
    searches++;
    return new Promise(resolve=>{resolveSearch=()=>resolve({ok:true,json:async()=>({candidates:[],diagnostics:{raw_results:0},remaining_searches:8})});});
  }
  throw new Error("Unexpected URL: "+url);
 };
 const alerts=[];
 appFn(document,fetch,msg=>alerts.push(msg));
 return {ids,alerts,counts:()=>({searches,leads}),finishSearch:()=>resolveSearch()};
}
test("app JavaScript parses and registers exactly one search click handler",()=>{
 const f=fixture();
 assert.equal(f.ids["#search"].listeners.click?.length,1);
 assert.equal(f.counts().searches,0);
 assert.equal(f.ids["#search"].disabled,false);
});
test("one click issues exactly one request, disables during search, and re-enables afterwards",async()=>{
 const f=fixture(),button=f.ids["#search"];
 const click=button.listeners.click[0]();
 assert.equal(f.counts().searches,1);
 assert.equal(button.disabled,true);
 const duplicate=button.listeners.click[0]();
 assert.equal(f.counts().searches,1);
 f.finishSearch();
 await Promise.all([click,duplicate]);
 assert.equal(button.disabled,false);
 assert.match(f.ids["#msg"].textContent,/条件一致 0件/);
});
test("no request is sent to /api/search until a click",async()=>{
 const f=fixture();
 await Promise.resolve();
 assert.equal(f.counts().searches,0);
 assert.equal(f.counts().leads,1);
});
