/* Waray word -> English respelling (Wikivoyage/Frequency-course style), for filling
   the pronunciation cue on Challenger cards that lack one. Reuses vetted respellings
   from cards.js where the word matches; converts from a stress-marked dictionary
   accent otherwise; penultimate-stress default when no source. VALIDATES the
   transliterator against the 427 existing respellings first (run with `validate`).
   Run: node tools/build-respellings.mjs validate */
import fs from "fs";
import { SEED } from "../src/courses/waray/cards.js";

const V = "aeiou";
// ---- syllabifier: returns [{syl, glottalBefore}] ----
function syllabify(w) {
  w = w.toLowerCase().replace(/ng/g, "ŋ"); // ŋ = single unit
  const out = [];
  w.split("-").forEach((g, gi) => {
    const units = []; const re = /([^aeiou]*)([aeiou])/g; let m, last = 0;
    while ((m = re.exec(g))) { units.push({ o: m[1], v: m[2] }); last = re.lastIndex; }
    const tail = g.slice(last);
    if (!units.length) { if (g) out.push({ syl: g, glottalBefore: gi > 0 }); return; }
    const syls = units.map((u) => u.o + u.v);
    for (let k = 0; k < units.length - 1; k++) {
      const on = units[k + 1].o;
      if (on.length >= 2) { syls[k] += on.slice(0, -1); syls[k + 1] = on.slice(-1) + units[k + 1].v; }
    }
    if (tail) syls[syls.length - 1] += tail;
    syls.forEach((s, si) => out.push({ syl: s, glottalBefore: gi > 0 && si === 0 }));
  });
  return out;
}
// ---- one syllable -> respelling ----
function respellSyl(syl) {
  syl = syl.replace(/ŋ/g, "ng");
  const m = syl.match(/^([^aeiou]*)([aeiou])([^aeiou]*)$/i);
  if (!m) return syl;
  let [, onset, v, coda] = m; v = v.toLowerCase();
  let vowel;
  if (v === "a" && /^y/i.test(coda)) { vowel = "igh"; coda = coda.slice(1); }
  else if (v === "a" && /^w/i.test(coda)) { vowel = "ow"; coda = coda.slice(1); }
  else {
    const closed = coda.length > 0; // coda consonant => short vowel
    vowel = { a: closed ? "a" : "ah", e: closed ? "e" : "eh", i: closed ? "i" : "ee", o: "o", u: "oo" }[v];
  }
  const cmap = (s) => s.replace(/c/gi, "k");
  return cmap(onset) + vowel + cmap(coda);
}
// ---- word (+ optional 1-based stress syllable) -> respelling ----
function respell(word, stressIdx) {
  word = word.toLowerCase().replace(/[^a-z-]/g, ""); // strip punctuation, keep glottal hyphen
  const syls = syllabify(word);
  if (!syls.length) return word;
  const n = syls.length;
  // monosyllables carry no stress contrast — render lowercase, never capped (matches the
  // Frequency convention: an→"ahn", ko→"ko", nga→"ngah"), including clitics inside phrases
  if (n === 1) return respellSyl(syls[0].syl);
  const stress = stressIdx && stressIdx >= 1 && stressIdx <= n ? stressIdx - 1 : Math.max(0, n - 2); // default penultimate
  return syls.map((s, i) => {
    let r = respellSyl(s.syl);
    if (i === stress) r = r.toUpperCase();
    return r;
  }).join("-");
}

