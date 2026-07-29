/* Extract Peace Corps Phase 1 (Lessons 1-10) from noisy OCR into structured blocks via
   Gemini, and emit docs/schema/pc-course.sql (NOT loaded into the live DB — for review).
   node scratchpad/pc-extract.mjs [oneLessonNumberToPreview] */
import fs from "fs";
const KEY = fs.readFileSync("/Users/paulkilroy/dev/Sulog/.gemini-key", "utf8").trim();
const t = fs.readFileSync("/Users/paulkilroy/dev/Sulog/docs/sources/peace-corps/peace-corps-full-ocr.txt", "utf8");
const parts = t.split(/===\s*PAGE\s*(\d+)\s*===/); const pages = {};
for (let i = 1; i < parts.length; i += 2) pages[+parts[i]] = parts[i + 1];

// Lesson -> physical page range (Phase 1, clean numbering)
const LESSONS = [
  [1, "Lesson 1 — I-Class Personal Pronouns", 1, 3],
  [2, "Lesson 2 — I-Class Markers", 4, 7],
  [3, "Lesson 3 — I-Class Demonstratives", 8, 11],
  [4, "Lesson 4 — II-Class Pronouns & Markers", 12, 15],
  [5, "Lesson 5 — Ma- Actor Focus (verbs)", 16, 19],
  [6, "Lesson 6 — Ma- Focus + Object & Location", 20, 23],
  [7, "Lesson 7 — Location & Beneficiary", 24, 28],
  [8, "Lesson 8 — III-Class Personal Pronouns", 29, 34],
  [9, "Lesson 9 — III-Class ha+ Beneficiary", 35, 38],
  [10, "Lesson 10 — Review & Test", 39, 41],
  [11, "Lesson 11", 42, 45],
  [12, "Lesson 12", 46, 50],
  [13, "Lesson 13", 51, 56],
  [14, "Lesson 14", 57, 61],
  [15, "Lesson 15", 62, 67],
  [16, "Lesson 16", 68, 72],
  [17, "Lesson 17", 73, 77],
  [18, "Lesson 18", 78, 84],
  [19, "Lesson 19", 85, 90],
  [20, "Lesson 20 — Review Test", 91, 96],
  [21, "Lesson 21", 97, 100],
  [22, "Lesson 22", 101, 107],
  [23, "Lesson 23", 108, 114],
];

const prompt = (ocr) => `You are digitizing a vetted Peace Corps Waray-Waray lesson from NOISY OCR into clean
structured JSON for a language app. Fix obvious OCR errors (l->1, o with grave->o, dropped/misplaced
accents, jumbled multi-column tables) and reconstruct garbled charts. Keep Waray faithful; preserve
stress accents where shown; give faithful English.

Return STRICT JSON, blocks IN THE ORDER they appear, only those present. CAPTURE EVERY SECTION,
including the Oral Exercise and Written Exercise sections (do NOT skip them):
{ "title":"short lesson title",
  "blocks":[
    {"type":"grammar","title":"...","prose":"explanatory text as markdown; render any chart as a markdown table","formula":"a slot-formula if given, else \\"\\""},
    {"type":"examples","items":[{"war":"Waray sentence","en":"English"}]},
    {"type":"note","text":"a hint/note if present"},
    {"type":"vocab","items":[{"waray":"clean citation form WITHOUT any leading hyphen","meaning":"English","pos":"noun|verb|adj|pron|marker|adv"}]},
    {"type":"oral_exercise","instruction":"the drill's instruction line","items":[{"war":"Waray","en":"English"}]},
    {"type":"written_exercise","instruction":"the instruction","items":[{"war":"Waray","en":"English"}]}
  ]}
CRITICAL:
- In vocab, STRIP the leading hyphen the book uses to mark verb roots and instead set pos:"verb"
  (e.g. "-tútdò" -> {"waray":"tutdo","meaning":"to teach","pos":"verb"}). Keep stress accents.
- The Oral/Written Exercises are the DRILL questions — include every item (translation pairs both
  directions, substitution prompts, Q&A). If an exercise gives only Waray to translate, put it in
  "war" and your best English in "en"; if only English, put it in "en" and the target Waray in "war".
- A review/test lesson is mostly written_exercise items. Do NOT invent content not in the OCR.

LESSON OCR:
${ocr}`;

async function extract(ocr) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt(ocr) }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 16000 } }),
  });
  const j = await res.json();
  if (!j.candidates) throw new Error(JSON.stringify(j).slice(0, 300));
  return JSON.parse(j.candidates[0].content.parts[0].text);
}

const OUT = "/private/tmp/claude-501/-Users-paulkilroy-dev-Sulog/2ec9156d-452e-4eed-b759-f98650a29e43/scratchpad/pc-blocks.json";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const only = process.argv[2] ? +process.argv[2] : null;
// accumulate: keep already-extracted lessons, only fill missing ones
const results = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
const done = new Set(results.map((r) => r.num));
for (const [num, name, a, b] of LESSONS) {
  if (only && num !== only) continue;
  if (done.has(num)) { process.stderr.write(`  L${num} — already have\n`); continue; }
  const ocr = []; for (let p = a; p <= b; p++) ocr.push(pages[p] || "");
  process.stderr.write(`  L${num} (pp.${a}-${b})… `);
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    try {
      const d = await extract(ocr.join("\n"));
      results.push({ num, name, data: d }); ok = true;
      const bt = {}; for (const bl of d.blocks) bt[bl.type] = (bt[bl.type] || 0) + 1;
      process.stderr.write(`✓ ${d.title} — ${Object.entries(bt).map(([k, v]) => v + k).join(" ")}\n`);
      fs.writeFileSync(OUT, JSON.stringify(results.sort((x, y) => x.num - y.num), null, 2)); // save incrementally
    } catch (e) {
      const rate = /429|quota/i.test(e.message);
      process.stderr.write(rate ? `⏳ 429, backing off… ` : `✗ ${e.message.slice(0, 80)}\n`);
      if (rate) await sleep(35000); else break;
    }
  }
  await sleep(6000); // stay under per-minute limits
}
fs.writeFileSync(OUT, JSON.stringify(results.sort((x, y) => x.num - y.num), null, 2));
console.log(`\n✓ pc-blocks.json now has ${results.length}/10 lessons: ${results.map((r) => "L" + r.num).join(" ")}`);
