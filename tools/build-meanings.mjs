/* Reconcile the live course dictionary against the authoritative Tramp dictionary (tramp.json) with a
   3-tier matcher, and PROPOSE the meanings-table / variants / review-queue changes. Dry run by default
   (writes scratchpad/meanings-proposal.json + prints a report); no DB writes.
   Run: node tools/build-meanings.mjs */
import fs from "fs";
import pg from "/Users/paulkilroy/dev/Sulog/node_modules/pg/lib/index.js";
const SP = "/private/tmp/claude-501/-Users-paulkilroy-dev-Sulog/2ec9156d-452e-4eed-b759-f98650a29e43/scratchpad";
const nf = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
const STOP = new Set(["to", "a", "an", "the", "of", "or", "be", "is", "his", "her", "male", "female", "sg", "pl", "also", "any", "person", "general", "term", "one", "s", "sd", "sp", "fig"]);
const contentWords = (m) => (m || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w));
// Levenshtein (small, for spelling-variant closeness)
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };

// ---- load Tramp + build indexes ----
const tramp = JSON.parse(fs.readFileSync("docs/sources/dictionaries/tramp.json", "utf8")).entries;
const byHead = new Map();                       // norm headword -> [entries]
const inv = new Map();                          // gloss content-word -> Set(entryIdx)  (tier 3)
tramp.forEach((e, i) => {
  const k = nf(e.waray); if (!byHead.has(k)) byHead.set(k, []); byHead.get(k).push(e);
  for (const w of contentWords(e.gloss)) { if (!inv.has(w)) inv.set(w, new Set()); inv.get(w).add(i); }
});
const headSet = new Set(byHead.keys());

const PRE = ["nagka", "nakaka", "nagpa", "napa", "mapa", "naka", "naki", "nag", "mag", "nan", "man", "gin", "hin", "hi", "ha", "ka", "ki", "ma", "na", "pa", "in"];
function tier2(w) {                             // strip a prefix / suffix to reach a root that IS a headword
  let r = nf(w);
  for (const p of PRE) if (r.startsWith(p) && r.length - p.length >= 3 && headSet.has(r.slice(p.length))) return { root: r.slice(p.length), entries: byHead.get(r.slice(p.length)) };
  for (const s of ["on", "an", "i", "a"]) if (r.endsWith(s) && r.length - s.length >= 3 && headSet.has(r.slice(0, -s.length))) return { root: r.slice(0, -s.length), entries: byHead.get(r.slice(0, -s.length)) };
  return null;
}
function tier3(w, meaning) {                     // reverse-gloss: Tramp words whose gloss means the same
  const keys = contentWords(meaning); if (!keys.length) return [];
  const cand = new Map();
  for (const kw of keys) for (const idx of (inv.get(kw) || [])) cand.set(idx, (cand.get(idx) || 0) + 1);
  return [...cand].map(([idx, hits]) => ({ e: tramp[idx], hits, dist: lev(nf(w), nf(tramp[idx].waray)) }))
    .sort((a, b) => b.hits - a.hits || a.dist - b.dist).slice(0, 5);
}
const glossHas = (entries, meaning) => { const mt = new Set(contentWords(meaning)); return entries.some((e) => contentWords(e.gloss).some((w) => mt.has(w))); };

// ---- run over the live dictionary ----
if (!process.env.SUPABASE_DB_URL) { console.error("Set SUPABASE_DB_URL (the postgres connection string) in your environment first."); process.exit(1); }
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const dict = (await c.query("select waray,meaning,confirmed,kind,pos from dictionary order by waray")).rows;
await c.end();

// grammar/function words live in the PDF front matter, not the A-Z body — they're KNOWN, not gaps.
const FUNC_POS = new Set(["pron", "marker", "dem", "conj", "linker", "num", "det", "prep"]);
const KNOWN_FN = new Set(["ako", "ikaw", "ka", "hiya", "kita", "kami", "kamo", "hira", "akon", "imo", "iya", "amon", "aton", "iyo", "nira", "ko", "mo", "niya", "namon", "naton", "niyo", "ini", "iton", "ito", "adi", "adto", "aadi", "aada", "hini", "hito", "hadi", "hadto", "dinhi", "didto", "ngadi", "ngadto", "an", "in", "hin", "han", "si", "ni", "kan", "hi", "nga", "ngan", "mga"]);
const isFunc = (d) => FUNC_POS.has(d.pos) || KNOWN_FN.has(nf(d.waray));

