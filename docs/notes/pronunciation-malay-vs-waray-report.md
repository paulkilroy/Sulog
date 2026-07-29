# Pronunciation review — Malay TTS vs Waray (report only, no changes)

_Generated 2026-07-30 from the live dictionary (607 rows) + Oyzon's CHED "First 1000 Words" (2013),
using his own diacritic key. **Read-only analysis — no pronunciation data was modified.**_

## 1. Voltz's (Oyzon's) key — DECODED (this is the part you asked for)

From his legend **"Ikatulo nga Padugang: Mga Kugit"** (Third Appendix: the diacritics) plus the
worked homograph example `bagà / bága / bagâ` = _like / ember / lung_:

| mark | Oyzon's name | meaning | long/short |
|---|---|---|---|
| **acute** ´ (á é í ó ú) | `kugit na mataron` | the **stressed** vowel, wherever it sits | that vowel is **LONG** |
| **grave** ` (à è ì ò ù) | `kugit nga pasangko` | penult stress **+ final glottal stop** | penult long, final **short**+glottal |
| **circumflex** ^ (â ê î ô û) | `kugit na bari` | **final** stress **+ final glottal stop** | final long, glottal-closed |
| _(unmarked)_ | — | default penult stress | penult long |

Also: a standalone `` ` `` is his **glottal-stop consonant**. This is the standard Philippine
(Tagalog/Bikol) 4-way stress system — malumay / mabilís / malumì / maragsâ — applied to Waray.
**Bottom line: in Oyzon's dictionary, the accented vowel is the long one, and grave/circumflex also
flag a final glottal stop.**

## 2. ⚠️ Data-quality caveat — READ BEFORE TRUSTING ANY PER-WORD STRESS

Our copy of Oyzon's list is **OCR'd, and the accents are inconsistent.** Proof: `libro` appears
**3× plain** and **1× as `libró`** in the same file. Across all entries, **724 headwords carry a
diacritic, 68 don't** — so he marks stress on ~91% of words, but individual accents drift/duplicate
in the OCR. **Therefore the per-word "final-stressed" and "disagree" lists below are CANDIDATES to
eyeball, not a verdict.** To do the long-vs-short review *properly* we need a **clean digitization
of his accents** — re-OCR the PDF preserving diacritics, or get his original digital file from
Voltz. That's the real blocker for this task.

## 3. Why Malay TTS collides with Waray (the two gap classes)

Malay (ms-MY, the Apple fallback voice) has **fixed penultimate stress** and **no phonemic glottal
stop**. So:

**A) Stress / long-vs-short gaps (suprasegmental).** Words Oyzon marks **final-stressed** (mabilís/
maragsâ) get read with Malay's penult stress → the wrong vowel goes long. Of our 607 dictionary
words, **190 are in Oyzon's list**; of those, **~59 look final-stressed and ~15 carry a final
glottal** — *candidates, pending the clean-accent caveat above*. Sample final-stress candidates:
`saka, mapaso, telebisyon, panahon, bendisyon, buruhaton, karabaw, sakayan, kataposan`. Sample
glottal candidates: `damo, buhi, himo, bata, kinabuhi, duro, higda, napulo, puno`.

**B) Segmental letter-to-sound gaps (RELIABLE — based on plain spelling, no accents needed).**
Counts over the live dictionary:

| pattern | why Malay mis-reads it | count | examples |
|---|---|---|---|
| `mga` plural marker | can't read m+g+a (no vowel) | 1 | `mga` (already overridden → "manga") |
| word-initial `ng-` | Malay onset differs | 3 | `ngaran, ngan, nga` |
| hyphen = glottal stop | Malay drops the glottal | 21 | `madig-on, gab-i, matam-is, sul-ot, sari-sari, luy-a, tinun-an, pag-umangkon` |
| contains `e` | Malay tends to schwa `e` | 85 | `babaye, klase, lamesa, merkado, biyahe, sinehan` |
| vowel clusters (aa/oo/ao…) | Malay glides/splits differently | 22 | `ginoo, pagkaon, balaod, maaram, kaon, oo` |

_(The `e`-schwa bucket is broad/low-precision — many are fine; it's a review net, not a hit list.)_

## 4. Cross-check: our pronunciation guides vs Oyzon

Where both mark a stressed syllable and are comparable: **134 agree, 40 disagree** — but the
disagreements are dominated by the OCR-accent noise (e.g. `libro`: our guide `LEE-bro` = penult,
which is almost certainly right; the `libró` that flags it is the OCR artifact). So this mostly
**validates our guides** and surfaces a short eyeball list, not real errors.

## 5. Recommended next steps (NONE done — report-only per your instruction)

1. **Get a clean copy of Oyzon's accents** (re-OCR the PDF preserving diacritics, or his source
   file) — prerequisite for a trustworthy long/short pass. Flag to Voltz.
2. Then rank override candidates = _(final-stressed per clean Oyzon)_ ∪ _(glottal)_ ∪ _(hyphen /
   initial-ng / mga)_, and feed that into the existing A/B override editor.
3. Remember overrides only fix the **Apple/Malay** fallback — Windows/Android differ.

**No overrides or pronunciation fields were created or changed. This document is the only output.**
