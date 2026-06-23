# Frequency-first unit/lesson structure — concrete proposal

**Status:** proposal, 2026-06-23. This is the *buildable* successor to
`frequency-first-reorder.md`. That doc argued the **why** and mapped each current
unit to a phase; this one defines the **actual new section/unit/lesson order** to
drop into `CURRICULUM`, reusing the existing vocab cards as-is.

**Inferred, not blocked.** We don't have the exact 1→1000 ranks (corpus access is
pending — see `sources/waray-frequency-sources.md`). We don't need them: the
top-tier grammatical ordering is linguistically stable and high-confidence, and
top-1000 SET membership + the Peace-Corps utility signal are enough to sequence
content. If exact ranks arrive later, they only fine-tune *within* a phase.

---

## Design rules (from the CEFR blueprint)
1. **Frequency-first** — the grammatical glue (markers, pronouns, demonstratives,
   particles, have/there-is, core question words, 1–10) leads, not trails.
2. **Interleave grammar from day one** — glue is taught *as sentence-building*,
   threaded through every phase, never as a chart dump.
3. **i+1** — each phase's phrase lessons should add ~one new word at a time. Where
   the current cards already do this, reuse; where they jump, I flag a **[gap]**
   that wants 1–2 new bridge cards (append-only — safe re: SEED ids).
4. **Can-do milestones** — every phase and unit states "after this you can ___".
5. **Keep the engine** — sections→units→4-part lessons, unit reviews, Leitner SRS
   all unchanged. Only order/grouping changes.

## Why reordering is safe (technical)
`CURRICULUM` lessons reference cards by **Waray string**, and unit/lesson ids
(`u8l1`) are explicit literals — not positional. Reordering sections/units in the
array changes only unlock order; progress keyed by lesson id survives. The
positional hazard is SEED-card-only and untouched here. New bridge cards for i+1
are **appended** to SEED, never inserted.

---

## The new shape: 4 phases (was 7 sections)

| New | Phase | CEFR-ish | Can-do milestone |
|---|---|---|---|
| **P1** | Say something real | A1.1 | Greet; yes/no/thanks; name & point ("This is X"); say who you are; ask "what/where/who"; have/there-is; count 1–10; name immediate family. |
| **P2** | Put words together | A1.2 | Say what's mine/yours; describe things; say what you're doing *now*; tell time-of-day; everyday objects & food; order food; ask & follow directions; colors. |
| **P3** | Daily life & people | A2.1 | Describe people & jobs; body & feeling; can/must/don't; the week; weather; clothes; invite someone. |
| **P4** | Out in the world & beyond now | A2.2 | Past & future; travel/shopping/airport plans; months; 11–100; cooking; nature; faith & church. |

---

## P1 — Say something real *(A1.1)*
> **Can-do:** greet, say yes/no/thanks, name and point at things, say who you are,
> ask what/where/who, say there-is/have, count to ten, name your family.

| New unit | Source | Notes |
|---|---|---|
| P1·U1 Greetings & courtesy | current **u1** | as-is (already P1) |
| P1·U2 Me, you, them | **u3** pronouns | moved up from S2 |
| P1·U3 Naming things: hi / an / it + this/that | **u8** markers + **u9** demonstratives + **u12l2** (an/it) | **merge** — teach markers *through* "Ano ini? / Tubig ini / Kahoy adto / Ako hi Peter". Biggest jump up. |
| P1·U4 Is it? — first questions | **u13l1** (ano, hain, hin-o, ba) + **u13l2** | keep *who/what/where*; defer kay-ano/mapira/tagpira to P2/P4 |
| P1·U5 Have, there-is, none | **u29** (may/mayda, adi) + waray | pull *may/mayda/adi* out of Invitations up to here |
| P1·U6 Numbers 1–10 | **u33** (split) | usa…napulo only |
| P1·U7 Immediate family | **u4l1** (subset) | tatay, nanay, anak, bugto, asawa; rest of people → P3 |

**[gap]** P1·U3 wants 1–2 bridge cards so the marker jump is i+1 (e.g. "Saging ini" →
"Mapalit ako hin saging" already exists; add "An saging" as the bare-marker step).

## P2 — Put words together *(A1.2)*
> **Can-do:** say what's mine/yours, describe things, say what you're doing now,
> tell the time of day, name everyday objects & food, order food, ask & follow
> directions, name colors.

