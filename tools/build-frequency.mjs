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
   - docs/sources/waray-frequency.json (full data: word -> {count, inSeed, inChed})

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
};

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
  const examples = [];          // attested example sentences
  let cur = null;               // current entry block being accumulated
  const flush = () => {
    if (!cur) return;
    // headword = text before first colon; take primary form (before "(" or "/")
    const raw = cur.head.split(":")[0];
    const canon = norm(raw.split(/[(\/]/)[0]).replace(/^['\-]+|['\-]+$/g, "").trim();
    if (canon && /^[a-z][a-z'\-]*$/.test(canon)) heads.add(canon);
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
  return { heads, examples };
}

// --- build target lexicon: single-word SEED entries + CHED headwords ---
const seedWords = new Map(); // norm word -> original waray (single-token entries only)
for (const row of SEED) {
  const w = row[1] || "";
  if (!/\s/.test(w.trim())) { const n = norm(w).replace(/^['\-]+|['\-]+$/g, ""); if (n) seedWords.set(n, w); }
}

const chedText = read(SRC.ched);
const { heads: chedHeads, examples: chedExamples } = parseChed(chedText);

// --- count occurrences across the whole corpus ---
const corpus = [read(SRC.ched), read(SRC.peace), read(SRC.tramp)].join("\n");
const counts = new Map();
for (const t of tokens(corpus)) counts.set(t, (counts.get(t) || 0) + 1);

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

## Corpus
- CHED "First 1000 Words" (Oyzon 2013): **${chedHeads.size}** headwords parsed, **${chedExamples.length}** example sentences extracted
- Total distinct tokens counted: **${counts.size.toLocaleString()}**
- Target lexicon (confirmable Waray = SEED single-words ∪ CHED headwords): **${target.size}** words, of which **${occurring.length}** occur in the corpus

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

## Attested example sentences harvested (Track 2 seed pool)
**${chedExamples.length}** sentences pulled from CHED entries. First 15:

${chedExamples.slice(0, 15).map((s) => `- ${s}`).join("\n")}
`;

fs.writeFileSync(path.join(root, "docs/waray-frequency-graph.md"), md);
fs.writeFileSync(
  path.join(root, "docs/sources/waray-frequency.json"),
  JSON.stringify({
    builtFrom: Object.values(SRC),
    counts: Object.fromEntries(ranked.map((r) => [r.w, { n: r.n, inSeed: r.inSeed, inChed: r.inChed }])),
    chedHeads: [...chedHeads].sort(),
    gap: gap.map((r) => ({ w: r.w, n: r.n, tier: r.tier })),
    examples: chedExamples,
  }, null, 0)
);

console.log(`corpus tokens: ${counts.size} | CHED heads: ${chedHeads.size} | examples: ${chedExamples.length}`);
console.log(`target lexicon: ${target.size} | occurring: ${occurring.length} | SEED found: ${seedFound}/${seedWords.size}`);
console.log(`gap (CHED−SEED): ${gap.length} | SEED unseen: ${seedUnseen.length}`);
console.log(`top 15:`);
occurring.slice(0, 15).forEach((r) => console.log(`  ${String(r.rank).padStart(3)} ${r.w.padEnd(14)} ${String(r.n).padStart(4)}  T${r.tier} ${r.inSeed ? "deck" : "    "} ${r.inChed ? "ched" : ""}`));
