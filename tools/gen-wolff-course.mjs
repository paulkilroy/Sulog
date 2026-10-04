/* Wolff Unit-1 pilot: extract Lesson 1 from the parse-wolff.py skeleton and load it
   into Supabase as course 'wolff' (phases/units/lessons/lesson_blocks/block_items).

   EVERY item (vocab word or dialogue line) is inserted as an EXPRESSION — the shared
   dictionary table is never touched (HARD RULE: dict = PC/Tramp only). Inserted
   expression ids are recorded in docs/sources/wolff/expr-ids.json so a reload can
   delete exactly ours and nothing else.

   The course is unlisted: reachable only via the ?course=wolff URL override.
   (CC BY-ND: adapted content stays out of any UI until John Wolff's permission lands.)

   Extraction heuristics (two-column dialogue pages; Waray/English sides SWAP by page):
   - column language = Tramp-dictionary hit-rate per column
   - vocab pair: L/R lines on the same baseline (±0.012), each side short
   - dialogue pair: numbered lines matched by number; unnumbered lines continue
     the previous numbered line in their column

   Run:  node tools/gen-wolff-course.mjs <scratch>            # extract + preview
         SUPABASE_DB_URL=… node tools/gen-wolff-course.mjs <scratch> --load   */
import fs from "fs";

const SCR = process.argv[2];
const LOAD = process.argv.includes("--load");
if (!SCR) { console.error("usage: node tools/gen-wolff-course.mjs <scratch-dir> [--load]"); process.exit(1); }
const skel = JSON.parse(fs.readFileSync(`${SCR}/wolff-ocr/wolff-unit1.json`, "utf8"));

const tramp = JSON.parse(fs.readFileSync("docs/sources/dictionaries/tramp.json", "utf8"));
const DICT = new Set();
for (const e of tramp.entries) for (const w of [e.waray, e.norm]) if (w) DICT.add(w.toLowerCase());
const fold = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const dictScore = (s) => {
  const toks = fold(s).replace(/[^a-z\s-]/g, " ").split(/\s+/).filter((t) => t.length > 1);
  return toks.length ? toks.filter((t) => DICT.has(t)).length / toks.length : 0;
};
// the 1967 typewriter + OCR confuses o/e/c in ENGLISH text ("suitoase", "thoso") — light repair
const fixEn = (s) => s
  .replace(/\boase\b/g, "case").replace(/([a-z])oase/g, "$1case")
  .replace(/\b([Tt])hoso\b/g, "$1hose").replace(/\bwhoro\b/g, "where").replace(/\baro\b/g, "are")
  .replace(/\bIou\b/g, "You").replace(/\b([a-z]+)o([bcdfgklmnprstvz])e\b/g, (m, a, b) => DICT.has(m.toLowerCase()) ? m : m); // conservative: leave unknowns

const L1 = skel["1"].sections;
const sec = (n) => L1.find((s) => s.name === n) || { lines: [] };
const topics = L1.filter((s) => s.name.startsWith("topic"));

const bs = sec("basic_sentences").lines.filter((l) => l.y < 0.9 && l.y > 0.06 && !/google|michigan|original from/i.test(l.t));
const byPage = new Map();
for (const l of bs) { if (!byPage.has(l.seq)) byPage.set(l.seq, []); byPage.get(l.seq).push(l); }

/* Dialogue page layout (verified seq 41-42):
     LEFT  x<~0.5 : numbered English speaker lines ("13. Dr. Martillo: You, Bob,")
                    + their continuations + vocab GLOSSES ("come here")
     RIGHT x>~0.5 : the Waray sentence (starred: "*Rita, kadi, …") + its short
                    continuations, and single Waray vocab WORDS ("kadi")
   Pairing is BY ROW (same y): gloss↔word, anchor↔sentence. Numbers exist only
   on the English side. */
