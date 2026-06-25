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
  return parts.map((p, i) => ({ title: titles[i] || `#${i}`, toks: tokens(p) })).filter((s) => s.toks.length > 20);
}
const all = [
  ...stories("docs/sources/bloom-waray-stories.txt", "BOOK").map((s) => ({ ...s, src: "Bloom" })),
  ...stories("docs/sources/bfc-waray-stories.txt", "STORY").map((s) => ({ ...s, src: "BFC" })),
];

const fullRoots = rootsOf(fullDeck);
const cumRoots = cum.map((c) => rootsOf(c.set));

// for each story: coverage at each phase + full deck, and the phase it first crosses 80% (stem)
const rows = all.map((s) => {
  const perPhase = cum.map((c, i) => cover(s.toks, c.set, cumRoots[i]));
  const full = cover(s.toks, fullDeck, fullRoots);
  const reach80 = perPhase.findIndex((p) => p.stem >= 0.8);
  const reach90 = perPhase.findIndex((p) => p.stem >= 0.9);
  return { ...s, perPhase, full, reach80, reach90 };
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
- **Full-deck ceiling** (if you learned every card): ≥90% in **${ceil(0.9)}** stories · ≥80% in **${ceil(0.8)}** · ≥70% in **${ceil(0.7)}**
- Reaching ≥80% (stem) by phase: ${cum.map((c, i) => `${PN[i]} **${atPhase(i, 0.8)}**`).join(" · ")}
- Reaching ≥90% (stem) by phase: ${cum.map((c, i) => `${PN[i]} **${atPhase(i, 0.9)}**`).join(" · ")}

## The catch — full-deck ceiling
A story's **full-deck %** is the ceiling: even finishing the whole course, that's the most
you'd know, because the rest are words our curriculum never teaches (the long tail). If a
story tops out at 70%, it needs ~30% glossing no matter what — that's the "learn this
story" tier, not "flow." Raw vs stem gap shows how much Waray inflection hides.
`;
fs.writeFileSync(path.join(root, "docs/reading-coverage.md"), md);

console.log(`stories: ${rows.length} | full-deck ceiling ≥90%: ${ceil(0.9)}, ≥80%: ${ceil(0.8)}, ≥70%: ${ceil(0.7)}`);
console.log(`reach ≥80% by phase (stem): ${cum.map((c, i) => `${PN[i]}=${atPhase(i, 0.8)}`).join(" ")}`);
console.log(`\ntop 8 most-readable (stem %):`);
rows.slice(0, 8).forEach((r) => console.log(`  ${pct(r.full.stem).toString().padStart(3)}% full | P1-4: ${r.perPhase.map((p) => pct(p.stem)).join("/")} | ${r.src} ${r.title.slice(0, 32)}`));
console.log(`\nbottom 4 (long tail / specialized vocab):`);
rows.slice(-4).forEach((r) => console.log(`  ${pct(r.full.stem).toString().padStart(3)}% full | raw ${pct(r.full.raw)}% | ${r.src} ${r.title.slice(0, 32)}`));
