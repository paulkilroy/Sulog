/* Normalize + dedupe the dictionary: canonical headword = lowercase, accents stripped (Waray isn't
   typed with accents). Merge case/accent twins (Tátay/tatay, sinehán/sinehan) into one row, re-point
   every FK (block_items, lesson_blocks.about, expressions.focus, progress), delete the losers, and
   EXPORT the accented forms to scratchpad/accent-map.json for the pronunciation guide.
   Dry run by default (prints a plan); pass --apply to write. Needs SUPABASE_DB_URL. */
import fs from "fs";
import pg from "/Users/paulkilroy/dev/Sulog/node_modules/pg/lib/index.js";
const SP = "/private/tmp/claude-501/-Users-paulkilroy-dev-Sulog/2ec9156d-452e-4eed-b759-f98650a29e43/scratchpad";
const APPLY = process.argv.includes("--apply");
const canon = (s) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^[^a-z0-9]+/, "").replace(/[^a-z0-9]+$/, "");  // + strip leading/trailing punctuation (klaro? → klaro)
if (!process.env.SUPABASE_DB_URL) { console.error("Set SUPABASE_DB_URL first."); process.exit(1); }
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = async (s, p) => (await c.query(s, p)).rows;

const dict = await q("select waray,meaning,pos,pronunciation,confirmed,kind from dictionary");
const refCount = new Map();  // waray -> # block_items referencing it (to pick the survivor)
for (const r of await q("select dict_waray w, count(*) n from block_items where dict_waray is not null group by dict_waray")) refCount.set(r.w, +r.n);

// group by canonical form
const groups = new Map();
for (const d of dict) { const k = canon(d.waray); if (!k) continue; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(d); }

const accentMap = {};      // canonical -> [accented original forms]
const plan = { renames: [], merges: [], untouched: 0 };
for (const [k, members] of groups) {
  const accented = [...new Set(members.map((m) => m.waray).filter((w) => w !== k))];
  if (accented.length) accentMap[k] = accented;
  if (members.length === 1 && members[0].waray === k) { plan.untouched++; continue; }
  // survivor data: prefer a confirmed member, then the most-referenced, then first
  const survivor = members.slice().sort((a, b) => (b.confirmed - a.confirmed) || ((refCount.get(b.waray) || 0) - (refCount.get(a.waray) || 0)))[0];
  const losers = members.filter((m) => m.waray !== k);
  (members.length > 1 ? plan.merges : plan.renames).push({ k, from: members.map((m) => m.waray), survivor: survivor.waray, meaning: survivor.meaning, confirmed: members.some((m) => m.confirmed) });
}
fs.writeFileSync(`${SP}/accent-map.json`, JSON.stringify(accentMap, null, 0));

console.log(`=== dedup plan — ${dict.length} rows → ${groups.size} canonical words ===`);
console.log(`  untouched (already canonical):  ${plan.untouched}`);
console.log(`  rename (case/accent, no twin):  ${plan.renames.length}`);
console.log(`  merge (2+ rows → 1):            ${plan.merges.length}`);
console.log(`  accent forms saved for pronunciation: ${Object.keys(accentMap).length} words → accent-map.json`);
console.log(`\n  sample renames:`, plan.renames.slice(0, 8).map((r) => `${r.from[0]}→${r.k}`).join("  "));
console.log(`  sample merges: `, plan.merges.slice(0, 8).map((r) => `[${r.from.join("/")}]→${r.k}`).join("  "));

if (!APPLY) { console.log("\n(dry run — pass --apply to execute)"); await c.end(); process.exit(0); }

// ---- APPLY, in one transaction ----
const repoint = async (from, to) => {
  await q("update block_items   set dict_waray=$2 where dict_waray=$1", [from, to]);
  await q("update lesson_blocks set about=$2      where about=$1", [from, to]);
  await q("update expressions    set focus=$2      where focus=$1", [from, to]);
  await q("delete from progress where waray=$1 and user_id in (select user_id from progress where waray=$2)", [from, to]); // avoid PK collision
  await q("update progress       set waray=$2      where waray=$1", [from, to]);
};
try {
  await q("begin");
  for (const [k, members] of groups) {
    if (members.length === 1 && members[0].waray === k) continue;
    const survivor = members.slice().sort((a, b) => (b.confirmed - a.confirmed) || ((refCount.get(b.waray) || 0) - (refCount.get(a.waray) || 0)))[0];
    // ensure the canonical row exists
    if (!members.some((m) => m.waray === k)) {
      await q("insert into dictionary (waray,kind,meaning,pos,pronunciation,confirmed) values ($1,$2,$3,$4,$5,$6) on conflict (waray) do nothing",
        [k, survivor.kind || "word", survivor.meaning, survivor.pos, survivor.pronunciation, members.some((m) => m.confirmed)]);
    }
    for (const m of members) if (m.waray !== k) { await repoint(m.waray, k); await q("delete from dictionary where waray=$1", [m.waray]); }
    // fold survivor data + preserve accented spellings as variants
    await q("update dictionary set meaning=$2, pos=coalesce(pos,$3), confirmed=confirmed or $4, variants=(select array(select distinct unnest(variants || $5::text[]))) where waray=$1",
      [k, survivor.meaning, survivor.pos, members.some((m) => m.confirmed), accentMap[k] || []]);
  }
  await q("commit");
  const after = (await q("select count(*) n from dictionary"))[0].n;
  const dangling = (await q("select count(*) n from block_items bi where dict_waray is not null and not exists (select 1 from dictionary d where d.waray=bi.dict_waray)"))[0].n;
  console.log(`\n✓ applied — dictionary now ${after} rows · dangling block refs: ${dangling}`);
} catch (e) { await q("rollback"); console.error("✗ rolled back:", e.message); }
await c.end();
