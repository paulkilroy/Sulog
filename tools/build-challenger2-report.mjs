/* Wide multi-column review report for Challenger 2. Reads the full source JSONs (which
   carry grammar / cefr / difficulty / per-word examples) so the report can show them.
   Per unit: New Words (+example) | Apply phrases | Graded Unit Review | Story — every
   word color-coded. Per-phase summary band, unit header with CEFR/difficulty/grammar,
   terminology panel. Output: challenger2-report.html.
   Run: node tools/build-challenger2-report.mjs */
import fs from "fs";
import { SEED_CH2 } from "../src/courses/waray/challenger2.js";

const P1 = JSON.parse(fs.readFileSync("docs/sources/challenger-expanded-final.json", "utf8"));
const P2 = JSON.parse(fs.readFileSync("docs/sources/challenger2-p2.json", "utf8"));
const PHASES = [
  { id: "p1", name: "First Steps in Daram (Expanded)", hint: "Denser greetings, family, home, food, numbers", units: P1.detailed_units },
  { id: "p2", name: "Daily Life in the Neighborhood", hint: "In-laws, the yard, going places, weather, daily time", units: P2.detailed_units },
];

const MARKERS = new Set(["hi", "in", "it", "an", "nga", "ngan", "ha", "han", "na", "ka", "ni", "ba", "ini", "iton", "adto", "ito", "sin", "hin", "may", "la", "man", "gud", "pa", "kay", "ngani", "gihap"]);
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9-]/g, "");
const esc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const roots = (t) => { const o = new Set([t]); const p = t.replace(/^(nagpa|magpa|naka|maka|nang|mang|mag|nag|gin|pag|ma|na|um|i)/, ""); o.add(p); o.add(p.replace(/(on|an|hi|i|a)$/, "")); return [...o].filter(Boolean); };
const REVIEW_N = 10; // the graded review targets 10 items

let taughtBefore = new Set();          // cumulative taught lemmas (for grey)
const originOf = {};                    // lemma -> unit title where first taught

