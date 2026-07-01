/* Generate a whole PHASE of Challenger 2 from the course map, unit by unit, designing
   the vocabulary too (the map only has titles/can-dos). Recycles already-taught words,
   keeps our standards (markers out of vocab, per-word example, apply phrases, a review,
   a story), and forbids out-of-vocab CONTENT words in phrases so nothing needs post-hoc
   swapping. Writes docs/sources/challenger2-<phase>.json (display first; ingest later).
   Run: node tools/gen-challenger2-phase.mjs p2 */
import fs from "fs";
import { SEED_CH2 } from "../src/courses/waray/challenger2.js";
const KEY = fs.readFileSync(".gemini-key", "utf8").trim();
const MODEL = "gemini-2.5-flash";

// already-taught single words (recycle pool)
const KNOWN = [...new Set(SEED_CH2.filter((r) => !/\s/.test(r[1])).map((r) => r[1]))];

// ---- phase specs from the blueprint course_map ----
const PHASES = {
  p2: { id: "p2", title: "Daily Life in the Neighborhood", units: [
    { id: "u6", title: "Meeting the In-Laws", can_do: "Introduce yourself respectfully to extended family members." },
    { id: "u7", title: "Everyday Objects in the Yard", can_do: "Ask for common household items outside or in the kitchen." },
    { id: "u8", title: "Where are You Going? (Kain ka?)", can_do: "Answer the common neighborhood passing greeting." },
    { id: "u9", title: "Talking About the Weather", can_do: "Comment on the heat, rain, and wind with community members." },
    { id: "u10", title: "Time of Day and Simple Tasks", can_do: "Coordinate basic daily times for chores or casual meetings." },
    { id: "u11", title: "Phase 2 Review & Celebration", can_do: "Combine early neighborhood conversations smoothly.", review: true },
  ] },
};

const phaseId = process.argv[2] || "p2";
const PHASE = PHASES[phaseId];
if (!PHASE) { console.log("unknown phase", phaseId); process.exit(1); }

const MARKERS = "hi, in, it, hin, sin, an, nga, ngan, ha, han";
const MARKER_SET = new Set(MARKERS.split(",").map((s) => s.trim()));

function promptFor(u, knownNow) {
  const reviewNote = u.review
    ? `This is a REVIEW & CELEBRATION unit: introduce FEW or NO new words (0-3 max). Its lessons are all "apply" — mix Phase-1 and Phase-2 words into warm, celebratory phrases; the story is a small celebration scene.`
    : `Teach 12-16 NEW content words for this theme, in 2 "words" lessons of ~6-8 each, then 1 "apply" lesson (5-6 phrases) and 1 review "apply" lesson (4 phrases), then a story.`;
  return `Design ONE unit of an expanded spoken Waray-Waray course for older US adults retiring to Daram, Samar. Warm, practical, real island life. Output ONLY JSON for this one unit.

UNIT ${u.id}: "${u.title}". Goal: ${u.can_do}
${reviewNote}

ALREADY TAUGHT — recycle these freely in phrases and the story; do NOT re-introduce them in new_vocab:
${knownNow.join(", ")}

HARD RULES:
1. new_vocab = only translatable CONTENT words (nouns, verbs, adjectives, question words, numbers, pronouns). Each: {"lemma","pos","gloss","example":{"war","focus","en"},"difficulty":1-3,"register":"spoken","samar_variant":"","confirm":false,"note":""}. example = a natural 2-5 word Waray mini-phrase using the word; focus = the exact token that IS this word; en = natural English of the whole phrase. Set "confirm":true on any form you're unsure is real Daram usage.
2. Do NOT put bare markers/particles (${MARKERS}) in new_vocab — use them only inside grammar examples, phrases, and the story.
3. PHRASES & STORY must use ONLY words that are either taught above OR introduced in THIS unit's new_vocab (plus the allowed markers). Do NOT use any other content word. This is critical — every content word must be known.
4. Grammar case: absolutive pronouns (ako, ikaw, hiya, kita, kami, hira) as subjects; enclitics (ko, mo, niya) only as agent/possessor. Never an enclitic as a plain subject.
5. lessons carry "teaches":[] (words lessons) or "phrases":[{"war","en"}] (apply/review). story: 3-4 sentences (English each) + 1-2 multiple-choice questions whose choices are all plausible.
6. Spelling: lowercase lemmas, keep hyphens, use ng.

JSON shape:
{"unit_id":"${u.id}","phase_id":"${PHASE.id}","title":"${u.title}","theme":"","cefr":"A1","difficulty":1,"can_do":"${u.can_do}","new_grammar":[{"point":"","explain_en":"","examples":[{"war":"","en":""}]}],"new_vocab":[...],"lessons":[{"lesson_id":"${u.id}l1","title":"","type":"words","teaches":[]},{"lesson_id":"${u.id}l2","title":"","type":"words","teaches":[]},{"lesson_id":"${u.id}l3","title":"","type":"apply","phrases":[{"war":"","en":""}]},{"lesson_id":"${u.id}l4","title":"Unit ${u.id} Review","type":"apply","phrases":[{"war":"","en":""}]}],"story":{"story_id":"${u.id}s1","title":"","title_en":"","sentences":[{"war":"","en":""}],"questions":[{"q":"","choices":["","",""],"answer_index":0}]}}`;
}

