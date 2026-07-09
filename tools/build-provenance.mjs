/* Provenance view for Lesson 1 — DETERMINISTIC. The book prints a heading before each section
   (Examples, Oral Exercises, Written Exercises, Vocabulary, Note, Accent Marks). We locate those
   heading lines in the OCR and carve the page at them: every line between two headings belongs to
   the section the heading opened — no fuzzy word-matching. The pronoun chart inside the grammar
   intro is bounded by the known paradigm words (from the DB). Left = scan with the carved sections;
   right = the lesson, same colors. */
import fs from "fs";
import pg from "/Users/paulkilroy/dev/Sulog/node_modules/pg/lib/index.js";
const SP = "/private/tmp/claude-501/-Users-paulkilroy-dev-Sulog/2ec9156d-452e-4eed-b759-f98650a29e43/scratchpad";
const b64 = (p) => fs.readFileSync(p).toString("base64");
const esc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// each scan section → the schema block it becomes → the course-review column it lands in
const DEST = {
  guide:    { c: "#3f6ea5", short: "Guide", block: "grammar / note", col: "Guide" },
  paradigm: { c: "#7a5aa8", short: "Pronoun chart", block: "vocab · paradigm", col: "Words & Phrases" },
  examples: { c: "#4b7bb0", short: "Examples", block: "drill · recognition", col: "Practice drills" },
  vocab:    { c: "#2f8f4e", short: "Vocabulary", block: "vocab", col: "Words & Phrases" },
  oral:     { c: "#b0791d", short: "Oral exercise", block: "drill · production (speak)", col: "Practice drills" },
  written:  { c: "#c8641d", short: "Written exercise", block: "drill · production (type)", col: "Practice drills" },
};
const chain = (d) => `${DEST[d].short}  →  ${DEST[d].block}  →  ${DEST[d].col} column`;

// ---- load OCR pages (normalized boxes; top = distance from page top) ----
const PAGES = [1, 2, 3];
const pageLines = {};
for (const n of PAGES) {
  const j = JSON.parse(fs.readFileSync(`${SP}/ocr-p0${n}.json`, "utf8"));
  pageLines[n] = j.lines.map((l) => ({ t: l.t, x: l.x, w: l.w, top: 1 - l.y - l.h, bottom: 1 - l.y })).sort((a, b) => a.top - b.top);
}

// ---- the DB lesson (right pane) + the known paradigm words (to bound the chart) ----
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = async (s) => (await c.query(s)).rows;
const lessons = {};
for (const lid of ["pc-l1a", "pc-l1b"]) {
  const bl = await q(`select id,ord,type,title,body_md,drill_kind,drill_modality from lesson_blocks where lesson_id='${lid}' order by ord`);
  for (const b of bl) b.items = await q(`select bi.expr_id, coalesce(d.waray,e.waray) w, coalesce(d.meaning,e.translation) t from block_items bi left join dictionary d on d.waray=bi.dict_waray left join expressions e on e.id=bi.expr_id where bi.block_id=${b.id} order by bi.ord`);
  lessons[lid] = bl;
}
const paradigmWords = new Set((await q(`select d.waray from lesson_blocks lb join block_items bi on bi.block_id=lb.id join dictionary d on d.waray=bi.dict_waray where lb.lesson_id='pc-l1a' and lb.type='vocab' and lb.title is not null`)).map((r) => r.waray.toLowerCase()));
await c.end();

