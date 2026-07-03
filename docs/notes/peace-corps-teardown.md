# Peace Corps Waray course — instructional-design teardown (all 23 lessons / 114 pp.)

Reverse-engineered from `docs/sources/peace-corps/peace-corps-waray-lessons.pdf` (page PNGs cached in
`docs/sources/peace-corps/pages/`). Purpose: extract the vetted lesson design so we can decide what
Sulog should adopt, and shape the data model before Supabase.

## The course arc (grammatical spine, not thematic/frequency)

23 lessons, ordered by morphosyntax. Vocabulary is whatever illustrates the current grammar point.

- **L1–4 — equational (verbless) grammar:** I-Class pronouns → markers → demonstratives → II-Class possession. A learner masters topic-marking + case *before any verb*.
- **L5–9 — verbs & the sentence formula:** Ma- Actor Focus (tense) → +object → +location → +beneficiary. The template `Ma-Verb + I-Cl Actor + II-Cl Object + III-Cl Loc/Dir` is filled **one slot per lesson** and reprinted every lesson.
- **L10 — REVIEW + TEST milestone** (consolidation chart of everything since L1 + 20-item graded test + teacher-check + "go back if you struggled").
- **L11–15 — modifiers & particles:** nga linker → the "VIP word" enclitic system, **one particle per lesson then stacking**: ba (question) → na/pa (aspect) → liwat/gihapon (additive) → hin duro (intensifier).
- **L16–19 — negation & a second verb class:** waray/diri → long-form + double-negator → negation + particle word-order → Mag- Actor Focus + verbalizing nouns.
- **L20 — REVIEW + TEST milestone** (L11–19).
- **L21–23 — advanced clause:** negating mag- (ayaw commands) → pseudo-verbs (karuyag/pwede/kinahanglan) → question words (ano/hin-o), previewing the rest.

## Canonical lesson anatomy (the fundamental design)

Every non-review lesson is the SAME ordered sequence of typed blocks:

1. **REVIEW** — active recall of the *prior* lesson before anything new. Escalates: reproduce-chart-from-memory → fill-in-blank → translate. (retrieval practice, not re-reading)
2. `*****` divider
3. **GRAMMAR INSTRUCTION** — metalinguistic prose (rules ABOUT the language) + a **chart** or **boxed slot-formula** (the "VIP word" ordering engine).
4. **WORKED EXAMPLES** — parallel two-column Waray | English model sentences; sometimes two valid English readings marked `[or]`; sometimes interlinear slot-labels.
5. **NOTES / HINTS** — just-in-time footnotes at a word's first use (mga, ngan, ka), plus cultural/pragmatic notes (ritual refusal at supper; sacred-name markers).
6. **ORAL EXERCISES** — named drills on an **autonomy ladder**: echo/repeat → teacher-cued transform → **learner produces**. Teacher-mediated (TEACHER/LEARNER two-column scripts).
7. **WRITTEN EXERCISES** — **bidirectional** translation (Waray→Eng AND Eng→Waray), plus **transformation / minimal-pair / paradigm-permutation** sets (one base sentence spun through every aspect/question/particle variant) and **fill-in-blank with constraints** ("use a new word, don't repeat").
8. **VOCABULARY** — glossed, **stress-accented**, verb-roots hyphen-flagged, at the **END** — a consolidation/reference list, NOT a pre-teach. Words are always met in context first.

Every ~10 lessons this is replaced by a **milestone**: a single consolidation chart + a 20-item graded test + a teacher-check gate + diagnostic→remediation routing + affective celebration ("Congratulations, Lesson 20!").

## The deep sequencing principles

1. **Grammatical spine** — sequence by structure, not theme/frequency.
2. **Equational before verbal** — verbless sentences first, then verbs.
3. **Persistent visible formula, filled one slot per lesson** over an arc.
4. **Spiral at two scopes** — every lesson opens with prior-lesson review; every ~10 a wide cumulative review+test.
5. **One new element per lesson, then stacking** — each new particle/form must combine with everything prior.
6. **Contrast pairs taught together** — singular|plural, proper|common, past|future, correct|INCORRECT.
7. **Transfer by analogy** — Mag- taught as "you already know Ma-, this is easy."
8. **Vocabulary in context before the glossed list** (never front-loaded).

## Techniques a drill/flashcard app lacks (candidate imports)

