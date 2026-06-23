# Waray frequency data — source leads (the gold mine)

Found 2026-06-22 while researching a frequency-first curriculum rebuild
(see `docs/cefr-curriculum-blueprint.md`). These are the real, Waray-specific
frequency resources to mine. **Not yet downloaded** — capture/extract next.

## 1. 3NS Corpora Project (corporaproject.org) — PRIMARY
- A database of texts in ~10 Philippine languages by **Mark Fullmer** (3NS),
  built to preserve literature + classify texts by comprehension level.
- **Waray corpus = language id 24**: **2,127 texts · 1,753,070 total words ·
  89,658 word forms.** Big enough for real frequency ranking.
- Has a **"Frequency Lists"** section and **"Semantic Lists"** under Words.
- Single-word lookup with frequency: `https://corporaproject.org/index.php?word_search=<WORD>&language=24`
  (e.g. `?word_search=sunod&language=24`).
- Nav links seen: Words / Frequency Lists → `index.php?type=word&id=all`
  (needs `&language=24`); Semantic Lists → `index.php?type=semantic&id=all`.
- NOTE: direct fetch of the frequency-list page hit a permission/JS issue —
  the ranked data didn't render to a simple GET. May need the right query
  params, a session, or scraping the per-word counts. Revisit.
- Site root: https://corporaproject.org/

## 2. "First One Thousand Commonly Used Words in Waray" — IDEAL if obtainable
- Full: *First One Thousand Commonly Used Words in Waray: A Waray-English
  Dictionary for MTBMLE Educators* (CHED / 3NS, **2013**).
- A published, frequency-ranked top-1000 Waray word list built FOR educators —
  exactly a frequency-first vocabulary spine. Track down a PDF/scan.
- MTBMLE = Mother Tongue-Based Multilingual Education (DepEd/CHED program).

## 3. "High Frequency Word List of Select Philippine Languages"
- Mentioned alongside #2; covers several PH languages incl. Waray. Find source.

## Other corpora noted (from STT research, see waray-speech-to-text memory)
- PLD corpus — 454 hrs audio, 9 PH langs incl. Waray (UP Diliman; Guevara/Cajote
  et al. 2024). https://aclanthology.org/2024.sigul-1.32/ — audio, not text.
- Repos: imperialite/Philippine-Languages-Online-Corpora, jhellingman/phildict.
- Waray Wikipedia (war.wikipedia.org): huge but mostly Lsjbot geo-stubs →
  content-word frequency is skewed; function words still reliable.

## Local fallback corpus we already have
- `docs/peace-corps-transcript.md` — conversational Waray (interleaved w/ English,
  needs filtering). Good for a *pedagogical* frequency proxy.
- `docs/sources/tramp-zorc-...txt` — dictionary (headwords + example sentences).

## OUTCOME (2026-06-22) — got the dictionary, FREE
- **Free official PDF obtained & saved:** `docs/sources/waray-first-1000-words-2013.pdf`
  (105pp, extracted text in `...-2013.txt`). Source: the MTB-MLE educators' blog
  https://mlephil.wordpress.com/2013/09/29/... → direct PDF
  `wp-content/uploads/2013/09/syahan-nga-usa-ka-yukot-hin-mga-pulong-edited.pdf`.
  Also mirrored on DocsLib (doc 7161104) and Scribd (doc 449268274). **No payment
  or registration needed** — it's CHED/DAP-funded educational material meant for
  free distribution. ISBN 978-971-94520-3-4 (print, Tacloban, May 2013).
- **The catch:** the body is an **alphabetical** Waray-English dictionary of the
  ~1000 words (headword + POS + gloss + example). The **frequency-RANK appendix**
  ("Syahan nga Padugang: Listahan han Kaagsob") is a **placeholder** in this free
  edition: *"Insert the list here (file name: frequency list 1000 words)."* The
  corpus it ranked = 179,000 terms. So we have the **SET** of top-1000, not the
  1→1000 ranks.
- **To get exact ranks:** scrape corporaproject.org (Waray=24, JS-gated) OR the
  print book's appendix OR the readability site http://www.waraylanguage.org/readability.php.
- **Cross-ref done** (see `docs/frequency-first-reorder.md`): of Sulog's 378
  single-word cards, ≥43% are in the top-1000 SET (floor — grammar words &
  verb inflections miss because the dict lists roots + a separate grammar
  section). The cards NOT in the set are overwhelmingly **months, days,
  religious vocab, job titles, transport, modern food** = Spanish/English loans
  = exactly the themes the reorder defers. The frequency data CONFIRMS the
  reorder direction.

## Remaining next steps
1. (Optional) get exact 1→1000 ranks via corpus scrape for fine-grained ordering.
2. Re-derive lessons under i+1 using the top-1000 SET as the inclusion filter.
3. Decide what to CUT/DEFER (the loan-heavy thematic clusters) and what top-1000
   words to ADD that Sulog lacks.
