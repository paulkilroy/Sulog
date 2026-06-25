/* Reading-feasibility analysis: for each free story, what % of its RUNNING WORDS would a
   learner know after each curriculum phase (and at the full deck)? Token coverage is the
   comprehension-relevant metric (knowing frequent words covers most running text).

   Waray inflects heavily (root kaon → nakaon/kumaon/ginkaon), so surface matching
   undercounts. We report two numbers:
   - RAW: exact-match only (conservative floor)
   - STEM: also counts a story token as known if a taught root (≥4 chars) is inside it
     (morphological containment — closer to real comprehension)

   Run: node tools/reading-coverage.mjs   →   docs/reading-coverage.md */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FREQUENCY } from "../src/courses/waray/frequency.js";
import { SEED } from "../src/courses/waray/cards.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const tokens = (t) => norm(t).replace(/[’`]/g, "'").split(/[^a-z'\-]+/).map((x) => x.replace(/^['\-]+|['\-]+$/g, "")).filter((x) => x.length >= 2);

// cumulative taught token-set after each phase (curriculum order)
const acc = new Set(), cum = [];
for (const ph of FREQUENCY) {
  for (const u of ph.units) for (const l of u.lessons) for (const it of (l.items || [])) for (const t of tokens(it)) acc.add(t);
  cum.push({ name: ph.name, set: new Set(acc) });
}
const fullDeck = new Set();
for (const r of SEED) for (const t of tokens(r[1])) fullDeck.add(t);