async function callAPI(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  const body = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.6, maxOutputTokens: 22000 } };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await res.json();
  if (j.error) throw new Error(`API ${j.error.code}: ${j.error.message}`);
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  try { return JSON.parse(text); } catch (e) { return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); }
}

const norm = (t) => t.toLowerCase().replace(/[.,!?¿¡;:"']/g, "").trim();
function validate(u, out, knownNow) {
  const newWords = new Set((out.new_vocab || []).map((v) => v.lemma));
  const PARTICLES = ["ka", "ni", "na", "ba", "in", "an", "ini", "iton", "adto", "ito", "ngan", "tapos", "kay", "la", "man", "gud", "hin", "sin", "han", "ha", "may", "mayda", "pero", "ay", "para", "sige", "daram", "didi", "didto", "hira", "ngani", "gihap", "pa"];
  const allowed = new Set([...knownNow.map(norm), ...[...newWords].map(norm), ...MARKER_SET, ...PARTICLES]);
  const markerLeak = (out.new_vocab || []).filter((v) => MARKER_SET.has(v.lemma)).map((v) => v.lemma);
  const noEx = (out.new_vocab || []).filter((v) => !v.example?.war).map((v) => v.lemma);
  const reintro = [...newWords].filter((w) => knownNow.includes(w));
  const applyNoPhr = (out.lessons || []).filter((l) => l.type === "apply" && !(l.phrases || []).length).map((l) => l.lesson_id);
  // out-of-vocab content words across phrases + story (skip Capitalized = proper names)
  const oov = new Set();
  const texts = [];
  for (const l of out.lessons || []) for (const p of l.phrases || []) texts.push(p.war);
  for (const s of out.story?.sentences || []) texts.push(s.war);
  for (const t of texts) for (const raw of t.split(/\s+/)) {
    const tok = norm(raw);
    if (!tok || /^\d+$/.test(tok) || allowed.has(tok)) continue;
    if (/^[A-Z]/.test(raw)) continue; // proper name / sentence-initial — ignore
    oov.add(tok);
  }
  return { markerLeak, noEx, reintro, applyNoPhr, oov: [...oov] };
}

const known = [...KNOWN];
const results = [];
for (const u of PHASE.units) {
  let best = null, attempt = 0;
  while (attempt < 3) {
    attempt++;
    process.stdout.write(`→ ${u.id} ${u.title} (try ${attempt}) … `);
    const t0 = Date.now();
    let out;
    try { out = await callAPI(promptFor(u, known)); }
    catch (e) { console.log("ERR (truncated/parse) — retrying"); continue; }
    const v = validate(u, out, known);
    console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s — ${out.new_vocab?.length} new` +
      (v.markerLeak.length ? ` ⚠marker:${v.markerLeak}` : "") +
      (v.noEx.length ? ` ⚠noEx:${v.noEx}` : "") +
      (v.reintro.length ? ` ⚠reintro:${v.reintro}` : "") +
      (v.applyNoPhr.length ? ` ⚠emptyApply` : "") +
      (v.oov.length ? ` ⓘoov:${v.oov.slice(0, 8).join(",")}` : " ✓"));
    best = out; // keep latest valid-shape result
    if (!v.markerLeak.length && !v.noEx.length && !v.applyNoPhr.length) break; // oov is informational only
  }
  if (!best) { console.log(`  ✗ ${u.id} failed all attempts — skipping`); continue; }
  results.push(best);
  for (const w of (best.new_vocab || []).map((x) => x.lemma)) if (!known.includes(w)) known.push(w);
}

fs.writeFileSync(`docs/sources/challenger2-${phaseId}.json`, JSON.stringify({ phase_id: phaseId, detailed_units: results }, null, 2));
let total = 0; for (const u of results) total += (u.new_vocab || []).length;
console.log(`\n✓ saved docs/sources/challenger2-${phaseId}.json — ${results.length} units, ${total} new words`);
