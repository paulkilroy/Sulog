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
- Target lexicon (confirmable Waray = SEED single-words ∪ CHED headwords): **1157** words, of which **1127** occur in the corpus

## Attested-sentence pool (Track 2 — frame-engine fuel)
- CHED dictionary examples: **1154**
- Bible for Children (children's register): **408**
- Bloom Library (21 CC books, contemporary children's): **321**
- **Combined pool: 1883 sentences** (deduping not applied)
- _Bible for Children © Bible for Children, Inc. (free to copy, not for sale). Bloom Library books CC-licensed — see bloom-waray/SOURCES.md. Both attributed._
- ⚠️ The BFC translation leans **dialectal/colloquial** (san→han, sa→ha, wara→waray, sino→hin-o). Real Waray, but normalize before using as frame templates — a job for native-speaker validation.

## Coverage of what we teach
- SEED single-word vocab: **424** words
- …found in the corpus: **395** (93%)
- …never seen in the corpus: **29** (listed at the end — check spelling/rarity)

## Tiers (by corpus frequency rank, over the 1127 occurring target words)
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
| 17 | ako | 281 | 1 | ✓ |  |
| 18 | may | 276 | 1 | ✓ | ✓ |
| 19 | diri | 271 | 1 | ✓ | ✓ |
| 20 | ba | 257 | 1 | ✓ |  |
| 21 | hira | 256 | 1 | ✓ |  |
| 22 | imo | 244 | 1 | ✓ |  |
| 23 | ira | 226 | 1 | ✓ |  |
| 24 | para | 204 | 1 | ✓ | ✓ |
| 25 | liwat | 195 | 1 | ✓ |  |
| 26 | ginoo | 188 | 1 | ✓ |  |
| 27 | akon | 185 | 1 | ✓ |  |
| 28 | usa | 185 | 1 | ✓ |  |
| 29 | niya | 166 | 1 | ✓ |  |
| 30 | away | 163 | 1 |  | ✓ |
| 31 | kun | 155 | 1 | ✓ | ✓ |
| 32 | ano | 146 | 1 | ✓ |  |
| 33 | iton | 135 | 1 | ✓ |  |
| 34 | tawo | 135 | 1 | ✓ | ✓ |
| 35 | duro | 128 | 1 | ✓ | ✓ |
| 36 | didto | 125 | 1 | ✓ |  |
| 37 | bata | 121 | 1 | ✓ | ✓ |
| 38 | ko | 118 | 1 | ✓ |  |
| 39 | nanay | 116 | 1 | ✓ | ✓ |
| 40 | adlaw | 109 | 1 | ✓ | ✓ |
| 41 | anak | 108 | 1 | ✓ | ✓ |
| 42 | balay | 106 | 1 | ✓ | ✓ |
| 43 | siday | 97 | 1 |  | ✓ |
| 44 | aton | 90 | 1 | ✓ |  |
| 45 | adto | 89 | 1 | ✓ |  |
| 46 | pulong | 89 | 1 |  | ✓ |
| 47 | kita | 87 | 1 | ✓ |  |
| 48 | tatay | 87 | 1 | ✓ | ✓ |
| 49 | tikang | 87 | 1 | ✓ | ✓ |
| 50 | dida | 84 | 1 | ✓ |  |
| 51 | nira | 84 | 1 | ✓ |  |
| 52 | ada | 80 | 1 |  | ✓ |
| 53 | babayi | 79 | 1 |  | ✓ |
| 54 | kami | 76 | 1 | ✓ |  |
| 55 | lalaki | 76 | 1 | ✓ | ✓ |
| 56 | amo | 75 | 1 |  | ✓ |
| 57 | amon | 74 | 1 | ✓ |  |
| 58 | siring | 74 | 1 | ✓ | ✓ |
| 59 | maupay | 72 | 1 | ✓ | ✓ |
| 60 | sala | 71 | 1 | ✓ | ✓ |
| 61 | bisan | 70 | 1 | ✓ | ✓ |
| 62 | dinhi | 70 | 1 | ✓ |  |
| 63 | gihapon | 68 | 1 | ✓ | ✓ |
| 64 | yana | 67 | 1 | ✓ | ✓ |
| 65 | damo | 66 | 1 | ✓ | ✓ |
| 66 | iyo | 65 | 1 | ✓ |  |
| 67 | sugad | 65 | 1 | ✓ | ✓ |
| 68 | baga | 63 | 1 |  | ✓ |
| 69 | iba | 63 | 1 | ✓ | ✓ |
| 70 | kamo | 63 | 1 | ✓ |  |
| 71 | tuna | 63 | 1 | ✓ | ✓ |
| 72 | sumat | 61 | 1 |  | ✓ |
| 73 | ayaw | 59 | 1 | ✓ | ✓ |
| 74 | kada | 59 | 1 | ✓ | ✓ |
| 75 | tungod | 59 | 1 | ✓ | ✓ |
| 76 | karuyag | 57 | 1 | ✓ | ✓ |
| 77 | libro | 57 | 1 | ✓ | ✓ |
| 78 | lugar | 54 | 1 | ✓ | ✓ |
| 79 | pero | 53 | 1 | ✓ | ✓ |
| 80 | tubig | 51 | 1 | ✓ | ✓ |
| 81 | hin-o | 50 | 1 | ✓ |  |
| 82 | anay | 49 | 1 | ✓ | ✓ |
| 83 | klase | 47 | 1 | ✓ | ✓ |
| 84 | panahon | 47 | 1 | ✓ | ✓ |
| 85 | tanan | 47 | 1 | ✓ | ✓ |
| 86 | kinabuhi | 46 | 1 | ✓ | ✓ |
| 87 | kinahanglan | 45 | 1 | ✓ | ✓ |
| 88 | pagkaon | 45 | 1 | ✓ | ✓ |
| 89 | asya | 44 | 1 |  | ✓ |
| 90 | langit | 44 | 1 | ✓ | ✓ |
| 91 | maaram | 44 | 1 | ✓ | ✓ |
| 92 | tuba | 44 | 1 |  | ✓ |
| 93 | bato | 43 | 1 |  | ✓ |
| 94 | dagat | 43 | 1 | ✓ | ✓ |
| 95 | diin | 43 | 1 | ✓ |  |
| 96 | wara | 43 | 1 |  | ✓ |
| 97 | apoy | 42 | 1 | ✓ |  |
| 98 | dako | 41 | 1 | ✓ | ✓ |
| 99 | basi | 39 | 1 | ✓ | ✓ |
| 100 | bungto | 39 | 1 | ✓ | ✓ |
| 101 | dara | 39 | 1 | ✓ | ✓ |
| 102 | pastor | 39 | 1 | ✓ |  |
| 103 | sulod | 38 | 1 | ✓ | ✓ |
| 104 | di | 37 | 1 |  | ✓ |
| 105 | namon | 37 | 1 | ✓ |  |
| 106 | butang | 36 | 1 | ✓ | ✓ |
| 107 | puno | 36 | 1 |  | ✓ |
| 108 | una | 36 | 1 | ✓ | ✓ |
| 109 | asawa | 35 | 1 | ✓ | ✓ |
| 110 | kahoy | 35 | 1 | ✓ | ✓ |
| 111 | babaye | 34 | 1 | ✓ |  |
| 112 | barko | 34 | 1 |  | ✓ |
| 113 | baton | 34 | 1 |  | ✓ |
| 114 | buot | 34 | 2 | ✓ | ✓ |
| 115 | gab-i | 34 | 2 |  | ✓ |
| 116 | winaray | 34 | 2 |  | ✓ |
| 117 | malipayon | 33 | 2 |  | ✓ |
| 118 | mayor | 33 | 2 | ✓ | ✓ |
| 119 | duha | 32 | 2 | ✓ |  |
| 120 | mahusay | 32 | 2 | ✓ | ✓ |

## Gap list — CHED top-1000 words we DON'T teach yet (by corpus frequency)
_The highest-value add candidates: Oyzon's corpus says these are common, and they're not in the deck._

| # | word | count | tier |
|--:|------|------:|:--:|
| 1 | nga | 3150 | 1 |
| 15 | ug | 324 | 1 |
| 30 | away | 163 | 1 |
| 43 | siday | 97 | 1 |
| 46 | pulong | 89 | 1 |
| 52 | ada | 80 | 1 |
| 53 | babayi | 79 | 1 |
| 56 | amo | 75 | 1 |
| 68 | baga | 63 | 1 |
| 72 | sumat | 61 | 1 |
| 89 | asya | 44 | 1 |
| 92 | tuba | 44 | 1 |
| 93 | bato | 43 | 1 |
| 96 | wara | 43 | 1 |
| 104 | di | 37 | 1 |
| 107 | puno | 36 | 1 |
| 112 | barko | 34 | 1 |
| 113 | baton | 34 | 1 |
| 115 | gab-i | 34 | 2 |
| 116 | winaray | 34 | 2 |
| 117 | malipayon | 33 | 2 |
| 121 | mano | 32 | 2 |
| 122 | ngani | 32 | 2 |
| 123 | dayon | 31 | 2 |
| 124 | dyos | 31 | 2 |
| 125 | kamot | 31 | 2 |
| 127 | kalugaringon | 30 | 2 |
| 129 | tamsi | 30 | 2 |
| 134 | alas | 28 | 2 |
| 138 | pamilya | 28 | 2 |
| 139 | sakit | 28 | 2 |
| 142 | tuig | 27 | 2 |
| 146 | angay | 25 | 2 |
| 148 | bulan | 25 | 2 |
| 150 | kabataan | 25 | 2 |
| 153 | oras | 25 | 2 |
| 158 | kahuman | 24 | 2 |
| 159 | nagsiring | 24 | 2 |
| 160 | pinulongan | 24 | 2 |
| 161 | hala | 23 | 2 |
| 165 | upod | 23 | 2 |
| 166 | bangin | 22 | 2 |
| 167 | buhi | 22 | 2 |
| 168 | kalibutan | 22 | 2 |
| 171 | pananglitan | 22 | 2 |
| 172 | tiil | 22 | 2 |
| 173 | aga | 21 | 2 |
| 174 | agi | 21 | 2 |
| 176 | dapit | 21 | 2 |
| 178 | gawas | 21 | 2 |
| 179 | hangin | 21 | 2 |
| 181 | maraot | 21 | 2 |
| 182 | mas | 21 | 2 |
| 183 | nakita | 21 | 2 |
| 184 | pag-abot | 21 | 2 |
| 186 | butnga | 20 | 2 |
| 187 | himo | 20 | 2 |
| 189 | nagin | 20 | 2 |
| 190 | ngahaw | 20 | 2 |
| 191 | pakiana | 20 | 2 |
| 192 | samtang | 20 | 2 |
| 194 | ungod | 20 | 2 |
| 195 | baboy | 19 | 2 |
| 196 | bahin | 19 | 2 |
| 197 | labi | 19 | 2 |
| 198 | naghimo | 19 | 2 |
| 199 | padi | 19 | 2 |
| 200 | pira | 19 | 2 |
| 201 | problema | 19 | 2 |
| 202 | bantay | 18 | 2 |
| 205 | kundi | 18 | 2 |
| 206 | natural | 18 | 2 |
| 207 | sakay | 18 | 2 |
| 209 | yakan | 18 | 2 |
| 210 | baba | 17 | 2 |
| 211 | balod | 17 | 2 |
| 212 | gamit | 17 | 2 |
| 213 | hasta | 17 | 2 |
| 214 | ilarom | 17 | 2 |
| 216 | kaupod | 17 | 2 |

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
