/* Build the SECOND Challenger course ("challenger2") from the expanded blueprint,
   applying the agreed fixes from the Gemini self-audit + our structural decisions:
   - clean fixes: fragment/illogical examples, u3 title_en, untaught-noun swaps
   - structural: move enclitics ko/mo from u1 -> u4 (where there are nouns to attach
     to), add niya (3rd-person agent) to u4
   Emits src/courses/waray/challenger2.js (decks c2u1..c2u5). Does NOT touch the
   original challenger.js.  Run: node tools/build-challenger2.mjs */
import fs from "fs";
const o = JSON.parse(fs.readFileSync("docs/sources/challenger-expanded-final.json", "utf8"));
const U = {}; for (const u of o.detailed_units) U[u.unit_id] = u;

// walk every Waray string in a unit (examples, phrases, story, grammar) and map it
const mapWar = (u, fn) => {
  for (const v of u.new_vocab) if (v.example) v.example.war = fn(v.example.war);
  for (const l of u.lessons) for (const p of (l.phrases || [])) p.war = fn(p.war);
  for (const g of u.new_grammar || []) for (const e of (g.examples || [])) e.war = fn(e.war);
  if (u.story) { for (const s of u.story.sentences || []) s.war = fn(s.war); }
};
const swapWords = (u, pairs) => mapWar(u, (w) => {
  for (const [a, b] of pairs) w = w.replace(new RegExp(`\\b${a}\\b`, "g"), b);
  return w;
});

// ---- u5: untaught counting nouns -> already-taught nouns; "May kwarta" -> "Akon kwarta"
swapWords(U.u5, [["mangga", "isda"], ["kamatis", "tinapay"], ["saging", "isda"], ["itlog", "tinapay"], ["buko", "anak"], ["pakwan", "tinapay"], ["May kwarta", "Akon kwarta"], ["may kwarta", "akon kwarta"]]);

// ---- u3: untaught content words + title_en
swapWords(U.u3, [["sangkay", "anak"], ["malipayon", "maupay"], ["Maupay nga adlaw", "Maupay nga aga"], ["mayda kudal", "in kudal"]]);
if (U.u3.story && !U.u3.story.title_en) U.u3.story.title_en = "At My House";
// global guard: never leave a blank title_en
for (const u of o.detailed_units) if (u.story && !u.story.title_en) u.story.title_en = u.story.title;

// ---- u4: same untaught-word cleanup
swapWords(U.u4, [["malipayon", "maupay"]]);

// ---- structural: move ko/mo from u1 -> u4, add niya to u4 ----
const ENC = {
  ko:   { lemma: "ko", pos: "pronoun", gloss: "my / by me (enclitic)", example: { war: "Kape ko", focus: "ko", en: "My coffee" }, difficulty: 1, register: "spoken", samar_variant: "", confirm: false, note: "Post-posed agent/possessor of ako." },
  mo:   { lemma: "mo", pos: "pronoun", gloss: "your / by you (enclitic)", example: { war: "Gusto mo?", focus: "mo", en: "Do you want it?" }, difficulty: 1, register: "spoken", samar_variant: "", confirm: false, note: "Post-posed agent/possessor of ikaw." },
  niya: { lemma: "niya", pos: "pronoun", gloss: "his/her / by him-her", example: { war: "Gusto niya isda", focus: "niya", en: "He/she wants fish" }, difficulty: 2, register: "spoken", samar_variant: "", confirm: true, note: "Agent/possessor of hiya — confirm Daram form." },
};
U.u1.new_vocab = U.u1.new_vocab.filter((v) => v.lemma !== "ko" && v.lemma !== "mo");
U.u4.new_vocab.push(ENC.ko, ENC.mo, ENC.niya);

// ---- u1 vocab example fixes (fragments + illogical) ----
const setEx = (u, lemma, ex) => { const v = u.new_vocab.find((x) => x.lemma === lemma); if (v) v.example = ex; };
setEx(U.u1, "yana",  { war: "Maupay kita yana",  focus: "yana",  en: "We are good now" });
setEx(U.u1, "kaina", { war: "Maupay hira kaina", focus: "kaina", en: "They were good earlier" });
setEx(U.u1, "unina", { war: "Maupay ako unina", focus: "unina", en: "I'll be good later" });
setEx(U.u1, "ako",   { war: "Ako hi Maria",      focus: "Ako",   en: "I am Maria" });

