/* Build Challenger 2 (Expanded) — Phase 1 + Phase 2 — into challenger2.js.
   Loads the generated phase JSONs and applies precise whole-object OVERRIDES to fix
   the items that earlier blunt token-swaps broke (u5 war/en mismatches, u3 fragment)
   and the P2 kita-homonym clash. Emits decks c2u1..c2u11. Does not touch challenger.js.
   Run: node tools/build-challenger2.mjs */
import fs from "fs";
const P1 = JSON.parse(fs.readFileSync("docs/sources/challenger-expanded-final.json", "utf8"));
const P2 = JSON.parse(fs.readFileSync("docs/sources/challenger2-p2.json", "utf8"));
const unit = (o, id) => o.detailed_units.find((u) => u.unit_id === id);

// ---------- P1 fixes ----------
// u5: correct number examples (taught nouns, matching English)
const u5 = unit(P1, "u5");
const EX5 = {
  usa: ["usa ka isda", "usa", "one fish"], duha: ["duha ka tinapay", "duha", "two breads"],
  tulo: ["tulo ka anak", "tulo", "three children"], upat: ["upat ka balay", "upat", "four houses"],
  lima: ["lima ka pesos", "lima", "five pesos"], unom: ["unom ka kwarto", "unom", "six rooms"],
  pito: ["pito ka bintana", "pito", "seven windows"], walo: ["walo ka isda", "walo", "eight fish"],
  siyam: ["siyam ka tinapay", "siyam", "nine breads"], napulo: ["napulo ka anak", "napulo", "ten children"],
  kwarta: ["Akon kwarta", "kwarta", "My money"],
};
for (const v of u5.new_vocab) if (EX5[v.lemma]) v.example = { war: EX5[v.lemma][0], focus: EX5[v.lemma][1], en: EX5[v.lemma][2] };
// u5 apply + review phrases (clean war/en)
u5.lessons.find((l) => l.lesson_id === "u5l3").phrases = [
  { war: "Tagpira ini nga isda?", en: "How much is this fish?" },
  { war: "Lima ka pesos.", en: "Five pesos." },
  { war: "Mapalit ako tulo ka isda.", en: "I will buy three fish." },
  { war: "Mahal ini.", en: "This is expensive." },
  { war: "Barato an tinapay.", en: "The bread is cheap." },
  { war: "Waray ako sukli.", en: "I don't have change." },
];
u5.lessons.find((l) => l.lesson_id === "u5l4").phrases = [
  { war: "Pira an kwarta mo?", en: "How much money do you have?" },
  { war: "Mapalit ka napulo ka tinapay?", en: "Will you buy ten breads?" },
  { war: "Bayad na! Waray sukli.", en: "Pay now! No change." },
  { war: "Mahal an isda, barato an tinapay.", en: "The fish is expensive, the bread is cheap." },
];
u5.story.sentences = [
  { war: "Mapalit ako isda.", en: "I will buy fish." },
  { war: "Tagpira ini?", en: "How much is this?" },
  { war: "Lima ka pesos.", en: "Five pesos." },
  { war: "Mahal an isda. Barato an tinapay.", en: "The fish is expensive. The bread is cheap." },
];
u5.story.questions = [
  { q: "What will the person buy?", choices: ["Isda", "Tinapay", "Kwarta"], answer_index: 0 },
  { q: "How is the bread priced?", choices: ["Barato", "Mahal", "Waray"], answer_index: 0 },
];
// u3 review: fix the broken "in kudal" fragment and the "anak"/"friend" mismatch
const u3rev = unit(P1, "u3").lessons.find((l) => l.lesson_id === "u3l4");
u3rev.phrases = [
  { war: "Tindog ha purtahan.", en: "Stand at the door." },
  { war: "Iyo bintana adto.", en: "That is your (plural) window." },
  { war: "Aadi in kudal.", en: "Here is the fence." },
  { war: "Sulod ha balay, akon anak.", en: "Come in, my child." },
];

