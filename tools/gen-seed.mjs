/* Generate docs/schema/seed.sql — the REAL content load for the new relational model,
   from our existing sources:
     - cards.js (Frequency word bank)        -> dictionary words (vetted, w/ pronunciation)
     - challenger2.js + phase1/2.json (CH2)   -> a course: phases/units/lessons/blocks
                                                 + expressions (examples, apply, story lines)
                                                 + stories
     - docs/dictionary/phrases.json           -> dictionary phrases (survival, confirmed)
     - docs/word-bank/phrase-idioms.json      -> dictionary phrases (idioms, confirmed=false = review list)
   Classifies CH2 apply-phrases: idiomatic (in the dictionary set) -> dict ref; else -> expression.
   Run: node tools/gen-seed.mjs   (then validate with docs/schema/validate.mjs) */
import fs from "fs";
const ch2 = await import("../src/courses/waray/challenger2.js");
const cards = (await import("../src/courses/waray/cards.js")).SEED;
const P1 = JSON.parse(fs.readFileSync("docs/courses/challenger2/phase1.json", "utf8"));
const P2 = JSON.parse(fs.readFileSync("docs/courses/challenger2/phase2.json", "utf8"));
const survival = JSON.parse(fs.readFileSync("docs/dictionary/phrases.json", "utf8"));
const idioms = JSON.parse(fs.readFileSync("docs/word-bank/phrase-idioms.json", "utf8")).idioms;

