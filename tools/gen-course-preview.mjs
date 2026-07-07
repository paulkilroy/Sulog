#!/usr/bin/env node
/* Regenerate the "Course vs. Book" side-by-side verification page from the LIVE DB.
 *
 * Part of the PC ingestion pipeline: run after reloading the course so the page always
 * reflects what's actually live. Book scan + OCR on the left, the app's course preview on
 * the right, with per-item DIRECTION badges, full multiple-choice option sets (via the same
 * distractor rules the app uses), and a verbatim-vs-synthesized flag against the book OCR
 * (that's where Gemini fabrications like "Madig-on hiya" surface).
 *
 * Writes docs/preview/pc-course-vs-book.html (self-contained, gitignored). Scanned-page
 * images are downscaled with `sips` and cached (base64) in docs/preview/.pages-cache.json;
 * delete that file to rebuild from the source PNGs. Requires SUPABASE_DB_URL.
 *
 * Run:  SUPABASE_DB_URL=... node tools/gen-course-preview.mjs
 */
import pg from "pg";
import fs from "fs";
import { execSync } from "child_process";

const SRC = "docs/sources/peace-corps";
const OUT_DIR = "docs/preview";
const OUT = `${OUT_DIR}/pc-course-vs-book.html`;
const PAGES_CACHE = `${OUT_DIR}/.pages-cache.json`;
const PAGES_DIR = `${SRC}/pages`;
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---- scanned page images: book page N -> downscaled base64 JPEG (cached) ----
function pageFile(n) {
  if (n <= 23) return `${PAGES_DIR}/page_${String(n).padStart(2, "0")}.png`;
  if (n <= 69) return `${PAGES_DIR}/page-${String(n).padStart(3, "0")}.png`;
  return `${PAGES_DIR}/page_${String(n).padStart(2, "0")}.png`; // 70..92
}
function buildPagesCache() {
  const out = {};
  const tmp = `${OUT_DIR}/.pg-tmp.jpg`;
  for (let n = 1; n <= 92; n++) {
    const f = pageFile(n);
    if (!fs.existsSync(f)) continue;
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
function distractors(item, deck) { // replicate pickDistractors: 3 English options, same shape, distinct meaning, prefer same deck
  const aW = key(item.waray), aE = key(item.en), want = /\s/.test(item.waray.trim());
  const distinct = (c) => c.waray !== item.waray && key(c.waray) !== aW && key(c.en) !== aE;
  const shaped = (c) => c.phrase === want;
  let pool = cards.filter((c) => distinct(c) && shaped(c) && c.deck === deck);
  if (pool.length < 3) pool = cards.filter((c) => distinct(c) && shaped(c));
  if (pool.length < 3) pool = cards.filter(distinct);
  const seen = new Set([aE]), out = [];
  for (const c of pool.sort((a, b) => a.waray.localeCompare(b.waray))) { if (c.en && !seen.has(key(c.en))) { seen.add(key(c.en)); out.push(c.en); } if (out.length === 3) break; }
  return out;
}

// ---- OCR: segment by lesson + normalized full text for the verbatim check ----
const ocr = fs.readFileSync(`${SRC}/peace-corps-full-ocr.txt`, "utf8");
const normO = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const ocrN = normO(ocr);
const ocrByLesson = {}; { let cur = null; for (const ln of ocr.split("\n")) { const m = ln.match(/^Lesson (\d+)/); if (m) { cur = +m[1]; ocrByLesson[cur] = ocrByLesson[cur] || []; } if (cur) ocrByLesson[cur].push(ln); } for (const k in ocrByLesson) ocrByLesson[k] = ocrByLesson[k].join("\n"); }
const inBook = (w) => { const n = normO(w); return n.length >= 3 && ocrN.includes(n); };
const isSent = (w) => /\s/.test((w || "").trim());
const pagesOf = (txt) => { const s = new Set(); let m; const re = /===PAGE (\d+)===/g; while ((m = re.exec(txt || ""))) if (+m[1] >= 1 && +m[1] <= 92) s.add(+m[1]); return [...s].sort((a, b) => a - b); };

// ---- assemble per-lesson data + direction/verbatim/MC ----
const stats = { synth: 0, sentTotal: 0, mc: 0 };
const data = [];
for (const l of lessons) {
  const num = +(/pc-l(\d+)/.exec(l.id)?.[1] || 0);
  const L = { id: l.id, title: l.title, num, phase: l.pname, ocr: ocrByLesson[num] || "", pages: pagesOf(ocrByLesson[num]), blocks: [] };
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
      if (B.mc) { choices = distractors(i, l.uid); stats.mc++; }
      B.items.push({ waray: i.waray, en: i.en, dir: i.dir, verbatim: verd, choices });
    }
    L.blocks.push(B);
  }
  data.push(L);
}

