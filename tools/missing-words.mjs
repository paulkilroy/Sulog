/* Find every story word the reader can't gloss, and split them into:
   (1) INFLECTED — we have the root (found by containment OR light de-inflection incl. the
       -um-/-in- infix), the reader just doesn't show it → fixable with a stem-gloss fallback.
   (2) MISSING — no recoverable root → a genuine vocabulary gap to gloss/add (Ella triage).
   Proper names are excluded. Run: node tools/missing-words.mjs  →  docs/missing-words.md */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { STORIES, GLOSS } from "../src/courses/waray/stories.js";
import { VARIANTS } from "../src/courses/waray/variants.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const toks = (t) => norm(t).replace(/[’`]/g, "'").split(/[^a-z'\-]+/).map((x) => x.replace(/^['\-]+|['\-]+$/g, "")).filter((x) => x.length >= 2);
const fold = (w) => w.replace(/o/g, "u").replace(/e/g, "i");

const glossKeys = new Set(Object.keys(GLOSS));
const roots = [...glossKeys].filter((w) => w.length >= 4);
const hasGloss = (t) => glossKeys.has(t) || (VARIANTS[t] && glossKeys.has(VARIANTS[t])) || glossKeys.has(fold(t));

// light de-inflection: return candidate roots to look up in the glossary
function deinflect(t) {
  const c = new Set();
  const add = (x) => { if (x && x.length >= 3 && x !== t) c.add(x); };
  let s = t.replace(/^(nakaka|nagka|naka|nagpa|napa|nag|mag|nan|nam|nang|gin|gi|na|ma|pa|pag|pan|ka|i)/, ""); add(s);
  // -um-/-in- infix after the first consonant: b+um+aton -> baton ; t+in+ago -> tago
  const inf = t.replace(/^([bcdfghjklmnpqrstvwxyz])(um|in)/, "$1"); add(inf);
  for (const base of [t, s, inf]) { const y = base.replace(/(han|hon|nan|an|on|i|a)$/, ""); add(y); add(fold(y)); }
  return [...c];
}
const knownRoot = (t) => {
  for (const cand of deinflect(t)) if (glossKeys.has(cand)) return cand;            // de-inflects to a known root (exact)
  const r = roots.find((x) => x.length >= 4 && t.length > x.length && t.includes(x)); // else contains one (fuzzy)
  return r || null;
};

