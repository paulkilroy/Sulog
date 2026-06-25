/* Ingest a ChatGPT MC reply (docs/sources/mc-reply.json) into the persistent
   docs/sources/story-questions.json (map keyed by story id), MERGING so batches accumulate.
   Validates ids against the stories and sanity-checks each question. build-stories.mjs then
   folds these into stories.js. Run: node tools/ingest-mc.mjs */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { STORIES } from "../src/courses/waray/stories.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const ids = new Set(STORIES.map((s) => s.id));

let raw = read("docs/sources/mc-reply.json").trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
const incoming = JSON.parse(raw);

const store = "docs/sources/story-questions.json";
const cur = fs.existsSync(path.join(root, store)) ? JSON.parse(read(store)) : {};

let added = 0, skipped = [];
for (const o of incoming) {
  if (!ids.has(o.id)) { skipped.push(`unknown id: ${o.id}`); continue; }
  const qs = (o.questions || []).filter((q) =>
    q && typeof q.q === "string" && Array.isArray(q.options) && q.options.length >= 2 &&
    Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);
  if (qs.length !== (o.questions || []).length) skipped.push(`${o.id}: dropped ${(o.questions || []).length - qs.length} malformed question(s)`);
  if (!qs.length) continue;
  cur[o.id] = { title_en: o.title_en || cur[o.id]?.title_en || "", questions: qs };
  added++;
}

fs.writeFileSync(path.join(root, store), JSON.stringify(cur, null, 1));
const have = Object.keys(cur);
console.log(`ingested ${added} stories | story-questions.json now covers ${have.length}/${STORIES.length} stories`);
if (skipped.length) console.log("notes:\n  " + skipped.join("\n  "));
const missing = STORIES.filter((s) => !cur[s.id]).map((s) => s.id);
console.log(`\nstill missing MC (${missing.length}):\n  ${missing.join("\n  ")}`);
