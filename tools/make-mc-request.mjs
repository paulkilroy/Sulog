/* Emit a comprehension-question request to paste into ChatGPT. All stories, each as a
   whole readable block (story separator, not per-line), and we ask ONLY for multiple-choice
   questions back as compact JSON keyed by story id — so the reply ingests cleanly and is
   small enough to do in one pass. Run: node tools/make-mc-request.mjs */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { STORIES } from "../src/courses/waray/stories.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

let out = `COMPREHENSION QUESTIONS — Waray children's stories (for the Sulog reading app)

For EACH story below, write 2 simple multiple-choice comprehension questions IN ENGLISH
that check whether a reader understood the STORY (who / what / where / why — not vocabulary
trivia). The reader is a Waray learner who may not know every word.
- Exactly 3 options each, exactly one correct.
- Base questions on meaning; wrong options should be plausible but clearly wrong from the story.
- Also give a short English title.

Return ONE JSON array — one object per story, EXACTLY this shape, and NOTHING else:
[
  {"id":"<id>","title_en":"<short English title>","questions":[
    {"q":"<question>","options":["A","B","C"],"answer":0},
    {"q":"<question>","options":["A","B","C"],"answer":1}
  ]}
]

(The "answer" is the 0-based index of the correct option. Use the exact "id" shown.)
Stories follow, each after a "===== <id> =====" line.
`;

for (const s of STORIES) {
  out += `\n===== ${s.id} =====\nTITLE (Waray): ${s.title}\n\n${s.paras.join("\n")}\n`;
}

fs.writeFileSync(path.join(root, "docs/mc-request.txt"), out);
const words = out.split(/\s+/).length;
console.log(`wrote docs/mc-request.txt — ${STORIES.length} stories, ~${words.toLocaleString()} words, ${out.length.toLocaleString()} chars`);
console.log(`(if it's too big for one paste, split on the "=====" lines — each block is self-contained)`);