- Explicit **grammar instruction** (rules) + **slot-formula diagrams** — a generative model, not items.
- **Error-contrast** (INCORRECT vs CORRECT side by side).
- **Ambiguity-aware / multi-answer** items (`[or]`, context-determined).
- **Transformation / minimal-pair / paradigm-permutation** drills (negate this; make it a question; add a particle).
- **Autonomy-graded drill ladder** (echo → cued transform → produce) within a lesson.
- **Bidirectional translation** as a deliberate pair.
- **Free-recall of the grammar formula itself** ("without looking, write it").
- **Kinesthetic/gestural cueing** ("point in the direction of the possessive").
- **Milestone consolidation + gated test + remediation routing** every N units.
- **Affective scaffolding** (reassurance, milestone celebration).
- **Stress marks + verb-root/affix tagging** on every lexical entry.

Big caveats: it's **teacher-mediated** (many drills need a live coach we'd replace with app mechanics/TTS/STT), **grammar-first** (misses common vocab; heavy for an adult who wants to talk fast), and the **lexicon is missionary-heavy** (pastor/deacon/"praise the Lord") — great structure, not a word list to import.

## Gap analysis vs Sulog + schema implication

| PC section / idea | Sulog today | Gap | Data-model implication |
|---|---|---|---|
| Grammar instruction (rules + formula) | `new_grammar` + `can_do` EXIST in Challenger data, **never shown** | Have data, no presentation | Surface a **grammar/instruction block**; entity `grammar {point, rule, formula}` |
| Worked model sentences | 1 example per word card | Have per-word examples; no "study models" beat | Examples = **expressions** (our layer); tag some as lesson models |
| Notes / hints (mga, pragmatics) | `note`/`subtext` exist, not surfaced | Have data partial, no presentation | **note block** on lesson/word |
| Review opens each lesson | SRS spacing (adaptive) | We space review, but don't open a lesson with structured prior recall | mostly logic; optional `review` block |
| Oral drills (produce, ladder) | listen mode + TTS; recognition-heavy | Lack productive speech + difficulty ramp | new **exercise types**; STT challenge items |
| Written bidirectional | type mode (has dir) | Mostly have it | ok |
| Transformation / minimal-pair drills | none | **Big gap** — no "negate/question/add-particle" items | new item type `transform {base, op → target}`; needs grammar templates |
| Vocab list at END (in-context first) | **pre-teaches** words | Opposite order | sequencing change: meet word in a phrase before solo drill |
| Milestone consolidation + gated test / N units | per-unit graded review only | No cross-unit test + remediation routing | course-level `assessment` entity + gate flags |
| Ambiguity-aware answers | single-answer grader | Gap (ties to STT false-negatives) | expression carries **multiple accepted** translations |
| Stress + root/affix metadata | pronunciation ✓ | Lack root/affix tag | dictionary entry: `pos`, `root`, `affix` |
| Grammatical spine + formula scaffold | frequency/phrase order | Different philosophy | **decision** — add a grammar track or not |

What Sulog does that PC can't: TTS/STT (replaces the coach), SRS spacing, frequency/CEFR sequencing, self-study, the coverage-based reader, adaptive MC remediation.

## The core tension + what to decide before Supabase

PC is **grammar-first / teacher-mediated / production-heavy**. Sulog is **vocab-&-phrase-first / self-study / recognition-heavy** — deliberately, for adult expats who want to communicate fast. Don't wholesale-adopt PC. **Cherry-pick the high-ROI, low-teacher-dependency pieces**, most of which we already hold the data for:

- **Add an "instruction" block** (grammar note + can-do + a hint) — you already have `new_grammar`/`can_do`/`note` in the Challenger data; the app just never renders them. Highest ROI, near-zero new content.
- **A "study the models" beat** before drilling (you have examples).
- **Fix vocab ordering** — meet a word inside a phrase before drilling it solo.
- **A few transformation item types** (statement↔question, negate) — new, high-value for production.
- **Phase-level consolidation + gated test** (you have per-unit review; add a per-phase one with remediation).
- **Ambiguity-aware grading** (multiple accepted answers) — fixes a real bug.
- Defer/skip: the full grammatical spine (keep frequency/phrase order), the teacher-only drills, the missionary lexicon.

**The load-bearing schema decision:** model a lesson as an **ordered list of typed content blocks** (instruction · models · note · drill(type) · vocab · review), NOT the fixed 4-part `words / apply / review / story`. PC proves lessons are heterogeneous sequences. If Supabase models `lesson_blocks(lesson_id, order, type, payload)`, every PC-style section — and everything Sulog already has — becomes a block type, and we can add instruction/notes/transform drills without reshaping the schema later.
