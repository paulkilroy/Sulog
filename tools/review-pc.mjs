/* Offline review of the generated Peace Corps course: parse docs/schema/pc-course.sql and print each
   lesson's block structure (paradigm words, drills, review) — no DB needed. Run: node tools/review-pc.mjs */
import fs from "fs";
const sql = fs.readFileSync("/Users/paulkilroy/dev/Sulog/docs/schema/pc-course.sql", "utf8");

// split a "( … ), ( … )" values body into tuples, then into fields — respecting '' escapes
const splitTop = (body) => { const out = []; let d = 0, cur = "", str = false; for (let i = 0; i < body.length; i++) { const ch = body[i]; if (str) { cur += ch; if (ch === "'") { if (body[i + 1] === "'") cur += body[++i]; else str = false; } continue; } if (ch === "'") { str = true; cur += ch; continue; } if (ch === "(") { if (d++ === 0) cur = ""; continue; } if (ch === ")") { if (--d === 0) out.push(cur); continue; } if (d) cur += ch; } return out; };
const fields = (s) => { const out = []; let cur = "", str = false; for (let i = 0; i < s.length; i++) { const ch = s[i]; if (str) { cur += ch; if (ch === "'") { if (s[i + 1] === "'") cur += s[++i]; else str = false; } continue; } if (ch === "'") { str = true; cur += ch; continue; } if (ch === ",") { out.push(cur.trim()); cur = ""; continue; } cur += ch; } out.push(cur.trim()); return out; };
const uq = (s) => s == null || s === "null" ? null : /^'[\s\S]*'$/.test(s) ? s.slice(1, -1).replace(/''/g, "'") : s;
// body = from after this insert's `values` to the next `insert into` (or EOF); splitTop pulls the
// top-level (…) tuples and is quote-aware, so prose semicolons and the on-conflict clause don't matter.
const rows = (table) => {
  const start = sql.search(new RegExp("insert into " + table + "\\b"));
  if (start < 0) return [];
  const vi = sql.indexOf("values", start), next = sql.indexOf("insert into ", vi + 1);
  const body = sql.slice(vi + 6, next < 0 ? sql.length : next);
  return splitTop(body).map(fields).filter((f) => f.length >= 3);   // drop on-conflict "(waray)"/"(id)" artifacts
};

const dict = {}; for (const f of rows("dictionary")) dict[uq(f[0])] = { meaning: uq(f[2]), pos: uq(f[3]) };
const lessons = {}; for (const f of rows("lessons")) lessons[uq(f[0])] = uq(f[3]);
const blocks = {}; for (const f of rows("lesson_blocks")) blocks[uq(f[0])] = { lesson: uq(f[1]), ord: +uq(f[2]), type: uq(f[3]), title: uq(f[4]), dkind: uq(f[7]), dmod: uq(f[8]) };
const items = {}; for (const f of rows("block_items")) (items[uq(f[0])] = items[uq(f[0])] || []).push({ dict: uq(f[2]), role: uq(f[4]) });

const byLesson = {}; for (const id in blocks) (byLesson[blocks[id].lesson] = byLesson[blocks[id].lesson] || []).push({ ...blocks[id], id, items: items[id] || [] });
for (const les of Object.keys(byLesson).sort()) {
  console.log(`\n══ ${les} · ${lessons[les] || ""} ══`);
  for (const b of byLesson[les].sort((a, b) => a.ord - b.ord)) {
    const tag = b.type + (b.dkind ? `/${b.dkind}·${b.dmod}` : "") + (b.title ? ` — ${b.title}` : "");
    const words = b.items.filter((i) => i.dict).map((i) => i.dict);
    const detail = (b.type === "vocab" || b.type === "note") && words.length ? `  { ${words.join(", ")} }` : `  [${b.items.length}]`;
    console.log(`  ${String(b.ord).padStart(2)}. ${tag}${detail}`);
  }
}
