/* Phase 0 frequency builder — compute an attested Waray frequency "graph" from the
   text we already have in the repo, with zero external dependency.

   Sources:
   - docs/sources/waray-first-1000-words-2013.txt  (Oyzon/CHED: the top-1000 SET +
     parseable dictionary entries with example sentences — the authoritative signal)
   - docs/sources/peace-corps-full-ocr.txt          (conversational Waray, graded)
   - docs/sources/tramp-zorc-...-1991.txt           (large dict; mostly English, but its
     Waray headwords/examples add attestation — harmless since we only tally Waray)
   - src/courses/waray/cards.js  SEED               (the words we currently teach)

   Outputs:
   - docs/waray-frequency-graph.md   (human-readable report: ranked words, tiers, gap list)
   - docs/sources/waray-lexicon.json (normalized: sources, lexemes, cards, sentences)

   Method is deliberately conservative: we only ever *rank words we can confirm are Waray*
   (SEED words ∪ CHED headwords) by how often they occur across the corpus. English in the
   sources is simply never in that target set, so it can't pollute the ranking. Discovery of
   missing words uses the clean CHED-minus-SEED set, not a noisy raw-token list. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SEED } from "../src/courses/waray/cards.js";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dir, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const SRC = {
  ched: "docs/sources/waray-first-1000-words-2013.txt",
  peace: "docs/sources/peace-corps-full-ocr.txt",
  tramp: "docs/sources/tramp-zorc-waray-english-dictionary-1991.txt",
  // Phase 1: Bible for Children — 7 stories in children's-register Waray (free to copy,
  // not to sell; attributed). Simple declaratives, ideal for the frame engine. Note: this
  // translation uses some colloquial/dialectal spellings (san=han, sa=ha, ato=aton).
  bfc: "docs/sources/bfc-waray-stories.txt",
};

// harvest clean sentences from running text (rejoin PDF line-wraps, split on . ? !)
function harvestSentences(text) {
  return text
    .replace(/===STORY:[^=]*===/g, " ")
    .replace(/\s+/g, " ")
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => {
      const w = s.split(" ").length;
      if (w < 3 || w > 22 || s.length > 180) return false;
      return /\b(an|han|nga|san|sa|in|hin|ngan|siya|hi|si|ini|iton|may|waray|diri)\b/i.test(norm(s));
    });
}

// --- normalization: lowercase, strip diacritics, keep Waray's meaningful hyphen/apostrophe ---
const stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const norm = (s) => stripAccents((s || "").toLowerCase());
// tokenize running text into Waray-shaped tokens (letters + internal - and ')
function tokens(text) {
  return norm(text)
    .replace(/[’`]/g, "'")
    .split(/[^a-z'\-]+/)
    .map((t) => t.replace(/^['\-]+|['\-]+$/g, ""))
    .filter((t) => t.length >= 2);
}

// --- parse CHED dictionary entries: headword + example sentences ---
// entry line looks like:  headword (variant): POS nga label (english-pos). gloss. ‘example…
const POS_EN = /\((noun|verb|modifier|pronoun|numeral|particle|linker|determiner|interjection|expression|adverb|adjective|conjunction|preposition)s?\)/i;
function parseChed(text) {
  const lines = text.split(/\r?\n/);
  const heads = new Set();      // canonical Waray headwords (top-1000 set)
  const glossOf = new Map();    // headword -> English gloss
  const displayOf = new Map();  // headword -> accented display form
  const posOf = new Map();      // headword -> part of speech (english)
  const examples = [];          // attested example sentences
  let cur = null;               // current entry block being accumulated
  const flush = () => {
    if (!cur) return;
    // headword = text before first colon; take primary form (before "(" or "/")
    const raw = cur.head.split(":")[0];
    const canon = norm(raw.split(/[(\/]/)[0]).replace(/^['\-]+|['\-]+$/g, "").trim();
    if (canon && /^[a-z][a-z'\-]*$/.test(canon)) {
      heads.add(canon);
      const disp = raw.split(/[(\/]/)[0].trim();
      if (disp && !displayOf.has(canon)) displayOf.set(canon, disp);
      // gloss + pos = after the LAST POS paren (handles multi-POS entries), up to the
      // first example quote
      const beforeEx = cur.body[0].split(/[‘']/)[0];
      const re = new RegExp(POS_EN.source, "gi");
      let lastPos = -1, posName = null, mm;
      while ((mm = re.exec(beforeEx))) { lastPos = mm.index + mm[0].length; posName = mm[1].toLowerCase(); }
      if (posName && !posOf.has(canon)) posOf.set(canon, posName);
      if (lastPos >= 0) {
        const g = beforeEx.slice(lastPos).replace(/^[.\s\d,;]+/, "").replace(/\s+/g, " ").trim();
        if (g && !glossOf.has(canon)) glossOf.set(canon, g.slice(0, 60));
      }
    }
    // examples = anything in the block quoted with ‘ … (Waray sentences)
    const body = cur.body.join(" ");
    for (const m of body.matchAll(/[‘']([^‘'][^]*?)(?=[‘']|$)/g)) {
      const sent = m[1].replace(/\s+/g, " ").trim();
      if (sent.split(" ").length >= 3 && sent.length < 200) examples.push(sent);
    }
    cur = null;
  };
  for (const line of lines) {
    const ci = line.indexOf(":");
    const isEntry = ci > 0 && ci < 45 && POS_EN.test(line.slice(ci, ci + 75));
    if (isEntry) { flush(); cur = { head: line.slice(0, ci + 1), body: [line] }; }
    else if (cur) cur.body.push(line);
  }
  flush();
  return { heads, glossOf, displayOf, posOf, examples };
}

// --- build target lexicon: single-word SEED entries + CHED headwords ---
const seedWords = new Map(); // norm word -> original waray (single-token entries only)
for (const row of SEED) {
  const w = row[1] || "";
  if (!/\s/.test(w.trim())) { const n = norm(w).replace(/^['\-]+|['\-]+$/g, ""); if (n) seedWords.set(n, w); }
}

const chedText = read(SRC.ched);
const { heads: chedHeads, glossOf, displayOf, posOf, examples: chedExamples } = parseChed(chedText);

// Phase 1: children's-register sentences from Bible for Children
const bfcText = read(SRC.bfc);
const bfcSentences = harvestSentences(bfcText);
const sentencePool = [...chedExamples, ...bfcSentences];

// --- count occurrences across the whole corpus (per-source, for transparency) ---
const perSource = {};
const counts = new Map();
for (const [key, file] of Object.entries(SRC)) {
  const toks = tokens(read(file));
  perSource[key] = toks.length;
  for (const t of toks) counts.set(t, (counts.get(t) || 0) + 1);
}

// target set = words we can confirm are Waray
const target = new Set([...seedWords.keys(), ...chedHeads]);
const ranked = [...target]
  .map((w) => ({ w, n: counts.get(w) || 0, inSeed: seedWords.has(w), inChed: chedHeads.has(w) }))
  .sort((a, b) => b.n - a.n || a.w.localeCompare(b.w));

// tiers by rank quantile over words that actually occur (n>0)
const occurring = ranked.filter((r) => r.n > 0);
const tierOf = (i) => {
  const q = i / Math.max(1, occurring.length);
  return q < 0.1 ? 1 : q < 0.3 ? 2 : q < 0.6 ? 3 : 4; // 1=core … 4=rare
};
occurring.forEach((r, i) => { r.tier = tierOf(i); r.rank = i + 1; });

// gap list: CHED top-1000 words we DON'T teach, by corpus frequency (clean add-candidates)
const gap = occurring.filter((r) => r.inChed && !r.inSeed);
// SEED words that never appear in the corpus (rare / possibly mis-spelled vs corpus)
const seedUnseen = ranked.filter((r) => r.inSeed && r.n === 0).map((r) => r.w);

// ---------------- report ----------------
const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);
const seedFound = ranked.filter((r) => r.inSeed && r.n > 0).length;
let md = `# Waray frequency graph — Phase 0 (repo sources only)

_Built by tools/build-frequency.mjs from the text already in the repo. Zero external
dependency. Counts are attested occurrences across CHED + Peace Corps + Tramp/Zorc._

## Corpus (Phase 0 + Phase 1)
Token counts per source:
${Object.entries(perSource).map(([k, n]) => `- \`${k}\` — ${n.toLocaleString()} tokens`).join("\n")}
- CHED headwords parsed: **${chedHeads.size}**
- Total distinct tokens counted: **${counts.size.toLocaleString()}**
- Target lexicon (confirmable Waray = SEED single-words ∪ CHED headwords): **${target.size}** words, of which **${occurring.length}** occur in the corpus

## Attested-sentence pool (Track 2 — frame-engine fuel)
- CHED dictionary examples: **${chedExamples.length}**
- Bible for Children (children's register): **${bfcSentences.length}**
- **Combined pool: ${sentencePool.length} sentences** (deduping not applied)
- _Bible for Children © Bible for Children, Inc. — free to copy/print, not for sale; attributed._
- ⚠️ The BFC translation leans **dialectal/colloquial** (san→han, sa→ha, wara→waray, sino→hin-o). Real Waray, but normalize before using as frame templates — a job for native-speaker validation.

## Coverage of what we teach
- SEED single-word vocab: **${seedWords.size}** words
- …found in the corpus: **${seedFound}** (${pct(seedFound, seedWords.size)}%)
- …never seen in the corpus: **${seedUnseen.length}** (listed at the end — check spelling/rarity)

## Tiers (by corpus frequency rank, over the ${occurring.length} occurring target words)
- **Tier 1 (core, top 10%)**, **Tier 2 (10–30%)**, **Tier 3 (30–60%)**, **Tier 4 (rare, 60–100%)**

## Top 120 Waray words by attested frequency
| # | word | count | tier | in deck? | CHED-1000? |
|--:|------|------:|:--:|:--:|:--:|
`;
for (const r of occurring.slice(0, 120)) {
  md += `| ${r.rank} | ${r.w} | ${r.n} | ${r.tier} | ${r.inSeed ? "✓" : ""} | ${r.inChed ? "✓" : ""} |\n`;
}

md += `\n## Gap list — CHED top-1000 words we DON'T teach yet (by corpus frequency)
_The highest-value add candidates: Oyzon's corpus says these are common, and they're not in the deck._

| # | word | count | tier |
|--:|------|------:|:--:|
`;
for (const r of gap.slice(0, 80)) md += `| ${r.rank} | ${r.w} | ${r.n} | ${r.tier} |\n`;
md += `\n_(+${Math.max(0, gap.length - 80)} more in the JSON.)_\n`;

md += `\n## SEED words not found in the corpus (${seedUnseen.length})
_Either genuinely rare, a phrase fragment, or a spelling that differs from the corpus._

${seedUnseen.join(", ") || "—"}

## Sample harvested sentences (Track 2 seed pool)
**CHED dictionary examples** (first 8):
${chedExamples.slice(0, 8).map((s) => `- ${s}`).join("\n")}

**Bible for Children — children's register** (first 12):
${bfcSentences.slice(0, 12).map((s) => `- ${s}`).join("\n")}
`;

fs.writeFileSync(path.join(root, "docs/waray-frequency-graph.md"), md);

// the full attested-sentence pool as a browsable doc (Track-2 frame fuel)
let pool = `# Waray attested-sentence pool (Track 2)

_Harvested by tools/build-frequency.mjs. Every line is attested — from a dictionary
example or a published children's story — never invented. This is the raw fuel for the
frame engine; Ella validates patterns drawn from here before any generation ships._

- **CHED dictionary examples:** ${chedExamples.length}
- **Bible for Children (children's register):** ${bfcSentences.length} — _© Bible for Children, Inc.; free to copy/print, not for sale; leans dialectal (san→han, sa→ha)._
- **Total:** ${sentencePool.length}

## CHED dictionary examples (${chedExamples.length})
${chedExamples.map((s) => `- ${s}`).join("\n")}

## Bible for Children — children's register (${bfcSentences.length})
${bfcSentences.map((s) => `- ${s}`).join("\n")}
`;
fs.writeFileSync(path.join(root, "docs/sources/waray-attested-sentences.md"), pool);

// review-ready "words to add" — the gap list with glosses, for curriculum decisions
let add = `# Waray words to add — frequency gap, with glosses

_High-frequency words in Oyzon's CHED top-1000 that our deck does NOT teach, ranked by
attested corpus frequency. Glosses pulled from the CHED dictionary entries. **A review
list** — some are genre-skewed by the literary corpus (siday=poem, sumat=story) and a few
are spelling variants of cards we have (babayi≈babaye). Tick the ones to add._

Tiers: **1** = core (top 10% of all attested words) … **4** = rarer.

| add? | word | gloss | count | tier |
|:--:|------|-------|------:|:--:|
`;
for (const r of gap.slice(0, 70)) {
  add += `| ☐ | **${r.w}** | ${(glossOf.get(r.w) || "—").replace(/\|/g, "/")} | ${r.n} | ${r.tier} |\n`;
}
add += `\n_Top 70 of ${gap.length} gap words. Full lexicon in waray-lexicon.json._\n`;
fs.writeFileSync(path.join(root, "docs/waray-words-to-add.md"), add);
// ---------------- normalized lexicon: the JSON source of truth ----------------
// Entities + links: sources, lexemes, cards, sentences (sentence↔lexeme many-to-many).
// Generated, not hand-maintained — re-derives from SEED + the raw text sources. Markdown
// docs above are views of this same in-memory model. (No build timestamp — git is the clock.)
const SOURCES = [
  { id: "ched",  name: "First 1000 Words in Waray (Oyzon/CHED 2013)", url: "https://mlephil.wordpress.com/", license: "free educational (CHED/3NS)" },
  { id: "peace", name: "Peace Corps Waray course",                    url: "", license: "US gov — public domain" },
  { id: "tramp", name: "Tramp & Zorc Waray-English Dictionary (1991)", url: "", license: "reference" },
  { id: "bfc",   name: "Bible for Children — Waray (7 stories)",       url: "https://bibleforchildren.org/PDFs/waray/", license: "free to copy/print, not for sale" },
  { id: "seed",  name: "Sulog deck (hand-authored)",                   url: "", license: "project" },
];

const tnorm = (w) => norm(w).replace(/^['\-]+|['\-]+$/g, "");
const rankByNorm = new Map(occurring.map((r) => [r.w, r]));

// cards mirror SEED (positional ids c0…cN — append-only); single-word cards link to a lexeme
const cardByNorm = new Map();
const cards = SEED.map((row, i) => {
  const [deck, waray, english, subtext, say] = row;
  const single = !/\s/.test((waray || "").trim());
  const wn = tnorm(waray);
  if (single && wn && !cardByNorm.has(wn)) cardByNorm.set(wn, `c${i}`);
  return { id: `c${i}`, deck, waray, english, subtext: subtext || "", say: say || "", single, lexeme: single ? wn : null };
});

const lexNorms = new Set([...seedWords.keys(), ...chedHeads]);
const lexemes = [...lexNorms].map((n) => {
  const r = rankByNorm.get(n);
  const card = cardByNorm.get(n);
  return {
    id: n,
    waray: seedWords.get(n) || displayOf.get(n) || n,
    pos: posOf.get(n) || null,
    gloss: glossOf.get(n) || (card ? cards.find((c) => c.id === card)?.english : null) || null,
    freq: counts.get(n) || 0,
    tier: r ? r.tier : null,
    rank: r ? r.rank : null,
    top1000: chedHeads.has(n),
    inDeck: seedWords.has(n),
    cardId: card || null,
  };
}).sort((a, b) => b.freq - a.freq || a.id.localeCompare(b.id));

// multi-word (phrase) cards → the lexemes they contain
for (const c of cards) if (!c.single) c.words = [...new Set(tokens(c.waray).filter((t) => lexNorms.has(t)))];

// sentence pool with component lexemes (the many-to-many the frame engine queries)
let sid = 0;
const sentences = [
  ...chedExamples.map((t) => ({ text: t, sourceId: "ched", register: "dictionary" })),
  ...bfcSentences.map((t) => ({ text: t, sourceId: "bfc", register: "childrens" })),
].map((s) => ({ id: `s${sid++}`, ...s, words: [...new Set(tokens(s.text).filter((w) => lexNorms.has(w)))] }));

fs.writeFileSync(
  path.join(root, "docs/sources/waray-lexicon.json"),
  JSON.stringify({
    meta: {
      note: "Normalized source of truth for Waray curriculum data. Generated by tools/build-frequency.mjs from SEED + the text sources. Markdown docs are views of this.",
      builtFrom: Object.values(SRC),
      perSource,
      counts: { sources: SOURCES.length, lexemes: lexemes.length, cards: cards.length, sentences: sentences.length },
    },
    sources: SOURCES,
    lexemes,
    cards,
    sentences,
  }, null, 1)
);

console.log(`corpus tokens: ${counts.size} | CHED heads: ${chedHeads.size} | sentence pool: ${sentencePool.length} (CHED ${chedExamples.length} + BFC ${bfcSentences.length})`);
console.log(`target lexicon: ${target.size} | occurring: ${occurring.length} | SEED found: ${seedFound}/${seedWords.size}`);
console.log(`gap (CHED−SEED): ${gap.length} | SEED unseen: ${seedUnseen.length}`);
console.log(`top 15:`);
occurring.slice(0, 15).forEach((r) => console.log(`  ${String(r.rank).padStart(3)} ${r.w.padEnd(14)} ${String(r.n).padStart(4)}  T${r.tier} ${r.inSeed ? "deck" : "    "} ${r.inChed ? "ched" : ""}`));
