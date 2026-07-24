#!/usr/bin/env node
/* Confirm PC dictionary entries against the BOOK itself.
 *
 * `confirmed=false` on PC rows never doubted the Peace Corps book — it doubted OUR extraction
 * (scan → OCR → Gemini), which has hallucinated before. So the right auto-confirmation for a PC
 * word is: does the (waray, gloss) pair appear in the book's own printed vocab text? If yes, the
 * extraction is faithful and the book's authority carries — no native review needed. What's left
 * unconfirmed after this pass is the honest Ella set: pairs we cannot verify against print.
 *
 * Preview by default; --apply writes confirmed=true. Run: node --env-file=.env.local tools/confirm-from-book.mjs
 */
import pg from "pg";
import fs from "fs";

const ocr = fs.readFileSync("docs/sources/peace-corps/peace-corps-full-ocr.txt", "utf8");
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9' -]+/g, " ").replace(/\s+/g, " ").trim();
const lines = ocr.split("\n").map(norm);
// join adjacent lines too — vocab entries wrap
const joined = [...lines];
for (let i = 0; i < lines.length - 1; i++) joined.push((lines[i] + " " + lines[i + 1]).trim());

const STOP = new Set(["to", "a", "an", "the", "of", "or", "be", "is", "in", "at", "on", "for", "and", "one", "someone", "something", "s"]);
const content = (s) => norm(s).split(" ").filter((w) => w.length > 1 && !STOP.has(w));

const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
if (process.env.SULOG_SEARCH_PATH) await c.query(`set search_path to ${process.env.SULOG_SEARCH_PATH}`); // rebuild-check points tools at the scratch schema
const rows = (await c.query(`select d.waray, d.meaning from dictionary d where (not d.confirmed or d.confirmed_by is null)
  and exists (select 1 from block_items bi join lesson_blocks lb on lb.id=bi.block_id
              where bi.dict_waray = d.waray and lb.lesson_id like 'pc-%')`)).rows;

const confirmed = [], leftover = [];
for (const r of rows) {
  const w = norm(r.waray);
  const glossWords = content(r.meaning);
  // a book line that contains the headword AND at least half its gloss's content words
  const hit = joined.find((l) => l.includes(w) && glossWords.length > 0 &&
    glossWords.filter((g) => l.includes(g)).length >= Math.max(1, Math.ceil(glossWords.length / 2)));
  (hit ? confirmed : leftover).push({ ...r, hit });
}
console.log(`PC-drilled unconfirmed: ${rows.length} → book-verified ${confirmed.length} · needs Ella ${leftover.length}`);
console.log("\nbook-verified sample:");
for (const r of confirmed.slice(0, 6)) console.log(`  ✓ ${r.waray} = ${r.meaning}\n      book: "${r.hit.slice(0, 70)}"`);
console.log("\nstill needs a human (extraction not verifiable against print):");
for (const r of leftover) console.log(`  ? ${r.waray} = ${r.meaning}`);

if (process.argv.includes("--apply")) {
  await c.query("begin");
  let senses = 0;
  for (const r of confirmed) {
    await c.query("update dictionary set confirmed=true, confirmed_by=coalesce(confirmed_by,'book') where waray=$1", [r.waray]);
    // Propagate onto the sense row too. build-meanings runs BEFORE this pass and stamps a sense's
    // confirmed flag from dictionary.confirmed AT THAT MOMENT — which is still false here on a fresh
    // build, so the book confirmation would otherwise never reach the meanings table until a SECOND
    // reload (the live DB only had it because dictionary.confirmed accumulated across past reloads).
    // The verified pair is exactly (waray, dictionary.meaning) = the sense build-meanings inserted.
    const u = await c.query("update meanings set confirmed=true where waray=$1 and meaning=$2 and not confirmed", [r.waray, r.meaning]);
    senses += u.rowCount;
  }
  await c.query("commit");
  console.log(`\n✓ applied — ${confirmed.length} PC entries confirmed on the book's authority (+${senses} sense row(s) propagated)`);
} else console.log("\n(preview — pass --apply to write)");
await c.end();
