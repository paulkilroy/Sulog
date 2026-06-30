/* Ask Gemini to self-audit the finalized expanded Phase 1: feed it the JSON + the
   issue PATTERNS we found, and have it scan ALL units for the same/similar problems
   and report a structured list of proposed changes (NOT a rewrite). Saves the report
   to docs/sources/challenger-expanded-audit.json. Run: node tools/audit-expanded.mjs */
import fs from "fs";
const KEY = fs.readFileSync(".gemini-key", "utf8").trim();
const MODEL = "gemini-2.5-flash";
const COURSE = fs.readFileSync("docs/sources/challenger-expanded-final.json", "utf8");

const prompt = `You produced this finalized Phase 1 of a Waray-Waray (Winaray) course for older US adults in Daram, Samar. I reviewed it and found the specific issues below. Your job: (1) propose a fix for EACH of these exact issues, and (2) SCAN ALL FIVE UNITS for the same patterns and report any others. Do NOT rewrite the whole course — just report a structured change list.

THE SPECIFIC ISSUES I FOUND IN YOUR OUTPUT (fix these, then find similar):
1. [u1] Bare-fragment vocab examples with no predicate — yana: "Hiya yana" ("he/she now"); kaina: "Ako kaina" ("I earlier"); unina: "Kita unina" ("we later"). These aren't real utterances.
2. [u1] Illogical example — ako: "Kamusta ako?" = "How am I?" (you don't ask how you yourself are).
3. [u3] The story is missing "title_en" (it renders as "undefined").
4. [u5] Number examples teach counting with CONTENT nouns that are never taught anywhere: mangga, kamatis, saging, itlog, buko, pakwan. (Counting objects should use already-taught nouns like isda, tinapay, balay, anak.)
5. [stories] Story lines use content/function words not in any vocab: mayda, tapos, adto, ngan. (Markers like hi/in/ha/nga/ka are fine; these others I want you to assess.)
NOTE: a separate earlier draft had the grammar error "Maupay ko" (should be "Maupay ako") — this draft seems clean, but double-check no enclitic ko/mo is ever used as a subject.

Now scan for these PATTERNS across all units:
A) FRAGMENT EXAMPLES — an example.war that is not a natural, complete mini-utterance (e.g. a pronoun + adverb with no predicate: "Hiya yana" = "he/she now"; "Ako kaina" = "I earlier"). Propose a natural replacement that has a real predicate, using only words taught in that unit or earlier.
B) ODD / ILLOGICAL MEANING — examples, phrases, or story lines whose meaning is unnatural, pragmatically weird, or wrong (e.g. "Kamusta ako?" = "How am I?"; "Gusto mo gab-i?" = "do you want evening?"). Propose a sensible replacement.
C) MISSING / EMPTY FIELDS — any required field blank or absent (e.g. a story missing "title_en"). Propose the value.
D) OUT-OF-VOCABULARY CONTENT WORDS — CONTENT words (nouns, verbs, adjectives) used in any example.war, apply/review phrase, or story sentence that are NOT taught in new_vocab of this or an earlier unit (e.g. number examples using "mangga", "itlog", "kamatis" which are never taught; story words like "mayda", "tapos"). IMPORTANT: bare grammatical markers/particles (hi, in, it, hin, sin, an, nga, ngan, ha, han, ka, ni, na) are ALLOWED in context and must NOT be flagged. Only flag untaught CONTENT words. For each, propose either swapping to a taught word or note it is acceptable exposure.
E) GRAMMAR / CASE ERRORS — especially an enclitic pronoun (ko, mo) used as the SUBJECT of an equational/adjectival sentence instead of the absolutive (ako, ikaw): "Maupay ko" is WRONG ("Maupay ako" is right). Also wrong markers/linkers. Propose the corrected form.

For each finding, give: unit_id, a location string (the word lemma, lesson_id, or "story"), the category letter, the exact current text, your proposed replacement, and a one-line reason. Be thorough but precise — only real problems.

Output ONLY JSON in this shape:
{"audit":[{"unit_id":"u1","location":"yana (vocab example)","category":"A","current":"Hiya yana","proposed":"Maupay kita yana","reason":"fragment had no predicate"}], "summary":"one or two sentences on overall quality and how many issues by category"}

Here is the course JSON to audit:
${COURSE}`;

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
const body = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.3, maxOutputTokens: 20000 } };
console.log("→ asking Gemini to audit …");
const t0 = Date.now();
const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const j = await res.json();
console.log(`← ${res.status} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
if (j.error) { console.log("API ERROR:", j.error.code, j.error.status, j.error.message); process.exit(1); }
const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
let rep; try { rep = JSON.parse(text); } catch (e) { rep = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); }
fs.writeFileSync("docs/sources/challenger-expanded-audit.json", JSON.stringify(rep, null, 2));

const byCat = {};
for (const a of rep.audit || []) byCat[a.category] = (byCat[a.category] || 0) + 1;
console.log(`\n✓ ${(rep.audit || []).length} proposed changes — by category: ${JSON.stringify(byCat)}`);
console.log("summary:", rep.summary || "(none)");
console.log("\n— proposed changes —");
for (const a of rep.audit || []) console.log(`[${a.category}] ${a.unit_id} · ${a.location}\n    "${a.current}" → "${a.proposed}"\n    (${a.reason})`);
