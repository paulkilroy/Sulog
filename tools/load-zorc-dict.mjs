/* One-time bulk load of the full Tramp & Zorc dictionary into the DB.
   Run:  SUPABASE_DB_URL=... node tools/load-zorc-dict.mjs
   Safe to re-run — every insert is `on conflict do nothing`, and curated rows were excluded
   at generation time (tools/gen-zorc-dict.mjs). Wrapped in one transaction. */
import fs from "fs";
import pg from "pg";

const EXPECTED_REF = "kdtzfaobcgprivsxkger";
if (!(process.env.SUPABASE_DB_URL || "").includes(EXPECTED_REF)) {
  console.error(`✗ SUPABASE_DB_URL must point at project ${EXPECTED_REF} — refusing to load.`);
  process.exit(1);
}
const sql = fs.readFileSync("docs/schema/zorc-dictionary.sql", "utf8");
if (!sql.includes("insert into dictionary") || !sql.includes("on conflict")) {
  console.error("✗ zorc-dictionary.sql looks wrong — regenerate with tools/gen-zorc-dict.mjs");
  process.exit(1);
}

const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20000 });
await c.connect();
const n = async (t) => (await c.query(`select count(*)::int c from ${t}`)).rows[0].c;
const [d0, m0] = [await n("dictionary"), await n("meanings")];
console.log(`before: dictionary ${d0} · meanings ${m0}`);
await c.query("begin");
await c.query(sql);
await c.query("commit");
const [d1, m1] = [await n("dictionary"), await n("meanings")];
console.log(`after:  dictionary ${d1} (+${d1 - d0}) · meanings ${m1} (+${m1 - m0})`);
console.log("✓ loaded. Bump the course version so clients refetch:  update courses set version = version + 1 where id = 'pc';");
await c.end();
