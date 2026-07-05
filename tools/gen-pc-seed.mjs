/* Turn the Gemini-extracted PC blocks (scratchpad/pc-blocks.json) into docs/schema/pc-seed.sql.
   Each lesson is emitted as a TWO-PART flow:
     PART A — learn:     grammar guide → paradigm teach block (pronoun/marker chart, made drillable)
                         → vocab teach block (content words) → ONE recognition (MC) drill
     PART B — practice:  worked examples → oral exercise (speak-it) → written exercise (type-it, both ways)
   The paradigm block is lifted out of the grammar chart so every taught pronoun/marker becomes a real
   dictionary row — drillable AND countable for top-1000 coverage. The grammar chart stays as the guide.
   PC vocab inserts ON CONFLICT DO NOTHING so shared words (ako, hiya…) reuse CH2's rows.
   Expression/block ids are offset by 20000 to avoid colliding with the CH2 seed.
   Run: node tools/gen-pc-seed.mjs <path-to-pc-blocks.json>  */
import fs from "fs";
const SRC = process.argv[2] || "/private/tmp/claude-501/-Users-paulkilroy-dev-Sulog/2ec9156d-452e-4eed-b759-f98650a29e43/scratchpad/pc-blocks.json";
const lessons = JSON.parse(fs.readFileSync(SRC, "utf8")).sort((a, b) => a.num - b.num);
const S = (v) => v == null || v === "" ? "null" : "'" + String(v).replace(/'/g, "''") + "'";
const norm = (s) => (s || "").trim();
const lemma = (s) => norm(s).replace(/^-+/, ""); // strip the book's verb-root hyphen

const dict = new Map();          // waray -> {meaning,pos}
const expr = new Map();          // sentence -> id
let eid = 20000, bid = 20000;
const blocks = [], items = [];
const exprRows = [];
const putExpr = (war, en) => { const w = norm(war); if (!w) return null; if (expr.has(w)) return expr.get(w); const id = ++eid; expr.set(w, id); exprRows.push({ id, war: w, en: en || "" }); return id; };
const addBlock = (lid, ord, type, cols = {}) => { const id = ++bid; blocks.push({ id, lid, ord, type, ...cols }); return id; };
const teach = (bl, w, i, arr) => { arr.push(w); items.push({ b: bl, ord: i + 1, dict: w, role: "teach" }); };

// Function words explained in a lesson's intro prose but not in its chart — added by hand as we vet lessons.
const EXTRAS = {
  2: [{ waray: "ngan", meaning: "and", pos: "conj" }, { waray: "mga", meaning: "plural marker (before a noun)", pos: "marker" }],
};

// Pull "word (gloss)" cells out of any markdown chart in a grammar block — the pronoun/marker/
// demonstrative paradigm. "ikáw / ka (you)" yields BOTH ikáw and ka. Single-token words only,
// so sentence rows in example charts aren't mistaken for vocabulary.
function parseParadigm(prose) {
  if (!prose) return [];
  const out = [], seen = new Set();
  const rows = [];
  for (const ln of prose.split("\n")) {
    if (!/^\s*\|.*\|\s*$/.test(ln)) continue;
    const cells = ln.replace(/^\s*\||\|\s*$/g, "").split("|").map((s) => s.trim());
    if (cells.every((c) => c === "" || /^:?-+:?$/.test(c))) continue;   // skip md separator row
    rows.push(cells);
  }
  const add = (tokens, gloss) => { for (const tok of tokens.split("/")) { const w = lemma(tok); if (w && !seen.has(w)) { seen.add(w); out.push({ waray: w, meaning: gloss }); } } };
  const HEADER = /^(full|short|long)?\s*(form|meaning|word|pronoun|pronouns|marker|markers|singular|plural|english|waray)$/i;
  const single = (s) => s && !/\s/.test(s.replace(/\s*\/\s*/g, "/"));   // a single Waray token, or A/B alternates
  const dataRows = rows.filter((r) => !(r.length && HEADER.test(r[0])));

  // Mode 2 FIRST — a two-column "word | meaning" table (Full Form | Meaning: Ini | this very near…),
  // where column 1 is a bare Waray token. Must win over Mode 1 so the English gloss isn't read as the word.
  if (rows.every((r) => r.length === 2) && dataRows.every((r) => single(r[0]) && !/\(/.test(r[0]))) {
    for (const [c0, c1] of dataRows) if (c0 && c1) add(c0, c1);
    if (out.length) return out;
  }
  // Mode 1 — inline "word (gloss)" cells (pronoun charts: "akó (I)" packed into one cell)
  for (const cells of rows) for (const cell of cells) {
    const m = cell.match(/^([A-Za-zÀ-ÿ'’.\-]+(?:\s*\/\s*[A-Za-zÀ-ÿ'’.\-]+)?)\s*\(([^)]+)\)$/);
    if (m) add(m[1], m[2].trim());
  }
  return out;
}
// Marker charts label the cells by row/column ("| w/ Proper Nouns | Hi | hira |") instead of
// inline glosses, so parseParadigm misses them. Pull the body cells as marker items, naming the
// meaning from the row + column headers → Hi = "marker (w/ proper nouns, singular)".
function parseMarkers(prose) {
  if (!prose) return [];
  const grid = [];
  for (const ln of prose.split("\n")) {
    if (!/^\s*\|.*\|\s*$/.test(ln)) continue;
    const cells = ln.replace(/^\s*\||\|\s*$/g, "").split("|").map((s) => s.trim());
    if (cells.every((c) => c === "" || /^:?-+:?$/.test(c))) continue;  // skip md separator row
    grid.push(cells);
  }
  if (grid.length < 2) return [];
  const header = grid[0], out = [], seen = new Set();
  for (let r = 1; r < grid.length; r++) {
    const rowLabel = grid[r][0];
    for (let c = 1; c < grid[r].length; c++) {
      const w = lemma(grid[r][c].replace(/\(.*/, "").trim()).toLowerCase();  // markers are particles → lowercase
      if (!w || /singular|plural|noun|^w\//i.test(w)) continue;
      if (seen.has(w)) continue; seen.add(w);
      const where = /proper/i.test(rowLabel) ? "before a name" : /common/i.test(rowLabel) ? "before a common noun" : "particle";
      const pl = /plural/i.test(header[c] || "") ? ", plural" : "";
      out.push({ waray: w, meaning: `the (${where}${pl})` });   // learner-friendly gloss, not meta-jargon
    }
  }
  return out;
}
// pos for a paradigm, from the lesson/grammar title
const paradigmPos = (title = "") => /demonstrative|general pronoun/i.test(title) ? "dem" : /marker/i.test(title) ? "marker" : "pron";
// the drillable items a grammar chart yields — glossed pronoun/demonstrative table, else a marker grid
const chartItems = (b) => { const p = parseParadigm(b.prose); return p.length ? p : (/marker/i.test(b.title || "") ? parseMarkers(b.prose) : []); };

const emitted = [];                                    // ordered {id,title} for the lessons INSERT
const newLesson = (id, title) => { emitted.push({ id, title }); return { id, ord: 0 }; };
// --- per-lesson emit helpers (ctx = {id, ord}) ---
function emitGuide(ctx, grammarBlocks, wordsAccum) {    // grammar prose + lift its chart into a paradigm teach block
  for (const b of grammarBlocks) {
    addBlock(ctx.id, ++ctx.ord, "grammar", { title: b.title, body: b.prose, formula: b.formula });
    const para = chartItems(b);
    if (para.length) {
      const pos = paradigmPos(b.title);
      const bl = addBlock(ctx.id, ++ctx.ord, "vocab", { title: b.title || "Paradigm" });
      para.forEach((p, i) => { if (!dict.has(p.waray)) dict.set(p.waray, { meaning: p.meaning, pos }); teach(bl, p.waray, i, wordsAccum); });
    }
  }
}
function emitVocab(ctx, vocabBlocks, wordsAccum) {
  for (const b of vocabBlocks) {
    const bl = addBlock(ctx.id, ++ctx.ord, "vocab");
    (b.items || []).forEach((v, i) => { const w = lemma(v.waray); if (!w) return; if (!dict.has(w)) dict.set(w, { meaning: v.meaning, pos: v.pos }); teach(bl, w, i, wordsAccum); });
  }
}
const emitNotes = (ctx, notes) => notes.forEach((b) => addBlock(ctx.id, ++ctx.ord, "note", { body: b.text }));
function emitMC(ctx, words) {                           // one gentle recognition drill over freshly-taught words
  if (!words.length) return;
  const bl = addBlock(ctx.id, ++ctx.ord, "drill", { dkind: "recognition", dmod: "mc", dhint: "peek" });
  words.slice(0, 10).forEach((w, i) => items.push({ b: bl, ord: i + 1, dict: w, role: "item" }));
}
// The worked examples + oral substitution are paradigm practice — fold them into ONE recognition
// (multiple-choice) drill of whole sentences. No passive "examples" block.
function emitSentenceMC(ctx, exprBlocks) {
  const src = exprBlocks.flatMap((b) => b.items || []);
  if (!src.length) return;
  // title it so the drill is traceable to the book's section (its sentences ARE the "Examples")
  const title = exprBlocks.some((b) => b.type === "examples") ? "Examples" : null;
  const bl = addBlock(ctx.id, ++ctx.ord, "drill", { dkind: "recognition", dmod: "mc", dhint: "peek", title });
  src.forEach((e, i) => { const id = putExpr(e.war, e.en); if (id) items.push({ b: bl, ord: i + 1, expr: id, role: "item" }); });
}
function emitProd(ctx, drillBlocks, dmod) {             // production drill (speak/type), both directions
  for (const b of drillBlocks) { const bl = addBlock(ctx.id, ++ctx.ord, "drill", { dkind: "production", dmod, dhint: "none", ddir: "both" }); (b.items || []).forEach((e, i) => { const id = putExpr(e.war, e.en); if (id) items.push({ b: bl, ord: i + 1, expr: id, role: "item" }); }); }
}
function emitExtras(ctx, extras, wordsAccum) {          // hand-added function words explained in the intro
  if (!extras || !extras.length) return;
  const bl = addBlock(ctx.id, ++ctx.ord, "vocab", { title: "Also in this lesson" });
  extras.forEach((v, i) => { const w = lemma(v.waray); if (!dict.has(w)) dict.set(w, { meaning: v.meaning, pos: v.pos }); teach(bl, w, i, wordsAccum); });
}
// Marker-choice drill: the book gives a noun and asks which marker fits (hi/an/hira…). Modality "cloze" —
// the app blanks the marker and offers the lesson's markers as choices. Item stores the answered phrase
// (marker lowercased) with the noun as its gloss/prompt.
function emitMarkerChoice(ctx, drillBlocks) {
  for (const b of drillBlocks) {
    const bl = addBlock(ctx.id, ++ctx.ord, "drill", { dkind: "recognition", dmod: "cloze", dhint: "peek" });
    (b.items || []).forEach((e, i) => {
      const war = (e.war || "").replace(/^(\S+)/, (m) => paradigmSet.has(m.toLowerCase()) ? m.toLowerCase() : m);
      const id = putExpr(war, e.en); if (id) items.push({ b: bl, ord: i + 1, expr: id, role: "item" });
    });
  }
}

// --- pre-scan the paradigm vocabulary (all pronoun/marker/demonstrative forms) for the "what varies" test ---
const paradigmSet = new Set();
for (const L of lessons) for (const g of (L.data.blocks || []).filter((b) => b.type === "grammar")) for (const p of chartItems(g)) paradigmSet.add(p.waray.toLowerCase());
const tokns = (s) => (s || "").toLowerCase().split(/[^a-zà-ÿ'’]+/).filter(Boolean);
// A drill's focus is whatever VARIES across its items: if ≥2 distinct paradigm forms appear, it drills the
// paradigm (→ a-lesson recognition); if the paradigm form is held constant, it drills the vocab (→ b-lesson).
const paradigmVaries = (b) => { const seen = new Set(); for (const it of (b.items || [])) for (const t of tokns(it.war)) if (paradigmSet.has(t)) seen.add(t); return seen.size >= 2; };
const isTranslation = (b) => /translat/i.test(b.instruction || "");
// PARADIGM-RECALL fill-in ("write the chart/pronouns from memory / without looking") = the book leaves it
// BLANK, so the extracted items are the model's invented answers (it fabricated pronoun short forms this way). Drop.
const isFabricatedFill = (b) => /without looking|\b(write|reproduce|complete)\b[^.]*\b(chart|pronouns?|paradigm|forms?)\b/i.test(b.instruction || "");
// MARKER-CHOICE ("use/write the correct marker for these nouns") = a real cloze drill: pick the marker. Keep it.
const isMarkerChoice = (b) => /\bmarkers?\b/i.test(b.instruction || "") && /\b(correct|right|use|choose|fill|write|blank)\b/i.test(b.instruction || "");

// Sort a lesson's drills. recognize: {block, mode} — mode "sentence" (whole-sentence MC) or "marker" (marker cloze).
// produce: {block, dmod}. Rule: examples + paradigm-varying → recognize; vocab-varying + translations → produce.
function routeDrills(B) {
  const recognize = B.examples.map((b) => ({ b, mode: "sentence" })), produce = [];
  for (const b of [...B.oral, ...B.written]) {
    if (isFabricatedFill(b)) continue;                                              // drop invented fill-in answers
    else if (isMarkerChoice(b)) recognize.push({ b, mode: "marker" });              // pick-the-marker cloze
    else if (!isTranslation(b) && paradigmVaries(b)) recognize.push({ b, mode: "sentence" }); // paradigm varies → recognize
    else produce.push({ b, dmod: B.oral.includes(b) ? "voice" : "type" });          // vocab varies / translate → produce
  }
  return { recognize, produce };
}
const emitRecognize = (ctx, r) => r.mode === "marker" ? emitMarkerChoice(ctx, [r.b]) : emitSentenceMC(ctx, [r.b]);
// Warm-up review of the PRIOR lesson (the exercises the book puts before this lesson's first grammar block).
// Emitted as `review` blocks at the lesson start, carrying their natural modality so the app can drill them.
function emitReview(ctx, reviewBlocks) {
  for (const b of reviewBlocks) {
    const [dkind, dmod] = isMarkerChoice(b) ? ["recognition", "cloze"] : isTranslation(b) ? ["production", "type"] : ["recognition", "mc"];
    const bl = addBlock(ctx.id, ++ctx.ord, "review", { dkind, dmod, dhint: "peek", ddir: dkind === "production" ? "both" : null });
    (b.items || []).forEach((e, i) => {
      const war = (e.war || "").replace(/^(\S+)/, (m) => paradigmSet.has(m.toLowerCase()) ? m.toLowerCase() : m);
      const id = putExpr(war, e.en); if (id) items.push({ b: bl, ord: i + 1, expr: id, role: "item" });
    });
  }
}

for (const L of lessons) {
  const src = L.data.blocks || [];
  const firstGrammar = src.findIndex((b) => b.type === "grammar");
  const B = { grammar: [], note: [], examples: [], oral: [], written: [], vocab: [] };
  const review = [];
  src.forEach((b, idx) => {
    const k = { grammar: "grammar", note: "note", examples: "examples", oral_exercise: "oral", written_exercise: "written", vocab: "vocab" }[b.type];
    if (!k) return;
    // exercises BEFORE the first grammar block are the book's review of the prior lesson (drop fabricated fills)
    if (firstGrammar > 0 && idx < firstGrammar && (b.type === "oral_exercise" || b.type === "written_exercise")) {
      if (!isFabricatedFill(b)) review.push(b);
    } else B[k].push(b);
  });
  const paraGrammar = B.grammar.find((g) => chartItems(g).length);   // pronoun/demonstrative OR marker chart
  const hasContent = B.vocab.length || B.examples.length || B.written.length;
  const { recognize, produce } = routeDrills(B);

  if (paraGrammar && hasContent) {
    // ---- SPLIT: Na = warm-up review + the paradigm (recognition), Nb = the vocabulary in use (production) ----
    const a = newLesson(`pc-l${L.num}a`, `Lesson ${L.num}a · ${paraGrammar.title || "The paradigm"}`);
    const aw = []; emitReview(a, review); emitGuide(a, B.grammar, aw); emitNotes(a, B.note); emitExtras(a, EXTRAS[L.num], aw); emitMC(a, aw); recognize.forEach((r) => emitRecognize(a, r));
    const b = newLesson(`pc-l${L.num}b`, `Lesson ${L.num}b · Vocabulary & sentences`);
    const bw = []; emitVocab(b, B.vocab, bw); emitMC(b, bw); produce.forEach((p) => emitProd(b, [p.b], p.dmod));
  } else {
    // ---- SINGLE: no paradigm to peel off (verb / review lessons) — review, learn, recognize, then produce ----
    const c = newLesson(`pc-l${L.num}`, L.name);
    const w = []; emitReview(c, review); emitGuide(c, B.grammar, w); emitExtras(c, EXTRAS[L.num], w); emitNotes(c, B.note); emitVocab(c, B.vocab, w); emitMC(c, w);
    recognize.forEach((r) => emitRecognize(c, r)); produce.forEach((p) => emitProd(c, [p.b], p.dmod));
  }
}

const out = [];
out.push("-- GENERATED by tools/gen-pc-seed.mjs from Gemini-extracted PC blocks. AI-extracted from");
out.push("-- noisy OCR — everything confirmed=false (needs review). Load AFTER schema.sql + seed.sql.");
out.push("-- Paradigm lessons SPLIT: Na (pronoun/marker chart → MC → substitution drill), Nb (vocab → MC → examples → translate).");
out.push("-- Verb/review lessons stay single (learn then practice).\n");
out.push("insert into courses values ('pc','Peace Corps Waray','war','grammar-spine') on conflict (id) do nothing;");
out.push("insert into phases values ('pc-p1','pc',1,'Foundations (Lessons 1–10)','equational sentences & the pronoun classes') on conflict (id) do nothing;");
out.push("insert into units values ('pc-u1','pc-p1',1,'Pronoun classes & verbs',null,null) on conflict (id) do nothing;");
out.push("insert into lessons (id,unit_id,ord,title) values\n" + emitted.map((l, i) => `  (${S(l.id)},'pc-u1',${i + 1},${S(l.title)})`).join(",\n") + " on conflict (id) do nothing;");
// Refresh the gloss/pos of any UNCONFIRMED row (PC's own, re-generated each run) but never touch a
// human-confirmed entry — so the generator stays the source of truth until Ella signs off.
out.push("insert into dictionary (waray,kind,meaning,pos,confirmed) values\n" + [...dict].map(([w, d]) => `  (${S(w)},'word',${S(d.meaning)},${S(d.pos)},false)`).join(",\n") +
  "\n  on conflict (waray) do update set meaning = excluded.meaning, pos = excluded.pos where dictionary.confirmed = false;");
if (exprRows.length) out.push("insert into expressions (id,waray,translation) values\n" + exprRows.map((e) => `  (${e.id},${S(e.war)},${S(e.en)})`).join(",\n") + " on conflict (id) do nothing;");
out.push("insert into lesson_blocks (id,lesson_id,ord,type,title,body_md,formula,drill_kind,drill_modality,drill_hint,drill_direction) values\n" +
  blocks.map((b) => `  (${b.id},${S(b.lid)},${b.ord},${S(b.type)},${S(b.title)},${S(b.body)},${S(b.formula)},${S(b.dkind)},${S(b.dmod)},${S(b.dhint)},${S(b.ddir)})`).join(",\n") + " on conflict (id) do nothing;");
out.push("insert into block_items (block_id,ord,dict_waray,expr_id,role) values\n" +
  items.map((it) => `  (${it.b},${it.ord},${S(it.dict)},${it.expr ?? "null"},${S(it.role)})`).join(",\n") + ";");

fs.writeFileSync("docs/schema/pc-seed.sql", out.join("\n\n") + "\n");
const paraCt = blocks.filter((b) => b.type === "vocab" && b.title).length;
console.log(`✓ pc-seed.sql — ${lessons.length} lessons · dictionary +${dict.size} · expressions +${exprRows.length} · blocks +${blocks.length} (${paraCt} paradigm) · items +${items.length}`);
