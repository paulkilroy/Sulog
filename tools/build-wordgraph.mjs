/* Build a self-contained interactive word graph for the Challenger course.
   Nodes = words (colored by unit); edges = co-occurrence in apply phrases,
   stories, and per-word examples. Layout is force-simulated here in Node and
   baked into the SVG; the page just adds hover/drag. Output: wordgraph.html
   Run: node tools/build-wordgraph.mjs */
import fs from "fs";
import { SEED_CH, CHALLENGER } from "../src/courses/waray/challenger.js";

const PHASE = CHALLENGER[0]; // Phase 1
const UNITS = PHASE.units;

// word -> {unit index, gloss, example}
const cardByWaray = {};
for (const r of SEED_CH) cardByWaray[r[1]] = { gloss: r[2], example: r[5] || null };

const nodes = [];
const idx = new Map();
UNITS.forEach((u, ui) => {
  const words = u.lessons.filter((l) => l.kind !== "apply").flatMap((l) => l.items);
  for (const w of words) {
    if (idx.has(w)) continue;
    idx.set(w, nodes.length);
    const c = cardByWaray[w] || {};
    nodes.push({ w, unit: ui, gloss: c.gloss || "", ex: c.example, deg: 0 });
  }
});

// collect all "contexts" (multi-word strings) to mine co-occurrence from
const contexts = [];
for (const u of UNITS) {
  for (const l of u.lessons) if (l.kind === "apply") for (const p of l.items) contexts.push(p);
  if (u.story) { for (const ln of u.story.lines || []) contexts.push(ln.war); }
}
for (const n of nodes) if (n.ex?.war) contexts.push(n.ex.war);

