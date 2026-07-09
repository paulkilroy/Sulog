#!/usr/bin/env node
/* Regenerate the "Course vs. Book" verification SITE from the LIVE DB — one page per lesson,
 * plus an index. Part of the ingestion pipeline (reload-pc.mjs runs this last).
 *
 * Each lesson page has:
 *   LEFT  — the actual scanned pages with PROVENANCE OVERLAYS: the book prints a heading before
 *           each section (Examples, Oral/Written Exercises, Vocabulary, Review…), so we carve the
 *           page at those headings using Vision OCR line geometry (docs/sources/peace-corps/
 *           ocr-boxes/ocr-pNN.json) — colored boxes, each linked to the course block it became.
 *           Hover a box (or a course block, or a legend row) to trace the mapping both ways.
 *   RIGHT — the app's course preview: per-item DIRECTION badges, full multiple-choice option sets
 *           (same distractor rules as the app), and a verbatim-vs-OCR flag per sentence
 *           (fabrications like "Madig-on hiya" surface here).
 *
 * Output: docs/preview/verify/index.html + lesson-N.html (committed; Vercel serves at /verify/),
 * and docs/preview/verify.html (redirect for the old single-page URL). Scanned-page images come
 * from the cached base64 set in docs/preview/.pages-cache.json (rebuilt via sips if missing).
 * Requires SUPABASE_DB_URL.  Run: npm run preview
 */
import pg from "pg";
import fs from "fs";
import { execSync } from "child_process";

const SRC = "docs/sources/peace-corps";
const OUT_DIR = "docs/preview/verify";
const PAGES_CACHE = "docs/preview/.pages-cache.json";
const PAGES_DIR = `${SRC}/pages`;
const BOXES_DIR = `${SRC}/ocr-boxes`;
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---- scanned page images: book page N -> downscaled base64 JPEG (cached) ----
function pageFile(n) {
  if (n <= 23) return `${PAGES_DIR}/page_${String(n).padStart(2, "0")}.png`;
  if (n <= 69) return `${PAGES_DIR}/page-${String(n).padStart(3, "0")}.png`;
  return `${PAGES_DIR}/page_${String(n).padStart(2, "0")}.png`; // 70..92
}
function buildPagesCache() {
  const out = {}; const tmp = "docs/preview/.pg-tmp.jpg";
  for (let n = 1; n <= 92; n++) {
    const f = pageFile(n); if (!fs.existsSync(f)) continue;
    execSync(`sips --resampleWidth 600 -s format jpeg -s formatOptions 50 "${f}" --out "${tmp}"`, { stdio: "ignore" });
    out[n] = "data:image/jpeg;base64," + fs.readFileSync(tmp).toString("base64");
  }
  try { fs.unlinkSync(tmp); } catch {}
  fs.writeFileSync(PAGES_CACHE, JSON.stringify(out));
  return out;
}
const PAGES = fs.existsSync(PAGES_CACHE) ? JSON.parse(fs.readFileSync(PAGES_CACHE, "utf8")) : buildPagesCache();

// ---- pull the live course structure ----
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = async (s) => (await c.query(s)).rows;
const lessons = await q("select l.id,l.title,u.id uid,u.name uname,p.name pname from lessons l join units u on u.id=l.unit_id join phases p on p.id=u.phase_id where l.id like 'pc-%' order by p.ord,u.ord,l.ord");
const blocks = await q("select * from lesson_blocks where lesson_id like 'pc-%' order by lesson_id, ord");
const items = await q("select bi.* from block_items bi join lesson_blocks lb on lb.id=bi.block_id where lb.lesson_id like 'pc-%' order by bi.block_id, bi.ord");
const dict = await q("select waray,meaning from dictionary");
const exprs = await q("select id,waray,translation from expressions where id>=20000");
// paradigm-chart words (titled vocab blocks) — used to bound the pronoun/marker chart inside grammar prose
const paradigmWords = new Set((await q("select distinct d.waray from lesson_blocks lb join block_items bi on bi.block_id=lb.id join dictionary d on d.waray=bi.dict_waray where lb.lesson_id like 'pc-%' and lb.type='vocab' and lb.title is not null")).map((r) => r.waray.toLowerCase()));
await c.end();

const dByW = new Map(dict.map((d) => [d.waray, d]));
const eById = new Map(exprs.map((e) => [String(e.id), e]));
const resolve = (it) => it.dict_waray
  ? { waray: it.dict_waray, en: (dByW.get(it.dict_waray) || {}).meaning || "" }
  : { waray: (eById.get(String(it.expr_id)) || {}).waray || "", en: (eById.get(String(it.expr_id)) || {}).translation || "" };
