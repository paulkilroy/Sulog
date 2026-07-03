/* Ask Gemini to mine the Challenger 2 course for DICTIONARY PHRASES (fixed/idiomatic
   expressions with their own meaning) vs compositional sentences, and to propose the
   missing essential Daram-Waray survival phrases by category. Returns a reviewable diff
   (extracted + suggested). Does NOT touch any course/dictionary — review first.
   Run: node tools/mine-phrase-dict.mjs */
import fs from "fs";

const KEY = fs.readFileSync(".gemini-key", "utf8").trim();
const P1 = JSON.parse(fs.readFileSync("docs/courses/challenger2/phase1.json", "utf8"));
const P2 = JSON.parse(fs.readFileSync("docs/courses/challenger2/phase2.json", "utf8"));

// collect every multi-word item the course uses (dedup)
const items = [], seen = new Set();
const add = (war, en) => { if (!war || !/\s/.test(war.trim())) return; const k = war.trim(); if (seen.has(k)) return; seen.add(k); items.push(`${k}  —  ${en || ""}`); };
for (const P of [P1, P2]) for (const u of P.detailed_units) {
  for (const v of (u.new_vocab || [])) if (v.example?.war) add(v.example.war, v.example.en);
  for (const l of (u.lessons || [])) for (const p of (l.phrases || [])) add(p.war, p.en);
  if (u.story) for (const s of (u.story.sentences || [])) add(s.war, s.en);
}

const prompt = `You are a Waray-Waray (Winaray) expert helping build a phrasebook DICTIONARY for
older US English-speaking adults relocating to Daram, Samar, Philippines. Use everyday SPOKEN
Daram/Samar Waray.

We separate two kinds of multi-word item:
• DICTIONARY PHRASE — a fixed/idiomatic expression with its OWN meaning, learned as a unit and
  worth looking up (e.g. "Kumusta ka?" = How are you?, "Damo nga salamat" = Thank you very much,
  "Diri ako maaram" = I don't know, "Diri ako nakakaintindi" = I don't understand). These go in
  the dictionary. Note "I don't know" and "I don't understand" are DIFFERENT phrases.
• COMPOSITIONAL SENTENCE — meaning is just the sum of its words, a throwaway example
  (e.g. "Aadi in balay" = The house is here, "Mapalit ako tulo ka isda" = I will buy three fish).
  NOT a dictionary phrase.

TASK 1 — CLASSIFY & EXTRACT. Below are the multi-word items from our course. Return ONLY the ones
that are DICTIONARY PHRASES, cleaned to their citation form (drop personal names, normalize).

TASK 2 — SUGGEST MISSING. Propose additional essential Daram-Waray DICTIONARY PHRASES a newcomer
needs that are NOT already covered, organized by category. Aim for breadth — target 100-150 across
categories. You MUST include a "Getting unstuck" category (at least: I don't know, I don't
understand, I understand, Is it clear?, Please repeat that, Please speak slowly, What is this
called?, How do you say ___?, Wait a moment, I forgot). Other categories to cover: Greetings &
courtesy, Yes/No & basic responses, Directions & places, Shopping & money, Food & eating,
Health & help/emergency, Social & small talk, Time & scheduling, Home & daily life, Weather,
Transportation & getting around.

Everyday spoken Daram/Samar register. Prefer native Waray; where a Spanish/Tagalog loan is what
people actually say, give it but note it. Set "confirm": true for anything you are not fully
certain is the natural Daram form.

Return STRICT JSON, no prose:
{
  "extracted": [ { "war": "...", "en": "...", "category": "...", "note": "", "confirm": false } ],
  "suggested": [ { "war": "...", "en": "...", "category": "...", "register": "casual", "note": "", "confirm": false } ]
}

COURSE ITEMS (${items.length}):
${items.join("\n")}`;

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.4, maxOutputTokens: 32000 },
  }),
});
const j = await res.json();
if (!res.ok || !j.candidates) { console.error("API error:", JSON.stringify(j).slice(0, 600)); process.exit(1); }
const text = j.candidates[0].content.parts[0].text;
let data;
try { data = JSON.parse(text); } catch (e) { fs.writeFileSync("docs/word-bank/phrase-dict-diff.raw.txt", text); console.error("parse failed — raw saved to phrase-dict-diff.raw.txt"); process.exit(1); }

fs.writeFileSync("docs/word-bank/phrase-dict-diff.json", JSON.stringify(data, null, 2));
const ex = data.extracted || [], sg = data.suggested || [];
const cats = {}; for (const s of sg) cats[s.category] = (cats[s.category] || 0) + 1;
console.log(`✓ phrase-dict-diff.json — ${ex.length} extracted from course, ${sg.length} suggested new`);
console.log(`  extracted confirm-flagged: ${ex.filter((x) => x.confirm).length}`);
console.log(`  suggested by category:`);
for (const [c, n] of Object.entries(cats).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(3)}  ${c}`);
