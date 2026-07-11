#!/usr/bin/env node
/* RLS smoke test — proves the PUBLIC key can't do what it must never do.
 *
 * The publishable key ships in every browser; only row-level security stands between it and the
 * data. RLS is applied manually (docs/schema/rls.sql), so a recreated table silently comes back
 * UNPROTECTED — this test is the alarm. Runs with the same public URL+key the app ships (no
 * credentials needed); reload-pc.mjs runs it after every content load.
 *
 * Asserts: content is world-READABLE, but anon cannot write content or read/write anyone's
 * progress. Exits 1 on any failure.  Run: node tools/rls-smoke.mjs
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL || "https://kdtzfaobcgprivsxkger.supabase.co";
const KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_mVYVK10OZfARWUl3PcfhHQ_zHa7bVpS";
const anon = createClient(URL, KEY, { auth: { persistSession: false } });

let fails = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "✓" : "✗ FAIL"}  ${name}${detail ? " — " + detail : ""}`); if (!ok) fails++; };

// 1. content IS world-readable (the app depends on it)
{
  const { data, error } = await anon.from("dictionary").select("waray").limit(1);
  check("anon can READ dictionary", !error && data?.length === 1, error?.message);
}
// 2. anon cannot INSERT content
{
  const { error } = await anon.from("dictionary").insert({ waray: "__rls_smoke__", kind: "word", meaning: "x" });
  check("anon cannot INSERT dictionary", !!error, error ? "" : "INSERT SUCCEEDED — RLS IS OFF");
  if (!error) await anon.from("dictionary").delete().eq("waray", "__rls_smoke__"); // best-effort cleanup
}
// 3. anon cannot UPDATE content (confirmEntry is admin-only; RLS yields 0 rows, not an error)
{
  const { data, error } = await anon.from("dictionary").update({ meaning: "__hacked__" }).eq("waray", "ako").select();
  check("anon cannot UPDATE dictionary", !!error || (data || []).length === 0, `rows changed: ${(data || []).length}`);
}
// 4. anon cannot READ anyone's progress
{
  const { data, error } = await anon.from("progress").select("user_id").limit(1);
  check("anon sees NO progress rows", !error && (data || []).length === 0, error?.message || `saw ${(data || []).length} rows`);
}
// 5. anon cannot WRITE progress
{
  const { error } = await anon.from("progress").insert({ user_id: "00000000-0000-4000-8000-00000000dead", course_id: "x", waray: "__rls__" });
  check("anon cannot INSERT progress", !!error, error ? "" : "INSERT SUCCEEDED — RLS IS OFF");
}
// 6. same for the streak table (the sync writes it)
{
  const { data, error } = await anon.from("user_streak").select("user_id").limit(1);
  check("anon sees NO streak rows", !error && (data || []).length === 0, error?.message || `saw ${(data || []).length} rows`);
}

// 7. ella_answers: world-readable, admin-only writes
{
  const { error } = await anon.from("ella_answers").insert({ id: "__rls__", answer: "x" });
  check("anon cannot INSERT ella_answers", !!error, error ? "" : "INSERT SUCCEEDED — RLS IS OFF");
}

if (fails) { console.error(`\n✗ ${fails} RLS check(s) FAILED — the public key can reach protected data. Re-run docs/schema/rls.sql NOW.`); process.exit(1); }
console.log("\n✓ RLS intact — the shipped key can only do what the app needs.");
