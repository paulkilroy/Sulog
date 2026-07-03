/* Render the mined phrase diff (docs/word-bank/phrase-dict-diff.json) as a self-contained
   interactive review sheet: cull with per-item checkboxes (persisted), then copy the
   approved set as JSON. Output: scratchpad/phrase-review.html (published as an Artifact).
   Run: node tools/build-phrase-review.mjs */
import fs from "fs";

const d = JSON.parse(fs.readFileSync("docs/word-bank/phrase-dict-diff.json", "utf8"));
const isWord = (w) => !/\s/.test((w || "").replace(/[^A-Za-zÀ-ÿ' -]/g, "").trim()); // single token = already a dictionary word
// tag rows: extracted single-words are "already a word" (pre-rejected); everything else defaults approved
const ex = (d.extracted || []).map((x) => ({ ...x, group: "extracted", already: isWord(x.war) }));
const sg = (d.suggested || []).map((x) => ({ ...x, group: "suggested" }));
const all = [...ex, ...sg];

const cats = [...new Set(sg.map((x) => x.category))];
const OUT = "/private/tmp/claude-501/-Users-paulkilroy-dev-Sulog/2ec9156d-452e-4eed-b759-f98650a29e43/scratchpad/phrase-review.html";
const esc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const dataJSON = JSON.stringify(all).replace(/</g, "\\u003c");

const html = `<style>
:root{--paper:#fbf7ef;--card:#fffdf9;--ink:#232b2f;--soft:#6b747a;--line:#e7ded0;
  --ok:#2f8f4e;--okbg:#eef7f0;--rej:#b8b0a3;--amber:#b5791d;--amberbg:#fbf1dc;--chip:#eef2f4}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.serif{font-family:Georgia,"Times New Roman",serif}
.mono{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-variant-numeric:tabular-nums}
header{position:sticky;top:0;z-index:9;background:rgba(251,247,239,.94);backdrop-filter:blur(6px);
  border-bottom:1px solid var(--line);padding:14px 22px}
.htop{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
h1{font-family:Georgia,serif;font-weight:600;font-size:21px;margin:0}
.count{margin-left:auto;font-size:13px;color:var(--soft)} .count b{color:var(--ok);font-size:17px;font-family:Georgia,serif}
.note{font-size:12px;color:#7a5a17;background:var(--amberbg);border:1px solid #ecd9ac;border-radius:8px;padding:7px 11px;margin-top:9px}
.bar{display:flex;gap:8px;margin-top:9px;flex-wrap:wrap}
button{font:inherit;font-size:12.5px;border:1px solid var(--line);background:var(--card);color:var(--ink);
  border-radius:8px;padding:5px 11px;cursor:pointer}
button:hover{border-color:#cdbf9e} button:focus-visible{outline:2px solid var(--ok);outline-offset:1px}
main{max-width:900px;margin:0 auto;padding:14px 22px 60px}
h2{font-family:Georgia,serif;font-size:16px;margin:26px 0 4px;display:flex;align-items:center;gap:10px}
h2 .c{font:600 11px/1 ui-monospace,monospace;color:var(--soft);letter-spacing:.03em}
.grp{border:1px solid var(--line);border-radius:12px;background:var(--card);overflow:hidden;margin-top:8px}
.row{display:flex;align-items:flex-start;gap:11px;padding:8px 13px;border-bottom:1px dotted #efe7d6;cursor:pointer}
.row:last-child{border-bottom:0}
.row:hover{background:#fbf6ea}
.box{width:17px;height:17px;border:1.5px solid #c7bda9;border-radius:5px;margin-top:2px;flex:none;
  display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff}
.row.on .box{background:var(--ok);border-color:var(--ok)}
.row.on .box::after{content:"✓"}
.txt{flex:1;min-width:0}
.war{font-family:Georgia,serif;font-size:15.5px;font-weight:600}
.en{color:var(--soft);font-size:13px}
.meta{margin-top:1px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.tag{font-size:10.5px;padding:1px 7px;border-radius:11px;background:var(--chip);color:var(--soft)}
.tag.already{background:#f1ece0;color:var(--amber)} .tag.loan{background:#f0eaf6;color:#6a5aa8}
.row.off{opacity:.42} .row.off .war,.row.off .en{text-decoration:line-through}
dialog{border:none;border-radius:14px;padding:0;max-width:680px;width:92%;box-shadow:0 20px 60px -20px rgba(0,0,0,.4)}
dialog header{position:static;background:none;border:0;padding:16px 18px 8px}
textarea{width:100%;height:340px;border:1px solid var(--line);border-radius:8px;padding:10px;font:12px/1.5 ui-monospace,monospace;resize:vertical}
.dlgbar{padding:0 18px 16px;display:flex;gap:8px;justify-content:flex-end}
</style>

<header>
  <div class="htop">
    <h1>Phrase dictionary — review</h1>
    <span class="count"><b id="n">0</b> approved <span id="tot"></span></span>
  </div>
  <div class="note">⚑ Gemini-mined — treat <b>all of it</b> as pending Ella's ear (it flagged nothing itself). Cull here; approved set becomes the dictionary's phrase layer + the CH2 "Getting Unstuck" additions.</div>
  <div class="bar">
    <button onclick="setAll(true)">Approve all</button>
    <button onclick="setAll(false)">Reject all</button>
    <button onclick="showJSON()">Copy approved JSON…</button>
    <span class="count mono" style="margin-left:auto" id="cats"></span>
  </div>
</header>
<main id="app"></main>

<dialog id="dlg">
  <header><b class="serif">Approved phrases (<span id="dn"></span>)</b><div class="en" style="margin-top:3px">Select-all &amp; copy, then hand back for review.</div></header>
  <div style="padding:0 18px"><textarea id="ta" readonly></textarea></div>
  <div class="dlgbar"><button onclick="dlg.close()">Close</button></div>
</dialog>

<script>
const DATA = ${dataJSON};
const KEY = "sulog:phrase-review:v1";
let approved = new Set();
try { const s = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(s)) approved = new Set(s); else init(); } catch(e){ init(); }
function init(){ DATA.forEach((x,i)=>{ if(!x.already) approved.add(i); }); save(); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify([...approved])); }catch(e){} }
const esc=(s)=>(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");
function loan(x){ return /loan/i.test(x.note||"")?'<span class="tag loan">loan</span>':''; }
function rowHTML(x,i){
  const on = approved.has(i);
  return '<div class="row '+(on?'on':'off')+'" data-i="'+i+'"><div class="box"></div><div class="txt">'+
    '<div class="war">'+esc(x.war)+'</div><div class="en">'+esc(x.en)+'</div>'+
    '<div class="meta">'+(x.already?'<span class="tag already">already a word</span>':'')+loan(x)+
    (x.note&&!/loan/i.test(x.note)?'<span class="tag">'+esc(x.note)+'</span>':'')+'</div></div></div>';
}
function render(){
  const exRows = DATA.map((x,i)=>[x,i]).filter(([x])=>x.group==="extracted");
  const cats = [...new Set(DATA.filter(x=>x.group==="suggested").map(x=>x.category))];
  let h = '<h2 class="serif">Set-phrases already in Challenger 2 <span class="c">'+exRows.length+'</span></h2><div class="grp">'+
    exRows.map(([x,i])=>rowHTML(x,i)).join('')+'</div>';
  for(const c of cats){
    const rows = DATA.map((x,i)=>[x,i]).filter(([x])=>x.category===c && x.group==="suggested");
    h += '<h2 class="serif">'+esc(c)+' <span class="c">'+rows.length+'</span></h2><div class="grp">'+
      rows.map(([x,i])=>rowHTML(x,i)).join('')+'</div>';
  }
  app.innerHTML = h;
  document.querySelectorAll('.row').forEach(r=>r.onclick=()=>toggle(+r.dataset.i,r));
  tally();
}
function toggle(i,r){ if(approved.has(i)){approved.delete(i);r.classList.remove('on');r.classList.add('off');} else {approved.add(i);r.classList.add('on');r.classList.remove('off');} save(); tally(); }
function setAll(v){ approved = v ? new Set(DATA.map((_,i)=>i)) : new Set(); save(); render(); }
function tally(){
  n.textContent = approved.size; tot.textContent = "/ "+DATA.length;
  const by={}; DATA.forEach((x,i)=>{ if(approved.has(i)){ const c=x.group==="extracted"?"extracted":x.category; by[c]=(by[c]||0)+1; } });
  cats.textContent = Object.entries(by).map(([c,v])=>v+" "+c.split(/[ &]/)[0].toLowerCase()).join(" · ");
}
function showJSON(){
  const out = DATA.filter((_,i)=>approved.has(i)).map(({group,already,...x})=>x);
  ta.value = JSON.stringify(out,null,2); dn.textContent = out.length; ta.focus(); ta.select(); dlg.showModal();
}
render();
</script>`;

fs.writeFileSync(OUT, html);
console.log(`✓ wrote ${OUT} — ${all.length} rows (${ex.length} extracted, ${sg.length} suggested, ${ex.filter((x) => x.already).length} single-word noise pre-rejected)`);
