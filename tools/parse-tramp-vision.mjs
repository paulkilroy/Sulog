/* Parse the Vision-OCR'd Tramp & Zorc Waray→English dictionary (NDJSON: one {page,lines} per line,
   from scratchpad/pdf-ocr-range.swift) into a clean lookup. Vision preserves accents, so headwords
   that differ only by stress (bilad / bílad / bilád) stay distinct. One row per SENSE.
   Output: docs/sources/dictionaries/tramp.json
   Run: node tools/parse-tramp-vision.mjs [path-to-ndjson] */
import fs from "fs";
const SRC = process.argv[2] || "docs/sources/dictionaries/tramp-ocr.ndjson";
const OUT = "/Users/paulkilroy/dev/Sulog/docs/sources/dictionaries/tramp.json";

// A headword line: "word, pos. definition" — pos may be compound (v.f.l.pass., nom.pron., v.stat.)
const ENTRY = /^([A-Za-zÀ-ÿ'’-]{1,30}),\s*([a-z][a-z.]{0,14}\.)\s+(.+)$/;
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’`]/g, "'").trim();
const cleanGloss = (g) => g.replace(/\s+/g, " ").replace(/^\(([^)]*)\)\s*/, "").replace(/\s*[,;]\s*$/, "").trim();

// pull ordered entries out of one page's OCR lines (single column; split defensively if a 2nd column exists)
function pageEntries(lines) {
  const col = (ls) => {
    const sorted = ls.map((l) => ({ x: l.x, y: 1 - l.y - l.h, t: (l.t || "").trim() })).sort((a, b) => a.y - b.y || a.x - b.x);
    const ents = []; let cur = null;
    for (const l of sorted) {
      if (!l.t || /^\d+$/.test(l.t) || /^[A-Z]$/.test(l.t)) continue;   // page #, section letter
      const m = l.t.match(ENTRY);
      if (m) { if (cur) ents.push(cur); cur = { head: m[1], pos: m[2].replace(/\.$/, ""), gloss: m[3] }; }
      else if (cur && /^[a-zà-ÿ(]/.test(l.t)) cur.gloss += " " + l.t;   // wrapped continuation
      else if (cur) { ents.push(cur); cur = null; }
    }
    if (cur) ents.push(cur);
    return ents;
  };
  const left = lines.filter((l) => l.x < 0.45), right = lines.filter((l) => l.x >= 0.45);
  return [...col(left), ...(right.length > 5 ? col(right) : [])];
}

const rows = [];
let pages = 0;
for (const line of fs.readFileSync(SRC, "utf8").split("\n")) {
  if (!line.trim()) continue;
  let pg; try { pg = JSON.parse(line); } catch { continue; }
  pages++;
  for (const e of pageEntries(pg.lines || [])) {
    const gloss = cleanGloss(e.gloss);
    if (!gloss || gloss.length < 2) continue;
    rows.push({ waray: e.head.replace(/^['-]+|['-]+$/g, ""), norm: norm(e.head), pos: e.pos, gloss, page: pg.page });
  }
}
// dedupe exact (waray,pos,gloss) repeats
const seen = new Set(), entries = [];
for (const r of rows) { const k = r.waray + "|" + r.pos + "|" + r.gloss; if (!seen.has(k)) { seen.add(k); entries.push(r); } }

const uniqW = new Set(entries.map((e) => e.norm)).size;
fs.writeFileSync(OUT, JSON.stringify({ meta: { source: "Tramp & Zorc Waray-English Dictionary (1991), Vision OCR", pages, entries: entries.length, headwords: uniqW }, entries }, null, 0));
console.log(`✓ tramp.json — ${pages} pages · ${entries.length} senses · ${uniqW} distinct headwords`);
console.log("sample:", entries.slice(0, 5).map((e) => `${e.waray}(${e.pos})=${e.gloss.slice(0, 30)}`).join(" | "));