// ---- carve every page's lines into sections by the book's headings ----
const ANCHORS = [
  [/^\s*examples?\b/i, "examples"],
  [/^\s*oral\s+exercise/i, "oral"],
  [/^\s*written\s+exercise/i, "written"],
  [/^\s*vocabulary\b/i, "vocab"],
  [/^\s*note\s*[:.]/i, "guide"],
  [/^\s*accent\s+marks/i, "guide"],
];
const isChartHead = (t) => /^\s*(singular|plural)\s*$/i.test(t) || /class\s+(personal\s+)?pronouns?|general\s+pronouns?/i.test(t);
const wordsOf = (t) => (t || "").toLowerCase().split(/[^a-zà-ÿ']+/).filter(Boolean);
let current = "guide";                                   // page 1 opens with the grammar intro
for (const n of PAGES) {
  const lines = pageLines[n];
  for (const l of lines) {                               // 1) heading anchors set the running section
    const hit = ANCHORS.find(([re]) => re.test(l.t));
    if (hit) current = hit[1];
    l.dest = current;
  }
  // 2) inside the grammar intro, bound the pronoun chart by the known paradigm words + chart headers
  // chart cells & headers are SHORT lines; this keeps prose ("A I Class Personal Pronoun marks…",
  // "…short form which is ka") out of the chart bounds even though it name-drops the same words
  const chart = lines.filter((l) => { const w = wordsOf(l.t); return l.dest === "guide" && w.length <= 5 && (isChartHead(l.t) || (w.length <= 3 && w.some((x) => paradigmWords.has(x)))); });
  if (chart.length >= 2) {
    const top = Math.min(...chart.map((l) => l.top)), bottom = Math.max(...chart.map((l) => l.bottom));
    for (const l of lines) if (l.dest === "guide" && l.top >= top - 0.005 && l.bottom <= bottom + 0.005) l.dest = "paradigm";
  }
}

// ---- left pane: merge consecutive same-section lines into one labeled box ----
const pad = 0.006;
const pageHtml = (n) => {
  const lines = pageLines[n];
  const secs = [];
  for (const l of lines) {
    const cur = secs[secs.length - 1];
    if (cur && cur.dest === l.dest && l.top - cur.bottom < 0.045) { cur.left = Math.min(cur.left, l.x); cur.right = Math.max(cur.right, l.x + l.w); cur.bottom = Math.max(cur.bottom, l.bottom); cur.n++; }
    else secs.push({ dest: l.dest, left: l.x, right: l.x + l.w, top: l.top, bottom: l.bottom, n: 1 });
  }
  const boxes = secs.filter((s) => s.n >= 2 && DEST[s.dest]).map((s) => {
    const top = Math.max(0, s.top - pad) * 100, left = Math.max(0, s.left - pad) * 100;
    const w = Math.min(1, s.right - s.left + pad * 2) * 100, h = (s.bottom - s.top + pad * 2) * 100;
    return `<div class="sec" data-dest="${s.dest}" title="${esc(chain(s.dest))}" style="top:${top.toFixed(2)}%;left:${left.toFixed(2)}%;width:${w.toFixed(2)}%;height:${h.toFixed(2)}%;--c:${DEST[s.dest].c}"><span class="slab">${esc(DEST[s.dest].short)}</span></div>`;
  }).join("");
  return `<figure class="pg"><div class="pgn">scan · page ${n}</div><div class="imgwrap"><img src="data:image/png;base64,${b64(`${SP}/pg0${n}.png`)}" alt="page ${n}">${boxes}</div></figure>`;
};

// ---- right pane: the actual lesson from the DB ----
const blockDest = (b) => {
  if (b.type === "grammar" || b.type === "note") return "guide";
  if (b.type === "vocab") return b.title ? "paradigm" : "vocab";
  if (b.type === "drill") {
    if (b.drill_modality === "voice") return "oral";
    if (b.drill_modality === "type") return "written";
    if ((b.items[0] || {}).expr_id) return "examples";
    return "paradigm";
  }
  return "guide";
};
const KIND = { recognition: "Recognize", production: "Produce" };
const MOD = { mc: "multiple choice", type: "type it", voice: "speak it", cloze: "choose the marker" };
const blockHtml = (b) => {
  const d = blockDest(b), lab = DEST[d].short;
  const head = b.type === "drill" ? `${b.title ? b.title + " · " : ""}${KIND[b.drill_kind]} · ${MOD[b.drill_modality] || b.drill_modality}` : b.type === "grammar" ? (b.title || "Grammar") : b.type === "vocab" ? (b.title || "Vocabulary") : b.type;
  const items = (b.items || []).slice(0, 12).map((it) => `<div class="li"><span class="w">${esc(it.w)}</span> <span class="g">${esc(it.t)}</span></div>`).join("");
  const md = b.body_md ? `<div class="md">${esc(b.body_md).slice(0, 220)}${b.body_md.length > 220 ? "…" : ""}</div>` : "";
  return `<div class="blk" data-dest="${d}" style="--c:${DEST[d].c}"><div class="bh"><span class="tag">${esc(lab)}</span> ${esc(head)}</div>${md}${items}${(b.items || []).length > 12 ? `<div class="more">+${b.items.length - 12} more</div>` : ""}</div>`;
};
const lessonCol = (lid, title) => `<div class="les"><h3>${esc(title)}</h3>${lessons[lid].map(blockHtml).join("")}</div>`;
const legend = `<table class="maptbl"><thead><tr><th>Scan section</th><th></th><th>Schema block type</th><th></th><th>Review column</th></tr></thead><tbody>` +
  Object.entries(DEST).map(([k, v]) => `<tr class="lg" data-dest="${k}"><td class="ms"><i style="background:${v.c}"></i>${esc(v.short)}</td><td class="arw">→</td><td><code>${esc(v.block)}</code></td><td class="arw">→</td><td>${esc(v.col)}</td></tr>`).join("") +
  `</tbody></table>`;

const html = `<style>
:root{--paper:#f6f2ea;--ink:#242b30;--soft:#6b747a;--line:#e4dccb}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
header{position:sticky;top:0;z-index:5;background:rgba(246,242,234,.96);backdrop-filter:blur(6px);border-bottom:1px solid var(--line);padding:14px 20px 10px}
h1{font-family:Georgia,serif;font-weight:600;font-size:20px;margin:0}
.sub{color:var(--soft);font-size:12.5px;margin-top:3px;max-width:104ch}
.legend{margin-top:10px;overflow-x:auto}
.maptbl{border-collapse:collapse;font-size:11.5px}
.maptbl th{font:600 9.5px/1 -apple-system;text-transform:uppercase;letter-spacing:.05em;color:#9aa0a6;text-align:left;padding:0 10px 5px}
.maptbl td{padding:2px 10px;white-space:nowrap;color:#4b535a}
.maptbl code{font:11px ui-monospace,monospace;background:#efe9dc;border-radius:4px;padding:1px 6px;color:#5a4a2a}
.maptbl .ms{font-weight:600;color:#33383d}
.maptbl .ms i{width:11px;height:11px;border-radius:3px;display:inline-block;margin-right:6px;vertical-align:-1px}
.maptbl .arw{color:#c2b8a0;padding:2px 2px}
.lg{cursor:default;border-radius:5px;transition:.1s}
.lg.dim{opacity:.3}
tr.lg:hover td{background:#f3eee2}
.wrap{display:grid;grid-template-columns:minmax(340px,1fr) minmax(340px,1fr);gap:18px;padding:18px 20px 60px;align-items:start}
@media(max-width:820px){.wrap{grid-template-columns:1fr}}
.col-h{font:600 11px/1 -apple-system;text-transform:uppercase;letter-spacing:.08em;color:var(--soft);margin:0 2px 8px}
.pg{margin:0 0 16px}
.pgn{font:600 10px/1 ui-monospace,monospace;color:#a99;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.imgwrap{position:relative;line-height:0;border:1px solid var(--line);border-radius:6px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.imgwrap img{width:100%;display:block}
.sec{position:absolute;background:color-mix(in srgb,var(--c) 12%,transparent);border:1.5px solid color-mix(in srgb,var(--c) 68%,transparent);border-radius:4px;transition:.12s;cursor:default}
.sec:hover{background:color-mix(in srgb,var(--c) 24%,transparent);border-color:var(--c);box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 30%,transparent)}
.slab{position:absolute;top:-9px;left:6px;font:600 8.5px/1.4 -apple-system;letter-spacing:.03em;text-transform:uppercase;color:#fff;background:var(--c);border-radius:3px;padding:0 5px;white-space:nowrap}
.dimmed .sec:not(.on){opacity:.1}
.les{background:#fff;border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin-bottom:14px}
.les h3{font-family:Georgia,serif;font-size:15px;margin:0 0 8px;color:#3a4048}
.blk{border-left:3px solid var(--c);padding:5px 0 6px 10px;margin:0 0 8px;transition:.12s}
.dimmed .blk:not(.on){opacity:.2}
.bh{font-size:12px;color:#3a4048;margin-bottom:3px}
.bh .tag{display:inline-block;font:600 9.5px/1.5 -apple-system;text-transform:uppercase;letter-spacing:.03em;color:#fff;background:var(--c);border-radius:4px;padding:1px 6px;vertical-align:1px}
.md{font-size:11.5px;color:var(--soft);margin:2px 0 4px}
.li{padding:1px 0;border-bottom:1px dotted #f0ead9;font-size:11.5px}
.li .w{font-family:Georgia,serif;font-weight:600}.li .g{color:var(--soft)}
.more{font-size:10.5px;color:#a99;font-style:italic;margin-top:2px}
</style>
<header>
  <h1>How the scan becomes the lesson — Peace Corps, Lesson 1</h1>
  <div class="sub">Deterministic: the book prints a heading before each section, so we carve the page at those headings — everything between <i>Examples</i> and <i>Oral Exercises</i> is that section, exact bounds, no guessing. The table below is the full mapping: each scanned <b>section</b> → the <b>schema block</b> it becomes → the <b>review column</b> it shows under. Hover a row or a box to trace it.</div>
  <div class="legend">${legend}</div>
</header>
<div class="wrap">
  <div><div class="col-h">The scanned book</div>${PAGES.map(pageHtml).join("")}</div>
  <div><div class="col-h">The lesson it produces</div>${lessonCol("pc-l1a", "Lesson 1a · Personal Pronouns")}${lessonCol("pc-l1b", "Lesson 1b · Vocabulary & sentences")}</div>
</div>
<script>
function focus(dest){
  document.body.classList.toggle('dimmed',!!dest);
  document.querySelectorAll('[data-dest]').forEach(el=>el.classList.toggle('on',el.dataset.dest===dest));
  document.querySelectorAll('.lg').forEach(el=>el.classList.toggle('dim',dest&&el.dataset.dest!==dest));
}
document.querySelectorAll('.sec,.blk,.lg').forEach(el=>{
  el.addEventListener('mouseenter',()=>focus(el.dataset.dest));
  el.addEventListener('mouseleave',()=>focus(null));
});
</script>`;
fs.writeFileSync(`${SP}/provenance-l1.html`, html);
const counts = {};
for (const n of PAGES) for (const l of pageLines[n]) counts[l.dest] = (counts[l.dest] || 0) + 1;
console.log("✓ provenance-l1.html — line sections:", JSON.stringify(counts));
