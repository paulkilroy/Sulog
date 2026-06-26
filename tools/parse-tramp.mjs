/* Parse the Tramp & Zorc Waray-English dictionary (already in the repo, only ever used for
   frequency) into a headword→gloss lookup. This is a FULL dictionary — far past the CHED
   top-1000 — so it should cover most of the stories' "missing" words without asking an LLM.
   Output: docs/sources/tramp-gloss.json  + a coverage report vs the missing list.
   Run: node tools/parse-tramp.mjs */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’`]/g, "'").trim();

// headword, then a POS tag — which may be COMPOUND/dotted (n. / adv. / nom.pron. /
// postpos.gen.pron. / v.pass.) — then the definition. The old simple-POS pattern dropped
// every compound-tagged entry (all the pronouns, etc.).
const ENTRY = /^([A-Za-zÀ-ÿ'’\-][^,\n]{0,28}),\s*([a-z][a-z.]*\.)\s*(.*)$/;

const lines = read("docs/sources/tramp-zorc-waray-english-dictionary-1991.txt").split(/\r?\n/);
const gloss = {};
let cur = null;
const flush = () => {
  if (!cur) return;
  const head = norm(cur.head.split(/[(/]/)[0]).replace(/^['-]+|['-]+$/g, "");
  if (head && /^[a-z][a-z'\- ]*$/.test(head) && !head.includes(" ")) {
    let def = cur.def.join(" ")
      .replace(/^\([^)]*\)\s*/, "")            // drop a leading (Sp)/(origin) tag
      .replace(/\bNOTE:.*/i, "")
      .replace(/\s+/g, " ").trim();
    // take the first 1–2 senses, cap length
    const senses = def.split(/\s*[;.]\s*/).filter(Boolean).slice(0, 2).join("; ");
    const g = senses.slice(0, 55).replace(/[,;]\s*$/, "").trim();
    if (g && !gloss[head]) gloss[head] = g; // first (= main) sense wins
  }
  cur = null;
};
for (const line of lines) {
  const m = line.match(ENTRY);
  if (m && !/^mga --/.test(line)) { flush(); cur = { head: m[1].trim(), def: [m[3] || ""] }; }
  else if (cur && line.trim()) cur.def.push(line.trim());
}
flush();

fs.writeFileSync(path.join(root, "docs/sources/tramp-gloss.json"), JSON.stringify(gloss, null, 0));
const keys = Object.keys(gloss);
console.log(`parsed Tramp/Zorc → ${keys.length.toLocaleString()} headword glosses`);

// coverage vs the missing list
try {
  const miss = JSON.parse(read("docs/sources/missing-words.json")).missing;
  const covered = miss.filter((m) => gloss[m.w]);
  console.log(`missing words covered by Tramp: ${covered.length}/${miss.length} (${Math.round(100 * covered.length / miss.length)}%)`);
  console.log(`sample now-glossable:`);
  covered.slice(0, 12).forEach((m) => console.log(`  ${m.w.padEnd(14)} → ${gloss[m.w]}`));
  console.log(`still uncovered (top):`);
  miss.filter((m) => !gloss[m.w]).slice(0, 10).forEach((m) => console.log(`  ${m.w} (${m.docs} stories)`));
} catch (e) { console.log("(run tools/missing-words.mjs first for a coverage report)"); }
for (const w of ["mga", "ikaw", "ka", "kaliawan", "liaw", "naaro"]) console.log(`  check ${w}: ${gloss[w] || "—"}`);