const vocab = [], sentences = [];
for (const [, lines] of [...byPage.entries()].sort((a, b) => a[0] - b[0])) {
  const Lcol = lines.filter((l) => l.x < 0.5).sort((a, b) => b.y - a.y);
  const Rcol = lines.filter((l) => l.x >= 0.5).sort((a, b) => b.y - a.y);
  if (!Lcol.length || !Rcol.length) continue;
  const rAt = (y, tol = 0.015) => Rcol.find((r) => Math.abs(r.y - y) < tol);
  const isAnchor = (t) => /^[^a-z]{0,2}\d{0,2}[.,lI]?\s*[A-Z]/.test(t) && /^\s*\S{0,3}\d|^\d/.test(t);

  let current = null;                     // { eng:[], war:[], y }
  const flush = () => {
    if (!current) return;
    const strip = (s) => s.replace(/^\*\s*/, "").replace(/\s+/g, " ").trim();
    const war = strip(current.war.join(" "));
    const eng = fixEn(current.eng.join(" ")
      .replace(/^\d{1,2}[.,lI]?\s*/, "")
      .replace(/^[A-Z][a-zA-Z.]*\s?[A-Za-z]*\s*:\s*/, "")      // speaker label
      .replace(/\s+/g, " ")).trim();
    if (war.length > 3 && eng.length > 3 && dictScore(war) > 0.4)
      sentences.push({ waray: war, english: eng });
    current = null;
  };
  for (const l of Lcol) {
    const t = l.t.trim();
    const partner = rAt(l.y);
    const partnerIsWord = partner && partner.t.split(/\s+/).length <= 3 && !/^\*/.test(partner.t);
    if (/^\d{1,2}[.,lI]?\s/.test(t) || /^[^\w\s].?\s*$/.test(t)) {
      // numbered anchor → new dialogue turn; its row's right side starts the Waray sentence
      flush();
      current = { eng: [t], war: [], y: l.y };
      const main = rAt(l.y, 0.02);
      if (main && !partnerIsWordLike(main)) {
        current.war.push(main.t);
        // Waray continuations: right-col lines just below with ~same x as the main line
        let prevY = main.y;
        for (const r of Rcol) {
          if (r.y >= prevY || prevY - r.y > 0.035) continue;
          if (Math.abs(r.x - main.x) < 0.03 && r.t.split(/\s+/).length <= 6) { current.war.push(r.t); prevY = r.y; }
        }
      }
    } else if (partnerIsWord && t.split(/\s+/).length <= 6 && !current?.war.length === false && (!current || l.y < current.y - 0.03)) {
      // gloss row: left explanation ↔ right Waray word
      {
        const w = partner.t.replace(/[.,:]$/, "").trim();
        const e = fixEn(t.replace(/[.,:]$/, "")).toLowerCase().trim();
        const looksWaray = /^[a-záéíóúqA-ZÁÉÍÓÚ' ()-]{2,28}$/.test(w) && (dictScore(w) > 0 || /[áéíóú]/.test(w));
        if (looksWaray && e.length > 1 && e.length < 60) vocab.push({ waray: w, english: e });
      }
    } else if (current && current.y - l.y < 0.06) {
      current.eng.push(t);                 // English continuation of the open turn
    }
  }
  flush();
  // salvage: starred Waray sentences whose English number was OCR-mangled
  for (const r of Rcol) {
    if (!/^\*/.test(r.t)) continue;
    const war = r.t.replace(/^\*\s*/, "").replace(/[.,]$/, "").trim();
    if (sentences.some((x) => x.waray.startsWith(war.slice(0, 12)))) continue;
    const eng = Lcol.filter((l) => Math.abs(l.y - r.y) < 0.03 && !/^\d/.test(l.t))
      .concat(Lcol.filter((l) => r.y - l.y > 0 && r.y - l.y < 0.045 && l.x > 0.2))
      .map((l) => l.t).join(" ");
    const cleanEng = fixEn(eng.replace(/^.*?:\s*/, "").replace(/\s+/g, " ")).trim();
    if (war.length > 6 && cleanEng.length > 4 && dictScore(war) > 0.35)
      sentences.push({ waray: war + ".", english: cleanEng });
  }
}
function partnerIsWordLike(r) { return r.t.split(/\s+/).length <= 2 && !/^\*/.test(r.t); }

const seen = new Set();
const uniq = (arr) => arr.filter((x) => { const k = fold(x.waray); if (seen.has(k) || !k) return false; seen.add(k); return true; });
const vocabU = uniq(vocab), sentU = uniq(sentences);

const prose = (s) => s.lines.filter((l) => l.y > 0.06 && !/google|michigan|original from/i.test(l.t))
  .map((l) => l.t).join(" ").replace(/\s+/g, " ").trim();
const teach = [];
// commentary deliberately EXCLUDED from teach: it is numbered cross-reference notes
// (meaningless without the numbered sentences) and our segmentation bleeds dialogue into it
for (const t of topics) {
  const body = prose(t);
  if (body.length > 60) teach.push({ title: t.title || t.name.replace("topic ", "§"), body: body.slice(0, 2000) });
}

console.log(`vocab: ${vocabU.length} · dialogue lines: ${sentU.length} · teach parts: ${teach.length}`);
console.log("\nsample vocab:", JSON.stringify(vocabU.slice(0, 8)));
console.log("\nsample dialogue:", JSON.stringify(sentU.slice(0, 4), null, 1));
console.log("\nteach titles:", teach.map((t) => t.title).join(" · "));

if (!LOAD) { console.log("\n(dry run — add --load to write the DB)"); process.exit(0); }

// ---------------- DB load ----------------
const { default: pg } = await import("pg");
const EXPECTED_REF = "kdtzfaobcgprivsxkger";
if (!(process.env.SUPABASE_DB_URL || "").includes(EXPECTED_REF)) {
  console.error(`✗ SUPABASE_DB_URL must point at ${EXPECTED_REF}`); process.exit(1);
}
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = async (sql, p = []) => (await c.query(sql, p)).rows;
const IDS_FILE = "docs/sources/wolff/expr-ids.json";

await q("begin");
try {
  // tear down any previous wolff rows (ours only)
  await q(`delete from lesson_blocks where lesson_id in (select id from lessons where unit_id in (select id from units where phase_id in (select id from phases where course_id='wolff')))`);
  await q(`delete from lessons where unit_id in (select id from units where phase_id in (select id from phases where course_id='wolff'))`);
  await q(`delete from units where phase_id in (select id from phases where course_id='wolff')`);
  await q(`delete from phases where course_id='wolff'`);
  if (fs.existsSync(IDS_FILE)) {
    const old = JSON.parse(fs.readFileSync(IDS_FILE, "utf8"));
    if (old.length) await q(`delete from expressions where id = any($1)`, [old]);
  }
  await q(`insert into courses (id, name, lang, methodology, version) values ('wolff','Wolff Classic (1967)','war','grammar-spine',1)
           on conflict (id) do update set version = courses.version + 1`);
  await q(`insert into phases (id, course_id, ord, name, can_do) values ('wolff-p1','wolff',1,'Unit 1 · First conversations',null)`);
  await q(`insert into units (id, phase_id, ord, name, can_do) values ('wolff-u1','wolff-p1',1,'Lesson 1 · Getting Acquainted','Meet someone and exchange pleasantries (Tacloban Waray, 1967)')`);
  await q(`insert into lessons (id, unit_id, ord, title) values ('wolff-l1','wolff-u1',1,'Getting Acquainted')`);

  const exprIds = [];
  const insertExprs = async (items) => {
    const ids = [];
    for (const it of items) {
      const r = await q(`insert into expressions (waray, translation) values ($1,$2) returning id`, [it.waray, it.english]);
      ids.push(r[0].id); exprIds.push(r[0].id);
    }
    return ids;
  };
  const vocabIds = await insertExprs(vocabU);
  const sentIds = await insertExprs(sentU);

  let ord = 0;
  const block = async (fields) => (await q(
    `insert into lesson_blocks (lesson_id, ord, type, title, body_md, drill_kind, drill_modality, drill_direction)
     values ('wolff-l1', $1, $2, $3, $4, $5, $6, $7) returning id`,
    [++ord, fields.type, fields.title || null, fields.body || null, fields.kind || null, fields.modality || null, fields.dir || null]))[0].id;
  const attach = async (blockId, ids) => {
    for (let i = 0; i < ids.length; i++)
      await q(`insert into block_items (block_id, ord, expr_id, role) values ($1,$2,$3,'item')`, [blockId, i + 1, ids[i]]);
  };
  for (const t of teach) await block({ type: "grammar", title: t.title, body: t.body });
  await attach(await block({ type: "phrases", title: "Words from the dialogue" }), vocabIds);
  await attach(await block({ type: "drill", title: "Recognize", kind: "recognition", modality: "mc" }), vocabIds);
  await attach(await block({ type: "drill", title: "Dialogue lines", kind: "recognition", modality: "mc" }), sentIds);

  await q("commit");
  fs.writeFileSync(IDS_FILE, JSON.stringify(exprIds));
  console.log(`\n✓ loaded course 'wolff': ${vocabIds.length} vocab + ${sentIds.length} dialogue expressions, ${teach.length + 3} blocks`);
  console.log(`  expression ids recorded in ${IDS_FILE}`);
} catch (e) {
  await q("rollback");
  console.error("✗ rolled back:", e.message);
  process.exit(1);
} finally { await c.end(); }
