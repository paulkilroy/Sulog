# Phrase-expansion proposal — mined, not invented

**Status:** proposal for review, 2026-06-23. Shows how i+1 **phrase cards** would
slot into the Frequency curriculum's later/theme units, Duolingo-style. **Every
sentence below is mined from a source already in the repo — none invented.**

**Sources & tags:**
- `PC L5` = Peace Corps course (docs/peace-corps-transcript.md / -extract.md).
  These are **attested on BOTH sides** (Waray + English verbatim from the course).
- `CHED:word` = First-1000 dictionary (docs/sources/waray-first-1000-words-2013.txt).
  The **Waray is attested**; the English is my gloss → wants a teacher spot-check.
- Confidence: ✅ both sides attested · 📖 Waray attested, English mine · ⚠️ no clean source yet → teacher needed.

**i+1 note:** "new" = the one new word the sentence adds over already-taught vocab.
New words get appended to cards (id-safe) only if we keep them.

I picked **"Do it: now / will / did"** as the lead because the Peace Corps course
is wall-to-wall clean verbal sentences there — zero gloss guesswork. **"God &
worship"** follows to show the harder, dictionary-sourced case honestly.

---

## P2 · "Do it: now / will / did"  (verbs)

**Existing lesson — "Eat & go" (unchanged):**
makaon (will eat) · nakaon (is eating) · kinmaon (ate) · malakat (will go) · nalakat (is going) · linmakat (went)

**➕ PROPOSED new lesson — "Verbs in sentences"** (all from Peace Corps, ✅ both sides attested):

| Waray | English | Source | New word (i+1) |
|---|---|---|---|
| **Nakaon hiya** | He's eating | PC L5 | — (nakaon + hiya, both known) |
| **Matindog kita** | We'll stand | PC L5 | tindog (stand) |
| **Nasimba kami** | We're worshipping | PC L5 | simba (already a card) |
| **Tinmawag kamo** | You (pl) called | PC L5 | tawag (call) |
| **Mapalit hira hin isda ha merkado** | They'll buy fish at the market | PC L6 | merkado (market) |
| **Natindog hira hiton lamesa ha sala** | They're standing on that table in the living room | PC L6 | — (all known once tindog is in) |

_Why this works:_ each reuses a pronoun + a verb form the unit already teaches,
adding at most one new noun. "Nasimba kami" even recycles `simba`, which is
already in the deck — pure recombination.

---

## P4 · "God & worship"  (faith — the harder, theme-sourced case)

**Existing lesson — "God & worship" (unchanged):**
Diyos (God) · Ginoo (Lord) · Jesu Kristo · espiritu (spirit) · simba (to worship) · ampo (to pray) · wali (to preach) · bendisyon (blessing) · gugma (love) · kasingkasing (heart)

**➕ PROPOSED new lesson — "Faith in sentences":**

| Waray | English | Source | Confidence |
|---|---|---|---|
| **Nasimba kami** | We're worshipping | PC L5 | ✅ both attested |
| **Ini nga uran, bendisyon ini han Ginoo** | This rain is a blessing from the Lord | CHED:bendisyon | 📖 English mine |
| **Diyos-diyos** | idol | PC L6 | ✅ both attested |
| _"I prayed", "the pastor preached"_ | — | — | ⚠️ no clean source sentence found → teacher needed |

_The honest result:_ the course gives us 2 clean faith sentences for free; the
dictionary adds 1 more (English to be checked); and a couple of the obvious ones
("I prayed") **have no attested example in our sources**, so I'd leave those for
your teacher rather than invent them. This is the pattern across themes: grammar
& everyday units mine richly and cleanly; specialized themes are thinner and need
a verification pass.

---

## What I'd do if you green-light this
1. **Lead with the Peace-Corps-rich units** (verbs, "X is Y", possessives, markers,
   meals, directions) — those mine to ✅ both-attested sentences with no guesswork.
2. **Theme units** (faith, cooking, travel) get a dictionary pass with 📖 glosses
   flagged, plus an explicit ⚠️ list of "wanted but unattested" sentences to hand
   your teacher/girlfriend — so the gaps are visible, not papered over.
3. Each new card stores its **source tag** (in the card's subtext or a note field)
   so any line is traceable back to where it came from.
4. Regenerate `docs/frequency-curriculum-expanded.md` so you see the full result.

## Open questions for you
- **OK with the source tagging** (PC / CHED) living in the card's subtext line?
- **Cap per unit?** e.g. add ~4–6 sentence cards per theme unit (one new lesson),
  or more?
- Want the ⚠️ "unattested but wanted" lines collected into one doc for a single
  teacher session?