// proper names: mid-sentence Title-case (exclude from the gaps)
function names(text) {
  const out = new Set();
  for (const sent of text.replace(/\s+/g, " ").split(/[.!?]+/))
    sent.trim().split(" ").slice(1).forEach((w) => { const x = w.replace(/^["'“”(]+/, "").replace(/[,;:)"'“”]+$/, ""); if (/^[A-Z][a-zà-ÿ]+$/.test(x)) out.add(norm(x)); });
  return out;
}

const inflected = new Map(), missing = new Map(); // token -> {freq, docs:Set, root?}
const caps = new Map(); // token -> {c: capitalized occurrences, t: total} (to spot leaked names)
let total = 0, glossed = 0, nameTok = 0;
for (const s of STORIES) {
  const nm = names((s.paras || []).join(" "));
  for (const p of s.paras || []) for (const raw of p.split(/\s+/)) {
    const x = raw.replace(/^["'“”(.,]+/, "").replace(/[,;:)"'“”.!?]+$/, ""); const cn = norm(x);
    if (cn) { const e = caps.get(cn) || { c: 0, t: 0 }; e.t++; if (/^[A-Z]/.test(x)) e.c++; caps.set(cn, e); }
  }
  for (const p of s.paras || []) for (const t of toks(p)) {
    total++;
    if (nm.has(t)) { nameTok++; continue; }
    if (hasGloss(t)) { glossed++; continue; }
    const r = knownRoot(t);
    const bucket = r ? inflected : missing;
    const e = bucket.get(t) || { freq: 0, docs: new Set(), root: r };
    e.freq++; e.docs.add(s.title); bucket.set(t, e);
  }
}
const rank = (m) => [...m.entries()].map(([w, e]) => ({ w, ...e, docs: e.docs.size })).sort((a, b) => b.docs - a.docs || b.freq - a.freq);
const inf = rank(inflected), mis = rank(missing);

// categorize the still-missing words by the kind of work each needs
const AFFIX = new Set(["nag", "gin", "mag", "pag", "naka", "nagka", "nang", "nan", "gi", "ig", "napa", "nagpa"]);
const FUNCTION = new Set(["ka", "ikaw", "mo", "ko", "sin", "siya", "hira", "kita", "kami", "kamo", "ako", "imo", "akon", "iya", "ira", "aton", "amon", "iyo", "nira", "niya", "nimo", "nakon", "la", "man", "gud", "daw", "gad", "ngani", "kuno", "unta", "kunta", "ngay-an", "ngayan", "hala", "tana", "anay", "liwat", "ngani", "ba", "kay", "kun", "kon", "basta", "agud", "kungud"]);
const capRatio = (w) => { const e = caps.get(w); return e && e.t ? e.c / e.t : 0; };
function categorize(w) {
  if (AFFIX.has(w)) return "affix-fragment";       // split verb prefix written apart (gin tuha)
  if (capRatio(w) >= 0.6) return "name";            // leaked proper noun (mostly capitalized)
  if (FUNCTION.has(w)) return "function/clitic";    // pronoun/particle that needs a curated gloss
  if (w.length <= 3) return "short (clitic/noise)"; // tiny tokens — usually clitics or OCR bits
  return "content";                                  // genuine vocabulary Tramp lacks
}
const cats = {};
for (const r of mis) { const c = categorize(r.w); (cats[c] = cats[c] || []).push(r); }
const catOrder = ["content", "function/clitic", "short (clitic/noise)", "affix-fragment", "name"];

const pct = (n) => Math.round((100 * n) / total);
let md = `# Story words the reader can't gloss

_Every distinct story token with no glossary entry, split by whether we can recover a known
root. Proper names excluded. "Complete dictionary" = ~1,000 CHED **roots** + the deck —
inflected forms and beyond-top-1000 words still fall through._

## Totals (running tokens)
- glossed: **${glossed}** (${pct(glossed)}%) · names: **${nameTok}** (${pct(nameTok)}%)
- **inflected (root known, just not shown): ${[...inflected.values()].reduce((s, e) => s + e.freq, 0)}** tokens · ${inf.length} distinct
- **missing (genuine gap): ${[...missing.values()].reduce((s, e) => s + e.freq, 0)}** tokens · ${mis.length} distinct

## Categories of the still-missing (${mis.length}) — what each needs
${catOrder.map((c) => `- **${c}**: ${(cats[c] || []).length}`).join("\n")}

${catOrder.map((c) => `### ${c} (${(cats[c] || []).length})\n${(cats[c] || []).slice(0, 40).map((r) => r.w).join(", ") || "—"}${(cats[c] || []).length > 40 ? ` … +${(cats[c] || []).length - 40}` : ""}`).join("\n\n")}

## INFLECTED — we have the root, the reader just doesn't show it (${inf.length})
_A stem-gloss fallback would fix all of these for free. (e.g. \`bumaton\` → \`baton\`.)_

| word | →root | #stories | freq |
|------|-------|:--:|--:|
${inf.slice(0, 60).map((r) => `| ${r.w} | ${r.root} | ${r.docs} | ${r.freq} |`).join("\n")}
${inf.length > 60 ? `\n_+${inf.length - 60} more._` : ""}

## MISSING — genuine vocabulary gaps to gloss/add (${mis.length})
_Sorted by story spread. These need a real gloss (Ella) — e.g. \`kaliawan\` = "entertainment / to not be bored"._

| word | #stories | freq |
|------|:--:|--:|
${mis.slice(0, 120).map((r) => `| ${r.w} | ${r.docs} | ${r.freq} |`).join("\n")}
${mis.length > 120 ? `\n_+${mis.length - 120} more (full set in the JSON sidecar)._` : ""}
`;
fs.writeFileSync(path.join(root, "docs/missing-words.md"), md);
fs.writeFileSync(path.join(root, "docs/sources/missing-words.json"), JSON.stringify({ inflected: inf, missing: mis }, null, 0));

console.log(`tokens ${total} | glossed ${pct(glossed)}% | names ${pct(nameTok)}% | inflected ${inf.length} distinct | MISSING ${mis.length} distinct`);
console.log(`\nstill-missing (${mis.length}) by category:`);
catOrder.forEach((c) => console.log(`  ${String((cats[c] || []).length).padStart(4)}  ${c}`));
console.log(`\ncheck the examples:`);
for (const w of ["bumaton", "kaliawan"]) {
  const b = inflected.get(w) ? `INFLECTED → ${inflected.get(w).root}` : missing.get(w) ? "MISSING" : hasGloss(w) ? "glossed" : "(name/absent)";
  console.log(`  ${w}: ${b}`);
}
console.log(`\ntop genuine gaps:`); mis.slice(0, 15).forEach((r) => console.log(`  ${r.docs} stories ·${String(r.freq).padStart(3)}× ${r.w}`));
