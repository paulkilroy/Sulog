/* Fill the pronunciation guide (dictionary.pronunciation, e.g. "mah-OO-pigh") for words that lack
   one, reusing the transliterator from build-respellings.mjs and taking STRESS from the accented
   form we captured during dedup (variants[] / Tramp). Multi-word entries are COMPOSED from per-word guides (existing guide, else transliterated with Tramp stress).
   Preview by default; --apply writes. Needs SUPABASE_DB_URL. */
import fs from "fs";
import pg from "/Users/paulkilroy/dev/Sulog/node_modules/pg/lib/index.js";

// --- transliterator (verbatim from tools/build-respellings.mjs) ---
function syllabify(w) {
  w = w.toLowerCase().replace(/ng/g, "ŋ");
  const out = [];
  w.split("-").forEach((g, gi) => {
    const units = []; const re = /([^aeiou]*)([aeiou])/g; let m, last = 0;
    while ((m = re.exec(g))) { units.push({ o: m[1], v: m[2] }); last = re.lastIndex; }
    const tail = g.slice(last);
    if (!units.length) { if (g) out.push({ syl: g, glottalBefore: gi > 0 }); return; }
    const syls = units.map((u) => u.o + u.v);
    for (let k = 0; k < units.length - 1; k++) { const on = units[k + 1].o; if (on.length >= 2) { syls[k] += on.slice(0, -1); syls[k + 1] = on.slice(-1) + units[k + 1].v; } }
    if (tail) syls[syls.length - 1] += tail;
    syls.forEach((s, si) => out.push({ syl: s, glottalBefore: gi > 0 && si === 0 }));
  });
  return out;
}
function respellSyl(syl) {
  syl = syl.replace(/ŋ/g, "ng");
  const m = syl.match(/^([^aeiou]*)([aeiou])([^aeiou]*)$/i);
  if (!m) return syl;
  let [, onset, v, coda] = m; v = v.toLowerCase(); let vowel;
  if (v === "a" && /^y/i.test(coda)) { vowel = "igh"; coda = coda.slice(1); }
  else if (v === "a" && /^w/i.test(coda)) { vowel = "ow"; coda = coda.slice(1); }
  else { const closed = coda.length > 0; vowel = { a: closed ? "a" : "ah", e: closed ? "e" : "eh", i: closed ? "i" : "ee", o: "o", u: "oo" }[v]; }
  const cmap = (s) => s.replace(/c/gi, "k");
  return cmap(onset) + vowel + cmap(coda);
}
function respell(word, stressIdx) {
  word = word.toLowerCase().replace(/[^a-z-]/g, "");
  const syls = syllabify(word);
  if (!syls.length) return word;
  const n = syls.length;
  if (n === 1) return respellSyl(syls[0].syl);
  const stress = stressIdx && stressIdx >= 1 && stressIdx <= n ? stressIdx - 1 : Math.max(0, n - 2);
  return syls.map((s, i) => { let r = respellSyl(s.syl); if (i === stress) r = r.toUpperCase(); return r; }).join("-");
}

// stress syllable (1-based) from an accented spelling: Waray = one vowel per syllable, so it's the
// ordinal of the accented vowel among all vowels.
const stripAcc = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function stressIdx(accented) {
  if (!accented) return 0;
  const s = accented.toLowerCase().normalize("NFD"); let vi = 0, stress = 0;
  for (let i = 0; i < s.length; i++) if ("aeiou".includes(s[i])) { vi++; if (/[̀́]/.test(s[i + 1] || "")) stress = vi; }
  return stress;
}

// --- authoritative accented forms from Tramp ---
const tramp = JSON.parse(fs.readFileSync("docs/sources/dictionaries/tramp.json", "utf8")).entries;
const trampAcc = new Map();
for (const e of tramp) { const k = stripAcc(e.waray).replace(/[^a-z]/g, ""); if (/[̀-ͯ]/.test(e.waray.normalize("NFD")) && !trampAcc.has(k)) trampAcc.set(k, e.waray); }
const accentedFor = (word, variants) => {
  const w = stripAcc(word);
  for (const v of (variants || [])) if (stripAcc(v) === w && /[̀-ͯ]/.test(v.normalize("NFD"))) return v;   // our own accented variant
  return trampAcc.get(w.replace(/[^a-z]/g, "")) || null;                                                   // else Tramp's
};

