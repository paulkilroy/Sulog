#!/usr/bin/env node
/* Bootstrap an EMPTY database to the full Sulog schema. Refuses to run if content tables
 * already exist (this is the from-scratch path, not a migration tool). After this,
 * `npm run all` builds the complete content DB from committed sources + judgment tables.
 *
 * Applies, in order: schema.sql (content + per-user tables), rls.sql (row-level security,
 * defines is_admin()), sync-guards.sql (stale-write triggers), ella-answers.sql and
 * native-confirmations.sql (the judgment tables — the durable record of native feedback).
 *
 * Run: npm run bootstrap   (needs SUPABASE_DB_URL in .env.local)
 */
import pg from "pg";
import fs from "fs";

const url = process.env.SUPABASE_DB_URL || "";
if (!url) { console.error("Set SUPABASE_DB_URL (node --env-file=.env.local …)"); process.exit(1); }
if (!url.includes("kdtzfaobcgprivsxkger")) { console.error("✗ refusing: not the Sulog project"); process.exit(1); }

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
const existing = (await c.query(
  `select tablename from pg_tables where schemaname='public' and tablename in ('courses','dictionary','lessons')`)).rows;
if (existing.length) {
  console.error(`✗ refusing: content tables already exist (${existing.map((r) => r.tablename).join(", ")}).`);
  console.error("  Bootstrap is for an EMPTY database. For content changes use `npm run all`.");
  process.exit(1);
}
const FILES = ["schema.sql", "rls.sql", "sync-guards.sql", "ella-answers.sql", "native-confirmations.sql"];
for (const f of FILES) {
  process.stdout.write(`applying docs/schema/${f}… `);
  await c.query(fs.readFileSync(`docs/schema/${f}`, "utf8"));
  console.log("✓");
}
await c.end();
console.log("\n✓ empty database bootstrapped — now run `npm run all` to build the content.");