// ---------- P2 fix: kita (see) collides with kita (we) — teach magkita instead ----------
const u10 = unit(P2, "u10");
for (const v of u10.new_vocab) if (v.lemma === "kita") { v.lemma = "magkita"; v.gloss = "meet"; v.example = { war: "Magkita kita ha merkado", focus: "Magkita", en: "Let's meet at the market" }; v.note = "to meet up (root kita = see); distinct from the pronoun kita = we"; }
for (const l of u10.lessons) if (l.teaches) l.teaches = l.teaches.map((w) => w === "kita" ? "magkita" : w);

// ============ emit ============
const seed = [], phases = [], levels = {};
const seen = new Set(), dups = [];
const pushCard = (row) => { if (seen.has(row[1])) { dups.push(row[1]); return; } seen.add(row[1]); seed.push(row); };
let deckN = 0;
for (const [phase, meta] of [[P1, { id: "c2p1", name: "First Steps in Daram (Expanded)", hint: "Denser greetings, family, home, food, numbers" }], [P2, { id: "c2p2", name: "Daily Life in the Neighborhood", hint: "In-laws, the yard, going places, weather, daily time" }]]) {
  const units = [];
  for (const u of phase.detailed_units) {
    const deck = `c2u${++deckN}`;
    for (const v of u.new_vocab) { pushCard([deck, v.lemma, v.gloss, v.note || "", "", v.example ? { war: v.example.war, focus: v.example.focus, en: v.example.en } : null]); if (!/\s/.test(v.lemma)) levels[v.lemma] = phase === P1 ? "A0" : "A1"; }
    const lessons = [];
    for (const l of u.lessons.filter((x) => x.type === "words")) lessons.push({ id: l.lesson_id, title: l.title, items: l.teaches || [] });
    for (const l of u.lessons.filter((x) => x.type === "apply")) { for (const p of l.phrases || []) pushCard([deck, p.war, p.en, "", "", null]); lessons.push({ id: l.lesson_id, title: l.title, kind: "apply", items: (l.phrases || []).map((p) => p.war) }); }
    const uu = { id: u.unit_id, name: u.title, hint: u.theme || u.can_do || "", lessons };
    if (u.story) { const q0 = (u.story.questions || [])[0]; uu.story = { id: u.story.story_id, title: u.story.title, titleEn: u.story.title_en || u.story.title, lines: (u.story.sentences || []).map((s) => ({ war: s.war, en: s.en })) }; if (q0) uu.story.q = { q: q0.q, options: q0.choices, answer: q0.answer_index }; }
    units.push(uu);
  }
  phases.push({ id: meta.id, name: meta.name, hint: meta.hint, units });
}
if (dups.length) console.log("• deduped shared phrases:", [...new Set(dups)].length);

const rowStr = (r) => "  " + JSON.stringify(r);
const out = `/* Waray (Challenger 2 · Daram — EXPANDED) — GENERATED by tools/build-challenger2.mjs.
   The denser redesign (Gemini API, self-audited + patched), a SEPARATE course for
   side-by-side comparison. Phases 1-2. Card shape: [deck,waray,english,subtext,say,example?].
   Decks c2u1..c2u11. */

export const SEED_CH2 = [
${seed.map(rowStr).join(",\n")},
];

export const FORGOTTEN_CH2 = new Set();

export const CHALLENGER2 = ${JSON.stringify(phases, null, 2)};

export const CH2_LEVELS = ${JSON.stringify(levels)};
`;
fs.writeFileSync("src/courses/waray/challenger2.js", out);
fs.writeFileSync("docs/sources/challenger-expanded-final.json", JSON.stringify(P1, null, 2));
fs.writeFileSync("docs/sources/challenger2-p2.json", JSON.stringify(P2, null, 2));
let w = 0, ph = 0; for (const r of seed) (/\s/.test(r[1]) ? ph++ : w++);
console.log(`✓ challenger2.js — ${phases.length} phases, ${phases.reduce((a, p) => a + p.units.length, 0)} units, ${w} word cards + ${ph} phrase cards`);