// ---- u1 apply/story rewritten ko/mo-free (only u1 words: greetings, time, pronouns) ----
const u1apply = U.u1.lessons.find((l) => l.lesson_id === "u1l3");
const u1review = U.u1.lessons.find((l) => l.lesson_id === "u1l4");
if (u1apply) u1apply.phrases = [
  { war: "Maupay nga aga, hi Maria.", en: "Good morning, Maria." },
  { war: "Kamusta ikaw yana?", en: "How are you now?" },
  { war: "Maupay ako yana.", en: "I am good now." },
  { war: "Maupay hira kaina.", en: "They were good earlier." },
  { war: "Maupay kita unina!", en: "We'll be good later (you and I)!" },
];
if (u1review) u1review.phrases = [
  { war: "Maupay nga gab-i, hi Juan.", en: "Good evening, Juan." },
  { war: "Kamusta hira? Maupay kami.", en: "How are they? We're good (not you)." },
  { war: "Maupay kita yana.", en: "We are good now (you and I)." },
];
U.u1.story = {
  story_id: "u1s1", title: "Kamusta Kita?", title_en: "How Are We?",
  sentences: [
    { war: "Maupay nga aga. Ako hi Maria.", en: "Good morning. I am Maria." },
    { war: "Kamusta ikaw yana?", en: "How are you now?" },
    { war: "Maupay ako. Maupay kita yana!", en: "I am good. We are good now!" },
  ],
  questions: [
    { q: "What time of day is it?", choices: ["Morning", "Noon", "Evening"], answer_index: 0 },
    { q: "How is Maria?", choices: ["Tired", "Good", "Sad"], answer_index: 1 },
  ],
};

// ---- re-split the words-lessons for u1 (15) and u4 (19) to match the new vocab ----
const wordsLemmas = (u) => u.new_vocab.map((v) => v.lemma);
const resplit = (u, titles) => {
  const ws = u.lessons.filter((l) => l.type === "words");
  const lemmas = wordsLemmas(u);
  const half = Math.ceil(lemmas.length / ws.length);
  ws.forEach((l, i) => { l.teaches = lemmas.slice(i * half, (i + 1) * half); if (titles[i]) l.title = titles[i]; });
};
resplit(U.u1, ["Times of Day", "Pronouns & Identity"]);
resplit(U.u4, ["Kitchen Staples", "Wants, Actions & Pronouns"]);

// ============ emit challenger2.js ============
const seed = [], cp1Units = [], levels = {};
o.detailed_units.forEach((u, i) => {
  const deck = `c2u${i + 1}`;
  for (const v of u.new_vocab) {
    seed.push([deck, v.lemma, v.gloss, v.note || "", "", v.example ? { war: v.example.war, focus: v.example.focus, en: v.example.en } : null]);
    if (!/\s/.test(v.lemma)) levels[v.lemma] = "A0";
  }
  const lessons = [];
  for (const l of u.lessons.filter((x) => x.type === "words")) lessons.push({ id: l.lesson_id, title: l.title, items: l.teaches });
  for (const l of u.lessons.filter((x) => x.type === "apply")) {
    for (const p of l.phrases || []) seed.push([deck, p.war, p.en, "", "", null]);
    lessons.push({ id: l.lesson_id, title: l.title, kind: "apply", items: (l.phrases || []).map((p) => p.war) });
  }
  const unit = { id: u.unit_id, name: u.title, hint: u.theme || u.can_do || "", lessons };
  if (u.story) {
    const q0 = (u.story.questions || [])[0];
    unit.story = { id: u.story.story_id, title: u.story.title, titleEn: u.story.title_en, lines: (u.story.sentences || []).map((s) => ({ war: s.war, en: s.en })) };
    if (q0) unit.story.q = { q: q0.q, options: q0.choices, answer: q0.answer_index };
  }
  cp1Units.push(unit);
});

// dedupe SEED by waray (lessons resolve by text; last wins otherwise)
const seen = new Set(), dups = [];
const seedDedup = seed.filter((r) => { if (seen.has(r[1])) { dups.push(r[1]); return false; } seen.add(r[1]); return true; });
if (dups.length) console.log("⚠ duplicate waray dropped:", [...new Set(dups)].join(", "));

const cp1 = { id: "c2p1", name: "First Steps in Daram (Expanded)", hint: "Denser greetings, family, home, food, numbers — the expanded build", units: cp1Units };
const rowStr = (r) => "  " + JSON.stringify(r);
const out = `/* Waray (Challenger 2 · Daram — EXPANDED) — GENERATED by tools/build-challenger2.mjs.
   The denser 8-10-words/lesson redesign (Gemini API, self-audited + patched), kept as a
   SEPARATE course so it can run side-by-side with the original Challenger. Phase 1 only.
   Card shape: [deck, waray, english, subtext, respelling, example?]. Decks c2u1..c2u5. */

export const SEED_CH2 = [
${seedDedup.map(rowStr).join(",\n")},
];

export const FORGOTTEN_CH2 = new Set();

export const CHALLENGER2 = ${JSON.stringify([cp1], null, 2)};

export const CH2_LEVELS = ${JSON.stringify(levels)};
`;
fs.writeFileSync("src/courses/waray/challenger2.js", out);
fs.writeFileSync("docs/sources/challenger-expanded-final.json", JSON.stringify(o, null, 2)); // persist patched
let words = 0, phrases = 0; for (const r of seedDedup) (/\s/.test(r[1]) ? phrases++ : words++);
console.log(`✓ wrote challenger2.js — ${cp1Units.length} units, ${words} word cards + ${phrases} phrase cards`);
cp1Units.forEach((u) => console.log(`  ${u.id} ${u.name}: ${u.lessons.filter((l) => l.kind !== "apply").reduce((a, l) => a + l.items.length, 0)} words, ${u.lessons.filter((l) => l.kind === "apply").length} apply`));
