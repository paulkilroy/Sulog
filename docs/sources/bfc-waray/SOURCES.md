# Bible for Children — Waray sources (provenance)

Source materials for the Phase 1 children's-register Waray corpus. Preserved here so the
pipeline is reproducible offline and the origin/license is documented.

## Origin
- **Publisher:** Bible for Children, Inc. — https://bibleforchildren.org
- **Directory:** https://bibleforchildren.org/PDFs/waray/
- **Translator credit (from the PDFs):** www.christian-translation.com
- **License (quoted from each story):** _"Mayaon ka katungod nga magcopya or mag imprita
  sito ini nga storya basta diri mo ini ig babaligya."_ → free to copy/print, **not for
  sale**. Our use (deriving frequency statistics + harvesting attested example sentences
  for a free, non-commercial learning app) is within this; **attribute Bible for Children.**
- **Dialect note:** this translation leans colloquial/dialectal (san→han, sa→ha,
  wara→waray, sino→hin-o). Real Waray, but normalize before using as frame templates.

## Files (the `_PDA` text-only layout — cleanest text layer)
Only 7 of the ~60 Bible for Children stories exist in Waray:

| # | Story | File |
|--:|-------|------|
| 01 | When God Made Everything | `01_When_God_Made_Everything_PDA.pdf` |
| 02 | The Start of Man's Sadness | `02_The_Start_of_Mans_Sadness_PDA.pdf` |
| 03 | Noah and the Great Flood | `03_Noah_and_the_Great_Flood_PDA.pdf` |
| 36 | The Birth of Jesus | `36_The_Birth_of_Jesus_PDA.pdf` |
| 40 | The Miracles of Jesus | `40_The_Miracles_of_Jesus_PDA.pdf` |
| 54 | The First Easter | `54_The_First_Easter_PDA.pdf` |
| 60 | Heaven — God's Beautiful Home | `60_Heaven_Gods_Beautiful_Home_PDA.pdf` |

## Re-fetch (if needed)
```sh
base="https://bibleforchildren.org/PDFs/waray"
for s in 01_When_God_Made_Everything 02_The_Start_of_Mans_Sadness 03_Noah_and_the_Great_Flood \
         36_The_Birth_of_Jesus 40_The_Miracles_of_Jesus 54_The_First_Easter 60_Heaven_Gods_Beautiful_Home; do
  curl -s -o "${s}_PDA.pdf" "${base}/${s}_Waray_PDA.pdf"
done
```

## Extraction
Text layer pulled via PDFKit (`PDFDocument.string`), boilerplate credits stripped, into
`docs/sources/bfc-waray-stories.txt`. Folded into the corpus + sentence pool by
`tools/build-frequency.mjs`. See `docs/waray-frequency-graph.md` and
`docs/sources/waray-attested-sentences.md`.
