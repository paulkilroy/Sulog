/* Ask Gemini for IDIOMATIC Waray expressions — phrases whose English meaning you could
   NOT guess word-by-word (the dictionary's phrase layer), NOT compositional sentences.
   Anchored on the phrases both courses already teach (so it doesn't repeat or reinvent),
   with a `literal` field to prove non-compositionality. Everything comes back confirm:true
   (Gemini's Waray is unreliable — the whole set is pending Ella).
   Output: docs/word-bank/phrase-idioms.json (review artifact). Run: node tools/mine-phrase-dict.mjs */
import fs from "fs";

const KEY = fs.readFileSync(".gemini-key", "utf8").trim();
const cards = (await import("../src/courses/waray/cards.js")).SEED;
const P1 = JSON.parse(fs.readFileSync("docs/courses/challenger2/phase1.json", "utf8"));
const P2 = JSON.parse(fs.readFileSync("docs/courses/challenger2/phase2.json", "utf8"));

// every multi-word phrase we already teach, across BOTH courses (the "don't repeat" anchor)
const existing = new Set();
for (const r of cards) if (/\s/.test(r[1])) existing.add(r[1].trim());
for (const P of [P1, P2]) for (const u of P.detailed_units) {
  for (const v of (u.new_vocab || [])) if (v.example?.war && /\s/.test(v.example.war)) existing.add(v.example.war.trim());
  for (const l of (u.lessons || [])) for (const p of (l.phrases || [])) if (/\s/.test(p.war)) existing.add(p.war.trim());
  if (u.story) for (const s of (u.story.sentences || [])) if (/\s/.test(s.war)) existing.add(s.war.trim());
}

const prompt = `You are a Waray-Waray (Winaray) expert building a phrasebook DICTIONARY for older US
English-speaking adults relocating to Daram, Samar, Philippines. Everyday SPOKEN Daram/Samar Waray.

Return IDIOMATIC EXPRESSIONS ONLY — fixed phrases whose English meaning you could NOT guess from
the individual words. The learner must memorize each as a unit. The test: the literal word-for-word
is different from the actual meaning, OR it is a fixed social/discourse formula.

GOLD examples of exactly what we want:
• "Maupay kun sugad"  — literal "good if so"        → means "I hope so / if you say so"
• "Damo nga salamat"  — literal "many thanks"        → "thank you very much"
• "Walang anuman"     — literal "nothing at all"     → "you're welcome" (Tagalog, but what people say)
• "Hinay-hinay la"    — literal "slowly-slowly just" → "take it easy / take your time"
• "Waray pa"          — literal "none still"          → "not yet"
• "Waray ako makabaro"— literal "I have no news"      → "I don't understand"
• "Sige, sunod na la" — literal "okay, next already"  → "goodbye, see you next time"

DO NOT return:
• literal greetings ("Maupay nga aga" = good morning)
• plain compositional sentences ("Aadi in balay" = the house is here; "Mapalit ako isda" = I'll buy fish)
• one-word commands
• anything already in the EXISTING list at the bottom (don't repeat OR offer a competing form for it)

Give NEW idioms a Daram newcomer needs — especially discourse/pragmatic ones: never mind, it's up to
you, whatever you like, no problem, good luck, be careful, long time no see, what a pity, of course,
maybe/perhaps, more or less, little by little, God willing, so-so, that's enough, hurry up, take care,
by the way, etc. Prefer native Waray; if the everyday form is a Tagalog/Spanish borrowing, give it and
set "loan".

For EACH return: { "war", "en" (meaning), "literal" (word-for-word gloss), "category", "loan": "" | "Tagalog" | "Spanish", "confirm": true }
Set "confirm": true on ALL of them (a native speaker verifies everything).

Return STRICT JSON, no prose: { "idioms": [ ... ] }

EXISTING — do NOT repeat or compete with these (${existing.size}):
${[...existing].join("\n")}`;

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.6, maxOutputTokens: 32000 } }),
});
const j = await res.json();
if (!res.ok || !j.candidates) { console.error("API error:", JSON.stringify(j).slice(0, 600)); process.exit(1); }
let data; try { data = JSON.parse(j.candidates[0].content.parts[0].text); }
catch (e) { fs.writeFileSync("docs/word-bank/phrase-idioms.raw.txt", j.candidates[0].content.parts[0].text); console.error("parse failed — raw saved"); process.exit(1); }

const idioms = (data.idioms || []).filter((x) => x.war && !existing.has(x.war.trim())); // drop any that echo existing
fs.writeFileSync("docs/word-bank/phrase-idioms.json", JSON.stringify({ idioms }, null, 2));
const cats = {}, loans = {}; for (const x of idioms) { cats[x.category] = (cats[x.category] || 0) + 1; if (x.loan) loans[x.loan] = (loans[x.loan] || 0) + 1; }
console.log(`✓ phrase-idioms.json — ${idioms.length} idioms (anchored on ${existing.size} existing phrases)`);
console.log(`  loans: ${Object.entries(loans).map(([k, v]) => k + ":" + v).join(" ") || "none"}`);
console.log(`  by category:`); for (const [c, n] of Object.entries(cats).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(3)}  ${c}`);