// tokenize a context to the word-nodes it contains
const norm = (t) => t.toLowerCase().replace(/[.,!?¿¡;:"']/g, "").trim();
const wordKeys = [...idx.keys()];
const keyByNorm = {}; for (const k of wordKeys) keyByNorm[norm(k)] = k;

const edgeW = new Map(); // "a|b" -> weight
for (const ctx of contexts) {
  const toks = ctx.split(/\s+/).map(norm).filter(Boolean);
  const present = [...new Set(toks.map((t) => keyByNorm[t]).filter(Boolean))];
  for (let i = 0; i < present.length; i++)
    for (let j = i + 1; j < present.length; j++) {
      const a = idx.get(present[i]), b = idx.get(present[j]);
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      edgeW.set(key, (edgeW.get(key) || 0) + 1);
    }
}
const links = [...edgeW.entries()].map(([k, w]) => { const [a, b] = k.split("|").map(Number); nodes[a].deg++; nodes[b].deg++; return { a, b, w }; });

// ---- force layout (deterministic-ish; seeded ring per unit) ----
const N = nodes.length;
const W = 1100, H = 760, cx = W / 2, cy = H / 2;
nodes.forEach((n, i) => {
  const ua = (n.unit / UNITS.length) * Math.PI * 2;          // cluster angle by unit
  const ring = 230 + (i % 5) * 18;
  n.x = cx + Math.cos(ua) * ring + (Math.random() - 0.5) * 80;
  n.y = cy + Math.sin(ua) * ring + (Math.random() - 0.5) * 80;
  n.vx = 0; n.vy = 0;
});
const linkOf = nodes.map(() => []);
links.forEach((l) => { linkOf[l.a].push(l); linkOf[l.b].push(l); });
for (let step = 0; step < 600; step++) {
  // repulsion
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    let dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
    let d2 = dx * dx + dy * dy || 0.01; const f = 1400 / d2;
    const d = Math.sqrt(d2); const ux = dx / d, uy = dy / d;
    nodes[i].vx += ux * f; nodes[i].vy += uy * f;
    nodes[j].vx -= ux * f; nodes[j].vy -= uy * f;
  }
  // spring on edges
  for (const l of links) {
    const a = nodes[l.a], b = nodes[l.b];
    let dx = b.x - a.x, dy = b.y - a.y; const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const target = 70; const f = (d - target) * 0.02 * Math.min(3, l.w);
    const ux = dx / d, uy = dy / d;
    a.vx += ux * f; a.vy += uy * f; b.vx -= ux * f; b.vy -= uy * f;
  }
  // unit cohesion + gravity to center
  const cen = UNITS.map(() => ({ x: 0, y: 0, n: 0 }));
  nodes.forEach((n) => { cen[n.unit].x += n.x; cen[n.unit].y += n.y; cen[n.unit].n++; });
  cen.forEach((c) => { c.x /= c.n || 1; c.y /= c.n || 1; });
  for (const n of nodes) {
    n.vx += (cen[n.unit].x - n.x) * 0.01 + (cx - n.x) * 0.002;
    n.vy += (cen[n.unit].y - n.y) * 0.01 + (cy - n.y) * 0.002;
    n.x += n.vx * 0.5; n.y += n.vy * 0.5; n.vx *= 0.82; n.vy *= 0.82;
  }
}
// fit to viewbox
const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
const pad = 60, sx = (W - 2 * pad) / (maxX - minX || 1), sy = (H - 2 * pad) / (maxY - minY || 1), s = Math.min(sx, sy);
nodes.forEach((n) => { n.x = pad + (n.x - minX) * s; n.y = pad + (n.y - minY) * s; n.r = 7 + Math.min(10, n.deg * 0.9); });

const COLORS = ["#16a3ab", "#e8833a", "#5aa469", "#c2566b", "#7b6cc4", "#3f8fd0", "#b58a2e"];
const unitNames = UNITS.map((u) => u.name);

const data = { nodes: nodes.map((n) => ({ w: n.w, u: n.unit, g: n.gloss, x: +n.x.toFixed(1), y: +n.y.toFixed(1), r: +n.r.toFixed(1), ex: n.ex ? { war: n.ex.war, en: n.ex.en } : null })), links: links.map((l) => ({ a: l.a, b: l.b, w: l.w })) };

const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sulog — Challenger Phase 1 word graph</title>
<style>
  :root{--sand:#f7f1e6;--ink:#1f2d33;--soft:#5e6b70}
  *{box-sizing:border-box} body{margin:0;background:var(--sand);color:var(--ink);font-family:-apple-system,Segoe UI,Roboto,sans-serif}
  header{padding:16px 20px 6px} h1{font-family:Georgia,serif;margin:0;font-size:22px}
  .sub{color:var(--soft);font-size:13px;margin-top:3px}
  .legend{display:flex;flex-wrap:wrap;gap:8px 14px;padding:8px 20px 4px;font-size:12.5px}
  .legend span{display:inline-flex;align-items:center;gap:6px}
  .dot{width:11px;height:11px;border-radius:50%}
  .wrap{position:relative} svg{width:100%;height:auto;display:block;touch-action:none}
  line.edge{stroke:#b9b0a0;stroke-opacity:.45}
  circle.node{stroke:#fff;stroke-width:1.5;cursor:grab}
  text.lab{font-family:Georgia,serif;font-size:12px;fill:var(--ink);pointer-events:none}
  .dim{opacity:.12;transition:opacity .15s} .hot{opacity:1}
  #tip{position:fixed;pointer-events:none;background:#fff;border:1px solid #e0d8c8;border-radius:10px;
    padding:8px 11px;font-size:13px;box-shadow:0 6px 20px -8px rgba(0,0,0,.4);max-width:230px;display:none;z-index:9}
  #tip b{font-family:Georgia,serif;font-size:15px} #tip .g{color:var(--soft)} #tip .e{margin-top:5px;font-size:12px}
  #tip .e .w{color:#0c6b73;font-weight:600}
</style></head><body>
<header><h1>Challenger · Phase 1 — word graph</h1>
<div class="sub">${nodes.length} words · ${links.length} links · lines connect words that appear together in a phrase, story, or example. Hover a word to trace its connections; drag to rearrange.</div></header>
<div class="legend">${unitNames.map((nm, i) => `<span><i class="dot" style="background:${COLORS[i % COLORS.length]}"></i>${nm}</span>`).join("")}</div>
<div class="wrap"><svg id="g" viewBox="0 0 ${W} ${H}"></svg></div>
<div id="tip"></div>
<script>
const DATA=${JSON.stringify(data)};
const COLORS=${JSON.stringify(COLORS)};
const svg=document.getElementById("g"), tip=document.getElementById("tip");
const NS="http://www.w3.org/2000/svg";
const adj={}; DATA.nodes.forEach((_,i)=>adj[i]=new Set());
const edgeEls=DATA.links.map(l=>{adj[l.a].add(l.b);adj[l.b].add(l.a);
  const e=document.createElementNS(NS,"line");e.setAttribute("class","edge");
  e.setAttribute("stroke-width",Math.min(4,0.8+l.w*0.7));
  e.setAttribute("x1",DATA.nodes[l.a].x);e.setAttribute("y1",DATA.nodes[l.a].y);
  e.setAttribute("x2",DATA.nodes[l.b].x);e.setAttribute("y2",DATA.nodes[l.b].y);
  e.__l=l; svg.appendChild(e); return e;});
const nodeG=[];
DATA.nodes.forEach((n,i)=>{
  const g=document.createElementNS(NS,"g"); g.__i=i;
  const c=document.createElementNS(NS,"circle"); c.setAttribute("class","node");
  c.setAttribute("cx",n.x);c.setAttribute("cy",n.y);c.setAttribute("r",n.r);
  c.setAttribute("fill",COLORS[n.u%COLORS.length]); g.appendChild(c);
  const t=document.createElementNS(NS,"text"); t.setAttribute("class","lab");
  t.setAttribute("x",n.x+n.r+3);t.setAttribute("y",n.y+4);t.textContent=n.w; g.appendChild(t);
  svg.appendChild(g); nodeG.push({g,c,t});
});
function setHL(i){
  const keep=new Set([i,...adj[i]]);
  nodeG.forEach((o,j)=>o.g.classList.toggle("dim",!keep.has(j)));
  edgeEls.forEach(e=>{const on=e.__l.a===i||e.__l.b===i; e.classList.toggle("dim",!on); e.classList.toggle("hot",on);});
}
function clearHL(){nodeG.forEach(o=>o.g.classList.remove("dim"));edgeEls.forEach(e=>e.classList.remove("dim","hot"));tip.style.display="none";}
nodeG.forEach((o,i)=>{
  const n=DATA.nodes[i];
  o.g.addEventListener("mouseenter",ev=>{setHL(i);
    tip.style.display="block"; tip.innerHTML="<b>"+n.w+"</b> <span class=g>"+n.g+"</span>"+(n.ex?"<div class=e><span class=w>"+n.ex.war+"</span><br>"+n.ex.en+"</div>":"");});
  o.g.addEventListener("mousemove",ev=>{tip.style.left=(ev.clientX+14)+"px";tip.style.top=(ev.clientY+14)+"px";});
  o.g.addEventListener("mouseleave",clearHL);
  // drag
  let drag=false;
  const down=ev=>{drag=true;o.c.style.cursor="grabbing";ev.preventDefault();};
  const move=ev=>{if(!drag)return; const pt=svg.createSVGPoint(); const e=ev.touches?ev.touches[0]:ev;
    pt.x=e.clientX;pt.y=e.clientY; const m=pt.matrixTransform(svg.getScreenCTM().inverse());
    n.x=m.x;n.y=m.y; o.c.setAttribute("cx",n.x);o.c.setAttribute("cy",n.y);
    o.t.setAttribute("x",n.x+n.r+3);o.t.setAttribute("y",n.y+4);
    edgeEls.forEach(le=>{if(le.__l.a===i){le.setAttribute("x1",n.x);le.setAttribute("y1",n.y);} if(le.__l.b===i){le.setAttribute("x2",n.x);le.setAttribute("y2",n.y);}});};
  const up=()=>{drag=false;o.c.style.cursor="grab";};
  o.g.addEventListener("mousedown",down); o.g.addEventListener("touchstart",down,{passive:false});
  window.addEventListener("mousemove",move); window.addEventListener("touchmove",move,{passive:false});
  window.addEventListener("mouseup",up); window.addEventListener("touchend",up);
});
</script></body></html>`;

fs.writeFileSync("wordgraph.html", html);
console.log(`✓ wrote wordgraph.html — ${nodes.length} nodes, ${links.length} links`);
// top hubs
const top = [...nodes].sort((a, b) => b.deg - a.deg).slice(0, 8).map((n) => `${n.w}(${n.deg})`);
console.log("  most-connected:", top.join(", "));
