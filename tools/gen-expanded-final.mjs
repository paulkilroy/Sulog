/* Upgrade the 85-word "expanded" blueprint to our standards, UNIT BY UNIT via the
   Gemini API (so the model can't budget-cut vocabulary). For each unit it KEEPS every
   listed content word, moves markers (hi/in/hin) out of vocab into grammar/phrases,
   adds a per-word example, fills apply lessons with phrases, and writes a story.
   Validates each unit (re-tries once if words were dropped) and merges to
   docs/sources/challenger-expanded-final.json. Does NOT touch challenger.js.
   Run: node tools/gen-expanded-final.mjs */
import fs from "fs";
const KEY = fs.readFileSync(".gemini-key", "utf8").trim();
const MODEL = "gemini-2.5-flash";

// ---- the blueprint, per unit. `vocab` = content words to KEEP (lemma|pos|gloss|samar|note).
//      `markers` = bare particles that must stay OUT of new_vocab (taught in context only).
//      `add` = words to introduce on top (the everyday enclitics the user wants). ----
const BLUEPRINT = [
  { id:"u1", title:"Greetings, Time, and Pronouns", theme:"Basic Social Encounters", can_do:"I can greet people at any time of day and use basic pronouns.",
    grammar:["Personal name marker 'hi' (before a person's name)","Inclusive 'kita' (you+I) vs exclusive 'kami' (not you)"],
    vocab:[["maupay","adjective","good","",""],["aga","noun","morning","",""],["udto","noun","noon","",""],["kulop","noun","afternoon","",""],["gab-i","noun","evening/night","",""],["yana","adverb","now","",""],["kaina","adverb","earlier (today)","",""],["unina","adverb","later (today)","nganina",""],["kamusta","interjection","how are you","kumusta",""],["ako","pronoun","I","",""],["ikaw","pronoun","you (sg)","",""],["hiya","pronoun","he/she","",""],["hira","pronoun","they","",""],["kami","pronoun","we (exclusive)","",""],["kita","pronoun","we (inclusive)","",""]],
    markers:["hi"], add:[["ko","pronoun","my / by me (enclitic)","","postposed agent: 'kape ko' = my coffee"],["mo","pronoun","your / by you (enclitic)","","postposed agent: 'gusto mo' = you want"]] },
  { id:"u2", title:"Family, Respect, and Pointers", theme:"Basic Locations and Relatives", can_do:"I can address extended family and pinpoint locations.",
    grammar:["Pointers: aadi (by me), aada (by you), didto (far from both)","Negator 'diri'"],
    vocab:[["nanay","noun","mother","",""],["tatay","noun","father","",""],["kuya","noun","older brother","","also any slightly older male"],["ate","noun","older sister","","also any slightly older female"],["bugto","noun","sibling","",""],["asawa","noun","spouse","",""],["anak","noun","child","",""],["apo","noun","grandchild","",""],["aadi","adverb","here","",""],["aada","adverb","there","",""],["didto","adverb","over there","",""],["hain","interrogative","where","",""],["oo","interjection","yes","",""],["diri","adverb","no/not","di",""],["dadi","verb","come here","kani",""],["ngadto","verb","go there","",""]],
    markers:[], add:[] },
  { id:"u3", title:"House and Daily Actions", theme:"Home Environment in Daram", can_do:"I can identify house parts and express basic daily actions.",
    grammar:["Common-noun marker 'in' (Samar: 'it') before general nouns","Possession: akon (my), imo (your sg), iyo (your pl)"],
    vocab:[["balay","noun","house","",""],["kwarto","noun","room","",""],["kusina","noun","kitchen","",""],["pantaw","noun","back porch","","wash area common in Samar homes"],["purtahan","noun","door","",""],["bintana","noun","window","",""],["natad","noun","yard","",""],["kudal","noun","fence","",""],["akon","pronoun","my/mine","",""],["imo","pronoun","your/yours (sg)","",""],["iyo","pronoun","your/yours (pl)","",""],["sulod","verb","enter","",""],["gawas","verb","exit / go out","",""],["lingkod","verb","sit","",""],["tindog","verb","stand","",""]],
    markers:["in"], add:[] },
  { id:"u4", title:"Food, Drinks, and Requests", theme:"Staple Needs and Politeness", can_do:"I can ask for specific foods and make polite requests.",
    grammar:["Wanting with 'Gusto ko ...'","Indefinite object marker 'hin' (Samar: 'sin') = 'some'"],
    vocab:[["tubig","noun","water","",""],["kape","noun","coffee","",""],["kan-on","noun","cooked rice","",""],["isda","noun","fish","",""],["utan","noun","vegetables","",""],["prutas","noun","fruit","",""],["tinapay","noun","bread","",""],["sabaw","noun","soup/broth","",""],["gusto","verb","want","",""],["kinahanglan","verb","need","",""],["alayon","interjection","please","",""],["salamat","interjection","thank you","",""],["kaon","verb","eat","",""],["inom","verb","drink","",""],["init","adjective","hot","",""],["matugnaw","adjective","cold","",""]],
    markers:["hin"], add:[] },
  { id:"u5", title:"Numbers and Money", theme:"Small Market Transactions", can_do:"I can count up to ten and handle basic transactions.",
    grammar:["Asking price with 'Tagpira ini?'","Future buying with 'mapalit'"],
    vocab:[["usa","numeral","one","",""],["duha","numeral","two","",""],["tulo","numeral","three","",""],["upat","numeral","four","",""],["lima","numeral","five","",""],["unom","numeral","six","",""],["pito","numeral","seven","",""],["walo","numeral","eight","",""],["siyam","numeral","nine","",""],["napulo","numeral","ten","",""],["pira","interrogative","how many","",""],["tagpira","interrogative","how much each","",""],["palit","verb","buy","",""],["mapalit","verb","will buy","",""],["bayad","verb","pay","",""],["sukli","noun","change (money)","",""],["kwarta","noun","money","",""],["pesos","noun","pesos","",""],["mahal","adjective","expensive","",""],["barato","adjective","cheap","",""]],
    markers:[], add:[] },
];