// proper names: Title-case words appearing MID-sentence (not sentence-initial, not
// ALL-CAPS titles). A reader recognizes these as names, so they shouldn't count as
// "unknown vocabulary". Recurring names get caught wherever they appear mid-sentence.
function properNames(text) {
  const names = new Set();
  const flat = text.replace(/\s+/g, " ");
  for (const sent of flat.split(/[.!?]+/)) {
    const words = sent.trim().split(" ");
    for (let i = 1; i < words.length; i++) {
      const w = words[i].replace(/^["'“”(]+/, "").replace(/[,;:)"'“”]+$/, "");
      if (/^[A-Z][a-zà-ÿ]+$/.test(w)) names.add(norm(w));
    }
  }
  return names;
}

const rootsOf = (set) => [...set].filter((w) => w.length >= 4);
function cover(toks, set, roots) {
  let raw = 0, stem = 0;
  for (const t of toks) {
    const exact = set.has(t);
    if (exact) { raw++; stem++; continue; }
    if (t.length >= 4 && roots.some((r) => t.includes(r))) stem++;
  }
  return { raw: raw / toks.length, stem: stem / toks.length };
}

// per-story token lists from the marker-separated corpus files
function stories(file, marker) {
  const text = read(file);
  const titles = [...text.matchAll(new RegExp(`===${marker}: ([^=\\[\\n]+)`, "g"))].map((m) => m[1].trim());
  const parts = text.split(new RegExp(`===${marker}:[^=]*===`)).map((s) => s.trim());
  parts.shift(); // leading empty
  return parts.map((p, i) => ({ title: titles[i] || `#${i}`, raw: p, toks: tokens(p) })).filter((s) => s.toks.length > 20);
}
const all = [
  ...stories("docs/sources/bloom-waray-stories.txt", "BOOK").map((s) => ({ ...s, src: "Bloom" })),
  ...stories("docs/sources/bfc-waray-stories.txt", "STORY").map((s) => ({ ...s, src: "BFC" })),
];

const fullRoots = rootsOf(fullDeck);
const cumRoots = cum.map((c) => rootsOf(c.set));

// for each story: coverage at each phase + full deck, and the phase it first crosses 80% (stem)
let totalRemoved = 0, totalToks = 0;
const rows = all.map((s) => {
  const names = properNames(s.raw);
  const toks = s.toks.filter((t) => !names.has(t)); // drop proper names from the denominator
  totalRemoved += s.toks.length - toks.length; totalToks += s.toks.length;
  const perPhase = cum.map((c, i) => cover(toks, c.set, cumRoots[i]));
  const full = cover(toks, fullDeck, fullRoots);
  const reach80 = perPhase.findIndex((p) => p.stem >= 0.8);
  const reach90 = perPhase.findIndex((p) => p.stem >= 0.9);
  return { ...s, toks, removed: s.toks.length - toks.length, perPhase, full, reach80, reach90 };
}).sort((a, b) => b.full.stem - a.full.stem);

const pct = (x) => Math.round(x * 100);
const PN = ["P1", "P2", "P3", "P4"];
let md = `# Reading feasibility — story coverage by curriculum phase

_Token coverage = % of a story's running words a learner would know. **STEM** counts
inflected forms of taught roots (morphological containment); **raw** is exact-match only.
Comprehension guide: ~95% = comfortable read · ~90% = a stretch · <80% = too hard unaided
(but fine in "learn this story" mode with tap-to-gloss + pictures)._

Phases: ${cum.map((c, i) => `**${PN[i]}** ${c.name}`).join(" · ")}

## Per-story coverage (STEM %), sorted by full-deck ceiling
| Story | src | ${PN.map((p) => p).join(" | ")} | **Full deck** | ready@ |
|-------|:--:|--:|--:|--:|--:|:--:|:--:|
`;
for (const r of rows) {
  const cells = r.perPhase.map((p) => pct(p.stem)).join(" | ");
  const ready = r.reach80 >= 0 ? PN[r.reach80] : "—";
  md += `| ${r.title.slice(0, 34)} | ${r.src} | ${cells} | **${pct(r.full.stem)}%** | ${ready} |\n`;
}

// summary
const ceil = (n) => rows.filter((r) => r.full.stem >= n).length;
const atPhase = (i, n) => rows.filter((r) => r.perPhase[i].stem >= n).length;
md += `\n## Summary
- Stories analyzed: **${rows.length}** (${all.filter((s) => s.src === "Bloom").length} Bloom + ${all.filter((s) => s.src === "BFC").length} BFC)
- Proper names excluded from denominators: **${totalRemoved}** tokens (${Math.round(100 * totalRemoved / totalToks)}% of running words were names)
- **Full-deck ceiling** (if you learned every card): ≥90% in **${ceil(0.9)}** stories · ≥80% in **${ceil(0.8)}** · ≥70% in **${ceil(0.7)}**
- Reaching ≥80% (stem) by phase: ${cum.map((c, i) => `${PN[i]} **${atPhase(i, 0.8)}**`).join(" · ")}
- Reaching ≥90% (stem) by phase: ${cum.map((c, i) => `${PN[i]} **${atPhase(i, 0.9)}**`).join(" · ")}

## The catch — full-deck ceiling
A story's **full-deck %** is the ceiling: even finishing the whole course, that's the most
you'd know, because the rest are words our curriculum never teaches (the long tail). If a
story tops out at 70%, it needs ~30% glossing no matter what — that's the "learn this
story" tier, not "flow." Raw vs stem gap shows how much Waray inflection hides.
`;
// ---- cross-story leverage: which UNKNOWN words recur across the most stories ----
const lex = JSON.parse(read("docs/sources/waray-lexicon.json"));
const glossOf = new Map(lex.lexemes.map((l) => [l.id, l.gloss]));
const top1000 = new Set(lex.lexemes.filter((l) => l.top1000).map((l) => l.id));
const knownStem = (t) => fullDeck.has(t) || (t.length >= 4 && fullRoots.some((r) => t.includes(r)));

const spread = new Map(); // truly-unknown token -> {docs:Set, freq}
for (const s of rows) {
  const here = new Set();
  for (const t of s.toks) {
    if (t.length < 3 || knownStem(t)) continue;
    const e = spread.get(t) || { docs: new Set(), freq: 0 };
    e.freq++; e.docs.add(s.title); spread.set(t, e);
  }
}
const leverage = [...spread.entries()]
  .map(([w, e]) => ({ w, docs: e.docs.size, freq: e.freq, gloss: glossOf.get(w) || null, top1000: top1000.has(w) }))
  .sort((a, b) => b.docs - a.docs || b.freq - a.freq);

// simulate coverage lift on the top-12 readable stories from adding the top-N leverage words
const top12 = rows.slice(0, 12);
const avgCover = (extra) => {
  const xset = new Set([...fullDeck, ...extra]);
  const xroots = [...fullRoots, ...extra.filter((w) => w.length >= 4)];
  return top12.reduce((s, r) => s + cover(r.toks, xset, xroots).stem, 0) / top12.length;
};
const words = (n) => leverage.slice(0, n).map((l) => l.w);
const lift = { base: avgCover([]), a20: avgCover(words(20)), a40: avgCover(words(40)), a60: avgCover(words(60)) };

md += `\n## Cross-story leverage — unknown words by story spread
_Truly-unknown words (no taught root inside), ranked by how many stories they appear in.
Adding the high-spread ones lifts coverage across many stories at once. "1000?" = also in
the CHED top-1000 (a double win: frequent in the corpus AND spans the stories)._

**Coverage lift on the top-12 readable stories (avg STEM %):** base **${pct(lift.base)}%** → +20 words **${pct(lift.a20)}%** → +40 **${pct(lift.a40)}%** → +60 **${pct(lift.a60)}%**

| word | #stories | freq | gloss | 1000? |
|------|:--:|--:|-------|:--:|
`;
for (const l of leverage.slice(0, 45)) {
  md += `| **${l.w}** | ${l.docs} | ${l.freq} | ${(l.gloss || "—").replace(/\|/g, "/").slice(0, 40)} | ${l.top1000 ? "✓" : ""} |\n`;
}
md += `\n_${leverage.length} distinct unknown words total. The long tail (appears in 1 story) is genuinely story-specific — gloss it in the reader rather than teach it._\n`;

fs.writeFileSync(path.join(root, "docs/reading-coverage.md"), md);
console.log(`\ncross-story leverage: ${leverage.length} unknown words | lift top-12 avg: ${pct(lift.base)}% → +40w ${pct(lift.a40)}%`);
console.log(`top spread:`); leverage.slice(0, 12).forEach((l) => console.log(`  ${l.docs} stories ·${String(l.freq).padStart(3)}× ${l.w.padEnd(14)} ${l.top1000 ? "[1000]" : ""} ${l.gloss || ""}`));

console.log(`stories: ${rows.length} | full-deck ceiling ≥90%: ${ceil(0.9)}, ≥80%: ${ceil(0.8)}, ≥70%: ${ceil(0.7)}`);
console.log(`reach ≥80% by phase (stem): ${cum.map((c, i) => `${PN[i]}=${atPhase(i, 0.8)}`).join(" ")}`);
console.log(`\ntop 8 most-readable (stem %):`);
rows.slice(0, 8).forEach((r) => console.log(`  ${pct(r.full.stem).toString().padStart(3)}% full | P1-4: ${r.perPhase.map((p) => pct(p.stem)).join("/")} | ${r.src} ${r.title.slice(0, 32)}`));
console.log(`\nbottom 4 (long tail / specialized vocab):`);
rows.slice(-4).forEach((r) => console.log(`  ${pct(r.full.stem).toString().padStart(3)}% full | raw ${pct(r.full.raw)}% | ${r.src} ${r.title.slice(0, 32)}`));
