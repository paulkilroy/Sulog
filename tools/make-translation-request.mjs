/* Emit a translation-request file to paste into ChatGPT (Waray → English, the SAFE
   direction — we never generate Waray). Strict @@ id idx @@ prefix so the reply parses
   straight back via tools/ingest-translation.mjs. Run: node tools/make-translation-request.mjs [all] */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { STORIES } from "../src/courses/waray/stories.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const onlyBloom = !process.argv.includes("all");
const set = STORIES.filter((s) => !onlyBloom || s.source === "Bloom");

let out = `TRANSLATION REQUEST — Waray → English (for the Sulog reading app)

Translate each Waray line below into NATURAL, SIMPLE English (these are children's stories).
RULES:
- Keep the exact "@@ <id> <index> @@" prefix on every line, unchanged.
- Return ONLY these lines, one English line per input line — no extra commentary.
- "<index> t" is the story title; translate it too.
- If a line is a proper name only, keep the name.

`;
for (const s of set) {
  out += `\n# ${s.title} [${s.source} · ${s.license}]\n`;
  out += `@@ ${s.id} t @@ ${s.title}\n`;
  s.paras.forEach((p, i) => { out += `@@ ${s.id} ${i} @@ ${p}\n`; });
}

fs.writeFileSync(path.join(root, "docs/translation-request.txt"), out);
const lines = out.split("\n").filter((l) => l.startsWith("@@")).length;
console.log(`wrote docs/translation-request.txt — ${set.length} stories, ${lines} lines to translate (${onlyBloom ? "Bloom only; run with 'all' for BFC too" : "all sources"})`);