// a tier-3 candidate only counts if it STRICTLY means the same: every content word of our meaning
// appears in the candidate's gloss (kills "akon=my → klub=club" style noise).
const strictSame = (e, meaning) => { const mt = contentWords(meaning); if (!mt.length) return false; const gt = new Set(contentWords(e.gloss)); return mt.every((w) => gt.has(w)); };
const isProper = (w, m) => /^[A-Z]/.test(w) && /^[A-Z]/.test(m || "");   // month/day/place names — loans, not in Tramp body

const out = { agree: [], diverge: [], variant: [], nativeAlt: [], gap: [], phrase: [], grammar: [] };
for (const d of dict) {
  if (d.kind === "phrase" || /\s/.test(d.waray)) { out.phrase.push(d); continue; }   // phrases aren't single-word lookups
  if (isFunc(d)) { out.grammar.push(d); continue; }                                    // pronouns/markers — known, front matter
  const t1 = byHead.get(nf(d.waray));
  if (t1) { (glossHas(t1, d.meaning) ? out.agree : out.diverge).push({ ...d, tramp: t1[0].gloss }); continue; }
  const t2 = tier2(d.waray);
  if (t2) { (glossHas(t2.entries, d.meaning) ? out.agree : out.diverge).push({ ...d, via: t2.root, tramp: t2.entries[0].gloss }); continue; }
  const t3 = tier3(d.waray, d.meaning).filter((x) => strictSame(x.e, d.meaning));   // only same-meaning candidates
  const variant = t3.find((x) => x.dist <= 2 && Math.min(nf(d.waray).length, nf(x.e.waray).length) >= 4);
  if (variant) out.variant.push({ ...d, suggest: variant.e.waray, dist: variant.dist, tramp: variant.e.gloss });
  else if (t3.length && !isProper(d.waray, d.meaning)) out.nativeAlt.push({ ...d, suggest: t3[0].e.waray, tramp: t3[0].e.gloss });
  else out.gap.push(d);
}
fs.writeFileSync(`${SP}/meanings-proposal.json`, JSON.stringify(out, null, 1));
const n = dict.length, pct = (x) => `${x} (${Math.round(x / n * 100)}%)`;
console.log(`=== 3-tier reconciliation of ${n} course words vs Tramp ===\n`);
console.log(`  ✓ AGREE  (word found, gloss matches)        ${pct(out.agree.length)}   → confirm meaning`);
console.log(`  ⚠ DIVERGE (word found, gloss differs)       ${pct(out.diverge.length)}   → review (homograph / our gloss)`);
console.log(`  ✎ VARIANT (spelling variant, same meaning)  ${pct(out.variant.length)}   → variants[] + suggest`);
console.log(`  ↔ NATIVE-ALT (diff word, same meaning)      ${pct(out.nativeAlt.length)}   → suggest to Ella`);
console.log(`  ✗ GAP    (nothing found)                    ${pct(out.gap.length)}   → review`);
console.log(`  ⋯ PHRASE (multi-word, skipped)              ${pct(out.phrase.length)}`);
console.log(`  ⋯ GRAMMAR (pronoun/marker, known)           ${pct(out.grammar.length)}`);
const show = (a, k) => a.slice(0, 8).map((x) => `${x.waray}=${(x.meaning || "").slice(0, 18)}${x[k] ? ` [→${x[k]}]` : ""}`).join("  ·  ");
console.log(`\n  variants:   ${show(out.variant, "suggest")}`);
console.log(`\n  native-alt: ${show(out.nativeAlt, "suggest")}`);
console.log(`\n  gaps:       ${out.gap.slice(0, 16).map((x) => x.waray).join(", ")}`);
