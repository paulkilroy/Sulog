/* EXPORT the live course as clean, LLM-ready markdown — the outbound half of the AI-audit loop:
     export-course  →  (Gemini/Claude audits against docs/notes/modernization-rules.md)
     →  proposals come back as JSON  →  import-audit (emits review-queue rows w/ candidates)
     →  native confirms → admin approves → harvest applies.
   Writes docs/course-export/pc-course.md (one file; ~text only, no scans) with the modernization
   rules as a header so any reviewing AI has the context inline.
   Run:  SUPABASE_DB_URL=… node tools/export-course.mjs   (chained: npm run export)               */
import pg from "pg";
import fs from "fs";

const EXPECTED_REF = "kdtzfaobcgprivsxkger";
if (!(process.env.SUPABASE_DB_URL || "").includes(EXPECTED_REF)) {
  console.error(`✗ SUPABASE_DB_URL must point at ${EXPECTED_REF}`); process.exit(1);
}
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = async (sql, p = []) => (await c.query(sql, p)).rows;

const phases = await q(`select * from phases where course_id='pc' order by ord`);
const units = await q(`select * from units order by ord`);
const lessons = await q(`select * from lessons order by ord`);
const blocks = await q(`select * from lesson_blocks order by lesson_id, ord`);
const items = await q(`select bi.*, d.meaning dmean, d.pronunciation dpron, d.pos dpos, e.waray ewar, e.translation etran
  from block_items bi
  left join dictionary d on d.waray = bi.dict_waray
  left join expressions e on e.id = bi.expr_id
  order by bi.block_id, bi.ord`);
await c.end();

const byPhase = new Map(); units.forEach((u) => (byPhase.get(u.phase_id) || byPhase.set(u.phase_id, []).get(u.phase_id)).push(u));
const byUnit = new Map(); lessons.forEach((l) => (byUnit.get(l.unit_id) || byUnit.set(l.unit_id, []).get(l.unit_id)).push(l));
const byLesson = new Map(); blocks.forEach((b) => (byLesson.get(b.lesson_id) || byLesson.set(b.lesson_id, []).get(b.lesson_id)).push(b));
const byBlock = new Map(); items.forEach((it) => (byBlock.get(it.block_id) || byBlock.set(it.block_id, []).get(it.block_id)).push(it));

let md = `# Peace Corps Waray — full course export
Generated ${new Date().toISOString().slice(0, 10)} from the live database by tools/export-course.mjs.
Every drillable item carries a stable ref: \`[word: <waray>]\` or \`[sent#<id>]\` — cite these refs
in audit proposals so they can be imported mechanically.

## Modernization rules in force (see docs/notes/modernization-rules.md)
1. **Past-tense morphology**: the 1968 book's \`-inm-\` infix (kinmaon, sinmakay) is ARCHAIC —
   modern equivalents are \`na-\`/\`nag-\` (nakaon) or \`-um-\` (kumaon). \`-inm-\` is tagged
   Literary/Traditional, never deleted.
2. **Regional markers**: the app has a live toggle for Leyte (han/hin) vs Samar (san/sin) forms —
   frame marker guidance assuming it; show both renderings when relevant.
3. **Vocabulary**: flag archaic 1960s terms; give the modern conversational equivalent alongside
   (loanwords welcome where natives actually use them). Layer, never clobber.

`;
for (const ph of phases) {
  md += `\n# PHASE: ${ph.name}${ph.can_do ? ` — ${ph.can_do}` : ""}\n`;
  for (const u of byPhase.get(ph.id) || []) {
    md += `\n## UNIT: ${u.name}${u.can_do ? ` — ${u.can_do}` : ""}  (${u.id})\n`;
    for (const l of byUnit.get(u.id) || []) {
      md += `\n### LESSON ${l.id} — ${l.title || ""}\n`;
      for (const b of byLesson.get(l.id) || []) {
        const its = byBlock.get(b.id) || [];
        if (["grammar", "note"].includes(b.type)) {
          md += `\n**GUIDE${b.title ? ` — ${b.title}` : ""}**${b.formula ? `  \nFormula: \`${b.formula}\`` : ""}\n${b.body_md || ""}\n`;
        } else if (b.type === "vocab" || b.type === "phrases") {
          md += `\n**VOCAB${b.title ? ` — ${b.title}` : ""}**\n`;
          for (const it of its) md += it.dict_waray
            ? `- [word: ${it.dict_waray}] ${it.dict_waray}${it.dpron ? ` /${it.dpron}/` : ""}${it.dpos ? ` (${it.dpos})` : ""} — ${it.dmean || ""}\n`
            : `- [sent#${it.expr_id}] ${it.ewar} — ${it.etran || ""}\n`;
        } else if (b.type === "drill") {
          md += `\n**DRILL${b.title ? ` — ${b.title}` : ""}** (${b.drill_kind || "?"} · ${b.drill_modality || "?"}${b.drill_direction ? ` · ${b.drill_direction}` : ""})\n`;
          for (const it of its) md += it.dict_waray
            ? `- [word: ${it.dict_waray}] ${it.dict_waray} — ${it.dmean || ""}\n`
            : `- [sent#${it.expr_id}] ${it.ewar} — ${it.etran || ""}\n`;
        } else if (b.type === "assessment") {
          md += `\n**TEST (gate)** — pass ${Math.round((b.assess_threshold || 0.8) * 100)}%\n`;
        }
        if (b.footnote) md += `> footnote: ${b.footnote}\n`;
      }
    }
  }
}
fs.mkdirSync("docs/course-export", { recursive: true });
fs.writeFileSync("docs/course-export/pc-course.md", md);
console.log(`✓ docs/course-export/pc-course.md — ${(md.length / 1024).toFixed(0)}KB · ${phases.length} phases · ${lessons.length} lessons · ${items.length} items`);
