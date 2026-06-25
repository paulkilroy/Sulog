# Waray frequency graph — Phase 0 (repo sources only)

_Built by tools/build-frequency.mjs from the text already in the repo. Zero external
dependency. Counts are attested occurrences across CHED + Peace Corps + Tramp/Zorc._

## Corpus (Phase 0 + Phase 1)
Token counts per source:
- `ched` — 30,363 tokens
- `peace` — 18,943 tokens
- `tramp` — 235,860 tokens
- `bfc` — 6,503 tokens
- `bloom` — 6,182 tokens
- CHED headwords parsed: **869**
- Total distinct tokens counted: **59,012**
- Target lexicon (confirmable Waray = SEED single-words ∪ CHED headwords): **1159** words, of which **1129** occur in the corpus

## Attested-sentence pool (Track 2 — frame-engine fuel)
- CHED dictionary examples: **1154**
- Bible for Children (children's register): **408**
- Bloom Library (21 CC books, contemporary children's): **321**
- **Combined pool: 1883 sentences** (deduping not applied)
- _Bible for Children © Bible for Children, Inc. (free to copy, not for sale). Bloom Library books CC-licensed — see bloom-waray/SOURCES.md. Both attributed._
- ⚠️ The BFC translation leans **dialectal/colloquial** (san→han, sa→ha, wara→waray, sino→hin-o). Real Waray, but normalize before using as frame templates — a job for native-speaker validation.

## Coverage of what we teach
- SEED single-word vocab: **426** words
- …found in the corpus: **397** (93%)
- …never seen in the corpus: **29** (listed at the end — check spelling/rarity)

## Tiers (by corpus frequency rank, over the 1129 occurring target words)
- **Tier 1 (core, top 10%)**, **Tier 2 (10–30%)**, **Tier 3 (30–60%)**, **Tier 4 (rare, 60–100%)**

## Top 120 Waray words by attested frequency
| # | word | count | tier | in deck? | CHED-1000? |
|--:|------|------:|:--:|:--:|:--:|
| 1 | nga | 3150 | 1 |  | ✓ |
| 2 | an | 2591 | 1 | ✓ |  |
| 3 | han | 1641 | 1 | ✓ |  |
| 4 | ha | 1533 | 1 | ✓ |  |
| 5 | hin | 837 | 1 | ✓ |  |
| 6 | na | 648 | 1 | ✓ |  |
| 7 | it | 645 | 1 | ✓ |  |
| 8 | iya | 503 | 1 | ✓ |  |
| 9 | ngan | 499 | 1 | ✓ | ✓ |
| 10 | waray | 477 | 1 | ✓ | ✓ |
| 11 | hi | 389 | 1 | ✓ |  |
| 12 | ini | 382 | 1 | ✓ |  |
| 13 | pa | 373 | 1 | ✓ |  |
| 14 | hiya | 344 | 1 | ✓ |  |
| 15 | ug | 324 | 1 |  | ✓ |
| 16 | kay | 306 | 1 | ✓ | ✓ |
| 17 | ni | 299 | 1 | ✓ |  |
| 18 | ako | 281 | 1 | ✓ |  |
| 19 | may | 276 | 1 | ✓ | ✓ |
| 20 | diri | 271 | 1 | ✓ | ✓ |
| 21 | ba | 257 | 1 | ✓ |  |
| 22 | hira | 256 | 1 | ✓ |  |
| 23 | imo | 244 | 1 | ✓ |  |
| 24 | ira | 226 | 1 | ✓ |  |
| 25 | para | 204 | 1 | ✓ | ✓ |
| 26 | liwat | 195 | 1 | ✓ |  |
| 27 | ginoo | 188 | 1 | ✓ |  |
| 28 | akon | 185 | 1 | ✓ |  |
| 29 | usa | 185 | 1 | ✓ |  |
| 30 | niya | 166 | 1 | ✓ |  |
| 31 | away | 163 | 1 |  | ✓ |
| 32 | kan | 162 | 1 | ✓ |  |
| 33 | kun | 155 | 1 | ✓ | ✓ |
| 34 | ano | 146 | 1 | ✓ |  |
| 35 | iton | 135 | 1 | ✓ |  |
| 36 | tawo | 135 | 1 | ✓ | ✓ |
| 37 | duro | 128 | 1 | ✓ | ✓ |
| 38 | didto | 125 | 1 | ✓ |  |
| 39 | bata | 121 | 1 | ✓ | ✓ |
| 40 | ko | 118 | 1 | ✓ |  |
| 41 | nanay | 116 | 1 | ✓ | ✓ |
| 42 | adlaw | 109 | 1 | ✓ | ✓ |
| 43 | anak | 108 | 1 | ✓ | ✓ |
| 44 | balay | 106 | 1 | ✓ | ✓ |
| 45 | siday | 97 | 1 |  | ✓ |
| 46 | aton | 90 | 1 | ✓ |  |
| 47 | adto | 89 | 1 | ✓ |  |
| 48 | pulong | 89 | 1 |  | ✓ |
| 49 | kita | 87 | 1 | ✓ |  |
| 50 | tatay | 87 | 1 | ✓ | ✓ |
| 51 | tikang | 87 | 1 | ✓ | ✓ |
| 52 | dida | 84 | 1 | ✓ |  |
| 53 | nira | 84 | 1 | ✓ |  |
| 54 | ada | 80 | 1 |  | ✓ |
| 55 | babayi | 79 | 1 |  | ✓ |
| 56 | kami | 76 | 1 | ✓ |  |
| 57 | lalaki | 76 | 1 | ✓ | ✓ |
| 58 | amo | 75 | 1 |  | ✓ |
| 59 | amon | 74 | 1 | ✓ |  |
| 60 | siring | 74 | 1 | ✓ | ✓ |
| 61 | maupay | 72 | 1 | ✓ | ✓ |
| 62 | sala | 71 | 1 | ✓ | ✓ |
| 63 | bisan | 70 | 1 | ✓ | ✓ |
| 64 | dinhi | 70 | 1 | ✓ |  |
| 65 | gihapon | 68 | 1 | ✓ | ✓ |
| 66 | yana | 67 | 1 | ✓ | ✓ |
| 67 | damo | 66 | 1 | ✓ | ✓ |
| 68 | iyo | 65 | 1 | ✓ |  |
| 69 | sugad | 65 | 1 | ✓ | ✓ |
| 70 | baga | 63 | 1 |  | ✓ |
| 71 | iba | 63 | 1 | ✓ | ✓ |
| 72 | kamo | 63 | 1 | ✓ |  |
| 73 | tuna | 63 | 1 | ✓ | ✓ |
| 74 | sumat | 61 | 1 |  | ✓ |
| 75 | ayaw | 59 | 1 | ✓ | ✓ |
| 76 | kada | 59 | 1 | ✓ | ✓ |
| 77 | tungod | 59 | 1 | ✓ | ✓ |
| 78 | karuyag | 57 | 1 | ✓ | ✓ |
| 79 | libro | 57 | 1 | ✓ | ✓ |
| 80 | lugar | 54 | 1 | ✓ | ✓ |
| 81 | pero | 53 | 1 | ✓ | ✓ |
| 82 | tubig | 51 | 1 | ✓ | ✓ |
| 83 | hin-o | 50 | 1 | ✓ |  |
| 84 | anay | 49 | 1 | ✓ | ✓ |
| 85 | klase | 47 | 1 | ✓ | ✓ |
| 86 | panahon | 47 | 1 | ✓ | ✓ |
| 87 | tanan | 47 | 1 | ✓ | ✓ |
| 88 | kinabuhi | 46 | 1 | ✓ | ✓ |
| 89 | kinahanglan | 45 | 1 | ✓ | ✓ |
| 90 | pagkaon | 45 | 1 | ✓ | ✓ |
| 91 | asya | 44 | 1 |  | ✓ |
| 92 | langit | 44 | 1 | ✓ | ✓ |
| 93 | maaram | 44 | 1 | ✓ | ✓ |
| 94 | tuba | 44 | 1 |  | ✓ |
| 95 | bato | 43 | 1 |  | ✓ |
| 96 | dagat | 43 | 1 | ✓ | ✓ |
| 97 | diin | 43 | 1 | ✓ |  |
| 98 | wara | 43 | 1 |  | ✓ |
| 99 | apoy | 42 | 1 | ✓ |  |
| 100 | dako | 41 | 1 | ✓ | ✓ |
| 101 | basi | 39 | 1 | ✓ | ✓ |
| 102 | bungto | 39 | 1 | ✓ | ✓ |
| 103 | dara | 39 | 1 | ✓ | ✓ |
| 104 | pastor | 39 | 1 | ✓ |  |
| 105 | sulod | 38 | 1 | ✓ | ✓ |
| 106 | di | 37 | 1 |  | ✓ |
| 107 | namon | 37 | 1 | ✓ |  |
| 108 | butang | 36 | 1 | ✓ | ✓ |
| 109 | puno | 36 | 1 |  | ✓ |
| 110 | una | 36 | 1 | ✓ | ✓ |
| 111 | asawa | 35 | 1 | ✓ | ✓ |
| 112 | kahoy | 35 | 1 | ✓ | ✓ |
| 113 | babaye | 34 | 1 | ✓ |  |
| 114 | barko | 34 | 2 |  | ✓ |
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
| 1 | nga | 3150 | 1 |
| 15 | ug | 324 | 1 |
| 31 | away | 163 | 1 |
| 45 | siday | 97 | 1 |
| 48 | pulong | 89 | 1 |
| 54 | ada | 80 | 1 |
| 55 | babayi | 79 | 1 |
| 58 | amo | 75 | 1 |
| 70 | baga | 63 | 1 |
| 74 | sumat | 61 | 1 |
| 91 | asya | 44 | 1 |
| 94 | tuba | 44 | 1 |
| 95 | bato | 43 | 1 |
| 98 | wara | 43 | 1 |
| 106 | di | 37 | 1 |
| 109 | puno | 36 | 1 |
| 114 | barko | 34 | 2 |
| 115 | baton | 34 | 2 |
| 117 | gab-i | 34 | 2 |
| 118 | winaray | 34 | 2 |
| 119 | malipayon | 33 | 2 |
| 123 | mano | 32 | 2 |
| 124 | ngani | 32 | 2 |
| 125 | dayon | 31 | 2 |
| 126 | dyos | 31 | 2 |
| 127 | kamot | 31 | 2 |
| 129 | kalugaringon | 30 | 2 |
| 131 | tamsi | 30 | 2 |
| 136 | alas | 28 | 2 |
| 140 | pamilya | 28 | 2 |
| 141 | sakit | 28 | 2 |
| 144 | tuig | 27 | 2 |
| 148 | angay | 25 | 2 |
| 150 | bulan | 25 | 2 |
| 152 | kabataan | 25 | 2 |
| 155 | oras | 25 | 2 |
| 160 | kahuman | 24 | 2 |
| 161 | nagsiring | 24 | 2 |
| 162 | pinulongan | 24 | 2 |
| 163 | hala | 23 | 2 |
| 167 | upod | 23 | 2 |
| 168 | bangin | 22 | 2 |
| 169 | buhi | 22 | 2 |
| 170 | kalibutan | 22 | 2 |
| 173 | pananglitan | 22 | 2 |
| 174 | tiil | 22 | 2 |
| 175 | aga | 21 | 2 |
| 176 | agi | 21 | 2 |
| 178 | dapit | 21 | 2 |
| 180 | gawas | 21 | 2 |
| 181 | hangin | 21 | 2 |
| 183 | maraot | 21 | 2 |
| 184 | mas | 21 | 2 |
| 185 | nakita | 21 | 2 |
| 186 | pag-abot | 21 | 2 |
| 188 | butnga | 20 | 2 |
| 189 | himo | 20 | 2 |
| 191 | nagin | 20 | 2 |
| 192 | ngahaw | 20 | 2 |
| 193 | pakiana | 20 | 2 |
| 194 | samtang | 20 | 2 |
| 196 | ungod | 20 | 2 |
| 197 | baboy | 19 | 2 |
| 198 | bahin | 19 | 2 |
| 199 | labi | 19 | 2 |
| 200 | naghimo | 19 | 2 |
| 201 | padi | 19 | 2 |
| 202 | pira | 19 | 2 |
| 203 | problema | 19 | 2 |
| 204 | bantay | 18 | 2 |
| 207 | kundi | 18 | 2 |
| 208 | natural | 18 | 2 |
| 209 | sakay | 18 | 2 |
| 211 | yakan | 18 | 2 |
| 212 | baba | 17 | 2 |
| 213 | balod | 17 | 2 |
| 214 | gamit | 17 | 2 |
| 215 | hasta | 17 | 2 |
| 216 | ilarom | 17 | 2 |
| 218 | kaupod | 17 | 2 |

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
