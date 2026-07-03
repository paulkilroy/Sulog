import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
const db = new PGlite();
const run = async (f) => { await db.exec(fs.readFileSync(f,"utf8")); console.log("  ✓ loaded "+f.split("/").pop()); };
try {
  await run("docs/schema/schema.sql");
  await run("docs/schema/ch2-phase1.sql");
  await run("docs/schema/pc-phase1.sql");
} catch(e){ console.log("  ✗ LOAD ERROR:", e.message); process.exit(1); }

const q = async (sql) => (await db.query(sql)).rows;
console.log("\n=== it loaded. sanity checks ===");
console.log("dictionary:", (await q("select count(*) c from dictionary"))[0].c,
            "| expressions:", (await q("select count(*) c from expressions"))[0].c,
            "| lesson_blocks:", (await q("select count(*) c from lesson_blocks"))[0].c,
            "| block_items:", (await q("select count(*) c from block_items"))[0].c);
console.log("\nblocks by type:");
for(const r of await q("select type,count(*) n from lesson_blocks group by type order by n desc")) console.log("   "+r.n+"  "+r.type);

console.log("\nSHARED DICTIONARY — is 'ako' used by BOTH courses' blocks?");
const shared = await q(`select c.id course, count(*) uses from block_items bi
  join lesson_blocks lb on lb.id=bi.block_id join lessons l on l.id=lb.lesson_id
  join units u on u.id=l.unit_id join phases p on p.id=u.phase_id join courses c on c.id=p.course_id
  where bi.dict_waray='ako' group by c.id`);
for(const r of shared) console.log("   "+r.course+": uses 'ako' "+r.uses+"×");

console.log("\nFK ENFORCEMENT — insert a drill item pointing at a non-existent word:");
try { await db.query("insert into block_items(block_id,ord,dict_waray,role) values (1,99,'agoo','item')");
      console.log("   ✗ accepted a dangling ref (FK NOT working)"); }
catch(e){ console.log("   ✓ REJECTED: "+e.message.split("\n")[0]); }

console.log("\nFK ENFORCEMENT — the 'exactly one ref' rule (both dict and expr set):");
try { await db.query("insert into block_items(block_id,ord,dict_waray,expr_id,role) values (1,98,'ako',1,'item')");
      console.log("   ✗ accepted both refs set"); }
catch(e){ console.log("   ✓ REJECTED: "+e.message.split("\n")[0]); }

console.log("\nreview points at a real prior block (FK):");
for(const r of await q(`select lb.lesson_id, lb.review_mode, t.type target_type, t.title target_title
  from lesson_blocks lb join lesson_blocks t on t.id=lb.review_target where lb.type='review'`))
  console.log("   "+r.lesson_id+" review ("+r.review_mode+") → "+r.target_type+": "+r.target_title);
