# Waray frequency graph — Phase 0 (repo sources only)

_Built by tools/build-frequency.mjs from the text already in the repo. Zero external
dependency. Counts are attested occurrences across CHED + Peace Corps + Tramp/Zorc._

## Corpus (Phase 0 + Phase 1)
Token counts per source:
- `ched` — 30,363 tokens
- `peace` — 18,943 tokens
- `tramp` — 235,860 tokens
- `bfc` — 6,503 tokens
- `bloom` — 5,631 tokens
- CHED headwords parsed: **869**
- Total distinct tokens counted: **58,897**
- Target lexicon (confirmable Waray = SEED single-words ∪ CHED headwords): **1160** words, of which **1130** occur in the corpus

## Attested-sentence pool (Track 2 — frame-engine fuel)
- CHED dictionary examples: **1154**
- Bible for Children (children's register): **408**
- Bloom Library (21 CC books, contemporary children's): **313**
- **Combined pool: 1875 sentences** (deduping not applied)
- _Bible for Children © Bible for Children, Inc. (free to copy, not for sale). Bloom Library books CC-licensed — see bloom-waray/SOURCES.md. Both attributed._
- ⚠️ The BFC translation leans **dialectal/colloquial** (san→han, sa→ha, wara→waray, sino→hin-o). Real Waray, but normalize before using as frame templates — a job for native-speaker validation.

## Coverage of what we teach
- SEED single-word vocab: **427** words
- …found in the corpus: **398** (93%)
- …never seen in the corpus: **29** (listed at the end — check spelling/rarity)

## Tiers (by corpus frequency rank, over the 1130 occurring target words)
- **Tier 1 (core, top 10%)**, **Tier 2 (10–30%)**, **Tier 3 (30–60%)**, **Tier 4 (rare, 60–100%)**

## Top 120 Waray words by attested frequency
| # | word | count | tier | in deck? | CHED-1000? |
|--:|------|------:|:--:|:--:|:--:|
| 1 | nga | 3148 | 1 |  | ✓ |
| 2 | an | 2589 | 1 | ✓ |  |
| 3 | han | 1637 | 1 | ✓ |  |
| 4 | ha | 1533 | 1 | ✓ |  |
| 5 | mga | 975 | 1 | ✓ |  |
| 6 | hin | 837 | 1 | ✓ |  |
| 7 | it | 645 | 1 | ✓ |  |
| 8 | na | 614 | 1 | ✓ |  |
| 9 | iya | 503 | 1 | ✓ |  |
| 10 | ngan | 499 | 1 | ✓ | ✓ |
| 11 | waray | 476 | 1 | ✓ | ✓ |
| 12 | hi | 389 | 1 | ✓ |  |
| 13 | ini | 382 | 1 | ✓ |  |
| 14 | pa | 372 | 1 | ✓ |  |
| 15 | hiya | 344 | 1 | ✓ |  |
| 16 | ug | 324 | 1 |  | ✓ |
| 17 | kay | 306 | 1 | ✓ | ✓ |
| 18 | ni | 298 | 1 | ✓ |  |
| 19 | ako | 281 | 1 | ✓ |  |
| 20 | diri | 271 | 1 | ✓ | ✓ |
| 21 | may | 271 | 1 | ✓ | ✓ |
| 22 | ba | 257 | 1 | ✓ |  |
| 23 | hira | 256 | 1 | ✓ |  |
| 24 | imo | 244 | 1 | ✓ |  |
| 25 | ira | 226 | 1 | ✓ |  |
| 26 | para | 204 | 1 | ✓ | ✓ |
| 27 | liwat | 195 | 1 | ✓ |  |
| 28 | ginoo | 188 | 1 | ✓ |  |
| 29 | akon | 185 | 1 | ✓ |  |
| 30 | usa | 185 | 1 | ✓ |  |
| 31 | niya | 166 | 1 | ✓ |  |
| 32 | away | 163 | 1 |  | ✓ |
| 33 | kan | 162 | 1 | ✓ |  |
| 34 | kun | 155 | 1 | ✓ | ✓ |
| 35 | ano | 146 | 1 | ✓ |  |
| 36 | iton | 135 | 1 | ✓ |  |
| 37 | tawo | 135 | 1 | ✓ | ✓ |
| 38 | duro | 128 | 1 | ✓ | ✓ |
| 39 | didto | 125 | 1 | ✓ |  |
| 40 | bata | 121 | 1 | ✓ | ✓ |
| 41 | ko | 118 | 1 | ✓ |  |
| 42 | nanay | 116 | 1 | ✓ | ✓ |
| 43 | adlaw | 109 | 1 | ✓ | ✓ |
| 44 | anak | 108 | 1 | ✓ | ✓ |
| 45 | balay | 106 | 1 | ✓ | ✓ |
| 46 | siday | 97 | 1 |  | ✓ |
| 47 | aton | 90 | 1 | ✓ |  |
| 48 | adto | 89 | 1 | ✓ |  |
| 49 | pulong | 89 | 1 |  | ✓ |
| 50 | kita | 87 | 1 | ✓ |  |
| 51 | tatay | 87 | 1 | ✓ | ✓ |
| 52 | tikang | 87 | 1 | ✓ | ✓ |
| 53 | dida | 84 | 1 | ✓ |  |
| 54 | nira | 84 | 1 | ✓ |  |
| 55 | ada | 80 | 1 |  | ✓ |
| 56 | babayi | 79 | 1 |  | ✓ |
| 57 | kami | 76 | 1 | ✓ |  |
| 58 | lalaki | 76 | 1 | ✓ | ✓ |
| 59 | amo | 75 | 1 |  | ✓ |
| 60 | amon | 74 | 1 | ✓ |  |
| 61 | siring | 74 | 1 | ✓ | ✓ |
| 62 | maupay | 72 | 1 | ✓ | ✓ |
| 63 | sala | 71 | 1 | ✓ | ✓ |
| 64 | bisan | 70 | 1 | ✓ | ✓ |
| 65 | dinhi | 70 | 1 | ✓ |  |
| 66 | gihapon | 68 | 1 | ✓ | ✓ |
| 67 | yana | 67 | 1 | ✓ | ✓ |
| 68 | damo | 66 | 1 | ✓ | ✓ |
| 69 | sugad | 65 | 1 | ✓ | ✓ |
| 70 | iyo | 64 | 1 | ✓ |  |
| 71 | baga | 63 | 1 |  | ✓ |
| 72 | iba | 63 | 1 | ✓ | ✓ |
| 73 | kamo | 63 | 1 | ✓ |  |
| 74 | tuna | 63 | 1 | ✓ | ✓ |
| 75 | sumat | 61 | 1 |  | ✓ |
| 76 | ayaw | 59 | 1 | ✓ | ✓ |
| 77 | kada | 59 | 1 | ✓ | ✓ |
| 78 | tungod | 59 | 1 | ✓ | ✓ |
| 79 | karuyag | 57 | 1 | ✓ | ✓ |
| 80 | libro | 57 | 1 | ✓ | ✓ |
| 81 | lugar | 53 | 1 | ✓ | ✓ |
| 82 | pero | 53 | 1 | ✓ | ✓ |
| 83 | hin-o | 50 | 1 | ✓ |  |
| 84 | tubig | 50 | 1 | ✓ | ✓ |
| 85 | anay | 49 | 1 | ✓ | ✓ |
| 86 | klase | 47 | 1 | ✓ | ✓ |
| 87 | tanan | 47 | 1 | ✓ | ✓ |
| 88 | kinabuhi | 46 | 1 | ✓ | ✓ |
| 89 | kinahanglan | 45 | 1 | ✓ | ✓ |
| 90 | pagkaon | 45 | 1 | ✓ | ✓ |
| 91 | asya | 44 | 1 |  | ✓ |
| 92 | langit | 44 | 1 | ✓ | ✓ |
| 93 | maaram | 44 | 1 | ✓ | ✓ |
| 94 | panahon | 44 | 1 | ✓ | ✓ |
| 95 | tuba | 44 | 1 |  | ✓ |
| 96 | dagat | 43 | 1 | ✓ | ✓ |
| 97 | diin | 43 | 1 | ✓ |  |
| 98 | wara | 43 | 1 |  | ✓ |
| 99 | apoy | 42 | 1 | ✓ |  |
| 100 | dako | 41 | 1 | ✓ | ✓ |
| 101 | bato | 40 | 1 |  | ✓ |
| 102 | basi | 39 | 1 | ✓ | ✓ |
| 103 | bungto | 39 | 1 | ✓ | ✓ |
| 104 | dara | 39 | 1 | ✓ | ✓ |
| 105 | pastor | 39 | 1 | ✓ |  |
| 106 | sulod | 38 | 1 | ✓ | ✓ |
| 107 | namon | 37 | 1 | ✓ |  |
| 108 | butang | 36 | 1 | ✓ | ✓ |
| 109 | di | 36 | 1 |  | ✓ |
| 110 | puno | 36 | 1 |  | ✓ |
| 111 | una | 36 | 1 | ✓ | ✓ |
| 112 | asawa | 35 | 1 | ✓ | ✓ |
| 113 | kahoy | 35 | 1 | ✓ | ✓ |
| 114 | babaye | 34 | 2 | ✓ |  |
| 115 | baton | 34 | 2 |  | ✓ |
| 116 | buot | 34 | 2 | ✓ | ✓ |
| 117 | gab-i | 34 | 2 |  | ✓ |
| 118 | winaray | 34 | 2 |  | ✓ |
| 119 | malipayon | 33 | 2 |  | ✓ |
| 120 | mayor | 33 | 2 | ✓ | ✓ |

## Gap list — CHED top-1000 words we DON'T teach yet (by corpus frequency)
_The highest-value add candidates: Oyzon's corpus says these are common, and they're not in the deck._

| # | word | count | tier |
|--:|------|------:|:--:|
| 1 | nga | 3148 | 1 |
| 16 | ug | 324 | 1 |
| 32 | away | 163 | 1 |
| 46 | siday | 97 | 1 |
| 49 | pulong | 89 | 1 |
| 55 | ada | 80 | 1 |
| 56 | babayi | 79 | 1 |
| 59 | amo | 75 | 1 |
| 71 | baga | 63 | 1 |
| 75 | sumat | 61 | 1 |
| 91 | asya | 44 | 1 |
| 95 | tuba | 44 | 1 |
| 98 | wara | 43 | 1 |
| 101 | bato | 40 | 1 |
| 109 | di | 36 | 1 |
| 110 | puno | 36 | 1 |
| 115 | baton | 34 | 2 |
| 117 | gab-i | 34 | 2 |
| 118 | winaray | 34 | 2 |
| 119 | malipayon | 33 | 2 |
| 123 | mano | 32 | 2 |
| 124 | ngani | 32 | 2 |
| 125 | barko | 31 | 2 |
| 126 | dayon | 31 | 2 |
| 127 | dyos | 31 | 2 |
| 128 | kamot | 31 | 2 |
| 130 | kalugaringon | 30 | 2 |
| 132 | tamsi | 30 | 2 |
| 137 | alas | 28 | 2 |
| 140 | pamilya | 28 | 2 |
| 141 | sakit | 28 | 2 |
| 145 | tuig | 27 | 2 |
| 149 | angay | 25 | 2 |
| 151 | bulan | 25 | 2 |
| 153 | kabataan | 25 | 2 |
| 160 | kahuman | 24 | 2 |
| 161 | nagsiring | 24 | 2 |
| 162 | pinulongan | 24 | 2 |
| 163 | hala | 23 | 2 |
| 167 | oras | 23 | 2 |
| 168 | upod | 23 | 2 |
| 169 | bangin | 22 | 2 |
| 170 | buhi | 22 | 2 |
| 171 | kalibutan | 22 | 2 |
| 174 | pananglitan | 22 | 2 |
| 175 | tiil | 22 | 2 |
| 176 | aga | 21 | 2 |
| 177 | agi | 21 | 2 |
| 179 | dapit | 21 | 2 |
| 181 | gawas | 21 | 2 |
| 182 | hangin | 21 | 2 |
| 184 | maraot | 21 | 2 |
| 185 | pag-abot | 21 | 2 |
| 187 | butnga | 20 | 2 |
| 188 | himo | 20 | 2 |
| 190 | mas | 20 | 2 |
| 191 | nagin | 20 | 2 |
| 192 | nakita | 20 | 2 |
| 193 | ngahaw | 20 | 2 |
| 194 | pakiana | 20 | 2 |
| 195 | samtang | 20 | 2 |
| 197 | ungod | 20 | 2 |
| 198 | baboy | 19 | 2 |
| 199 | bahin | 19 | 2 |
| 200 | labi | 19 | 2 |
| 201 | naghimo | 19 | 2 |
| 202 | padi | 19 | 2 |
| 203 | pira | 19 | 2 |
| 204 | problema | 19 | 2 |
| 205 | bantay | 18 | 2 |
| 208 | kundi | 18 | 2 |
| 209 | natural | 18 | 2 |
| 211 | yakan | 18 | 2 |
| 212 | baba | 17 | 2 |
| 213 | balod | 17 | 2 |
| 214 | gamit | 17 | 2 |
| 215 | hasta | 17 | 2 |
| 216 | ilarom | 17 | 2 |
| 218 | kaupod | 17 | 2 |
| 219 | mahal | 17 | 2 |

_(+652 more in the JSON.)_

## SEED words not found in the corpus (29)
_Either genuinely rare, a phrase fragment, or a spelling that differs from the corpus._

bagahe, buoton, dominggo, eroplano, gin-iimbita, hulam, ig-upod, igbabad, isnak, kahera, klaro?, kostums, lakso, limpyu, lutuon, maalsom, mamasyada, mapira?, matidong, pakwan, pedicab, relo, saribo, sorbetes, sukli, suoy, syaket, tindera, tinidor

## Sample harvested sentences (Track 2 seed pool)
**CHED dictionary examples** (first 8):
- Ay, Inday, bagà ka gud hinin balod. 2
- Kundi, áanhon man, kaluoyan kay di maaram magsiring.
- An kadaan nga abakadahan gagamiton komo batakan nga pananglitanan ha pagtutdo han bata pagluwas, pagbasa, pamati ug pagsurat nga nagamit han tuminungnong nga mga pulong.
- Binuhi hira niya inay ha abot han iya makakaya. 2
- Ginhihinulat han mga taga-Balangiga an pag-abot ni Layong Uray. 3
- Pira an abot han imo dakop nga isda?
- Mano, pwede kumadi ka la anay niyan ha balay kay may áda namon igpapakita ha imo. 2
- Waray pa ada umabot an iya tatay. ádi /adí (yadi): pagpakita nga tigsaliwan (demonstrative pronoun). here; indicates something very close to the speaker.

**Bible for Children — children's register** (first 8):
- Sino an nagtuha sa ato?
- An Biblia, pulong han Ginoo, nagsusumat san tinikangan san katawhan.
- Sadto pa, an Ginoo gin tuha an pinaka-una nga lalaki ug iya gin ngaranan nga Adan.
- Gin tuha san Ginoo si Adan tikang han tapotapo sa tuna.
- Han paghatag kinabuhi han Ginoo kan Adan, nabuhi siya.
- Nakita niya an iya kalugaringo sulod sin maupay nga harden nga gintatawag Eden.
- Antis pa pagtuhaa han Ginoo si Adan, naghimo siya hin kalibutan nga puno sin mag upay nga mga butang.
- Sa kamatooran, gin buhat san Ginoo an ngatanan – ngatanan.

**Bloom Library — contemporary children's books** (first 12):
- Nakagmata hi Mira han tuga-ok han manok.
- Nangadi hiya pagpasalamat han Ginoo ngan dali nga gintipig an iya hinigdaan.
- Pag gawas niya ha kwarto, iya gintawag an iya nanay.
- "Nanay, nanay, nanay!" Iya liwat gintawag an iya tatay.
- "Tatay,tatay, tatay!" Pero waray may bumaton ha iya.
- Kumadto hiya ha ira kusina, waray tawo.
- Kumadto hiya ha ira balkon, waray tawo.
- Kumadto hiya ha ira libong, waray liwat tawo!
- Bumalik hi Mira ha sulod han ira balay ngan nahinumdum hiya.
- Huybes ngayan yana, adlaw han tabo asya waray dinhi hira nanay ngan tatay.
- Waray la mag-iha, umabot na an kag-anak ni Mira tikang ha tabu-an.
- Damo an ira dara.