if (!process.env.SUPABASE_DB_URL) { console.error("Set SUPABASE_DB_URL first."); process.exit(1); }
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = async (s, p) => (await c.query(s, p)).rows;
const APPLY = process.argv.includes("--apply");

// sanity: our transliterator must reproduce existing guides
const have = await q("select waray,pronunciation,variants from dictionary where pronunciation is not null and pronunciation <> '' and waray !~ ' '");
let ok = 0, mism = [];
for (const r of have) { const a = accentedFor(r.waray, r.variants); const g = respell(r.waray, stressIdx(a)); if (g === r.pronunciation) ok++; else if (mism.length < 6) mism.push(`${r.waray}: ours=${g} vs stored=${r.pronunciation}`); }
console.log(`sanity: transliterator reproduces ${ok}/${have.length} existing guides`);
if (mism.length) console.log("  sample differences (mostly hand-vetted forms):", mism.join(" | "));

// fill the missing single words
const missing = await q("select waray,variants from dictionary where (pronunciation is null or pronunciation = '') and waray !~ ' ' and waray !~ '/' and kind = 'word'");
const filled = missing.map((r) => { const a = accentedFor(r.waray, r.variants); return { waray: r.waray, say: respell(r.waray, stressIdx(a)), from: a ? (r.variants?.includes(a) ? "own-accent" : "tramp") : "penultimate-default" }; });
console.log(`\nmissing pronunciation (single words): ${missing.length}`);
console.log("  sample fills:", filled.slice(0, 10).map((f) => `${f.waray}→${f.say}`).join("  "));
const byFrom = filled.reduce((m, f) => (m[f.from] = (m[f.from] || 0) + 1, m), {});
console.log("  stress source:", JSON.stringify(byFrom));

// compose multi-word guides from per-word guides: each word's stored guide if it has one,
// else transliterate it (Tramp stress, penultimate default). Phrase-level prosody (liaison,
// phrase stress) is beyond us — but per-word is exactly how the guides are read aloud anyway.
const wordGuide = new Map((await q("select waray, pronunciation from dictionary where pronunciation is not null and waray !~ ' '")).map((r) => [r.waray.toLowerCase(), r.pronunciation]));
const guideFor = (w) => {
  const lw = w.toLowerCase().replace(/[^a-zà-ÿ'\-]/g, "");
  if (!lw) return null;
  if (wordGuide.has(lw)) return wordGuide.get(lw);
  const a = accentedFor(lw, []);
  return respell(lw, stressIdx(a));
};
const missingMulti = await q("select waray from dictionary where (pronunciation is null or pronunciation = '') and waray ~ ' '");
const multiFilled = missingMulti.map((r) => ({ waray: r.waray, say: r.waray.split(/\s+/).map(guideFor).filter(Boolean).join(" ") })).filter((f) => f.say);
console.log(`\nmissing pronunciation (multi-word): ${missingMulti.length}`);
console.log("  composed:", multiFilled.slice(0, 8).map((f) => `${f.waray}→${f.say}`).join("  |  "));

if (APPLY) {
  await q("begin");
  for (const f of filled) await q("update dictionary set pronunciation=$2 where waray=$1", [f.waray, f.say]);
  for (const f of multiFilled) await q("update dictionary set pronunciation=$2 where waray=$1", [f.waray, f.say]);
  await q("commit");
  const p = (await q("select count(pronunciation) p, count(*) n from dictionary"))[0];
  console.log(`\n✓ applied — ${p.p}/${p.n} dictionary entries now have a pronunciation guide`);
} else console.log("\n(preview — pass --apply to write)");
await c.end();
