# Frequency-first unit/lesson structure — hybrid proposal

**Status:** proposal, rev. 2026-06-23. Successor to `frequency-first-reorder.md`
(the *why*). This is the *buildable* structure: a **frequency-first sequence**
delivered with **Duolingo-style can-do packaging** (grammar stays implicit; every
unit is a goal you can do), plus a concrete **sizing model**.

**Inferred, not blocked.** Exact 1→1000 ranks (corpus access pending,
`sources/waray-frequency-sources.md`) aren't needed: the grammatical ordering is
high-confidence and SET membership covers content. Ranks, if they arrive, only
fine-tune order *within* a phase.

---

## Two influences, reconciled
- **Frequency-first** (our analysis): the grammatical glue — markers, pronouns,
  demonstratives, have/there-is, core questions, 1–10 — is the highest-frequency
  material, so it leads.
- **Modern Duolingo** (`duome.eu/vocabulary/de/es`): never names grammar as a
  unit. Every skill is a **can-do scenario** ("Order in a café," "Ask the way");
  grammar is embedded inside the theme; themes **spiral** (Family light early,
  deeper later); units are **big** (many small lessons, heavy recycling).

**The hybrid:** keep frequency-first *sequencing*; adopt Duolingo's *packaging*.
Grammar still leads — but disguised as scenarios, with a can-do on every unit, and
the themes spiral. (Waray earns one nudge toward explicitness: its case markers
`an/hin/han/ha/hi` are so frequent and so alien that they get an early, deliberate
home — anchored for Tagalog speakers to `ang/ng/sa`.)

---

## Design rules
1. **Frequency-first order** — glue before themes; loan-heavy themes last.
2. **Implicit grammar via can-do units** — no "Markers"/"Possessives" unit titles.
   Each unit is named for what you can *do*; the grammar rides inside.
3. **i+1** — each lesson introduces only a few new words among already-known ones.
4. **Spiral** — revisit core themes (family, food, directions, numbers, questions)
   at increasing depth instead of one-and-done.
5. **Keep the engine** — sections→units→4-part lessons, unit reviews, Leitner SRS.

## Sizing model (the new part)

Current state: **~8 new words/lesson, ~1.9 lessons/unit** (10 units are a single
lesson; units avg ~16 words). Lessons are fine; **units are too small** and there's
**too little recycling** — every lesson is ~8 brand-new words with no i+1 cushion.

| Level | Today | Target | Why |
|---|---|---|---|
| **Lesson** | 4–13 items, ~all new | **5–8 items: ≤5 new + 2–3 recycled** | i+1 — new word lands among knowns. Split any >8. Grammar-dense lessons skew to **3–5 new**. |
| **Unit** | 1–3 lessons (~16 items) | **3–5 lessons (~20–35 items)**, ends in unit review | a unit = one *complete* can-do scenario worth reviewing |
| **Phase** | (n/a) | **7–11 units** | a CEFR-ish band with a headline milestone |

**Where the extra size comes from — recycling, not new vocab.** Duolingo grows
units by adding **sentences that recombine known words**, not by piling on
vocabulary. So a unit gets bigger by: (a) each lesson reusing 2–3 earlier words,
(b) more short i+1 phrase cards built from already-taught words. New *vocabulary*
load per lesson stays small; new *sentence* practice carries the volume. (Phrase
cards are appended to SEED — safe re: positional ids.)

## Why reordering is safe (technical)
`CURRICULUM` lessons reference cards by **Waray string**; unit/lesson ids (`u8l1`)
are explicit literals, not positional. Reordering changes only unlock order;
progress keyed by lesson id survives. The positional hazard is SEED-card-only.
New recycled/bridge cards are **appended** to SEED, never inserted.

---

## The 4 phases (was 7 sections)

| Phase | Headline can-do |
|---|---|
| **P1 Say something real** (A1.1) | Greet; yes/no/thanks; name & point; say who you are; ask what/where/who; there-is/have; count to ten; your family. |
| **P2 Put words together** (A1.2) | Mine/yours; describe; do-it-*now*; time-of-day; home & food; order food; ask the way; colors. |
| **P3 Daily life & people** (A2.1) | People & jobs; body & feeling; can/must/don't; the week; weather; clothes; invite someone. |
| **P4 Out in the world & beyond now** (A2.2) | Past & future; travel/shopping/airport; months; 11–100; cooking; nature; faith. |

Unit titles below are **can-do goals**, not grammar labels. "Teaches" notes the
grammar that rides inside (implicit). **↻** marks a spiral pickup of an earlier theme.

### P1 — Say something real *(A1.1)*
| Unit (can-do) | Teaches (implicit) | Source |
|---|---|---|
| P1·U1 **Say hello & thanks** | greetings, courtesy | u1 |
| P1·U2 **Say who's who** | pronouns ako/ikaw/hiya… | u3 |
| P1·U3 **Name what you see** | markers hi/an/it + this/that, via "Ano ini? → Tubig ini → Ako hi Peter" | u8 + u9 + u12l2 |
| P1·U4 **Ask what, where, who** | question words ano/hain/hin-o + ba | u13l1–l2 |
| P1·U5 **Say what there is** | may / mayda / waray / adi | u29 (extract) |
| P1·U6 **Count to ten** | numbers 1–10 | u33 (split) |
| P1·U7 **Introduce your family** | immediate-family nouns | u4l1 |

