#!/usr/bin/env node
/* AUTHENTICATED RLS smoke test — the companion to rls-smoke.mjs.
 *
 * rls-smoke only exercises the ANONYMOUS key, so it stayed green while a policy-recursion bug
 * made every signed-in progress read throw ("infinite recursion detected in policy for relation
 * enrollments") — the app couldn't pull and showed empty progress. This test closes that gap.
 *
 * No real users or credentials needed: it creates throwaway fixture rows, then impersonates each
 * persona at the DB level (`set local role authenticated` + injected request.jwt.claims, exactly
 * what Supabase does), asserts the access matrix, and ROLLS BACK — nothing persists.
 *
 * Any policy error (recursion, missing grant) fails the run. Needs SUPABASE_DB_URL.
 * Run: npm run rls:authed
 */
import pg from "pg";

const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

let fails = 0;
const ok = (name, pass, detail = "") => { console.log(`${pass ? "✓" : "✗ FAIL"}  ${name}${detail ? " — " + detail : ""}`); if (!pass) fails++; };

// impersonate a Supabase-authenticated user for the next queries
const as = async (uid, email = "x@example.com") => {
  await c.query("reset role");
  await c.query("set local role authenticated");
  await c.query(`select set_config('request.jwt.claims', $1, true)`,
    [JSON.stringify({ sub: uid, email, role: "authenticated" })]);
};
// run a count, returning -1 if the policy ERRORS (recursion etc.) so we can assert on it
const count = async (sql, params = []) => {
  try { return Number((await c.query(sql, params)).rows[0].n); }
  catch (e) { console.log(`    ↳ policy error: ${e.message}`); return -1; }
};

const S1 = "11111111-1111-4111-8111-111111111111"; // student, enrolled
const S2 = "22222222-2222-4222-8222-222222222222"; // student, NOT enrolled
const I1 = "33333333-3333-4333-8333-333333333333"; // instructor of the class
const R1 = "44444444-4444-4444-8444-444444444444"; // reviewer
const A1 = "55555555-5555-4555-8555-555555555555"; // admin (via user_roles)
const CLS = "__rls_test_class__";

await c.query("begin");
try {
  // ---- fixtures (as owner) ----
  for (const [id, em] of [[S1, "s1@x"], [S2, "s2@x"], [I1, "i1@x"], [R1, "r1@x"], [A1, "a1@x"]])
    await c.query("insert into profiles (user_id, email) values ($1,$2) on conflict do nothing", [id, em]);
  await c.query("insert into user_roles (user_id, role) values ($1,'instructor'),($2,'reviewer'),($3,'admin')", [I1, R1, A1]);
  await c.query("insert into classes (id, instructor_id, name, code, course_id) values ($1,$2,'RLS Test','__RLSTEST__','pc')", [CLS, I1]);
  await c.query("insert into enrollments (class_id, student_id) values ($1,$2)", [CLS, S1]);
  for (const s of [S1, S2])
    await c.query("insert into progress (user_id, course_id, waray, box, seen) values ($1,'pc','__rlsword__',3,1)", [s]);

  // ---- student: own progress only ----
  await as(S1, "s1@x");
  ok("student reads OWN progress", await count("select count(*) n from progress where user_id=$1", [S1]) === 1);
  ok("student CANNOT read another student's progress", await count("select count(*) n from progress where user_id=$1", [S2]) === 0);
  ok("student reads the class they joined", await count("select count(*) n from classes where id=$1", [CLS]) === 1);

  // ---- instructor: enrolled students only ----
  await as(I1, "i1@x");
  ok("instructor reads ENROLLED student's progress", await count("select count(*) n from progress where user_id=$1", [S1]) === 1);
  ok("instructor CANNOT read a non-enrolled student's progress", await count("select count(*) n from progress where user_id=$1", [S2]) === 0);
  ok("instructor reads their class roster", await count("select count(*) n from enrollments where class_id=$1", [CLS]) === 1);
  ok("instructor reads their own class", await count("select count(*) n from classes where id=$1", [CLS]) === 1);
  ok("instructor reads ENROLLED student's profile (roster names)", await count("select count(*) n from profiles where user_id=$1", [S1]) === 1);
  ok("instructor CANNOT read a non-enrolled student's profile", await count("select count(*) n from profiles where user_id=$1", [S2]) === 0);

  // ---- non-enrolled student: sees no class, no roster ----
  await as(S2, "s2@x");
  ok("outsider sees NO class", await count("select count(*) n from classes where id=$1", [CLS]) === 0);
  ok("outsider sees NO roster", await count("select count(*) n from enrollments where class_id=$1", [CLS]) === 0);

  // ---- reviewer: can record own coverage ----
  await as(R1, "r1@x");
  let rcOk = true;
  try { await c.query("insert into reviewer_coverage (reviewer_id, target_type, target_ref, course_id) values ($1,'word','__rlsword__','pc')", [R1]); }
  catch (e) { rcOk = false; console.log(`    ↳ ${e.message}`); }
  ok("reviewer records own coverage", rcOk);

  // ---- admin (by role, not email): sees everyone ----
  await as(A1, "a1@x");
  ok("admin (role-granted) reads all profiles", await count("select count(*) n from profiles") >= 5);
  ok("admin reads all feedback", await count("select count(*) n from feedback") >= 0);

  await c.query("reset role");
} catch (e) {
  console.error("✗ fixture/setup error:", e.message); fails++;
} finally {
  await c.query("rollback"); // nothing persists
}
await c.end();

if (fails) { console.error(`\n✗ ${fails} authenticated RLS check(s) FAILED.`); process.exit(1); }
console.log("\n✓ Authenticated RLS intact — students see only their own, instructors only their enrolled, no policy recursion.");
