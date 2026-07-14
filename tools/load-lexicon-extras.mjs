#!/usr/bin/env node
/* Load docs/dictionary/lexicon-extras.json — the committed lexicon state the PC seed cannot
   carry: the Tramp-backed word-bank entries (words + senses) and curated attributes
   (variants/pos/root/loan) for seed words. Runs inside `npm run reload` right after the
   seed, BEFORE the verifiers, so a from-scratch rebuild reproduces the live dictionary
   exactly (rebuild-check enforces this). Idempotent; the file is the source of truth. */
import pg from "pg";
import fs from "fs";
const X = JSON.parse(fs.readFileSync("docs/dictionary/lexicon-extras.json", "utf8"));
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
if (process.env.SULOG_SEARCH_PATH) await c.query(`set search_path to ${process.env.SULOG_SEARCH_PATH}`); // rebuild-check points tools at the scratch schema
await c.query("begin");
let words = 0, senses = 0, attrs = 0;
for (const w of X.words) {
  const r = await c.query(
    `insert into dictionary (waray,kind,meaning,pronunciation,pos,root,variants,loan,confirmed,confirmed_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (waray) do update set meaning=excluded.meaning, pronunciation=excluded.pronunciation,
       pos=excluded.pos, root=excluded.root, variants=excluded.variants, loan=excluded.loan,
       confirmed=dictionary.confirmed or excluded.confirmed,
       confirmed_by=coalesce(dictionary.confirmed_by, excluded.confirmed_by)`,
    [w.waray, w.kind, w.meaning, w.pronunciation, w.pos, w.root, w.variants || [], w.loan, w.confirmed, w.confirmed_by]);
  words += r.rowCount;
}
for (const s of X.senses) {
  const r = await c.query(
    `insert into meanings (waray,meaning,pos,pronunciation,sources,confirmed,ord) values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (waray,meaning) do update set pos=coalesce(excluded.pos, meanings.pos),
       pronunciation=coalesce(excluded.pronunciation, meanings.pronunciation),
       sources=(select array(select distinct unnest(meanings.sources || excluded.sources))),
       confirmed=meanings.confirmed or excluded.confirmed, ord=excluded.ord`,
    [s.waray, s.meaning, s.pos, s.pronunciation, s.sources || [], s.confirmed, s.ord]);
  senses += r.rowCount;
}
for (const [w, a] of Object.entries(X.attrs)) {
  // curated OVERRIDES for seed words — the file wins over the raw seed (verifiers + the
  // native-confirmation replay still run after this, so higher authorities win over the file)
  const r = await c.query(
    `update dictionary set meaning=coalesce($2,meaning), pronunciation=coalesce($3,pronunciation),
       variants=coalesce($4,variants), pos=coalesce($5,pos), root=coalesce($6,root), loan=coalesce($7,loan)
     where waray=$1`,
    [w, a.meaning || null, a.pronunciation || null, a.variants || null, a.pos || null, a.root || null, a.loan || null]);
  attrs += r.rowCount;
}
await c.query("commit");
console.log(`✓ lexicon extras: ${words} word-bank entries · ${senses} senses · attrs on ${attrs} seed words`);
await c.end();
