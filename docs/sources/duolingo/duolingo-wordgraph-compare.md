# Word-graph comparison: Duolingo vs Sulog

Crawled the Duolingo "Travel" skill (3rd Spanish skill) via the fandom MediaWiki
API (`api.php?action=parse&page=Spanish_Skill:Travel&prop=wikitext`) to compare how
words get reinforced. Source: https://duolingo.fandom.com/wiki/Spanish_Skill:Travel

## Duolingo "Travel" — the model
- **4 lessons, 29 new words, 54 sentences** (11 / 13 / 16 / 14 per lesson).
- ~6–9 NEW words per lesson, but **11–16 sentences** per lesson → each new word lands
  in multiple sentences, and sentences recombine words.
- Word graph (sentences each word appears in): el 19 · está 14 · un 12 · mi 11 ·
  dónde 8 · pasaporte 6 · boleto 6 · taxi 5 · hotel 5 · aquí 5 · tu 5 · tengo 4 ·
  necesito 3 · aeropuerto 3.
- **Only 6 of 38 distinct words appear once; 15 appear in ≥5 sentences.**
- A structural CORE (el/un, está, mi/tu, dónde, en, aquí, tengo, necesito) recurs in
  every lesson; content nouns get 3–6 hits each. Example reinforcing sentence:
  *"Yo tengo tu boleto a Madrid"* hits yo + tengo + tu + boleto at once.

## Sulog "travel cluster" (Ask the way + Shop + Get around + Airport + Day trip)
- **70 sentences, 81 distinct words.**
- **68% (55/81) appear in just one sentence; only 6 appear in ≥5.**
- Top words: an 25 · ha 12 · ako 11 · hain 8 · it 7 · harani 5 — i.e. our structural
  markers do recur, but the long tail of content words is one-and-done.

## Diagnosis
We have MORE sentences than Duolingo but spread them over **2× the distinct words**,
because our generator makes **one prompt per new word**. That maximizes coverage and
minimizes reuse — the opposite of Duolingo's "pool of sentences recombining a small
vocabulary."

| Metric | Duolingo Travel | Sulog travel cluster |
|---|--:|--:|
| Sentences | 54 | 70 |
| Distinct words | 38 | 81 |
| Words in 1 sentence | 16% | 68% |
| Words in ≥5 sentences | 15 | 6 |

## Deeper crawl (2026-06-23): first 36 Duolingo skills vs our 36 units
Crawled the Spanish skill order from `Module:Skills/spanish` and batch-fetched the
first 36 skill pages (Intro → Phrases 2) via the API. **Caveat:** the wiki only
carries full sentence lists for the first 4 skills (Intro/Phrases/Travel/Restaurant);
the rest are word-list stubs. So the sentence-level graph is Duolingo's first 4
skills (188 sentences) vs our full 36 units.

| Metric | Duolingo (first 4 skills) | Sulog (36 units) |
|---|--:|--:|
| New words | 105 | 356 |
| Sentences | 188 | 455 |
| Sentences / new word | 1.8 | 1.3 |
| Distinct words in sentences | 112 | 367 |
| **Words appearing once** | **7%** | **67%** |
| **Words appearing ≥3×** | **79%** | **21%** |

**Diagnosis (refined):** sentences-per-word is similar (1.8 vs 1.3); the gap is
**vocabulary concentration**. Duolingo packs ~112 words into 188 sentences and
recombines them (79% appear 3+×). We scatter 367 words across 455 sentences (67%
appear once). Their first 4 skills teach ~105 words *deeply*; ours teach 356
*thinly*. Two levers: (1) recombine more, (2) introduce fewer words per stretch and
drill them before adding more.

Our counts at time of writing: **4 phases · 36 units · 80 lessons** (49 ① words / 31 ② apply).

## The fix (proposed)
Stop generating one prompt per word. Instead, per unit generate a **sentence pool**
that:
1. Covers each new word at least once (keep coverage), AND
2. Adds **recombination sentences** reusing the unit's new words with each other and
   a fixed reinforced CORE of high-frequency Waray words (markers an/it/hi/ha/hin,
   pronouns ako/hiya/kami, may = have, karuyag = I want/need, hain = where, ini/iton
   = this/that, possessives ko/akon), so each word lands in ~2–3 sentences.

Target a distribution closer to Duolingo's: <25% of words appearing only once.

**Trade-off:** more sentences → more for Ella to record. Tunable via a reuse target
(e.g. 1.5–2× sentences per new word).