const phasesData = PHASES.map((ph) => {
  let pWords = 0, pPhrases = 0, pFlags = 0;
  const units = ph.units.map((u) => {
    const wordsLessons = (u.lessons || []).filter((l) => l.type === "words");
    const applyLessons = (u.lessons || []).filter((l) => l.type === "apply");
    const thisWords = new Set((u.new_vocab || []).map((v) => norm(v.lemma)));
    const earlier = new Set(taughtBefore);
    const tok = (raw, i) => {
      const n = norm(raw);
      if (!n) return `<span>${esc(raw)}</span>`;
      let cls = "red";
      if (thisWords.has(n)) cls = "new";
      else if (earlier.has(n)) cls = "old";
      else if (MARKERS.has(n)) cls = "mkr";
      else if (i > 0 && /^[A-Z]/.test(raw)) cls = "name";
      else if (roots(n).some((r) => thisWords.has(r))) cls = "new inf";
      else if (roots(n).some((r) => earlier.has(r))) cls = "old inf";
      return `<span class="w ${cls}">${esc(raw)}</span>`;
    };
    const line = (s) => s.split(/(\s+)/).map((p, i) => /^\s+$/.test(p) ? p : tok(p, i)).join("");
    const isFlag = (p, i) => { const n = norm(p); return n && !thisWords.has(n) && !earlier.has(n) && !MARKERS.has(n) && !(i > 0 && /^[A-Z]/.test(p)) && !roots(n).some((r) => thisWords.has(r) || earlier.has(r)); };
    let flags = 0;
    const scan = (s) => s.split(/\s+/).forEach((p, i) => { if (isFlag(p, i)) flags++; });
    for (const l of applyLessons) for (const p of (l.phrases || [])) scan(p.war);
    if (u.story) for (const s of (u.story.sentences || [])) scan(s.war);

    // ① new words with example
    const wordCells = (u.new_vocab || []).map((v) => {
      const repeat = earlier.has(norm(v.lemma));
      const ex = v.example?.war ? `<div class="ex">${line(v.example.war)} <span class="g">— ${esc(v.example.en)}</span></div>` : "";
      const orig = repeat && originOf[norm(v.lemma)] ? ` <em>↩ ${esc(originOf[norm(v.lemma)])}</em>` : "";
      return `<div class="wc ${repeat ? "old" : "new"}"><b>${esc(v.lemma)}</b> <span class="g">${esc(v.gloss)}</span>${repeat ? " <em>repeat</em>" : ""}${orig}${ex}</div>`;
    }).join("");
    // ② apply
    const applyCells = applyLessons.map((l) => `<div class="lz"><div class="lz-t">${esc(l.title)}</div>${(l.phrases || []).map((p) => `<div class="ph">${line(p.war)}<div class="en">${esc(p.en)}</div></div>`).join("")}</div>`).join("");
    // ③ graded review: pool = all apply phrases; pads to 10
    const pool = applyLessons.flatMap((l) => (l.phrases || []).map((p) => p.war));
    const pad = Math.max(0, REVIEW_N - pool.length);
    const reviewCell = `<div class="rz-note">Type the Waray · no hints · <b>80% to master</b>.<br>Tests up to ${REVIEW_N} of the ${pool.length} Apply phrases below, hardest first.</div>` +
      (pad > 0 ? `<div class="rz-warn">⚠ pool is only ${pool.length} → pads <b>${pad}</b> slot${pad === 1 ? "" : "s"} with your most-missed cards from <b>anywhere in the course</b> (can pull future-unit words).</div>` : `<div class="rz-ok">✓ pool ≥ ${REVIEW_N} → no padding; only this unit's phrases.</div>`) +
      pool.map((w) => `<div class="ph sm">${line(w)}</div>`).join("");
    // ④ story
    const storyCell = u.story ? `<div class="lz-t">${esc(u.story.title)} <span class="g">— ${esc(u.story.title_en || "")}</span></div>` +
      (u.story.sentences || []).map((s) => `<div class="ph">${line(s.war)}<div class="en">${esc(s.en)}</div></div>`).join("") +
      (u.story.questions || []).map((q) => `<div class="q">Q: ${esc(q.q)} <span class="g">[${(q.choices || []).map(esc).join(" · ")}] ✓${esc((q.choices || [])[q.answer_index])}</span></div>`).join("") : "<i>no story</i>";
    const grammar = (u.new_grammar || []).map((g) => esc(g.point)).join(" · ");

    for (const w of thisWords) { taughtBefore.add(w); if (!originOf[w]) originOf[w] = u.title; }
    pWords += thisWords.size; pPhrases += pool.length; pFlags += flags;
    return { id: u.unit_id, name: u.title, can: u.can_do, cefr: u.cefr, diff: u.difficulty, grammar, nWords: thisWords.size, nPhrases: pool.length, flags, pad, wordCells, applyCells, reviewCell, storyCell };
  });
  return { ...ph, units, pWords, pPhrases, pFlags };
});

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Challenger 2 — review report</title><style>
:root{--sand:#f7f1e6;--ink:#22303a;--soft:#5e6b70}
*{box-sizing:border-box} body{margin:0;background:var(--sand);color:var(--ink);font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:13.5px}
header{padding:14px 22px;border-bottom:1px solid #e3dccd;position:sticky;top:0;background:var(--sand);z-index:5}
h1{font-family:Georgia,serif;margin:0 0 4px;font-size:21px}
.panels{margin-top:6px;font-size:12px;color:var(--soft)} .panels b{color:var(--ink)}
.key{display:inline-flex;align-items:center;gap:5px;margin-right:11px}
.sw{display:inline-block;width:12px;height:12px;border-radius:3px}
.phase{margin:20px 22px 4px} .phase h2{font-family:Georgia,serif;font-size:18px;margin:0;display:inline}
.sumband{display:inline-block;margin-left:14px;font-size:12px;color:var(--soft)}
.sumband b{color:var(--ink)} .sumband .fl{color:#c2384b;font-weight:700}
.unit{margin:10px 22px;border:1px solid #e3dccd;border-radius:12px;background:#fff;overflow:hidden}
.uh{padding:9px 14px;background:#fbf7ef;border-bottom:1px solid #eee6d6}
.uh b{font-family:Georgia,serif;font-size:15.5px} .uh .can{color:var(--soft);font-size:12px}
.uh .cnt{float:right;font-size:11.5px;color:var(--soft)} .uh .flag{color:#c2384b;font-weight:700}
.uh .meta{font-size:11px;color:#9a8a63;margin-top:2px} .uh .lvl{display:inline-block;background:#eef3ee;color:#3a6f4a;border-radius:4px;padding:0 5px;font-weight:700;font-size:10.5px}
.cols{display:grid;grid-template-columns:1.1fr 1.2fr 1fr 1.3fr;gap:0}
.col{padding:11px 13px;border-right:1px solid #f0eadd}.col:last-child{border-right:0}
.col h4{margin:0 0 7px;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--soft)}
.wc{padding:3px 0;border-bottom:1px dotted #f0ead9} .wc b{font-family:Georgia,serif} .wc .g{color:var(--soft);font-size:12px} .wc em{color:#a08a55;font-size:10.5px;font-style:italic}
.wc.new b{color:#2f8f4e} .wc.old b{color:#8a9499}
.wc .ex{font-size:12px;margin-top:1px;font-family:Georgia,serif}
.lz{margin-bottom:9px}.lz-t{font-size:11px;font-weight:700;color:#b5761f;margin-bottom:2px}
.ph{font-family:Georgia,serif;font-size:14.5px;line-height:1.45;margin:2px 0}.ph.sm{font-size:13px;margin:1px 0}
.ph .en{font-family:-apple-system,sans-serif;font-size:11.5px;color:var(--soft);line-height:1.15}
.q{font-size:11.5px;color:var(--soft);margin-top:5px} .q .g{color:#9aa1a6}
.rz-note{font-size:11.5px;color:var(--soft);background:#f3fbf5;border:1px solid #dcebe0;border-radius:7px;padding:6px 8px;margin-bottom:7px}
.rz-warn{font-size:11.5px;color:#8a2c3b;background:#fbe8ea;border:1px solid #f0cdd2;border-radius:7px;padding:6px 8px;margin-bottom:7px}
.rz-ok{font-size:11.5px;color:#3a6f4a;background:#eef7f0;border-radius:7px;padding:5px 8px;margin-bottom:7px}
.w.new{color:#2f8f4e;font-weight:600}.w.old{color:#8a9499}
.w.red{color:#c2384b;font-weight:700;background:#fbe6e9;border-radius:3px;padding:0 2px}
.w.mkr{color:#b9b0a0;font-style:italic}.w.name{color:#6a5aa8}.w.inf{text-decoration:underline dotted}
</style></head><body>
<header>
<h1>Challenger 2 (Expanded) — content review</h1>
<div class="panels"><b>Hierarchy (locked):</b>
 <b>Course</b> (Waray · Challenger 2) › <b>Phase</b> (${phasesData.length}) › <b>Unit</b> (a theme + "I can…" goal) › then each Unit has <b>Lessons</b> (Words + Apply), a graded <b>Review</b>, and a <b>Story</b>. <span style="color:#9aa1a6">(A Lesson drills <b>Cards</b> — individual words or phrases.)</span>
 <i>Heads-up on "review":</i> the <b>"Unit N Review" lesson</b> is practice (② Apply); the <b>Review</b> in column ③ is the graded mastery test.</div>
<div class="panels" style="margin-top:5px"><b>Color</b> &nbsp;
 <span class="key"><span class="sw" style="background:#2f8f4e"></span>new this unit</span>
 <span class="key"><span class="sw" style="background:#8a9499"></span>taught earlier</span>
 <span class="key"><span class="sw" style="background:#c2384b"></span>never taught (flag)</span>
 <span class="key"><span class="sw" style="background:#b9b0a0"></span>marker</span>
 <span class="key"><span class="sw" style="background:#6a5aa8"></span>name</span>
 <span class="key"><span style="text-decoration:underline dotted">dotted</span> inflected root</span></div>
</header>
${phasesData.map((ph) => `<div class="phase"><h2>${esc(ph.name)}</h2><span class="sumband">${ph.units.length} units · <b>${ph.pWords}</b> words · <b>${ph.pPhrases}</b> phrases · <span class="${ph.pFlags ? "fl" : ""}">${ph.pFlags} untaught flags</span></span></div>` +
  ph.units.map((u) => `<div class="unit"><div class="uh"><span class="cnt">${u.nWords} words · ${u.nPhrases} phrases · <span class="${u.flags ? "flag" : ""}">${u.flags} flags</span></span><b>${esc(u.name)}</b> &nbsp;<span class="lvl">${esc(u.cefr || "")}${u.diff ? " · diff " + u.diff : ""}</span><div class="can">${esc(u.can || "")}</div>${u.grammar ? `<div class="meta">Grammar: ${u.grammar}</div>` : ""}</div>
<div class="cols">
<div class="col"><h4>① New words (${u.nWords})</h4>${u.wordCells}</div>
<div class="col"><h4>② Apply — phrases</h4>${u.applyCells}</div>
<div class="col"><h4>③ Graded unit review</h4>${u.reviewCell}</div>
<div class="col"><h4>④ Story</h4>${u.storyCell}</div>
</div></div>`).join("")).join("")}
</body></html>`;

fs.writeFileSync("challenger2-report.html", html);
const flags = phasesData.reduce((a, ph) => a + ph.pFlags, 0);
console.log(`✓ challenger2-report.html — ${phasesData.reduce((a, ph) => a + ph.units.length, 0)} units, ${flags} flags`);
for (const ph of phasesData) for (const u of ph.units) if (u.pad) console.log(`   padding: ${u.id} pads ${u.pad}`);
