/* Wide multi-column review report for Challenger 2. Per unit: New Words | Apply
   phrases | Story, with every word color-coded (new this unit / taught earlier /
   marker or name / untaught = red flag). Plus a terminology panel (the hierarchy
   words). Output: challenger2-report.html.  Run: node tools/build-challenger2-report.mjs */
import fs from "fs";
import { SEED_CH2, CHALLENGER2 } from "../src/courses/waray/challenger2.js";

const gloss = {}; for (const r of SEED_CH2) if (!/\s/.test(r[1])) gloss[r[1].toLowerCase()] = r[2];
const MARKERS = new Set(["hi", "in", "it", "an", "nga", "ngan", "ha", "han", "na", "ka", "ni", "ba", "ini", "iton", "adto", "ito", "sin", "hin", "may", "la", "man", "gud", "pa", "kay", "ngani", "gihap"]);
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9-]/g, "");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// strip common Waray affixes to catch inflected forms of a taught root
const roots = (t) => {
  const out = new Set([t]);
  const p = t.replace(/^(nagpa|magpa|naka|maka|nang|mang|mag|nag|gin|pag|ma|na|um|i)/, "");
  out.add(p); out.add(p.replace(/(on|an|hi|i|a)$/, ""));
  return [...out].filter(Boolean);
};

