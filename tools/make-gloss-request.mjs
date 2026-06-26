/* Build a ChatGPT first-pass request for the reader's MISSING words. Each word is shown in
   its real story sentence(s) (so GPT has context), and GPT is constrained to four verdicts:
   scanning-error / Waray definition / other-language definition / unknown. The reply is a
   JSON array we ingest with tools/ingest-gloss.mjs. Run: node tools/make-gloss-request.mjs
   Output: docs/sources/missing-gloss-request.md  (paste into ChatGPT). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { STORIES } from "../src/courses/waray/stories.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const missing = JSON.parse(read("docs/sources/missing-words.json")).missing;

const norm = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[’`]/g, "'").replace(/^[^a-z'\-]+|[^a-z'\-]+$/g, "");

// up to 2 context sentences per word, with the word wrapped in **bold** for GPT
function contexts(w) {
  const hits = [];
  for (const s of STORIES) for (const para of s.paras) {
    let matched = false;
    const txt = para.split(/(\s+)/).map((p) => {
      if (/^\s+$/.test(p) || !p) return p;
      if (norm(p) === w) { matched = true; return `**${p}**`; }
      return p;
    }).join("");
    if (matched) { hits.push({ title: s.title, txt }); if (hits.length >= 2) return hits; }
  }
  return hits;
}

const items = missing.map((m, i) => {
  const ctx = contexts(m.w).map((c) => `   - _${c.title}_: "${c.txt}"`).join("\n") || "   - (no context found)";
  return `${i + 1}. **${m.w}**  (${m.freq}×, ${m.docs} stor${m.docs === 1 ? "y" : "ies"})\n${ctx}`;
}).join("\n\n");

const out = `# Waray missing-word gloss — first pass (for ChatGPT)

You are an expert in **Waray-Waray (Winaray)**, the language of Samar and Leyte, Philippines.
Below are ${missing.length} words taken from real Waray children's stories that our dictionary
could not gloss. They are shown **in their story sentence(s)** so you have context (the target
word is in **bold**).

For **each** word, decide exactly ONE verdict:

1. **scan** — it is an OCR / scanning error or typo (the source text is wrong). Put the
   corrected Waray spelling in \`fix\`. *(We will fix the text, not add a gloss.)*
2. **waray** — it is a genuine Waray word. Put a short English definition in \`def\`.
3. **other** — it is a word from another language used inside the Waray story (English,
   Spanish, Tagalog, etc.). Put the language in \`lang\` and the English meaning in \`def\`.
4. **unknown** — you genuinely cannot tell.

Use the context to disambiguate (e.g. an inflected verb → give the meaning of that verb).
Do **not** guess wildly; prefer **unknown** over a low-confidence answer.

## Output format — return ONLY this, nothing else

A single JSON array, one object per word, in the SAME order, shape:

\`\`\`json
[
  {"w":"<word>","verdict":"scan|waray|other|unknown","fix":"","lang":"","def":""}
]
\`\`\`

Leave unused fields as empty strings. Keep \`def\` short (a few words).

---

## Words (with context)

${items}
`;

fs.writeFileSync(path.join(root, "docs/sources/missing-gloss-request.md"), out);
console.log(`wrote docs/sources/missing-gloss-request.md — ${missing.length} words`);
