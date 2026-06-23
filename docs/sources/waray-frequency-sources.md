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

## Next steps
1. Get the top-1000 list from #1 (scrape) or #2 (find the PDF).
2. Re-rank the current `CURRICULUM` items by that frequency.
3. Side-by-side: current teaching order vs frequency order; flag high-freq words
   missing from early lessons and low-freq words taught too early.