// build cumulative taught-word set as we walk units in order
let taughtBefore = new Set();
const phasesData = CHALLENGER2.map((ph) => ({
  name: ph.name, hint: ph.hint,
  units: ph.units.map((u) => {
    const wordsLessons = u.lessons.filter((l) => l.kind !== "apply");
    const applyLessons = u.lessons.filter((l) => l.kind === "apply");
    const thisWords = new Set(wordsLessons.flatMap((l) => l.items).map(norm));
    const earlier = new Set(taughtBefore);
    // classify one token
    const tok = (raw, i) => {
      const n = norm(raw);
      if (!n) return `<span>${esc(raw)}</span>`;
      let cls = "red", tip = "untaught content word";
      if (thisWords.has(n)) { cls = "new"; tip = "new this unit"; }
      else if (earlier.has(n)) { cls = "old"; tip = "taught earlier"; }
      else if (MARKERS.has(n)) { cls = "mkr"; tip = "grammar marker"; }
      else if (i > 0 && /^[A-Z]/.test(raw)) { cls = "name"; tip = "proper name"; }
      else if (roots(n).some((r) => thisWords.has(r))) { cls = "new inf"; tip = "inflected form (new root)"; }
      else if (roots(n).some((r) => earlier.has(r))) { cls = "old inf"; tip = "inflected form (earlier root)"; }
      return `<span class="w ${cls}" title="${tip}">${esc(raw)}</span>`;
    };
    const line = (s) => s.split(/(\s+)/).map((p, i) => /^\s+$/.test(p) ? p : tok(p, i)).join("");
    // count red flags across phrases + story
    let flags = 0;
    const scan = (s) => { for (const [i, p] of s.split(/\s+/).entries()) { const n = norm(p); if (n && !thisWords.has(n) && !earlier.has(n) && !MARKERS.has(n) && !(i > 0 && /^[A-Z]/.test(p)) && !roots(n).some((r) => thisWords.has(r) || earlier.has(r))) flags++; } };
    for (const l of applyLessons) for (const it of l.items) scan(it);
    if (u.story) for (const ln of u.story.lines) scan(ln.war);

    const wordCells = wordsLessons.flatMap((l) => l.items).map((w) => {
      const repeat = earlier.has(norm(w));
      return `<div class="wc ${repeat ? "old" : "new"}"><b>${esc(w)}</b> <span class="g">${esc(gloss[norm(w)] || "")}</span>${repeat ? ' <em>repeat</em>' : ""}</div>`;
    });
    const applyCells = applyLessons.map((l) => `<div class="lz"><div class="lz-t">${esc(l.title)}</div>${l.items.map((it) => `<div class="ph">${line(it)}</div>`).join("")}</div>`).join("");
    const storyCell = u.story ? `<div class="lz-t">${esc(u.story.title)} <span class="g">— ${esc(u.story.titleEn || "")}</span></div>` +
      u.story.lines.map((ln) => `<div class="ph">${line(ln.war)}<div class="en">${esc(ln.en)}</div></div>`).join("") +
      (u.story.q ? `<div class="q">Q: ${esc(u.story.q.q)} <span class="g">[${u.story.q.options.map(esc).join(" · ")}] ✓${esc(u.story.q.options[u.story.q.answer])}</span></div>` : "") : "<i>no story</i>";

    for (const w of thisWords) taughtBefore.add(w);
    return {
      id: u.id, name: u.name, hint: u.hint,
      nWords: thisWords.size, nPhrases: applyLessons.reduce((a, l) => a + l.items.length, 0), flags,
      wordCells: wordCells.join(""), applyCells, storyCell,
    };
  }),
}));

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Challenger 2 — review report</title><style>
:root{--sand:#f7f1e6;--ink:#22303a;--soft:#5e6b70}
*{box-sizing:border-box} body{margin:0;background:var(--sand);color:var(--ink);font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px}
header{padding:16px 22px;border-bottom:1px solid #e3dccd;position:sticky;top:0;background:var(--sand);z-index:5}
h1{font-family:Georgia,serif;margin:0 0 4px;font-size:22px}
.panels{display:flex;gap:26px;flex-wrap:wrap;margin-top:8px;font-size:12.5px;color:var(--soft)}
.panel b{color:var(--ink)}
.key{display:inline-flex;align-items:center;gap:5px;margin-right:12px}
.sw{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:middle}
.phase{font-family:Georgia,serif;font-size:18px;margin:22px 22px 4px;padding-top:8px}
.unit{margin:10px 22px;border:1px solid #e3dccd;border-radius:12px;background:#fff;overflow:hidden}
.uh{padding:10px 14px;background:#fbf7ef;border-bottom:1px solid #eee6d6}
.uh b{font-family:Georgia,serif;font-size:16px} .uh .can{color:var(--soft);font-size:12.5px}
.uh .cnt{float:right;font-size:12px;color:var(--soft)} .uh .flag{color:#c2384b;font-weight:700}
.cols{display:grid;grid-template-columns:1fr 1.4fr 1.4fr;gap:0}
.col{padding:12px 14px;border-right:1px solid #f0eadd}.col:last-child{border-right:0}
.col h4{margin:0 0 8px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--soft)}
.wc{padding:2px 0} .wc b{font-family:Georgia,serif} .wc .g{color:var(--soft);font-size:12.5px} .wc em{color:#a08a55;font-size:11px}
.wc.new b{color:#2f8f4e} .wc.old b{color:#8a9499}
.lz{margin-bottom:10px}.lz-t{font-size:11.5px;font-weight:700;color:#b5761f;margin-bottom:3px}
.ph{font-family:Georgia,serif;font-size:15px;line-height:1.5;margin:2px 0}
.ph .en{font-family:-apple-system,sans-serif;font-size:12px;color:var(--soft);line-height:1.2}
.q{font-size:12px;color:var(--soft);margin-top:6px} .q .g{color:#9aa1a6}
.w.new{color:#2f8f4e;font-weight:600}
.w.old{color:#8a9499}
.w.red{color:#c2384b;font-weight:700;background:#fbe6e9;border-radius:3px;padding:0 2px}
.w.mkr{color:#b9b0a0;font-style:italic}
.w.name{color:#6a5aa8}
.w.inf{text-decoration:underline dotted}
</style></head><body>
<header>
<h1>Challenger 2 (Expanded) — content review</h1>
<div class="panels">
<div class="panel"><b>What we call things:</b>
 <b>Course</b> = the whole track (Waray · Challenger 2) &nbsp;›&nbsp;
 <b>Phase</b> = a big section (${phasesData.length} of them) &nbsp;›&nbsp;
 <b>Unit</b> = one theme with an "I can…" goal &nbsp;›&nbsp;
 <b>Lesson</b> = a bite-sized block (Words or Apply) &nbsp;›&nbsp;
 <b>Card</b> = one word or phrase drilled &nbsp;·&nbsp;
 <b>Story</b> = the unit's reading capstone.
 <br><i>Note the "review" overload:</i> the <b>"Unit N Review" lesson</b> is just another Apply lesson (practice); the separate graded <b>"Unit review" button</b> is the auto-built mastery test (not shown here).</div>
</div>
<div class="panels"><div class="panel"><b>Color key</b> &nbsp;
 <span class="key"><span class="sw" style="background:#2f8f4e"></span>new this unit</span>
 <span class="key"><span class="sw" style="background:#8a9499"></span>taught earlier</span>
 <span class="key"><span class="sw" style="background:#c2384b"></span>never taught (flag)</span>
 <span class="key"><span class="sw" style="background:#b9b0a0"></span>grammar marker</span>
 <span class="key"><span class="sw" style="background:#6a5aa8"></span>proper name</span>
 <span class="key"><span style="text-decoration:underline dotted">dotted</span> = inflected form of a taught root</span>
</div></div>
</header>
${phasesData.map((ph) => `<div class="phase">${esc(ph.name)} <span class="g" style="color:#9aa1a6;font-size:13px">— ${esc(ph.hint || "")}</span></div>` +
  ph.units.map((u) => `<div class="unit"><div class="uh"><span class="cnt">${u.nWords} words · ${u.nPhrases} phrases · <span class="${u.flags ? "flag" : ""}">${u.flags} untaught flags</span></span><b>${esc(u.name)}</b> <span class="can">— ${esc(u.hint || "")}</span></div>
<div class="cols">
<div class="col"><h4>① New words (${u.nWords})</h4>${u.wordCells}</div>
<div class="col"><h4>② Apply — phrases</h4>${u.applyCells}</div>
<div class="col"><h4>③ Story</h4>${u.storyCell}</div>
</div></div>`).join("")).join("")}
</body></html>`;

fs.writeFileSync("challenger2-report.html", html);
const totalFlags = phasesData.reduce((a, ph) => a + ph.units.reduce((b, u) => b + u.flags, 0), 0);
console.log(`✓ wrote challenger2-report.html — ${phasesData.reduce((a, ph) => a + ph.units.length, 0)} units, ${totalFlags} untaught-word flags total`);
for (const ph of phasesData) for (const u of ph.units) if (u.flags) console.log(`   ⚠ ${u.id} ${u.name}: ${u.flags} flags`);