const MARKERS_ALL = "hi, in, it, hin, sin, an, nga, ngan, ha, han";

function promptFor(u) {
  const keep = [...u.vocab, ...u.add];
  const list = keep.map((v) => `- ${v[0]} (${v[1]}) = ${v[2]}${v[3] ? ` [Samar: ${v[3]}]` : ""}${v[4] ? ` — ${v[4]}` : ""}`).join("\n");
  return `You are finalizing ONE unit of a Waray-Waray (Winaray) course for older US adults retiring to Daram, Samar. Output ONLY JSON for this one unit.

UNIT ${u.id}: "${u.title}" — ${u.theme}. Can-do: ${u.can_do}.
Grammar points to teach (keep these): ${u.grammar.map((g) => `"${g}"`).join("; ")}.

KEEP EVERY ONE of these ${keep.length} content words in new_vocab — do NOT drop, merge, rename, or shrink the list. Use these exact lemmas and glosses:
${list}

HARD RULES:
1. new_vocab must contain EXACTLY these ${keep.length} words (no more, no fewer). Each entry:
   {"lemma","pos","gloss","example":{"war","focus","en"},"difficulty":1-2,"register":"spoken","samar_variant":"","confirm":false,"note":""}
   - example = a natural 2-5 word Waray mini-phrase USING the word; focus = the exact token in it that IS this word; en = natural English of the whole phrase.
   - Keep the Samar variant in samar_variant; set "confirm":true on any form you're unsure is the real Daram usage.
2. Do NOT put bare markers/particles (${MARKERS_ALL}) in new_vocab. ${u.markers.length ? `This unit's grammar introduces the marker(s) ${u.markers.join(", ")} — teach them ONLY inside new_grammar examples, the apply phrases, and the story.` : ""}
3. GRAMMAR CASE — be correct: use the absolutive pronouns (ako, ikaw, hiya, kita, kami, hira) as the SUBJECT of equational/adjectival sentences ("Maupay ako" = I am good, NOT "Maupay ko"). Use the enclitics ko/mo only as agent/possessor ("kape ko" = my coffee, "gusto mo" = you want). Never use ko/mo as a plain subject.
4. lessons: split the words into 2 "words" lessons of roughly equal size; then one "apply" lesson with 4-6 short real phrases (NO brand-new vocabulary — only this unit's + obviously-earlier words); then a "Unit ${u.id} Review" lesson (type:"apply") with 3-4 phrases. Apply/review lessons carry "phrases":[{"war","en"}] and "teaches":[].
5. story: 3-4 connected sentences (English each) using this unit's words + 2 multiple-choice questions.
6. Spelling: lowercase lemmas, keep hyphens, use ng. Warm, real, everyday.

JSON shape (this one unit only):
{"unit_id":"${u.id}","phase_id":"p1","title":"${u.title}","theme":"${u.theme}","cefr":"A0","difficulty":1,"can_do":"${u.can_do}","new_grammar":[{"point":"","explain_en":"","examples":[{"war":"","en":""}]}],"new_vocab":[...],"lessons":[{"lesson_id":"${u.id}l1","title":"","type":"words","teaches":[],"grammar_focus":""},{"lesson_id":"${u.id}l2","title":"","type":"words","teaches":[],"grammar_focus":""},{"lesson_id":"${u.id}l3","title":"","type":"apply","phrases":[{"war":"","en":""}],"teaches":[],"grammar_focus":""},{"lesson_id":"${u.id}l4","title":"Unit ${u.id} Review","type":"apply","phrases":[{"war":"","en":""}],"teaches":[],"grammar_focus":"Full Unit Review"}],"story":{"story_id":"${u.id}s1","title":"","title_en":"","sentences":[{"war":"","en":""}],"questions":[{"q":"","choices":["","",""],"answer_index":0}]}}`;
}

async function callAPI(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  const body = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.5, maxOutputTokens: 16000 } };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await res.json();
  if (j.error) throw new Error(`API ${j.error.code} ${j.error.status}: ${j.error.message}`);
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  try { return JSON.parse(text); } catch (e) { return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); }
}

const MARKER_SET = new Set(MARKERS_ALL.split(",").map((s) => s.trim()));
function validate(u, out) {
  const want = new Set([...u.vocab, ...u.add].map((v) => v[0]));
  const got = new Set((out.new_vocab || []).map((v) => v.lemma));
  const missing = [...want].filter((w) => !got.has(w));
  const markerLeak = (out.new_vocab || []).filter((v) => MARKER_SET.has(v.lemma)).map((v) => v.lemma);
  const noEx = (out.new_vocab || []).filter((v) => !v.example?.war).map((v) => v.lemma);
  const applyNoPhr = (out.lessons || []).filter((l) => l.type === "apply" && !(l.phrases || []).length).map((l) => l.lesson_id);
  return { missing, markerLeak, noEx, applyNoPhr };
}

const results = [];
for (const u of BLUEPRINT) {
  let out, v, attempt = 0;
  while (attempt < 2) {
    attempt++;
    process.stdout.write(`→ ${u.id} (attempt ${attempt}) … `);
    const t0 = Date.now();
    out = await callAPI(promptFor(u));
    v = validate(u, out);
    console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s — vocab ${out.new_vocab?.length}/${u.vocab.length + u.add.length}` +
      (v.missing.length ? ` ⚠ missing: ${v.missing.join(",")}` : " ✓") +
      (v.markerLeak.length ? ` ⚠ marker-in-vocab: ${v.markerLeak.join(",")}` : "") +
      (v.applyNoPhr.length ? ` ⚠ empty-apply: ${v.applyNoPhr.join(",")}` : ""));
    if (!v.missing.length && !v.markerLeak.length && !v.applyNoPhr.length) break;
  }
  results.push(out);
}

const merged = { phase_id: "p1", detailed_units: results };
fs.writeFileSync("docs/sources/challenger-expanded-final.json", JSON.stringify(merged, null, 2));
let total = 0; for (const u of results) total += (u.new_vocab || []).length;
console.log(`\n✓ saved docs/sources/challenger-expanded-final.json — ${results.length} units, ${total} words`);