const itemsByBlock = new Map();
for (const it of items) { const r = resolve(it); (itemsByBlock.get(it.block_id) || itemsByBlock.set(it.block_id, []).get(it.block_id)).push({ ...r, role: it.role }); }
const byLesson = new Map();
for (const b of blocks) (byLesson.get(b.lesson_id) || byLesson.set(b.lesson_id, []).get(b.lesson_id)).push({ ...b, items: itemsByBlock.get(b.id) || [] });

// card pool for distractors (deck = unit id, first occurrence wins) — mirrors the app's `cards`
const cards = []; const seenW = new Set();
for (const l of lessons) for (const b of (byLesson.get(l.id) || [])) for (const i of b.items) {
  if (!i.waray || seenW.has(i.waray)) continue; seenW.add(i.waray);
  cards.push({ waray: i.waray, en: i.en, deck: l.uid, phrase: /\s/.test(i.waray.trim()) });
}
const key = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
// replicate pickDistractors: 3 English options, same shape, distinct meaning; this drill's own
// items (the section) first, then the unit deck, then anywhere
function distractors(item, deck, section) {
  const aW = key(item.waray), aE = key(item.en), want = /\s/.test(item.waray.trim());
  const distinct = (cd) => cd.waray !== item.waray && key(cd.waray) !== aW && key(cd.en) !== aE;
  const shaped = (cd) => /\s/.test((cd.waray || "").trim()) === want;
  const seen = new Set([aE]), out = [];
  const fill = (list) => { for (const cd of list.slice().sort((a, b) => a.waray.localeCompare(b.waray))) { if (out.length === 3) break; if (!distinct(cd)) continue; if (cd.en && !seen.has(key(cd.en))) { seen.add(key(cd.en)); out.push(cd.en); } } };
  fill((section || []).filter(shaped));
  if (out.length < 3) fill(cards.filter((cd) => shaped(cd) && cd.deck === deck));
  if (out.length < 3) fill(cards.filter(shaped));
  if (out.length < 3) fill(cards);
  return out;
}

// ---- OCR text: segment by lesson + normalized full text for the verbatim check ----
const ocr = fs.readFileSync(`${SRC}/peace-corps-full-ocr.txt`, "utf8");
const normO = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const ocrN = normO(ocr);
const ocrByLesson = {}, lessonStartPage = {};
{ let cur = null, curPage = 1;
  for (const ln of ocr.split("\n")) {
    const pm = ln.match(/^===PAGE (\d+)===/); if (pm) curPage = +pm[1];
    const m = ln.match(/^Lesson (\d+)/);
    if (m) { cur = +m[1]; ocrByLesson[cur] = ocrByLesson[cur] || []; lessonStartPage[cur] = lessonStartPage[cur] ?? curPage; } // the PAGE marker for a lesson's first page precedes its heading
    if (cur) ocrByLesson[cur].push(ln);
  }
  for (const k in ocrByLesson) ocrByLesson[k] = ocrByLesson[k].join("\n");
}
const inBook = (w) => { const n = normO(w); return n.length >= 3 && ocrN.includes(n); };
const isSent = (w) => /\s/.test((w || "").trim());
const pagesOf = (txt) => { const s = new Set(); let m; const re = /===PAGE (\d+)===/g; while ((m = re.exec(txt || ""))) if (+m[1] >= 1 && +m[1] <= 92) s.add(+m[1]); return [...s].sort((a, b) => a - b); };