// ---- render ----
const esc = (s) => (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const BLK = { grammar: "var(--tide)", note: "var(--tide)", vocab: "#3fae6a", phrases: "#c58a2a", drill: "#c58a2a", assessment: "var(--coral)", story: "#9a7ad0", review: "var(--tide)" };
function renderMd(md) {
  if (!md) return ""; const out = []; let tbl = null;
  const flush = () => { if (tbl) { out.push(`<table class="md">${tbl.map((r, ri) => `<tr>${r.map((cl) => `<${ri === 0 ? "th" : "td"}>${esc(cl)}</${ri === 0 ? "th" : "td"}>`).join("")}</tr>`).join("")}</table>`); tbl = null; } };
  for (const ln of md.split("\n")) { if (/^\s*\|.*\|\s*$/.test(ln)) { const cells = ln.trim().replace(/^\||\|$/g, "").split("|").map((s) => s.trim()); if (cells.every((cl) => /^:?-+:?$/.test(cl))) continue; (tbl || (tbl = [])).push(cells); } else { flush(); if (ln.trim()) out.push(`<p>${esc(ln)}</p>`); } }
  flush(); return out.join("");
}
const dirBadge = (d) => d === "wte" ? `<span class="dir wte">WAR&rarr;ENG</span>` : d === "etw" ? `<span class="dir etw">ENG&rarr;WAR</span>` : "";
const verd = (v) => v === true ? `<span class="v ok" title="Verbatim in the book">&#10003; in book</span>` : v === false ? `<span class="v syn" title="Not verbatim — a substitution rendering or possible hallucination; check the scan/OCR on the left">&#9998; synth</span>` : "";
function itemHtml(i) {
  if (i.choices) { const opts = [{ t: i.en, ans: true }, ...i.choices.map((cl) => ({ t: cl, ans: false }))]; return `<div class="it mc">${dirBadge(i.dir)}<span class="war">${esc(i.waray)}</span><div class="choices">${opts.map((o) => `<span class="ch${o.ans ? " ans" : ""}">${esc(o.t)}</span>`).join("")}</div></div>`; }
  return `<div class="it${i.verbatim === false ? " flag" : ""}">${dirBadge(i.dir)}<span class="war">${esc(i.waray)}</span><span class="dash">&mdash;</span><span class="en">${esc(i.en)}</span>${verd(i.verbatim)}</div>`;
}
function blockHtml(b) {
  const c = BLK[b.type] || "#8aa"; let head = "", body = "";
  if (b.type === "grammar" || b.type === "note") { head = `${b.type}${b.title ? " · " + esc(b.title) : ""}`; body = renderMd(b.prose) + (b.formula ? `<div class="formula">${esc(b.formula)}</div>` : "") + b.items.map(itemHtml).join(""); }
  else if (b.type === "vocab") { head = `Vocabulary · ${b.items.length} word${b.items.length !== 1 ? "s" : ""}`; body = b.items.map((i) => `<div class="it"><span class="war">${esc(i.waray)}</span><span class="dash">&mdash;</span><span class="en">${esc(i.en)}</span></div>`).join(""); }
  else if (b.type === "drill") { head = `Drill · ${b.dirLabel || ""}${b.mc ? " · multiple choice" : ""}`; body = b.items.map(itemHtml).join(""); }
  else if (b.type === "assessment") { head = `&#128274; ${esc(b.title || "Exam")} · ${b.dirLabel || "both ways"}`; body = b.items.map(itemHtml).join(""); }
  else { head = b.type; body = b.items.map(itemHtml).join(""); }
  return `<div class="blk" style="border-color:${c}"><div class="bh" style="color:${c}">${head}</div>${body}</div>`;
}
const pagesBlock = (pgs) => !pgs.length ? "" : `<details class="pages"><summary>&#128196; Scanned page${pgs.length > 1 ? "s" : ""}: ${pgs.join(", ")}</summary><div class="pageimgs">${pgs.map((n) => PAGES[n] ? `<figure><img loading="lazy" src="${PAGES[n]}" alt="page ${n}"><figcaption>p. ${n}</figcaption></figure>` : `<div class="nopg">p.${n} &mdash; no scan</div>`).join("")}</div></details>`;

const byNum = {}; for (const L of data) (byNum[L.num] || (byNum[L.num] = [])).push(L);
const nums = Object.keys(byNum).map(Number).sort((a, b) => a - b);
const nav = nums.map((n) => `<a href="#L${n}">${n}</a>`).join("");
const sections = nums.map((n) => {
  const grp = byNum[n]; const ocrTxt = grp.find((g) => g.ocr)?.ocr || "(no OCR captured)";
  const pgs = [...new Set(grp.flatMap((g) => g.pages))].sort((a, b) => a - b);
  const right = grp.map((L) => `<div class="clesson"><div class="clh">${esc(L.title)}</div>${L.blocks.map(blockHtml).join("")}</div>`).join("");
  return `<section id="L${n}"><div class="lnum">Lesson ${n}<span class="ph">${esc(grp[0].phase)}</span></div><div class="cols"><div class="pane book"><div class="ph-h">&#128214; Book &mdash; scan &amp; OCR</div>${pagesBlock(pgs)}<pre>${esc(ocrTxt)}</pre></div><div class="pane course"><div class="ph-h">&#128241; Course preview</div>${right}</div></div></section>`;
}).join("");

const html = `<div class="wrap"><header>
  <h1>Peace Corps Waray — Course vs. Book</h1>
  <p class="sub">Book scan + OCR on the left (open <b>&#128196; Scanned pages</b> to see the raw PDF); the app's course preview on the right. Every drill/exam item shows its <b>direction</b>; multiple-choice drills show all <b>4 options</b> (correct one in green); each sentence is tagged <span class="v ok">&#10003; in book</span> (verbatim) or <span class="v syn">&#9998; synth</span> (a rendering to verify — fabrications hide here).</p>
  <div class="legend"><span class="dir wte">WAR&rarr;ENG</span> shown Waray, answer English <span class="dir etw">ENG&rarr;WAR</span> shown English, answer Waray <span class="chleg"><span class="ch ans">green</span>=correct MC option</span><span class="stat">${stats.sentTotal - stats.synth} verbatim · ${stats.synth} synth of ${stats.sentTotal}</span></div>
  <nav>Lesson: ${nav}</nav></header>${sections}</div>`;

const CSS = `
:root{--tide:#1cb0b8;--sea:#5fc9cf;--sun:#f4a53a;--coral:#f07a66;--jade:#3fae6a;--shell:#0b1f23;--sand:#16333a;--sand-deep:#2b4f56;--ink:#eaf3f2;--ink-soft:#9db3b5;--foam:#102a2f;}
*{box-sizing:border-box}body{margin:0}
.wrap{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:radial-gradient(135% 80% at 50% -8%,#123a3f 0%,var(--shell) 52%);min-height:100vh;padding-bottom:60px}
header{position:sticky;top:0;z-index:20;background:rgba(9,24,28,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--sand-deep);padding:14px 20px}
h1{margin:0 0 4px;font-size:19px;letter-spacing:-.01em}
.sub{margin:0 0 8px;font-size:12.5px;line-height:1.5;color:var(--ink-soft);max-width:900px}.sub b{color:var(--ink)}
.legend{display:flex;flex-wrap:wrap;gap:12px;align-items:center;font-size:11.5px;color:var(--ink-soft);margin-bottom:8px}
.stat{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--sea);font-weight:600}
nav{display:flex;flex-wrap:wrap;gap:4px}
nav a{font-size:12px;font-weight:700;color:var(--ink-soft);text-decoration:none;padding:3px 9px;border:1px solid var(--sand-deep);border-radius:8px;background:var(--foam);font-variant-numeric:tabular-nums}
nav a:hover{color:var(--ink);border-color:var(--tide)}
section{padding:6px 20px 0}
.lnum{position:sticky;top:118px;z-index:10;display:flex;align-items:baseline;gap:12px;font-size:20px;font-weight:800;letter-spacing:-.01em;margin:22px 0 8px;padding:6px 0;color:var(--sea)}
.ph{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-soft)}
.cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:16px;align-items:start}
@media(max-width:900px){.cols{grid-template-columns:1fr}}
.pane{border:1px solid var(--sand-deep);border-radius:14px;background:var(--foam);overflow:hidden}
.ph-h{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-soft);padding:9px 13px;background:var(--sand);border-bottom:1px solid var(--sand-deep);position:sticky;top:0}
.book pre{margin:0;padding:12px 14px;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;line-height:1.55;color:#cfe0df;white-space:pre-wrap;word-break:break-word;max-height:78vh;overflow:auto}
.course{padding:0 0 6px}
.clesson{padding:8px 14px 2px}
.clh{font-size:13px;font-weight:800;color:var(--sun);margin:8px 0 4px}
.blk{border-left:3px solid;padding:5px 0 5px 11px;margin:8px 0}
.bh{font-size:10px;text-transform:uppercase;letter-spacing:.06em;font-weight:800;margin-bottom:5px}
.blk p{margin:3px 0;font-size:13px;line-height:1.5;color:var(--ink)}
table.md{border-collapse:collapse;margin:6px 0;font-size:12px}
table.md th,table.md td{border:1px solid var(--sand-deep);padding:3px 8px;text-align:left;color:var(--ink)}
table.md th{background:var(--sand);font-weight:700}
.formula{font-family:ui-monospace,Menlo,monospace;font-size:12px;background:var(--sand);border:1px solid var(--sand-deep);border-radius:6px;padding:5px 8px;margin:5px 0;color:var(--sea)}
.it{display:flex;gap:7px;align-items:baseline;flex-wrap:wrap;padding:3px 0;border-bottom:1px dotted #24454b}
.it .war{font-family:Georgia,serif;font-size:14.5px;font-weight:600}
.it .dash{color:var(--ink-soft)}
.it .en{color:var(--ink-soft);font-size:12.5px}
.it.flag{background:rgba(244,165,58,.06);border-radius:6px;padding:3px 6px;margin:1px -6px}
.dir{font-size:9.5px;font-weight:800;letter-spacing:.04em;padding:1px 6px;border-radius:6px;font-variant-numeric:tabular-nums;white-space:nowrap;flex:0 0 auto}
.dir.wte{background:rgba(28,176,184,.18);color:var(--sea);border:1px solid rgba(28,176,184,.4)}
.dir.etw{background:rgba(244,165,58,.16);color:var(--sun);border:1px solid rgba(244,165,58,.4)}
.v{font-size:9.5px;font-weight:700;padding:0 5px;border-radius:5px;white-space:nowrap;margin-left:auto}
.v.ok{color:var(--jade)}.v.syn{color:var(--sun)}
.it.mc{flex-direction:column;align-items:flex-start;gap:5px;background:rgba(197,138,42,.05);border-radius:8px;padding:7px 9px;margin:4px 0;border-bottom:none}
.it.mc .war{font-size:15px}
.choices{display:flex;flex-wrap:wrap;gap:6px}
.ch{font-size:12px;color:var(--ink-soft);background:var(--sand);border:1px solid var(--sand-deep);border-radius:8px;padding:3px 9px}
.ch.ans{color:#0b1f23;background:var(--jade);border-color:var(--jade);font-weight:700}
.chleg{display:inline-flex;align-items:center;gap:5px}.chleg .ch.ans{font-size:10px;padding:1px 6px}
details.pages{margin:10px 12px 4px;border:1px solid var(--sand-deep);border-radius:10px;background:var(--sand);overflow:hidden}
details.pages summary{cursor:pointer;padding:8px 12px;font-size:12px;font-weight:700;color:var(--sea);user-select:none}
details.pages summary:hover{color:var(--ink)}
.pageimgs{display:flex;flex-wrap:wrap;gap:10px;padding:10px 12px;background:var(--foam)}
.pageimgs figure{margin:0;flex:1 1 260px;max-width:340px}
.pageimgs img{width:100%;border:1px solid var(--sand-deep);border-radius:6px;display:block;background:#fff}
.pageimgs figcaption{font-size:10.5px;color:var(--ink-soft);text-align:center;padding-top:3px;font-variant-numeric:tabular-nums}
.nopg{font-size:11px;color:var(--ink-soft);padding:20px;border:1px dashed var(--sand-deep);border-radius:6px}
`;

fs.writeFileSync(OUT, `<style>${CSS}</style>\n${html}`);
console.log(`✓ ${OUT} — ${nums.length} lessons · ${stats.mc} MC items · ${stats.sentTotal - stats.synth} verbatim / ${stats.synth} synth · ${(fs.statSync(OUT).size / 1048576).toFixed(1)}MB`);