| New unit | Source | Notes |
|---|---|---|
| P2·U1 Mine & yours | **u10** + **u11** possessives | both, in order ko/nakon → akon |
| P2·U2 Describing (X is Y) | **u6l1** looks + **u12l3** ("Gwapo an bata") | adjectives + equational pattern together |
| P2·U3 Little words | **u14** (na, pa, liwat, hin duro) | as-is |
| P2·U4 Doing it now | **u15** *present only* (nakaon/napalit/nainom) + **u17l2** common verbs | past/future tenses deferred to P4·U1 |
| P2·U5 Time & when | **u18** | as-is |
| P2·U6 Around the house | **u21l1** + **u21l3** (objects) | clothes (u21l2) → P3 |
| P2·U7 Eating & food core | **u22** + **u31l1** core | kan-on, isda, manok, tubig, marasa, gutom; "Namahaw ka na?" |
| P2·U8 Getting around | **u24** directions | "Hain it bangko? / Harani la / harayo" |
| P2·U9 Colors | **u34** | as-is |

**[gap]** P2·U4: present-tense forms (na-) are mixed with will/did (ma-/-inm-) in the
current u15 lessons. Split the cards by tense across P2·U4 (now) and P4·U1
(then) — no new cards, just reassign which lesson lists each form.

## P3 — Daily life & people *(A2.1)*
> **Can-do:** describe people & jobs, talk about your body & feelings, say what you
> can/must/shouldn't do, name the days, talk weather, invite someone.

| New unit | Source | Notes |
|---|---|---|
| P3·U1 More people | **u4l2** | lalaki, babaye, bata, tawo, bisita… |
| P3·U2 Jobs & roles | **u5** | as-is, moved down |
| P3·U3 Qualities | **u6l2** | malipay, buoton, hubya… |
| P3·U4 The body | **u7** | as-is |
| P3·U5 Can, must, don't | **u16** | as-is |
| P3·U6 More action verbs | **u17l1** + **u17l3** | laba, hugas, dalagan, surat… |
| P3·U7 Days of the week | **u19l1** | months split off → P4 |
| P3·U8 Weather | **u20** | as-is |
| P3·U9 Clothes | **u21l2** | moved out of Home |
| P3·U10 Invitations | **u29** (remainder) | minus may/mayda (now P1) |

## P4 — Out in the world & beyond now *(A2.2)*
> **Can-do:** talk past & future, make travel/shopping plans, handle the airport,
> name months, count to 100, cook a dish, talk nature, engage faith/church.

| New unit | Source | Notes |
|---|---|---|
| P4·U1 Did & will | **u15** *past+future* | the deferred half of the tense cards |
| P4·U2 When & travel | **u30** | san-o, maabot, "Kakan-o ka umabot?" |
| P4·U3 Months | **u19l2** | Enero…Disyembre |
| P4·U4 Numbers 11–100 | **u33** (remainder) | karuhaan…usa kagatos |
| P4·U5 Shopping & money | **u25** | as-is |
| P4·U6 Transport | **u26** | as-is |
| P4·U7 At the airport | **u27** | as-is |
| P4·U8 A day trip | **u28** | as-is |
| P4·U9 Cooking | **u23** | as-is (loan-heavy, specialized) |
| P4·U10 Nature & animals | **u32** | as-is |
| P4·U11 Faith & Church | **u35** + **u36** | most specialized — last |

---

## What changes vs. today, in one breath
The whole of old **Section 3 ("Building Blocks")** — markers, demonstratives,
possessives, particles, question words — is the highest-frequency material in the
language, yet today it's the *third* section a learner reaches. This proposal
splits it: its highest-frequency half (markers, demonstratives, core questions,
have/there-is) becomes **Phase 1**, and the rest lands in **Phase 2**. Thematic,
loan-heavy clusters (cooking, airport, shopping, transport, faith, months) all
slide to **Phase 4**. Greetings stay first; numbers and family split (core early,
tail late).

## Build steps (when greenlit)
1. Reorder `CURRICULUM` to the P1–P4 layout above (pure array reorder + regroup;
   keep all lesson ids stable).
2. Reassign the **u15 tense cards** and **u33 number cards** across their two new
   homes (P2/P4 and P1/P4) — list-membership edits only.
3. Add per-phase **can-do headers** (new field on the section, or fold into `hint`).
4. *(Optional, later)* author the **[gap]** bridge cards for true i+1 — appended to
   SEED, never inserted.
5. *(Optional, later)* when corpus ranks land, fine-tune order *within* each phase.