// ---- PROVENANCE: carve every scanned page into sections by the book's printed headings ----
// One GLOBAL pass in book order: the running section carries across page boundaries (page 2 may
// continue page 1's Written Exercises). Line boxes come from Vision OCR (ocr-boxes/ocr-pNN.json,
// normalized bottom-left origin → top = 1-y-h).
const DEST = {
  guide:    { c: "#5fc9cf", short: "Guide",          block: "grammar / note",            col: "read it" },
  paradigm: { c: "#b79ae8", short: "Chart",          block: "vocab · paradigm",          col: "learn the words" },
  examples: { c: "#6aa9e8", short: "Examples",       block: "drill · recognition",       col: "pick the meaning" },
  vocab:    { c: "#3fae6a", short: "Vocabulary",     block: "vocab",                     col: "learn the words" },
  oral:     { c: "#8a97a3", short: "Oral exercise",  block: "— dropped (teacher-led)",   col: "voice toggle instead" },
  written:  { c: "#f0a24a", short: "Written",        block: "drill · production",        col: "translate both ways" },
  gate:     { c: "#f07a66", short: "Review / test",  block: "assessment · gate",         col: "exit test" },
};
const ANCHORS = [
  [/^\s*Lesson\s+\d+/i, "guide"],                 // a new lesson opens with its intro
  [/^\s*review\s*[:.]?\s*$|^\s*review\s+test/i, "gate"], // the opener review = the PRIOR lesson's exit test
  [/^\s*examples?\b/i, "examples"],
  [/^\s*oral\s+exercises?/i, "oral"],
  [/^\s*written\s+exercises?/i, "written"],
  [/^\s*vocabulary\b/i, "vocab"],
  [/^\s*notes?\s*[:.]/i, "guide"],
  [/^\s*accent\s+marks/i, "guide"],
  // mid-lesson grammar-topic headings ("II CLASS MARKERS", "III Class Personal Pronouns"): the book
  // often prints these AFTER an exercise, and without an anchor the running exercise section
  // swallowed the next grammar block on the scan (L4's II Class Markers showed as "oral exercise").
  // Heading-only match: the line must BE the heading (prose that mentions "the II Class Markers,
  // like…" doesn't start with the class pattern, so it can't anchor).
  [/^\s*(the\s+)?[ivx1l]{0,4}\s*[-–]?\s*class\s+(personal\s+|general\s+)?(pronouns?|markers?)\s*\.?\s*$/i, "guide"],
];
const isChartHead = (t) => /^\s*(singular|plural)\s*$/i.test(t) || /class\s+(personal\s+|general\s+)?(pronouns?|markers?)/i.test(t);
const wordsOf = (t) => (t || "").toLowerCase().split(/[^a-zà-ÿ']+/).filter(Boolean);
const pageLines = {};
{
  let current = "guide";
  for (let n = 1; n <= 92; n++) {
    const f = `${BOXES_DIR}/ocr-p${String(n).padStart(2, "0")}.json`;
    if (!fs.existsSync(f)) continue;
    let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
    const lines = (j.lines || []).map((l) => ({ t: l.t, x: l.x, w: l.w, top: 1 - l.y - l.h, bottom: 1 - l.y })).sort((a, b) => a.top - b.top);
    for (const l of lines) { const hit = ANCHORS.find(([re]) => re.test(l.t)); if (hit) current = hit[1]; l.dest = current; }
    // bound the pronoun/marker chart inside grammar prose: chart cells are SHORT lines of known
    // paradigm words / chart headers (keeps prose that name-drops the same words out of the box)
    const chart = lines.filter((l) => { const w = wordsOf(l.t); return l.dest === "guide" && w.length <= 5 && (isChartHead(l.t) || (w.length <= 3 && w.some((x) => paradigmWords.has(x)))); });
    if (chart.length >= 2) {
      const top = Math.min(...chart.map((l) => l.top)), bottom = Math.max(...chart.map((l) => l.bottom));
      for (const l of lines) if (l.dest === "guide" && l.top >= top - 0.005 && l.bottom <= bottom + 0.005) l.dest = "paradigm";
    }
    pageLines[n] = lines;
  }
}
// merge consecutive same-section lines into one labeled overlay box
function pageBoxes(n) {
  const lines = pageLines[n]; if (!lines || !lines.length) return "";
  const secs = []; const pad = 0.006;
  for (const l of lines) {
    const cur = secs[secs.length - 1];
    if (cur && cur.dest === l.dest && l.top - cur.bottom < 0.045) { cur.left = Math.min(cur.left, l.x); cur.right = Math.max(cur.right, l.x + l.w); cur.bottom = Math.max(cur.bottom, l.bottom); cur.n++; }
    else secs.push({ dest: l.dest, left: l.x, right: l.x + l.w, top: l.top, bottom: l.bottom, n: 1 });
  }
  return secs.filter((s) => s.n >= 2 && DEST[s.dest]).map((s) => {
    const top = Math.max(0, s.top - pad) * 100, left = Math.max(0, s.left - pad) * 100;
    const w = Math.min(1, s.right - s.left + pad * 2) * 100, h = (s.bottom - s.top + pad * 2) * 100;
    return `<div class="sec" data-dest="${s.dest}" title="${esc(DEST[s.dest].short)} → ${esc(DEST[s.dest].block)}" style="top:${top.toFixed(2)}%;left:${left.toFixed(2)}%;width:${w.toFixed(2)}%;height:${h.toFixed(2)}%;--c:${DEST[s.dest].c}"><span class="slab">${esc(DEST[s.dest].short)}</span></div>`;
  }).join("");
}

// ---- assemble per-lesson data: direction, verbatim, MC choices ----
const esc = (s) => (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stats = { synth: 0, sentTotal: 0, mc: 0 };
const data = [];
for (const l of lessons) {
  const num = +(/pc-l(\d+)/.exec(l.id)?.[1] || 0);
  const L = { id: l.id, title: l.title, num, phase: l.pname, ocr: ocrByLesson[num] || "",
    pages: [...new Set([lessonStartPage[num], ...pagesOf(ocrByLesson[num])].filter((p) => p >= 1 && p <= 92))].sort((a, b) => a - b), blocks: [] };
  for (const b of (byLesson.get(l.id) || [])) {
    const its = b.items;
    const B = { type: b.type, title: b.title, prose: b.body_md, formula: b.formula, kind: b.drill_kind, gate: b.assess_gate, dirLabel: null, mc: false, items: [] };
    if (b.type === "assessment" && b.assess_gate) { const words = its.filter((i) => !isSent(i.waray)), sents = its.filter((i) => isSent(i.waray)), mixed = words.length && sents.length; its.forEach((i, k) => { i.dir = mixed ? (isSent(i.waray) ? "etw" : "wte") : (k < Math.ceil(its.length / 2) ? "wte" : "etw"); }); B.dirLabel = "Exam · both ways"; }
    else if (b.type === "drill" && b.drill_kind === "production") { const h = Math.ceil(its.length / 2); its.forEach((i, k) => (i.dir = k < h ? "wte" : "etw")); B.dirLabel = "Produce · both ways"; }
    else if (b.type === "drill") { its.forEach((i) => (i.dir = "wte")); B.dirLabel = "Recognize · Waray → English"; B.mc = b.drill_modality === "mc"; }
    else its.forEach((i) => (i.dir = null));
    for (const i of its) {
      let verd = null, choices = null;
      if ((b.type === "drill" || b.type === "assessment") && isSent(i.waray)) { stats.sentTotal++; verd = inBook(i.waray); if (!verd) stats.synth++; }
      if (B.mc) { choices = distractors(i, l.uid, its); stats.mc++; }
      B.items.push({ waray: i.waray, en: i.en, dir: i.dir, verbatim: verd, choices });
    }
    L.blocks.push(B);
  }
  data.push(L);
}

// ---- render ----
const blockDest = (b) => b.type === "grammar" || b.type === "note" ? "guide"
  : b.type === "vocab" ? (b.title ? "paradigm" : "vocab")
  : b.type === "assessment" ? "gate"
  : b.type === "drill" ? (b.kind === "production" ? "written" : "examples") : "guide";
function renderMd(md) {
  if (!md) return ""; const out = []; let tbl = null;
  const flush = () => { if (tbl) { out.push(`<table class="md">${tbl.map((r, ri) => `<tr>${r.map((cl) => `<${ri === 0 ? "th" : "td"}>${esc(cl)}</${ri === 0 ? "th" : "td"}>`).join("")}</tr>`).join("")}</table>`); tbl = null; } };
  for (const ln of md.split("\n")) { if (/^\s*\|.*\|\s*$/.test(ln)) { const cells = ln.trim().replace(/^\||\|$/g, "").split("|").map((s) => s.trim()); if (cells.every((cl) => /^:?-+:?$/.test(cl))) continue; (tbl || (tbl = [])).push(cells); } else { flush(); if (ln.trim()) out.push(`<p>${esc(ln)}</p>`); } }
  flush(); return out.join("");
}
const dirBadge = (d) => d === "wte" ? `<span class="dir wte">WAR&rarr;ENG</span>` : d === "etw" ? `<span class="dir etw">ENG&rarr;WAR</span>` : "";
const verd = (v) => v === true ? `<span class="v ok" title="Verbatim in the book">&#10003; in book</span>` : v === false ? `<span class="v syn" title="Not verbatim — a substitution rendering or possible hallucination; check the scan">&#9998; synth</span>` : "";
function itemHtml(i) {
  if (i.choices) { const opts = [{ t: i.en, ans: true }, ...i.choices.map((cl) => ({ t: cl, ans: false }))]; return `<div class="it mc">${dirBadge(i.dir)}<span class="war">${esc(i.waray)}</span><div class="choices">${opts.map((o) => `<span class="ch${o.ans ? " ans" : ""}">${esc(o.t)}</span>`).join("")}</div></div>`; }
  return `<div class="it${i.verbatim === false ? " flag" : ""}">${dirBadge(i.dir)}<span class="war">${esc(i.waray)}</span><span class="dash">&mdash;</span><span class="en">${esc(i.en)}</span>${verd(i.verbatim)}</div>`;
}
function blockHtml(b) {
  const d = blockDest(b), color = DEST[d].c;
  let head = "", body = "";
  if (b.type === "grammar" || b.type === "note") { head = `${b.type}${b.title ? " · " + esc(b.title) : ""}`; body = renderMd(b.prose) + (b.formula ? `<div class="formula">${esc(b.formula)}</div>` : "") + b.items.map(itemHtml).join(""); }
  else if (b.type === "vocab") { head = `${b.title ? esc(b.title) : "Vocabulary"} · ${b.items.length} word${b.items.length !== 1 ? "s" : ""}`; body = b.items.map((i) => `<div class="it"><span class="war">${esc(i.waray)}</span><span class="dash">&mdash;</span><span class="en">${esc(i.en)}</span></div>`).join(""); }
  else if (b.type === "drill") { head = `Drill · ${b.dirLabel || ""}${b.mc ? " · multiple choice" : ""}`; body = b.items.map(itemHtml).join(""); }
  else if (b.type === "assessment") { if (!b.items.length) return ""; head = `&#128274; ${esc(b.title || "Exam")} · ${b.dirLabel || "both ways"}`; body = b.items.map(itemHtml).join(""); }
  else { head = b.type; body = b.items.map(itemHtml).join(""); }
  return `<div class="blk" data-dest="${d}" style="--c:${color}"><div class="bh" style="color:${color}"><span class="tag" style="background:${color}">${esc(DEST[d].short)}</span> ${head}</div>${body}</div>`;
}
const legend = `<table class="maptbl"><tbody>` + Object.entries(DEST).map(([k, v]) =>
  `<tr class="lg" data-dest="${k}"><td class="ms"><i style="background:${v.c}"></i>${esc(v.short)}</td><td class="arw">&rarr;</td><td><code>${esc(v.block)}</code></td><td class="arw">&rarr;</td><td>${esc(v.col)}</td></tr>`).join("") + `</tbody></table>`;

const CSS = `
:root{--tide:#1cb0b8;--sea:#5fc9cf;--sun:#f4a53a;--coral:#f07a66;--jade:#3fae6a;--shell:#0b1f23;--sand:#16333a;--sand-deep:#2b4f56;--ink:#eaf3f2;--ink-soft:#9db3b5;--foam:#102a2f;}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:radial-gradient(135% 80% at 50% -8%,#123a3f 0%,var(--shell) 52%);min-height:100vh}
a{color:var(--sea)}
header{position:sticky;top:0;z-index:20;background:rgba(9,24,28,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--sand-deep);padding:12px 20px}
h1{margin:0 0 3px;font-size:18px;letter-spacing:-.01em}
.sub{margin:0 0 8px;font-size:12.5px;line-height:1.5;color:var(--ink-soft);max-width:920px}.sub b{color:var(--ink)}
.nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12.5px}
.nav a{font-weight:700;text-decoration:none;padding:4px 12px;border:1px solid var(--sand-deep);border-radius:9px;background:var(--foam)}
.nav a:hover{border-color:var(--tide)}
.nav .sp{margin-left:auto;color:var(--ink-soft);font-variant-numeric:tabular-nums}
.maptbl{border-collapse:collapse;font-size:11.5px;margin:8px 0 2px}
.maptbl td{padding:2px 8px;white-space:nowrap;color:var(--ink-soft)}
.maptbl code{font:11px ui-monospace,monospace;background:var(--sand);border-radius:4px;padding:1px 6px;color:var(--sea)}
.maptbl .ms{font-weight:700;color:var(--ink)}
.maptbl .ms i{width:11px;height:11px;border-radius:3px;display:inline-block;margin-right:6px;vertical-align:-1px}
.maptbl .arw{color:var(--sand-deep)}
.lg.dim{opacity:.3}
tr.lg:hover td{background:var(--sand)}
.wrap{display:grid;grid-template-columns:minmax(320px,1fr) minmax(340px,1.1fr);gap:16px;padding:16px 20px 60px;align-items:start}
@media(max-width:900px){.wrap{grid-template-columns:1fr}}
/* lesson pages: the two panes scroll independently (desktop); mobile falls back to page scroll */
@media(min-width:901px){
  body.lpage{height:100vh;overflow:hidden;display:flex;flex-direction:column}
  body.lpage header{flex:none}
  body.lpage .wrap{flex:1;min-height:0;overflow:hidden;padding-bottom:0;align-items:stretch}
  body.lpage .colpane{overflow-y:auto;min-height:0;padding-bottom:60px;scrollbar-width:thin;scrollbar-color:var(--sand-deep) transparent}
}
/* sticky section filter (click a box / block / legend row) */
.sec,.blk,.lg{cursor:pointer}
.blk.hide{display:none}
.filtered .sec:not(.on){opacity:.12}
.lg.onrow td{background:var(--sand)}
#fpill{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);z-index:30;color:#08262b;font:700 12px system-ui;padding:7px 16px;border-radius:999px;display:none;box-shadow:0 4px 14px rgba(0,0,0,.4)}
body.filtered #fpill{display:block}
.col-h{font:700 11px/1 system-ui;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-soft);margin:0 2px 8px}
.pg{margin:0 0 16px}
.pgn{font:600 10px/1 ui-monospace,monospace;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.imgwrap{position:relative;line-height:0;border:1px solid var(--sand-deep);border-radius:8px;overflow:hidden;background:#fff}
.imgwrap img{width:100%;display:block}
.sec{position:absolute;background:color-mix(in srgb,var(--c) 13%,transparent);border:1.5px solid color-mix(in srgb,var(--c) 70%,transparent);border-radius:4px;transition:.12s;cursor:default}
.sec:hover{background:color-mix(in srgb,var(--c) 26%,transparent);border-color:var(--c)}
.slab{position:absolute;top:-9px;left:6px;font:600 8.5px/1.5 system-ui;letter-spacing:.03em;text-transform:uppercase;color:#08262b;background:var(--c);border-radius:3px;padding:0 5px;white-space:nowrap}
.dimmed .sec:not(.on){opacity:.12}
details.rawocr{margin:4px 0 14px;border:1px solid var(--sand-deep);border-radius:10px;background:var(--foam)}
details.rawocr summary{cursor:pointer;padding:8px 12px;font-size:12px;font-weight:700;color:var(--sea)}
details.rawocr pre{margin:0;padding:10px 14px;font:11.5px/1.55 ui-monospace,monospace;color:#cfe0df;white-space:pre-wrap;word-break:break-word;max-height:60vh;overflow:auto}
.clesson{background:var(--foam);border:1px solid var(--sand-deep);border-radius:12px;padding:10px 14px;margin-bottom:14px}
.clh{font-size:13.5px;font-weight:800;color:var(--sun);margin:4px 0 6px}
.blk{border-left:3px solid var(--c);padding:5px 0 5px 11px;margin:8px 0;transition:.12s}
.dimmed .blk:not(.on){opacity:.18}
.bh{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;font-weight:800;margin-bottom:5px}
.bh .tag{display:inline-block;color:#08262b;border-radius:4px;padding:1px 6px;margin-right:4px;letter-spacing:.03em}
.blk p{margin:3px 0;font-size:13px;line-height:1.5;color:var(--ink);text-transform:none;letter-spacing:0;font-weight:400}
table.md{border-collapse:collapse;margin:6px 0;font-size:12px;text-transform:none;letter-spacing:0;font-weight:400}
table.md th,table.md td{border:1px solid var(--sand-deep);padding:3px 8px;text-align:left;color:var(--ink)}
table.md th{background:var(--sand);font-weight:700}
.formula{font:12px ui-monospace,monospace;background:var(--sand);border:1px solid var(--sand-deep);border-radius:6px;padding:5px 8px;margin:5px 0;color:var(--sea);text-transform:none;letter-spacing:0;font-weight:400;white-space:pre-wrap}
.it{display:flex;gap:7px;align-items:baseline;flex-wrap:wrap;padding:3px 0;border-bottom:1px dotted #24454b;font-weight:400;text-transform:none;letter-spacing:0}
.it .war{font-family:Georgia,serif;font-size:14.5px;font-weight:600}
.it .dash{color:var(--ink-soft)}.it .en{color:var(--ink-soft);font-size:12.5px}
.it.flag{background:rgba(244,165,58,.06);border-radius:6px;padding:3px 6px;margin:1px -6px}
.dir{font-size:9.5px;font-weight:800;letter-spacing:.04em;padding:1px 6px;border-radius:6px;white-space:nowrap;flex:0 0 auto}
.dir.wte{background:rgba(28,176,184,.18);color:var(--sea);border:1px solid rgba(28,176,184,.4)}
.dir.etw{background:rgba(244,165,58,.16);color:var(--sun);border:1px solid rgba(244,165,58,.4)}
.v{font-size:9.5px;font-weight:700;padding:0 5px;white-space:nowrap;margin-left:auto}
.v.ok{color:var(--jade)}.v.syn{color:var(--sun)}
.it.mc{flex-direction:column;align-items:flex-start;gap:5px;background:rgba(197,138,42,.05);border-radius:8px;padding:7px 9px;margin:4px 0;border-bottom:none}
.choices{display:flex;flex-wrap:wrap;gap:6px}
.ch{font-size:12px;color:var(--ink-soft);background:var(--sand);border:1px solid var(--sand-deep);border-radius:8px;padding:3px 9px}
.ch.ans{color:#0b1f23;background:var(--jade);border-color:var(--jade);font-weight:700}
.nopg{font-size:12px;color:var(--ink-soft);padding:18px;border:1px dashed var(--sand-deep);border-radius:8px;margin-bottom:14px}
/* index */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;padding:18px 20px 60px}
.card{display:block;text-decoration:none;color:var(--ink);background:var(--foam);border:1px solid var(--sand-deep);border-radius:14px;padding:14px 16px;transition:.12s}
.card:hover{border-color:var(--tide);transform:translateY(-1px)}
.card .n{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--sea)}
.card .t{font-size:14.5px;font-weight:700;margin:3px 0 6px;line-height:1.3}
.card .m{font-size:11.5px;color:var(--ink-soft);font-variant-numeric:tabular-nums}
.card .m .syn{color:var(--sun)} .card .m .ok{color:var(--jade)}
.phz{grid-column:1/-1;font:700 11px/1 system-ui;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-soft);margin:10px 2px -2px}
`;
const DEST_JSON = JSON.stringify(Object.fromEntries(Object.entries(DEST).map(([k, v]) => [k, { c: v.c, short: v.short }])));
const SCRIPT = `<div id="fpill"></div><script>
const DESTS = ${DEST_JSON};
let sticky = null;
// CLICK = sticky filter: only that section's blocks show on the right; click again / Esc clears
function apply(){
  document.body.classList.toggle('filtered', !!sticky);
  document.querySelectorAll('.blk').forEach(el=>el.classList.toggle('hide', !!sticky && el.dataset.dest!==sticky));
  document.querySelectorAll('.sec').forEach(el=>el.classList.toggle('on', !!sticky && el.dataset.dest===sticky));
  document.querySelectorAll('.lg').forEach(el=>{ el.classList.toggle('onrow', !!sticky && el.dataset.dest===sticky); el.classList.toggle('dim', !!sticky && el.dataset.dest!==sticky); });
  const p = document.getElementById('fpill');
  if (sticky && p){ p.style.background = DESTS[sticky].c; p.textContent = 'Showing only: ' + DESTS[sticky].short + '  —  click again or Esc to show all'; }
}
// HOVER = light trace (only while no sticky filter is active)
function focus(dest){
  if (sticky) return;
  document.body.classList.toggle('dimmed',!!dest);
  document.querySelectorAll('[data-dest]').forEach(el=>el.classList.toggle('on',el.dataset.dest===dest));
  document.querySelectorAll('.lg').forEach(el=>el.classList.toggle('dim',dest&&el.dataset.dest!==dest));
}
document.querySelectorAll('.sec,.blk,.lg').forEach(el=>{
  el.addEventListener('mouseenter',()=>focus(el.dataset.dest));
  el.addEventListener('mouseleave',()=>focus(null));
  el.addEventListener('click',(e)=>{ e.stopPropagation();
    sticky = sticky===el.dataset.dest ? null : el.dataset.dest;
    document.body.classList.remove('dimmed');
    document.querySelectorAll('.on').forEach(x=>x.classList.remove('on'));
    apply();
  });
});
document.addEventListener('keydown',(e)=>{ if(e.key==='Escape' && sticky){ sticky=null; apply(); } });
<\/script>`;

// group lessons by book number
const byNum = {}; for (const L of data) (byNum[L.num] || (byNum[L.num] = [])).push(L);
const nums = Object.keys(byNum).map(Number).sort((a, b) => a - b);

// ---- one page per lesson ----
for (let gi = 0; gi < nums.length; gi++) {
  const n = nums[gi]; const grp = byNum[n];
  const pgs = [...new Set(grp.flatMap((g) => g.pages))].sort((a, b) => a - b);
  const ocrTxt = grp.find((g) => g.ocr)?.ocr || "(no OCR captured)";
  const left = (pgs.length ? pgs.map((p) => PAGES[p]
    ? `<figure class="pg"><div class="pgn">scan · page ${p}</div><div class="imgwrap"><img src="${PAGES[p]}" alt="page ${p}">${pageBoxes(p)}</div></figure>`
    : `<div class="nopg">p.${p} &mdash; no scan (text-only appendix); OCR below is the only source</div>`).join("")
    : `<div class="nopg">no scanned pages mapped to this lesson</div>`)
    + `<details class="rawocr"><summary>Raw OCR text</summary><pre>${esc(ocrTxt)}</pre></details>`;
  const right = grp.map((L) => `<div class="clesson"><div class="clh">${esc(L.title)}</div>${L.blocks.map(blockHtml).join("")}</div>`).join("");
  const prev = gi > 0 ? `<a href="lesson-${nums[gi - 1]}.html">&larr; L${nums[gi - 1]}</a>` : "";
  const next = gi < nums.length - 1 ? `<a href="lesson-${nums[gi + 1]}.html">L${nums[gi + 1]} &rarr;</a>` : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lesson ${n} — Course vs. Book</title><style>${CSS}</style></head><body class="lpage">
<header>
  <h1>Lesson ${n} <span style="color:var(--ink-soft);font-weight:400">· ${esc(grp[0].phase)}</span></h1>
  <p class="sub"><b>Click</b> a colored box, course block, or legend row to show ONLY that section on the right (click again or Esc to show all); hover to trace. The panes scroll independently. Grey <b>Oral exercise</b> sections are deliberately not ingested (teacher-led; the answer-by-voice toggle covers speaking).</p>
  <div class="nav"><a href="index.html">&#8962; All lessons</a>${prev}${next}<span class="sp">page${pgs.length === 1 ? "" : "s"} ${pgs.join(", ") || "—"}</span></div>
  <div class="legend">${legend}</div>
</header>
<div class="wrap">
  <div class="colpane"><div class="col-h">&#128214; The scanned book</div>${left}</div>
  <div class="colpane"><div class="col-h">&#128241; The lesson it produces</div>${right}</div>
</div>${SCRIPT}</body></html>`;
  fs.writeFileSync(`${OUT_DIR}/lesson-${n}.html`, html);
}

// ---- index ----
const phaseOf = (n) => byNum[n][0].phase;
let curPhase = null;
const cardsHtml = nums.map((n) => {
  const grp = byNum[n];
  const allItems = grp.flatMap((L) => L.blocks.flatMap((b) => b.items));
  const sents = allItems.filter((i) => i.verbatim !== null);
  const synthN = sents.filter((i) => i.verbatim === false).length;
  const hasGate = grp.some((L) => L.blocks.some((b) => b.gate && b.items.length));
  const titles = grp.map((L) => L.title.replace(/^Lesson \d+[ab]? · /, "")).join(" · ");
  const ph = phaseOf(n);
  const head = ph !== curPhase ? `<div class="phz">${esc(ph)}</div>` : "";
  curPhase = ph;
  return head + `<a class="card" href="lesson-${n}.html"><div class="n">Lesson ${n}${hasGate ? " · &#128274; gated" : ""}</div><div class="t">${esc(titles)}</div><div class="m">${allItems.length} items · <span class="ok">${sents.length - synthN} &#10003; in book</span> · <span class="syn">${synthN} &#9998; synth</span></div></a>`;
}).join("");
fs.writeFileSync(`${OUT_DIR}/index.html`, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Course vs. Book — Peace Corps Waray</title><style>${CSS}</style>
<header>
  <h1>Peace Corps Waray — Course vs. Book</h1>
  <p class="sub">One page per lesson: the scanned book with <b>provenance overlays</b> (each colored section traced to the course block it became) beside the app's course preview — every drill item's <b>direction</b>, full <b>multiple-choice options</b>, and a <b>&#10003; in book / &#9998; synth</b> source check per sentence.</p>
  <div class="nav"><span class="sp">${stats.sentTotal - stats.synth} verbatim · ${stats.synth} synth of ${stats.sentTotal} sentences · ${stats.mc} MC items</span></div>
</header>
<div class="grid">${cardsHtml}</div>`);

// redirect for the old single-page URL (/verify.html)
fs.writeFileSync("docs/preview/verify.html", `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/verify/"><title>Course vs. Book</title><a href="/verify/">Course vs. Book has moved &rarr; /verify/</a>`);

const sizes = fs.readdirSync(OUT_DIR).reduce((a, f) => a + fs.statSync(`${OUT_DIR}/${f}`).size, 0);
console.log(`✓ ${OUT_DIR}/ — index + ${nums.length} lesson pages · ${stats.mc} MC · ${stats.sentTotal - stats.synth} verbatim / ${stats.synth} synth · ${(sizes / 1048576).toFixed(1)}MB total`);
