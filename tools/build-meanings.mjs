/* Reconcile the live course dictionary against the authoritative Tramp dictionary (tramp.json) with a
   3-tier matcher, and PROPOSE the meanings-table / variants / review-queue changes. Dry run by default
   (writes scratchpad/meanings-proposal.json + prints a report); no DB writes.
   Run: node tools/build-meanings.mjs */
import fs from "fs";
import pg from "/Users/paulkilroy/dev/Sulog/node_modules/pg/lib/index.js";
const SP = process.env.TMPDIR || "/tmp";   // reconciliation report (ephemeral, not a source)
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
if (process.env.SULOG_SEARCH_PATH) await c.query(`set search_path to ${process.env.SULOG_SEARCH_PATH}`); // rebuild-check points tools at the scratch schema
const dict = (await c.query("select waray,meaning,confirmed,kind,pos from dictionary order by waray")).rows;
// attach where each word comes from (which courses drill it) so the review page can show provenance
const courseOf = new Map((await c.query("select waray, courses from word_usage")).rows.map((r) => [r.waray, r.courses || []]));
for (const d of dict) d.courses = courseOf.get(d.waray) || [];

// grammar/function words live in the PDF front matter, not the A-Z body — they're KNOWN, not gaps.
const FUNC_POS = new Set(["pron", "marker", "dem", "conj", "linker", "num", "det", "prep"]);
const KNOWN_FN = new Set(["ako", "ikaw", "ka", "hiya", "kita", "kami", "kamo", "hira", "akon", "imo", "iya", "amon", "aton", "iyo", "nira", "ko", "mo", "niya", "namon", "naton", "niyo", "ini", "iton", "ito", "adi", "adto", "aadi", "aada", "hini", "hito", "hadi", "hadto", "dinhi", "didto", "ngadi", "ngadto", "an", "in", "hin", "han", "si", "ni", "kan", "hi", "nga", "ngan", "mga", "ha"]);
const isFunc = (d) => FUNC_POS.has(d.pos) || KNOWN_FN.has(nf(d.waray));

// a tier-3 candidate only counts if it STRICTLY means the same: every content word of our meaning
// appears in the candidate's gloss (kills "akon=my → klub=club" style noise).
const strictSame = (e, meaning) => { const mt = contentWords(meaning); if (!mt.length) return false; const gt = new Set(contentWords(e.gloss)); return mt.every((w) => gt.has(w)); };
const isProper = (w, m) => /^[A-Z]/.test(w) && /^[A-Z]/.test(m || "");   // month/day/place names — loans, not in Tramp body

const out = { agree: [], diverge: [], variant: [], nativeAlt: [], gap: [], phrase: [], grammar: [] };
for (const d of dict) {
  // classify on the PRIMARY sense only: a live card may carry merged "/" senses that a
  // fresh build doesn't have yet — classification must agree in both worlds (rebuild-check)
  const m0 = (d.meaning || "").split("/")[0].trim();
  if (d.kind === "phrase" || /\s/.test(d.waray)) { out.phrase.push(d); continue; }   // phrases aren't single-word lookups
  if (isFunc(d)) { out.grammar.push(d); continue; }                                    // pronouns/markers — known, front matter
  const t1 = byHead.get(nf(d.waray));
  if (t1) { (glossHas(t1, m0) ? out.agree : out.diverge).push({ ...d, tramp: t1[0].gloss }); continue; }
  const t2 = tier2(d.waray);
  if (t2) { (glossHas(t2.entries, m0) ? out.agree : out.diverge).push({ ...d, via: t2.root, tramp: t2.entries[0].gloss }); continue; }
  const t3 = tier3(d.waray, m0).filter((x) => strictSame(x.e, m0));   // only same-meaning candidates
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

// ---- --apply: populate the meanings table (course words = source of truth) ----
if (process.argv.includes("--apply")) {
  const qy = async (s, p) => (await c.query(s, p)).rows;
  // words in gloss-overrides.json own their sense rows (per-sense truth, incl. stress) —
  // inserting the raw card string here would add a near-duplicate sense ("we, inclusive"
  // next to the override's "we (inclusive)"). Confirm/variants still apply below.
  const OVERRIDE_WORDS = new Set(Object.keys(JSON.parse(fs.readFileSync("docs/dictionary/gloss-overrides.json", "utf8"))).filter((k) => !k.startsWith("_")));
  // a word's own meaning is auto-confirmed when Tramp agrees, it's a spelling variant, or it's a
  // known grammar word (pronoun/marker). Diverge / native-alt / gap keep their existing confirmed flag.
  const autoConfirm = new Set([...out.agree, ...out.variant, ...out.grammar].map((x) => x.waray));
  const trampAgrees = new Set([...out.agree, ...out.variant].map((x) => x.waray));
  // who asserts a sense = the courses that drill the word (word_usage) + 'tramp' when it agreed
  const courses = new Map((await qy("select waray, courses from word_usage")).map((r) => [r.waray, r.courses || []]));
  await qy("begin");
  for (const d of dict) {
    const conf = autoConfirm.has(d.waray) || d.confirmed;
    const sources = [...new Set([...(courses.get(d.waray) || []), ...(trampAgrees.has(d.waray) ? ["tramp"] : [])])];
    if (OVERRIDE_WORDS.has(d.waray)) {
      if (autoConfirm.has(d.waray) && !d.confirmed)
        await qy("update dictionary set confirmed=true, confirmed_by=coalesce(confirmed_by,$2) where waray=$1 and (not confirmed or confirmed_by is null)",
          [d.waray, trampAgrees.has(d.waray) ? "tramp" : "book"]);
      continue;
    }
    await qy(`insert into meanings (waray,meaning,pos,sources,confirmed,ord) values ($1,$2,$3,$4,$5,1)
              on conflict (waray,meaning) do update set confirmed = meanings.confirmed or excluded.confirmed,
                sources = (select array(select distinct unnest(meanings.sources || excluded.sources))), pos = coalesce(meanings.pos, excluded.pos)`,
      [d.waray, d.meaning, d.pos, sources, conf]);
    if (autoConfirm.has(d.waray))
      await qy("update dictionary set confirmed=true, confirmed_by=coalesce(confirmed_by,$2) where waray=$1 and (not confirmed or confirmed_by is null)",
        [d.waray, trampAgrees.has(d.waray) ? "tramp" : "book"]);   // grammar words = the book's front matter; never overwrite an existing stamp (ella wins)
  }
  for (const v of out.variant) await qy("update dictionary set variants=(select array(select distinct unnest(variants || $2::text[]) order by 1)) where waray=$1", [v.waray, [v.suggest]]);
  await qy("commit");
  const stats = (await qy("select count(*) n, count(*) filter (where confirmed) c from meanings"))[0];
  console.log(`\n✓ meanings populated — ${stats.n} sense rows, ${stats.c} confirmed`);
}
await c.end();