const S = (v) => v == null ? "null" : "'" + String(v).replace(/'/g, "''") + "'";
const B = (v) => v ? "true" : "false";
const norm = (s) => (s || "").trim();

// ---------- dictionary ----------
const dict = new Map();  // waray -> row
const putWord = (waray, meaning, pron, confirmed = true) => {
  const w = norm(waray); if (!w || dict.has(w)) return;
  dict.set(w, { waray: w, kind: "word", meaning: meaning || "", pron: pron || null, loan: null, confirmed });
};
const putPhrase = (waray, meaning, pron, loan = null, confirmed = false) => {
  const w = norm(waray); if (!w) return;
  if (dict.has(w)) { if (confirmed) dict.get(w).confirmed = true; return; }
  dict.set(w, { waray: w, kind: "phrase", meaning: meaning || "", pron: pron || null, loan, confirmed });
};
// CH2 word cards (pronunciation from the built course)
for (const r of ch2.SEED_CH2) if (!/\s/.test(r[1])) putWord(r[1], r[2], r[4], true);
// Frequency word bank
for (const r of cards) if (!/\s/.test(r[1])) putWord(r[1], r[2], r[4], true);
// survival phrases (confirmed) + idioms (unconfirmed = review list)
for (const p of survival) putPhrase(p.waray, p.meaning, p.pronunciation, p.loan || null, p.note && /pending/i.test(p.note) ? false : true);
for (const x of idioms) putPhrase(x.war, x.en, null, x.loan || null, false);   // all idioms -> review list
const dictPhrases = new Set([...dict.values()].filter((d) => d.kind === "phrase").map((d) => d.waray));

// ---------- expressions (dedup by sentence) ----------
const expr = new Map();  // waray -> {id, waray, translation, focus}
let eid = 0;
const putExpr = (waray, translation, focus = null) => {
  const w = norm(waray); if (!w) return null;
  if (expr.has(w)) return expr.get(w).id;
  const id = ++eid; expr.set(w, { id, waray: w, translation: translation || "", focus: focus && dict.has(focus) ? focus : null }); return id;
};

// ---------- course structure + blocks ----------
const units = [], lessons = [], blocks = [], items = [];
const stories = [], storyLines = [], storyQ = [];
let bid = 0;
const addBlock = (lessonId, ord, type, cols = {}) => { const id = ++bid; blocks.push({ id, lessonId, ord, type, ...cols }); return id; };
const addItem = (blockId, ord, ref, role) => items.push({ blockId, ord, dict: ref.dict || null, expr: ref.expr || null, role });

const phaseMeta = [{ id: "c2p1", name: "First Steps in Daram", units: P1.detailed_units }, { id: "c2p2", name: "Daily Life in the Neighborhood", units: P2.detailed_units }];
// map built curriculum (has deck/story shapes) alongside source JSON (has grammar/can_do)
const builtUnits = new Map();
for (const ph of ch2.CHALLENGER2) for (const u of ph.units) builtUnits.set(u.id, u);

for (let pi = 0; pi < phaseMeta.length; pi++) {
  const ph = phaseMeta[pi];
  for (let ui = 0; ui < ph.units.length; ui++) {
    const su = ph.units[ui];                    // source unit (grammar, can_do)
    const bu = builtUnits.get(su.unit_id) || {}; // built unit (lessons, story)
    units.push({ id: su.unit_id, phase: ph.id, ord: ui + 1, name: su.title, theme: su.theme || null, canDo: su.can_do || null });
    let lord = 0;
    // word + apply lessons from the built curriculum (resolved items by waray)
    for (const l of (bu.lessons || [])) {
      const lid = `${su.unit_id}-${l.id}`; lessons.push({ id: lid, unit: su.unit_id, ord: ++lord, title: l.title });
      const isApply = l.kind === "apply";
      // teach block
      const teachId = addBlock(lid, 1, isApply ? "phrases" : "vocab");
      (l.items || []).forEach((w, i) => {
        if (isApply) {
          if (dictPhrases.has(norm(w))) addItem(teachId, i + 1, { dict: norm(w) }, "phrase");
          else { const ei = putExpr(w, phraseEnglish(su, w)); addItem(teachId, i + 1, { expr: ei }, "phrase"); }
        } else addItem(teachId, i + 1, { dict: norm(w) }, "teach");
      });
      // two drills (mc recognition, type production) over the same items
      for (const [ord, kind, mod, hint] of [[2, "recognition", "mc", "peek"], [3, "production", "type", "partial"]]) {
        const did = addBlock(lid, ord, "drill", { dkind: kind, dmod: mod, dhint: hint, ddir: ord === 3 ? "both" : null });
        (l.items || []).slice(0, 6).forEach((w, i) => {
          if (isApply && !dictPhrases.has(norm(w))) addItem(did, i + 1, { expr: putExpr(w, phraseEnglish(su, w)) }, "item");
          else addItem(did, i + 1, { dict: norm(w) }, "item");
        });
      }
    }
    // unit review = assessment gate
    if ((bu.lessons || []).some((l) => l.kind === "apply")) {
      const lid = `${su.unit_id}-review`; lessons.push({ id: lid, unit: su.unit_id, ord: ++lord, title: "Unit Review" });
      addBlock(lid, 1, "assessment", { ascope: "unit", apool: "apply-phrases", asel: "hardest", an: 10, athr: 0.8, agate: true });
    }
    // story capstone
    if (bu.story) {
      const st = bu.story; stories.push({ id: st.id, title: st.title, titleEn: st.titleEn || st.title });
      (st.lines || []).forEach((ln, i) => { const ei = putExpr(ln.war, ln.en); storyLines.push({ story: st.id, ord: i + 1, expr: ei }); });
      if (st.q) storyQ.push({ story: st.id, q: st.q.q, options: st.q.options, answer: st.q.answer });
      const lid = `${su.unit_id}-story`; lessons.push({ id: lid, unit: su.unit_id, ord: ++lord, title: "Story" });
      addBlock(lid, 1, "story", { story: st.id });
    }
  }
}
// find an English gloss for an apply phrase from the source JSON
function phraseEnglish(su, war) {
  for (const l of (su.lessons || [])) for (const p of (l.phrases || [])) if (norm(p.war) === norm(war)) return p.en;
  for (const v of (su.new_vocab || [])) if (v.example && norm(v.example.war) === norm(war)) return v.example.en;
  return "";
}

// ---------- emit SQL (FK order) ----------
const out = [];
out.push("-- GENERATED by tools/gen-seed.mjs — real CH2 + word-bank + idioms content.\n");
out.push("insert into courses values ('waray','Waray','war','phrase-first');");
out.push("insert into phases values " + phaseMeta.map((p, i) => `('${p.id}','waray',${i + 1},${S(p.name)},null)`).join(",") + ";");
out.push("insert into units (id,phase_id,ord,name,theme,can_do) values\n" + units.map((u) => `  (${S(u.id)},${S(u.phase)},${u.ord},${S(u.name)},${S(u.theme)},${S(u.canDo)})`).join(",\n") + ";");
out.push("insert into lessons (id,unit_id,ord,title) values\n" + lessons.map((l) => `  (${S(l.id)},${S(l.unit)},${l.ord},${S(l.title)})`).join(",\n") + ";");
out.push("insert into dictionary (waray,kind,meaning,pronunciation,loan,confirmed) values\n" + [...dict.values()].map((d) => `  (${S(d.waray)},${S(d.kind)},${S(d.meaning)},${S(d.pron)},${S(d.loan)},${B(d.confirmed)})`).join(",\n") + ";");
out.push("insert into expressions (id,waray,translation,focus) values\n" + [...expr.values()].map((e) => `  (${e.id},${S(e.waray)},${S(e.translation)},${S(e.focus)})`).join(",\n") + ";");
if (stories.length) {
  out.push("insert into stories values " + stories.map((s) => `(${S(s.id)},${S(s.title)},${S(s.titleEn)})`).join(",") + ";");
  out.push("insert into story_lines values " + storyLines.map((l) => `(${S(l.story)},${l.ord},${l.expr})`).join(",") + ";");
  if (storyQ.length) out.push("insert into story_questions (story_id,q,options,answer) values\n" + storyQ.map((q) => `  (${S(q.story)},${S(q.q)},array[${q.options.map(S).join(",")}],${q.answer})`).join(",\n") + ";");
}
out.push("insert into lesson_blocks (id,lesson_id,ord,type,drill_kind,drill_modality,drill_hint,drill_direction,assess_scope,assess_pool,assess_select,assess_n,assess_threshold,assess_gate,story_id) values\n" +
  blocks.map((b) => `  (${b.id},${S(b.lessonId)},${b.ord},${S(b.type)},${S(b.dkind)},${S(b.dmod)},${S(b.dhint)},${S(b.ddir)},${S(b.ascope)},${S(b.apool)},${S(b.asel)},${b.an ?? "null"},${b.athr ?? "null"},${b.agate == null ? "null" : B(b.agate)},${S(b.story)})`).join(",\n") + ";");
out.push("insert into block_items (block_id,ord,dict_waray,expr_id,role) values\n" +
  items.map((it) => `  (${it.blockId},${it.ord},${S(it.dict)},${it.expr ?? "null"},${S(it.role)})`).join(",\n") + ";");

fs.writeFileSync("docs/schema/seed.sql", out.join("\n\n") + "\n");
console.log(`✓ seed.sql — dictionary:${dict.size} (words ${[...dict.values()].filter(d=>d.kind==="word").length}, phrases ${dictPhrases.size}; unconfirmed/review ${[...dict.values()].filter(d=>!d.confirmed).length}) · expressions:${expr.size} · stories:${stories.length} · units:${units.length} · lessons:${lessons.length} · blocks:${blocks.length} · block_items:${items.length}`);
