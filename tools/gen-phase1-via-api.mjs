import fs from "fs";

const KEY = fs.readFileSync(".gemini-key", "utf8").trim();
const MODEL = process.argv[2] || "gemini-2.5-pro";

const PROMPT = `You previously designed a Duolingo-style Waray-Waray (Winaray) course — "Challenger / Daram" — for the Sulog app, for older English-speaking US adults relocating to Daram, Samar (true beginners; practical adult daily life; warm, gentle, confidence-building). You produced a Phase 1 and a Phase 2. This is a REVISION of your own Phase 1 — build on it, don't start over.

WHY: Your Phase 1 leans heavily on nouns and doesn't give learners the high-frequency function vocabulary needed to build simple sentences. Expand it so by the end of Phase 1 a beginner can SAY and UNDERSTAND basic everyday sentences, not just name things.

CONTINUITY CONSTRAINT (important): Phase 2 recycles Phase 1's words, so keep teaching ALL of the current Phase 1 vocabulary below. You may re-sequence and re-group it and add new units, but don't drop these words.
CURRENT PHASE 1 (build on this):
- maupay(good), aga(morning), kulop(afternoon), gab-i(evening/night), ako(I), ikaw(you), kamusta(hello/how are you)
- oo(yes), diri(no/not), hain(where), hiya(he/she), aadi(here), aada(there), didto(over there), dadi(come here)
- asawa(spouse), anak(child), nanay(mother), tatay(father), balay(house), akon(my/mine), Balite(village in Daram)
- gusto(want/like), tubig(water), kape(coffee), alayon(please), kaon(eat), inom(drink), kan-on(cooked rice)
- usa(one), duha(two), tulo(three), pira(how many), tagpira(how much each), palit(buy), mapalit(will buy), pesos(pesos)

WHAT TO ADD (categories — you choose the actual Daram/Samar words and forms):
- COMPLETE the core everyday spoken PRONOUN set: every common person form a beginner actually speaks — all the "I / you / he-she / we(incl) / we(excl) / you-all / they" forms AND their possessive/agent partners ("my/your/his/our/their", both the pre-posed and the short post-posed/enclitic forms). Spread across several small lessons, partnered so each lesson is immediately usable.
- TIME / "when" expressions — give this GENUINELY THOROUGH coverage, not just one or two words: times of day, plus everyday past / present / future "when" deixis (now, today, earlier, later, tomorrow, yesterday-type meanings). A small dedicated time unit is ideal.
- Core RESPONSE & politeness words (yes/no/answer/thanks/please), co-located with the questions they answer so a unit can hold a small back-and-forth.

PACING (older beginners): ~7 units total, ~55-65 new content words. Per "words" lesson ~3-5 new words. Per unit ~6-10 new words + 1-2 grammar points, a couple of "words" lessons then an "apply".

UNIT SHAPE (in order): a concrete "I can..." goal, then (1) a few type:"words" lessons (new words + 1-2 grammar points), (2) one or more type:"apply" phrase lessons combining the unit's words into short real sentences with NO brand-new vocab — this is where grammatical glue (markers, pronoun enclitics, linkers) lives in context, (3) a short story (uses this and earlier units' words; English per sentence + 2-3 MC questions). The app auto-builds a TYPE-TO-PRODUCE unit review from the unit's words.

RULES:
1. Markers are NOT vocabulary. new_vocab holds only translatable content words — nouns, verbs, adjectives, question words, numbers, AND pronouns. Do NOT put bare markers/particles (an/in, hi, hin, nga, ngan, ha, han) in new_vocab; put them in grammar examples, apply phrases, and the story.
2. Per-word example (required): every new_vocab entry includes example{war, focus, en} — a natural 2-4 word mini-phrase using the word, focus = the exact token that IS this word (for highlighting), en = a natural reading of the whole phrase that makes the meaning clear. Most important for pronouns/function words.
3. Mark any Daram form you're unsure about with "confirm": true.
Metadata: difficulty 1-5 (beginners 1-2), register spoken/school/literary, samar_variant if it differs. Lowercase lemmas, keep hyphens, use ng.

Output the revised Phase 1 (phase_id "p1") as a SINGLE complete JSON object — do not truncate, do not use "_continued". Schema:
{ "phase_id":"p1","detailed_units":[ { "unit_id":"u1","phase_id":"p1","title":"","theme":"","cefr":"A0","difficulty":1,"can_do":"I can ...","new_grammar":[{"point":"","explain_en":"","examples":[{"war":"","en":""}]}],"new_vocab":[{"lemma":"","pos":"","gloss":"","example":{"war":"","focus":"","en":""},"difficulty":1,"register":"spoken","samar_variant":"","confirm":false,"note":""}],"lessons":[{"lesson_id":"u1l1","title":"","type":"words","teaches":["l1","l2"],"grammar_focus":""},{"lesson_id":"u1l3","title":"","type":"apply","phrases":[{"war":"","en":""}]}],"story":{"story_id":"u1s1","title":"","title_en":"","sentences":[{"war":"","en":""}],"questions":[{"q":"","choices":["","",""],"answer_index":0}]} } ] }`;

const body = {
  contents: [{ role: "user", parts: [{ text: PROMPT }] }],
  generationConfig: { responseMimeType: "application/json", temperature: 0.6, maxOutputTokens: 65000 },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
console.log(`→ calling ${MODEL} …`);
const t0 = Date.now();
const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const j = await res.json();
console.log(`← ${res.status} in ${((Date.now()-t0)/1000).toFixed(1)}s`);
if (j.error) { console.log("API ERROR:", j.error.code, j.error.status, "-", j.error.message); process.exit(1); }
const cand = j.candidates?.[0];
const finish = cand?.finishReason;
const text = cand?.content?.parts?.map(p=>p.text).join("") || "";
console.log("finishReason:", finish, "| text length:", text.length);
if (j.usageMetadata) console.log("tokens:", JSON.stringify(j.usageMetadata));

let parsed;
try { parsed = JSON.parse(text); }
catch (e) {
  // salvage: slice to outermost braces
  const s = text.slice(text.indexOf("{"), text.lastIndexOf("}")+1);
  try { parsed = JSON.parse(s); } catch (e2) { console.log("PARSE FAILED:", e2.message); fs.writeFileSync("docs/sources/challenger-phase1-result.json", text); console.log("(raw text written for inspection)"); process.exit(1); }
}
fs.writeFileSync("docs/sources/challenger-phase1-result.json", JSON.stringify(parsed, null, 2));
let total=0; const rows=[];
for (const u of parsed.detailed_units||[]) {
  const v=(u.new_vocab||[]); total+=v.length;
  const conf=v.filter(x=>x.confirm).map(x=>x.lemma);
  const ph=(u.lessons||[]).filter(l=>l.type==="apply").reduce((a,l)=>a+(l.phrases||[]).length,0);
  rows.push(`  ${u.unit_id} ${u.title} | ${v.length}w, ${ph} phrases, story:${u.story?"y":"n"}${conf.length?", confirm:["+conf.join(",")+"]":""}`);
}
console.log(`\nSAVED. ${parsed.detailed_units?.length} units, ${total} words, _continued:${!!parsed._continued}`);
console.log(rows.join("\n"));
