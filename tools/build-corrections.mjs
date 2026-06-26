/* Build a standalone corrections page for the reader's MISSING words.
   For each unglossed word it shows the actual story sentence(s) it appears in (word
   highlighted) + a per-word action box, with a "copy all actions" button so Paul can
   review in context and paste the actions back. Run: node tools/build-corrections.mjs
   Output: docs/corrections.html (open in a browser). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { STORIES } from "../src/courses/waray/stories.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const missing = JSON.parse(read("docs/sources/missing-words.json")).missing;
const tramp = JSON.parse(read("docs/sources/tramp-gloss.json"));

// --- normalization (matches the reader's tokenizer) ---
const norm = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[’`]/g, "'").replace(/^[^a-z'\-]+|[^a-z'\-]+$/g, "");
const fold = (w) => w.replace(/o/g, "u").replace(/e/g, "i");

// --- lightweight diagnostic hint (best-guess category) ---
const PREF = ["nakaka","nagpa","nagka","naka","napa","ginpa","nang","nan","nam","nag","mag","man","mam","mang","pag","pan","gin","maka","ka","na","ma","pa","i"].sort((a,b)=>b.length-a.length);
function roots(t) {
  const S = new Set([t, t.replace(/-/g,"")]);
  for (let p=0;p<3;p++) for (const s of [...S]) {
    for (const pr of PREF) if (s.startsWith(pr) && s.length-pr.length>=2) { S.add(s.slice(pr.length).replace(/^[-']+/,"")); break; }
    const inf = s.replace(/^([bcdfghjklmnpqrstvwxyz])(um|in)/, "$1"); if (inf!==s) S.add(inf);
    S.add(s.replace(/^([bcdfghjklmnpqrstvwxyz][aeiou])\1/, "$1"));
  }
  for (const s of [...S]) { const y = s.replace(/(han|hon|nan|an|on|i|a)$/, ""); if (y.length>=3) { S.add(y); S.add(fold(y)); } }
  return [...S].filter(s => s.length>=2 && s!==t);
}
function hint(w) {
  const r = roots(w).find(r => tramp[r]);
  if (tramp[w]) return `maybe in Tramp: ${tramp[w].slice(0,40)}`;
  if (r) return `stem → ${r}: ${tramp[r].slice(0,36)}`;
  if (/^[A-Z]/.test(w) || /(juan|mira|tisay|noe|pedro|dolce)/.test(w)) return "looks like a NAME";
  return "no dictionary root — likely local word / loan / typo";
}

// --- find context sentences per word ---
function contexts(w) {
  const hits = [];
  for (const s of STORIES) {
    for (const para of s.paras) {
      // rebuild the sentence with the matched token wrapped in <mark>
      let matched = false;
      const html = para.split(/(\s+)/).map((piece) => {
        if (/^\s+$/.test(piece) || !piece) return piece;
        if (norm(piece) === w) { matched = true; return `<mark>${esc(piece)}</mark>`; }
        return esc(piece);
      }).join("");
      if (matched) { hits.push({ title: s.title, html }); if (hits.length >= 3) return hits; }
    }
  }
  return hits;
}
const esc = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

const cards = missing.map((m, i) => {
  const ctx = contexts(m.w);
  const ctxHtml = ctx.length
    ? ctx.map((c) => `<div class="ctx"><span class="st">${esc(c.title)}</span> ${c.html}</div>`).join("")
    : `<div class="ctx none">(no context found)</div>`;
  return `<div class="card" data-w="${esc(m.w)}">
  <div class="hd"><span class="w">${esc(m.w)}</span>
    <span class="meta">${m.freq}× · ${m.docs} stor${m.docs===1?"y":"ies"}</span></div>
  <div class="hint">${esc(hint(m.w))}</div>
  ${ctxHtml}
  <input class="action" type="text" placeholder="action (e.g. gloss: 'market' · variant of X · name · drop · ask Ella)" />
</div>`;
}).join("\n");

const out = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sulog — missing-word corrections</title>
<style>
  body{font:16px/1.5 -apple-system,system-ui,sans-serif;margin:0;background:#f6f7f9;color:#1a1a1a}
  header{position:sticky;top:0;background:#fff;border-bottom:1px solid #ddd;padding:12px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;z-index:9}
  header h1{font-size:17px;margin:0;flex:1}
  header .n{color:#666;font-size:14px}
  button{font:inherit;font-weight:600;padding:8px 14px;border-radius:8px;border:1px solid #2563eb;background:#2563eb;color:#fff;cursor:pointer}
  #search{font:inherit;padding:7px 10px;border:1px solid #ccc;border-radius:8px;min-width:160px}
  .wrap{max-width:760px;margin:0 auto;padding:14px}
  .card{background:#fff;border:1px solid #e4e6ea;border-radius:10px;padding:12px 14px;margin:10px 0}
  .hd{display:flex;align-items:baseline;gap:10px}
  .w{font-size:19px;font-weight:700;color:#0f172a}
  .meta{color:#888;font-size:13px}
  .hint{color:#9333ea;font-size:12.5px;margin:2px 0 8px}
  .ctx{background:#f9fafb;border-left:3px solid #cbd5e1;padding:6px 10px;margin:5px 0;border-radius:4px;font-size:15px}
  .ctx.none{color:#aaa;font-style:italic;border-color:#eee}
  .ctx .st{display:block;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px}
  mark{background:#fde68a;padding:0 2px;border-radius:3px;font-weight:600}
  .action{width:100%;box-sizing:border-box;margin-top:8px;padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;font:inherit}
  .action:focus{outline:2px solid #2563eb;border-color:#2563eb}
  .done{background:#16a34a;border-color:#16a34a}
  textarea#dump{width:100%;height:160px;font:13px/1.4 ui-monospace,monospace;margin-top:10px;display:none}
</style></head><body>
<header>
  <h1>Missing-word corrections <span class="n">(${missing.length} words)</span></h1>
  <input id="search" placeholder="filter…" oninput="filt(this.value)">
  <span class="n" id="count"></span>
  <button onclick="copyActions()">Copy actions</button>
</header>
<div class="wrap">
  <p class="n">Read each word in its story sentence (highlighted), type an action in the box,
  then hit <b>Copy actions</b> — only words you've filled in are copied. Paste them back into the chat.</p>
  ${cards}
  <textarea id="dump" readonly></textarea>
</div>
<script>
function filt(q){q=q.toLowerCase().trim();document.querySelectorAll('.card').forEach(c=>{c.style.display=!q||c.dataset.w.includes(q)?'':'none'});}
function copyActions(){
  const lines=[];
  document.querySelectorAll('.card').forEach(c=>{const a=c.querySelector('.action').value.trim();if(a)lines.push(c.dataset.w+'  —  '+a);});
  const txt=lines.length?lines.join('\\n'):'(no actions filled in yet)';
  const d=document.getElementById('dump');d.style.display='block';d.value=txt;d.select();
  try{navigator.clipboard.writeText(txt);}catch(e){}
  document.execCommand&&document.execCommand('copy');
  const b=event.target;b.textContent='Copied '+lines.length+'!';b.classList.add('done');
  setTimeout(()=>{b.textContent='Copy actions';b.classList.remove('done');},1600);
  document.getElementById('count').textContent=lines.length+' filled';
}
</script>
</body></html>`;

fs.writeFileSync(path.join(root, "docs/corrections.html"), out);
const withCtx = missing.filter((m) => contexts(m.w).length).length;
console.log(`wrote docs/corrections.html — ${missing.length} words, ${withCtx} with story context`);