// ---- data sources for the fill cascade ----
// (a) vetted respellings from the Frequency course, keyed by lowercased word
function loadFreq() {
  const m = new Map();
  for (const r of SEED) if (!/\s/.test(r[1]) && (r[4] || "").trim()) m.set(r[1].toLowerCase(), r[4]);
  return m;
}
// (b) stress from the CHED First-1000 dictionary: acute-accented headword -> stress syllable index
function loadDict(path = "docs/sources/dictionaries/waray-first-1000-words-2013.txt") {
  const m = new Map();
  const strip = (s) => s.normalize("NFD").replace(/[̀-́]/g, ""); // drop combining acute/grave
  const txt = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
  for (const line of txt.split("\n")) {
    const mm = line.match(/^([A-Za-zÀ-ÿ'\-]+):/);
    if (!mm) continue;
    const head = mm[1].normalize("NFC");
    const plain = strip(head).toLowerCase();
    if (!/[aeiou]/i.test(plain) || /\s/.test(plain)) continue;
    // find ordinal of the accented vowel among all vowels
    const decomp = head.normalize("NFD");
    let vi = 0, stress = 0;
    for (let i = 0; i < decomp.length; i++) {
      const ch = decomp[i];
      if (/[aeiou]/i.test(ch)) { vi++; if (decomp[i + 1] === "́") stress = vi; }
    }
    if (stress && !m.has(plain)) m.set(plain, stress); // first (accented) entry wins
  }
  return m;
}
// (d) token-level accent miner: the accents we need are scattered through the Tramp
//     example sentences & sub-entries, not just headword lines. Scan EVERY accented
//     token in the whole text, map stripped-form -> stress ordinal, and majority-vote
//     (this also recovers inflected/derived surface forms that are never headwords).
function stressOrdinal(token) {
  const d = token.normalize("NFD");
  let vi = 0, stress = 0;
  for (let i = 0; i < d.length; i++) {
    if (/[aeiou]/i.test(d[i])) { vi++; if (/[̀-ͯ]/.test(d[i + 1] || "") && !stress) stress = vi; }
  }
  return { stress, nVowels: vi };
}
function loadTrampTokens(path = "docs/sources/dictionaries/tramp-zorc-waray-english-dictionary-1991.txt") {
  const votes = new Map(); // plain -> Map(stressIdx -> count)
  const txt = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
  for (const tok of txt.split(/[^A-Za-zÀ-ÿ'-]+/)) {
    if (!/[À-ɏ]/.test(tok.normalize("NFC")) && !/[À-ÿ]/.test(tok)) continue; // must carry an accent
    const nfc = tok.normalize("NFC");
    const { stress, nVowels } = stressOrdinal(nfc);
    if (!stress || nVowels < 2) continue; // need a real (multi-syllable) stress signal
    const plain = nfc.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z-]/g, "");
    if (plain.length < 2 || !/[aeiou]/.test(plain)) continue;
    if (!votes.has(plain)) votes.set(plain, new Map());
    const vm = votes.get(plain); vm.set(stress, (vm.get(stress) || 0) + 1);
  }
  const m = new Map();
  for (const [plain, vm] of votes) {
    let best = 0, bestN = 0, total = 0;
    for (const [idx, n] of vm) { total += n; if (n > bestN) { bestN = n; best = idx; } }
    m.set(plain, { idx: best, votes: bestN, total }); // majority stress + confidence
  }
  return m;
}
// merged stress lookup, priority: curated First-1000 > Tramp headword > Tramp tokens.
// value = {idx, src}
function loadStress() {
  const first = loadDict(), tramp = loadTramp(), toks = loadTrampTokens(), m = new Map();
  for (const [k, v] of toks) m.set(k, { idx: v.idx, src: "tramptok", votes: v.votes, total: v.total });
  for (const [k, v] of tramp) m.set(k, { idx: v, src: "tramp" });
  for (const [k, v] of first) m.set(k, { idx: v, src: "first1k" });
  return m;
}
// (c) stress from the Zorc/Tramp 1991 dictionary — clean headword,POS lines survive
//     the noisy OCR; the accented vowel (acute/grave/circumflex) marks stress.
function loadTramp(path = "docs/sources/dictionaries/tramp-zorc-waray-english-dictionary-1991.txt") {
  const m = new Map();
  const strip = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const txt = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
  for (const raw of txt.split("\n")) {
    // entry line: "headword, pos. ..."  (skip sub-entries starting with "-")
    const mm = raw.match(/^([A-Za-zÀ-ÿ'-]+),\s*(?:n|v|a|adj|adv|num|pron|prep|conj|part|id|interj|dem|art|vt|vi)\b/);
    if (!mm) continue;
    const head = mm[1].normalize("NFC");
    const plain = strip(head).toLowerCase().replace(/[^a-z-]/g, "");
    if (!/[aeiou]/.test(plain) || m.has(plain)) continue;
    const decomp = head.normalize("NFD");
    let vi = 0, stress = 0;
    for (let i = 0; i < decomp.length; i++) {
      if (/[aeiou]/i.test(decomp[i])) { vi++; if (/[̀-ͯ]/.test(decomp[i + 1] || "")) stress = stress || vi; }
    }
    if (stress) m.set(plain, stress);
  }
  return m;
}
// hand overrides where the penultimate default & dictionaries are known-wrong
// (native-ear corrections; e.g. init is unmarked in Tramp but is inít = ee-NIT)
const OVERRIDE = { kamusta: "kah-moos-TAH", kumusta: "kah-moos-TAH", init: "ee-NIT", walang: "wah-LANG", anuman: "ah-noo-MAN" };
// whole-PHRASE vetted pronunciations from the Frequency course (its multi-word cards),
// so a phrase reused in another course gets the exact vetted form, not a per-word rebuild
function loadFreqPhrases() {
  const m = new Map();
  const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
  for (const r of SEED) if (/\s/.test(r[1]) && (r[4] || "").trim()) m.set(norm(r[1]), r[4]);
  return m;
}
// root-strip fallback: an inflected surface form isn't a dict headword, but its ROOT
// is. Locate the root as a substring (this transparently handles CV-reduplication,
// e.g. umuuran ⊃ uran) and transfer the root's stressed-vowel ordinal to the surface
// form. Only fires when the root has real accent-derived stress.
const AFFIX_PRE = ["nagka", "nagpa", "nakiki", "nagpaka", "nag", "naka", "naki", "nan", "nam", "nang", "napa", "na", "magka", "magpa", "mag", "maka", "makig", "ma", "um", "gin", "ig", "paki", "pang", "pan", "pa", "ka", "gi"];
const AFFIX_SUF = ["han", "an", "on", "i", "a"];
function rootStrip(word, dict) {
  const key = word.toLowerCase().replace(/[^a-z-]/g, "");
  for (const p of ["", ...AFFIX_PRE]) {
    if (p && !key.startsWith(p)) continue;
    const rest = key.slice(p.length);
    for (const s of ["", ...AFFIX_SUF]) {
      if (s && !rest.endsWith(s)) continue;
      const root = s ? rest.slice(0, rest.length - s.length) : rest;
      if (root.length < 3 || !dict.has(root)) continue;
      const at = key.indexOf(root);
      if (at < 0) continue;
      const before = (key.slice(0, at).match(/[aeiou]/g) || []).length;
      const d = dict.get(root);
      const idx = before + d.idx;
      if (idx <= (key.match(/[aeiou]/g) || []).length) return { idx, src: "root:" + root };
    }
  }
  return null;
}
// cascade: override -> reuse Frequency verbatim -> dict-accent stress -> root-strip -> penult default
function fillSay(word, freq, dict) {
  const key = word.toLowerCase().replace(/[^a-z-]/g, "");
  if (OVERRIDE[key]) return { say: OVERRIDE[key], source: "override" };
  if (freq.has(key)) return { say: freq.get(key), source: "freq" };
  if (dict.has(key)) { const d = dict.get(key); return { say: respell(key, d.idx), source: d.src }; }
  const rs = rootStrip(key, dict);
  if (rs) return { say: respell(key, rs.idx), source: "rootstrip" };
  return { say: respell(key), source: "default" };
}

// ---- fill a SEED array in place: set empty say[4] on every card (words AND phrases,
//      by respelling each word and joining). Returns provenance stats + the list of
//      individual words whose stress was GUESSED (default) or OCR-mined (tramptok) /
//      derived (rootstrip), for the Ella review queue. Confidence tiers:
//        high  = override|freq|first1k|tramp   (native/vetted/clean dict accent)
//        review= tramptok|rootstrip|default    (OCR example accent / derived / penult guess)
const CONF = { override: "high", freq: "high", first1k: "high", tramp: "high", tramptok: "review", rootstrip: "review", default: "review" };
function fillSeedRespellings(seed, opts = {}) {
  const freq = opts.freq || loadFreq(), dict = opts.dict || loadStress(), phr = opts.phrases || loadFreqPhrases();
  const normP = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const counts = {}, flagged = new Map(); let filled = 0;
  for (const row of seed) {
    if ((row[4] || "").trim()) continue;
    const whole = phr.get(normP(row[1]));                     // exact vetted phrase pronunciation?
    if (whole) { row[4] = whole; counts.freqphrase = (counts.freqphrase || 0) + 1; filled++; continue; }
    const parts = row[1].trim().split(/\s+/).map((w) => ({ w, ...fillSay(w, freq, dict) }));
    row[4] = parts.map((p) => p.say).join(" ");
    filled++;
    for (const p of parts) {
      counts[p.source] = (counts[p.source] || 0) + 1;
      const key = p.w.toLowerCase().replace(/[^a-z-]/g, "");
      if (CONF[p.source] === "review" && key.length > 2 && !flagged.has(key))
        flagged.set(key, { word: p.w, say: p.say, source: p.source });
    }
  }
  return { filled, counts, flagged: [...flagged.values()] };
}

// ---- coverage report over the Challenger courses ----
if (process.argv[2] === "report") {
  const freq = loadFreq(), dict = loadStress();
  console.log(`sources: ${freq.size} Frequency respellings, ${dict.size} dict-accent stresses (First-1000 + Tramp)\n`);
  const order = ["override", "freq", "first1k", "tramp", "tramptok", "rootstrip", "default"];
  for (const [label, mod] of [["Challenger 1", "../src/courses/waray/challenger.js"], ["Challenger 2", "../src/courses/waray/challenger2.js"]]) {
    const m = await import(mod);
    const seed = m.SEED || m.SEED_CH2 || m.SEED_CH1 || m.SEED_CH;
    if (!seed) { console.log(`${label}: no SEED export found (${Object.keys(m).join(",")})`); continue; }
    const words = seed.filter((r) => !/\s/.test(r[1]));
    const need = words.filter((r) => !(r[4] || "").trim());
    const tally = {}, samples = {};
    for (const s of order) { tally[s] = 0; samples[s] = []; }
    for (const r of need) { const { say, source } = fillSay(r[1], freq, dict); tally[source]++; if (samples[source].length < 8) samples[source].push(`${r[1]} → ${say}`); }
    console.log(`${label}: ${words.length} word cards, ${need.length} need a respelling`);
    console.log(`  ${order.map((s) => `${s}=${tally[s]}`).join("  ")}   (needs-Ella = ${tally.default})`);
    for (const s of order) if (samples[s].length) console.log(`  [${s}] ${samples[s].join("  |  ")}`);
    console.log("");
  }
}

// ---- VALIDATION against the 427 known respellings ----
if (process.argv[2] === "validate") {
  const pairs = SEED.filter((r) => !/\s/.test(r[1]) && (r[4] || "").trim()).map((r) => [r[1].toLowerCase(), r[4]]);
  const stressOf = (resp) => { const parts = resp.split("-"); const i = parts.findIndex((p) => p === p.toUpperCase() && /[A-Z]/.test(p)); return i < 0 ? null : i + 1; };
  let exact = 0, syllOk = 0, mism = [];
  for (const [w, real] of pairs) {
    const st = stressOf(real);          // isolate transliteration from stress: feed the REAL stress
    const mine = respell(w, st);
    const norm = (s) => s.toLowerCase();
    if (norm(mine) === norm(real)) exact++;
    else { if (mine.split("-").length === real.split("-").length) syllOk++; if (mism.length < 30) mism.push([w, real, mine]); }
  }
  console.log(`transliteration validation over ${pairs.length} respellings (using each word's REAL stress):`);
  console.log(`  exact match: ${exact} (${Math.round(100 * exact / pairs.length)}%)`);
  console.log(`  right #syllables but char diff: ${syllOk}`);
  console.log("\n  sample mismatches (word · real · mine):");
  for (const [w, real, mine] of mism) console.log(`    ${w.padEnd(13)} ${real.padEnd(18)} ${mine}`);
  // stress accuracy: how often is penultimate the real stress?
  let penMatch = 0, withStress = 0;
  for (const [w, real] of pairs) { const st = stressOf(real); if (!st) continue; withStress++; const n = syllabify(w).length; if (st === Math.max(1, n - 1)) penMatch++; }
  console.log(`\n  penultimate == real stress: ${penMatch}/${withStress} (${Math.round(100 * penMatch / withStress)}%)`);
}

export { respell, syllabify, loadFreq, loadDict, loadTramp, loadStress, fillSay, fillSeedRespellings };
