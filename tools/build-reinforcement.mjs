/* Reinforcement table for Challenger Phase 1: each lesson's new words, how often
   each is practiced IN its unit and REUSED in LATER units (apply phrases + stories
   + examples), vs a simple spiral goal. Prints markdown + writes
   docs/challenger-reinforcement.md.  Run: node tools/build-reinforcement.mjs */
import { SEED_CH, CHALLENGER } from "../src/courses/waray/challenger.js";

const PHASE = CHALLENGER[0];
const UNITS = PHASE.units;
const glossBy = {}; for (const r of SEED_CH) glossBy[r[1]] = r[2];
const exBy = {}; for (const r of SEED_CH) if (r[5]?.war) exBy[r[1]] = r[5].war;

const norm = (t) => t.toLowerCase().replace(/[.,!?¿¡;:"'¡]/g, "").trim();

// word -> intro unit index, and word -> lesson title
const introUnit = {}, lessonOf = {}, unitNewWords = [];
UNITS.forEach((u, ui) => {
  const rows = [];
  for (const l of u.lessons) {
    if (l.kind === "apply") continue;
    for (const w of l.items) if (!(w in introUnit)) { introUnit[w] = ui; lessonOf[w] = l.title; rows.push(w); }
  }
  unitNewWords.push(rows);
});

// contexts per unit: apply phrases + story lines + the examples of words introduced here
const contextsByUnit = UNITS.map((u, ui) => {
  const ctx = [];
  for (const l of u.lessons) if (l.kind === "apply") ctx.push(...l.items);
  if (u.story) for (const ln of u.story.lines || []) ctx.push(ln.war);
  for (const w of unitNewWords[ui]) if (exBy[w]) ctx.push(exBy[w]);
  return ctx.map((s) => new Set(norm(s).split(/\s+/).filter(Boolean)));
});

// count: for word w (intro unit ui) -> uses in its own unit, and in later units
function counts(w) {
  const ui = introUnit[w], key = norm(w);
  let inUnit = 0, later = 0;
  contextsByUnit.forEach((ctxs, k) => {
    const hits = ctxs.reduce((a, set) => a + (set.has(key) ? 1 : 0), 0);
    if (k === ui) inUnit += hits; else if (k > ui) later += hits;
  });
  return { inUnit, later };
}

// goal: a simple spiral target — reappear in >=2 LATER contexts. Core function
// words (pronouns + the everyday verbs) get a higher bar of 3.
const CORE = new Set(["ako","ikaw","hiya","kita","kami","kamo","hira","akon","imo","iya","ko","mo","na","aton","amon","iyo","ira","ta","mi","niyo","nira","gusto","kaon","inom","palit","oo","diri"]);
const goalOf = (w) => CORE.has(w) ? 3 : 2;

let md = `# Challenger · Phase 1 — reinforcement table\n\n`;
md += `_Per unit: each lesson's **new words**, how many times it's practiced **in its own unit** (apply phrases + story + its example) and **reused later** (in any later unit's phrases/stories/examples), vs a spiral **goal** (core function words = 3, others = 2). **Status:** ✓ met · **+N** = needs N more later-reuses._\n`;

const totals = { words: 0, met: 0 };
UNITS.forEach((u, ui) => {
  md += `\n### ${ui + 1}. ${u.name}  _(${unitNewWords[ui].length} new words)_\n\n`;
  md += `| Lesson | New word | English | In unit | Reused later | Goal | Status |\n|---|---|---|:--:|:--:|:--:|:--|\n`;
  for (const w of unitNewWords[ui]) {
    const { inUnit, later } = counts(w);
    const goal = goalOf(w), need = Math.max(0, goal - later);
    const status = ui === UNITS.length - 1 ? "— (last unit)" : need === 0 ? "✓" : `+${need}`;
    if (ui !== UNITS.length - 1) { totals.words++; if (need === 0) totals.met++; }
    md += `| ${lessonOf[w]} | **${w}** | ${glossBy[w] || ""} | ${inUnit} | ${later} | ${goal} | ${status} |\n`;
  }
});
md += `\n**Spiral coverage:** ${totals.met}/${totals.words} new words (excluding the final unit) meet their later-reuse goal — ${Math.round(100 * totals.met / (totals.words || 1))}%.\n`;

import fs from "fs";
fs.writeFileSync("docs/challenger-reinforcement.md", md);
console.log(md);