### P2 — Put words together *(A1.2)*
| Unit (can-do) | Teaches (implicit) | Source |
|---|---|---|
| P2·U1 **Say what's yours & mine** | possessives ko/nakon → akon/imo | u10 + u11 |
| P2·U2 **Describe people & things** | adjectives + equational "Gwapo an bata" | u6l1 + u12l3 |
| P2·U3 **Say already / not yet / just / very** | particles na, pa, la, liwat, hin duro | u14 |
| P2·U4 **Say what you're doing now** | present-tense verbs (na-) + common verbs | u15 *present* + u17l2 |
| P2·U5 **Tell the time of day** ↻numbers | yana/niyan/buwas, oras | u18 |
| P2·U6 **Name things at home** | household nouns & objects | u21l1 + u21l3 |
| P2·U7 **Talk about meals** ↻questions | food core + "Namahaw ka na?" | u22 + u31l1 |
| P2·U8 **Ask the way** ↻markers | places, harani/harayo, "Hain it…?" | u24 |
| P2·U9 **Name colors** | colors | u34 |

### P3 — Daily life & people *(A2.1)*
| Unit (can-do) | Teaches (implicit) | Source |
|---|---|---|
| P3·U1 **Talk about people around you** ↻family | people nouns | u4l2 |
| P3·U2 **Talk about work** | job & role nouns | u5 |
| P3·U3 **Describe character** ↻describing | quality adjectives | u6l2 |
| P3·U4 **Say where it hurts** | body parts | u7 |
| P3·U5 **Say what you can, must & mustn't** | kinahanglan/mahimo/Ayaw/Pwede | u16 |
| P3·U6 **Talk about chores** ↻verbs | action verbs | u17l1 + u17l3 |
| P3·U7 **Name the days** | days of week | u19l1 |
| P3·U8 **Talk about the weather** | weather | u20 |
| P3·U9 **Talk about clothes** ↻home | clothing nouns | u21l2 |
| P3·U10 **Invite someone out** ↻there-is | invitation phrases | u29 (remainder) |

### P4 — Out in the world & beyond now *(A2.2)*
| Unit (can-do) | Teaches (implicit) | Source |
|---|---|---|
| P4·U1 **Talk about past & future** ↻verbs | tenses kinmaon/-inm-, ma- future | u15 *past+future* |
| P4·U2 **Make travel plans** ↻directions | san-o/maabot, "Kakan-o ka umabot?" | u30 |
| P4·U3 **Name the months** | months | u19l2 |
| P4·U4 **Count past ten** ↻numbers | 11–100 | u33 (remainder) |
| P4·U5 **Shop at the market** ↻questions,money | shopping, tagpira, sukli | u25 |
| P4·U6 **Get around by vehicle** | transport nouns | u26 |
| P4·U7 **Check in at the airport** | airport phrases | u27 |
| P4·U8 **Plan a day trip** ↻travel | pamasyada, isla, San Juanico | u28 |
| P4·U9 **Cook a dish** ↻food | cooking, adobo | u23 |
| P4·U10 **Talk about nature & animals** | nature, animals | u32 |
| P4·U11 **Talk about faith & church** | faith, church | u35 + u36 |

---

## Spiral map (what gets revisited)
- **Family:** P1·U7 (immediate, light) → P3·U1 (wider circle) → reused in P3·U3 (describe their looks).
- **Questions:** P1·U4 (what/where/who) → reused in P2·U7 ("Ano it paniudtuhon?"), P2·U8 ("Hain it bangko?"), P4·U5 ("Tagpira ini?").
- **Markers:** P1·U3 → reinforced every later unit; explicit pickup in P2·U8 directions.
- **Food:** P2·U7 (meals) → P4·U5 (market) → P4·U9 (cooking).
- **Directions/places:** P2·U8 → P4·U2 (travel) → P4·U8 (day trip).
- **Numbers:** P1·U6 (1–10) → P2·U5 (time) → P4·U4 (11–100) → P4·U5 (prices).
- **Verbs/tense:** P2·U4 (now) → P4·U1 (past/future).

## Build steps (when greenlit)
1. Reorder `CURRICULUM` to the P1–P4 layout (array reorder + regroup; lesson ids stay stable).
2. Rename units to the can-do titles above; add a per-phase headline milestone
   (new section field, or fold into `hint`).
3. Reassign the **u15 tense** cards (now vs. then) and **u33 number** cards (1–10 vs.
   11–100) across their two homes — list-membership edits, no new cards.
4. **Grow units to target size via recycling:** add 2–3 already-known anchor words to
   each lesson's item list (i+1), and author short i+1 phrase cards from known words
   (appended to SEED). Aim 3–5 lessons/unit.
5. Add **↻ spiral** pickups: seed each marked unit's first lesson with 1–2 words from
   the theme it revisits.
6. *(Later)* when corpus ranks land, fine-tune order within each phase.
