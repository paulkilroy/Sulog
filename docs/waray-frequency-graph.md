# Waray frequency graph — Phase 0 (repo sources only)

_Built by tools/build-frequency.mjs from the text already in the repo. Zero external
dependency. Counts are attested occurrences across CHED + Peace Corps + Tramp/Zorc._

## Corpus (Phase 0 + Phase 1)
Token counts per source:
- `ched` — 30,363 tokens
- `peace` — 18,943 tokens
- `tramp` — 235,860 tokens
- `bfc` — 6,503 tokens
- CHED headwords parsed: **869**
- Total distinct tokens counted: **58,448**
- Target lexicon (confirmable Waray = SEED single-words ∪ CHED headwords): **1157** words, of which **1122** occur in the corpus

## Attested-sentence pool (Track 2 — frame-engine fuel)
- CHED dictionary examples: **1154**
- Bible for Children (children's register): **408**
- **Combined pool: 1562 sentences** (deduping not applied)
- _Bible for Children © Bible for Children, Inc. — free to copy/print, not for sale; attributed._
- ⚠️ The BFC translation leans **dialectal/colloquial** (san→han, sa→ha, wara→waray, sino→hin-o). Real Waray, but normalize before using as frame templates — a job for native-speaker validation.

## Coverage of what we teach
- SEED single-word vocab: **424** words
- …found in the corpus: **390** (92%)
- …never seen in the corpus: **34** (listed at the end — check spelling/rarity)

## Tiers (by corpus frequency rank, over the 1122 occurring target words)
- **Tier 1 (core, top 10%)**, **Tier 2 (10–30%)**, **Tier 3 (30–60%)**, **Tier 4 (rare, 60–100%)**

## Top 120 Waray words by attested frequency
| # | word | count | tier | in deck? | CHED-1000? |
|--:|------|------:|:--:|:--:|:--:|
| 1 | nga | 2769 | 1 |  | ✓ |
| 2 | an | 2327 | 1 | ✓ |  |
| 3 | han | 1414 | 1 | ✓ |  |
| 4 | ha | 1356 | 1 | ✓ |  |
| 5 | hin | 757 | 1 | ✓ |  |
| 6 | it | 625 | 1 | ✓ |  |
| 7 | na | 549 | 1 | ✓ |  |
| 8 | waray | 435 | 1 | ✓ | ✓ |
| 9 | iya | 381 | 1 | ✓ |  |
| 10 | ngan | 363 | 1 | ✓ | ✓ |
| 11 | ini | 354 | 1 | ✓ |  |
| 12 | pa | 350 | 1 | ✓ |  |
| 13 | ug | 322 | 1 |  | ✓ |
| 14 | hi | 312 | 1 | ✓ |  |
| 15 | hiya | 273 | 1 | ✓ |  |
| 16 | kay | 266 | 1 | ✓ | ✓ |
| 17 | ba | 254 | 1 | ✓ |  |
| 18 | may | 239 | 1 | ✓ | ✓ |
| 19 | ako | 237 | 1 | ✓ |  |
| 20 | diri | 236 | 1 | ✓ | ✓ |
| 21 | hira | 214 | 1 | ✓ |  |
| 22 | imo | 209 | 1 | ✓ |  |
| 23 | ginoo | 187 | 1 | ✓ |  |
| 24 | ira | 187 | 1 | ✓ |  |
| 25 | liwat | 182 | 1 | ✓ |  |
| 26 | para | 177 | 1 | ✓ | ✓ |
| 27 | away | 163 | 1 |  | ✓ |
| 28 | akon | 160 | 1 | ✓ |  |
| 29 | usa | 142 | 1 | ✓ |  |
| 30 | kun | 139 | 1 | ✓ | ✓ |
| 31 | iton | 135 | 1 | ✓ |  |
| 32 | ano | 129 | 1 | ✓ |  |
| 33 | niya | 125 | 1 | ✓ |  |
| 34 | duro | 123 | 1 | ✓ | ✓ |
| 35 | didto | 120 | 1 | ✓ |  |
| 36 | tawo | 119 | 1 | ✓ | ✓ |
| 37 | bata | 113 | 1 | ✓ | ✓ |
| 38 | ko | 100 | 1 | ✓ |  |
| 39 | siday | 97 | 1 |  | ✓ |
| 40 | adlaw | 94 | 1 | ✓ | ✓ |
| 41 | balay | 92 | 1 | ✓ | ✓ |
| 42 | adto | 87 | 1 | ✓ |  |
| 43 | pulong | 86 | 1 |  | ✓ |
| 44 | anak | 83 | 1 | ✓ | ✓ |
| 45 | dida | 83 | 1 | ✓ |  |
| 46 | babayi | 77 | 1 |  | ✓ |
| 47 | lalaki | 74 | 1 | ✓ | ✓ |
| 48 | aton | 73 | 1 | ✓ |  |
| 49 | kita | 73 | 1 | ✓ |  |
| 50 | amo | 72 | 1 |  | ✓ |
| 51 | amon | 71 | 1 | ✓ |  |
| 52 | sala | 71 | 1 | ✓ | ✓ |
| 53 | tikang | 71 | 1 | ✓ | ✓ |
| 54 | nira | 70 | 1 | ✓ |  |
| 55 | kami | 68 | 1 | ✓ |  |
| 56 | dinhi | 65 | 1 | ✓ |  |
| 57 | gihapon | 65 | 1 | ✓ | ✓ |
| 58 | baga | 61 | 1 |  | ✓ |
| 59 | bisan | 61 | 1 | ✓ | ✓ |
| 60 | iyo | 61 | 1 | ✓ |  |
| 61 | tuna | 60 | 1 | ✓ | ✓ |
| 62 | maupay | 58 | 1 | ✓ | ✓ |
| 63 | sumat | 58 | 1 |  | ✓ |
| 64 | libro | 57 | 1 | ✓ | ✓ |
| 65 | sugad | 57 | 1 | ✓ | ✓ |
| 66 | kamo | 56 | 1 | ✓ |  |
| 67 | yana | 56 | 1 | ✓ | ✓ |
| 68 | ada | 55 | 1 |  | ✓ |
| 69 | iba | 54 | 1 | ✓ | ✓ |
| 70 | ayaw | 53 | 1 | ✓ | ✓ |
| 71 | damo | 51 | 1 | ✓ | ✓ |
| 72 | kada | 51 | 1 | ✓ | ✓ |
| 73 | hin-o | 50 | 1 | ✓ |  |
| 74 | tubig | 48 | 1 | ✓ | ✓ |
| 75 | tatay | 47 | 1 | ✓ | ✓ |
| 76 | tungod | 46 | 1 | ✓ | ✓ |
| 77 | kinabuhi | 45 | 1 | ✓ | ✓ |
| 78 | pero | 44 | 1 | ✓ | ✓ |
| 79 | tuba | 44 | 1 |  | ✓ |
| 80 | karuyag | 43 | 1 | ✓ | ✓ |
| 81 | klase | 43 | 1 | ✓ | ✓ |
| 82 | langit | 43 | 1 | ✓ | ✓ |
| 83 | lugar | 43 | 1 | ✓ | ✓ |
| 84 | maaram | 43 | 1 | ✓ | ✓ |
| 85 | wara | 43 | 1 |  | ✓ |
| 86 | anay | 41 | 1 | ✓ | ✓ |
| 87 | kinahanglan | 40 | 1 | ✓ | ✓ |
| 88 | tanan | 40 | 1 | ✓ | ✓ |
| 89 | basi | 39 | 1 | ✓ | ✓ |
| 90 | pastor | 39 | 1 | ✓ |  |
| 91 | pagkaon | 38 | 1 | ✓ | ✓ |
| 92 | bungto | 37 | 1 | ✓ | ✓ |
| 93 | diin | 37 | 1 | ✓ |  |
| 94 | asya | 36 | 1 |  | ✓ |
| 95 | dara | 36 | 1 | ✓ | ✓ |
| 96 | asawa | 35 | 1 | ✓ | ✓ |
| 97 | dagat | 35 | 1 | ✓ | ✓ |
| 98 | nanay | 35 | 1 | ✓ | ✓ |
| 99 | panahon | 35 | 1 | ✓ | ✓ |
| 100 | una | 35 | 1 | ✓ | ✓ |
| 101 | buot | 34 | 1 | ✓ | ✓ |
| 102 | di | 34 | 1 |  | ✓ |
| 103 | winaray | 34 | 1 |  | ✓ |
| 104 | babaye | 33 | 1 | ✓ |  |
| 105 | mayor | 33 | 1 | ✓ | ✓ |
| 106 | namon | 33 | 1 | ✓ |  |
| 107 | butang | 32 | 1 | ✓ | ✓ |
| 108 | sulod | 32 | 1 | ✓ | ✓ |
| 109 | dyos | 31 | 1 |  | ✓ |
| 110 | kahoy | 31 | 1 | ✓ | ✓ |
| 111 | puno | 31 | 1 |  | ✓ |
| 112 | dako | 30 | 1 | ✓ | ✓ |
| 113 | ngaran | 30 | 1 | ✓ | ✓ |
| 114 | makadto | 29 | 2 | ✓ | ✓ |
| 115 | siring | 29 | 2 | ✓ | ✓ |
| 116 | alas | 28 | 2 |  | ✓ |
| 117 | duha | 28 | 2 | ✓ |  |
| 118 | mahusay | 28 | 2 | ✓ | ✓ |
| 119 | makaon | 28 | 2 | ✓ | ✓ |
| 120 | ngani | 28 | 2 |  | ✓ |

## Gap list — CHED top-1000 words we DON'T teach yet (by corpus frequency)
_The highest-value add candidates: Oyzon's corpus says these are common, and they're not in the deck._

| # | word | count | tier |
|--:|------|------:|:--:|
| 1 | nga | 2769 | 1 |
| 13 | ug | 322 | 1 |
| 27 | away | 163 | 1 |
| 39 | siday | 97 | 1 |
| 43 | pulong | 86 | 1 |
| 46 | babayi | 77 | 1 |
| 50 | amo | 72 | 1 |
| 58 | baga | 61 | 1 |
| 63 | sumat | 58 | 1 |
| 68 | ada | 55 | 1 |
| 79 | tuba | 44 | 1 |
| 85 | wara | 43 | 1 |
| 94 | asya | 36 | 1 |
| 102 | di | 34 | 1 |
| 103 | winaray | 34 | 1 |
| 109 | dyos | 31 | 1 |
| 111 | puno | 31 | 1 |
| 116 | alas | 28 | 2 |
| 120 | ngani | 28 | 2 |
| 121 | dayon | 27 | 2 |
| 124 | bato | 26 | 2 |
| 125 | gab-i | 26 | 2 |
| 129 | tuig | 25 | 2 |
| 132 | barko | 24 | 2 |
| 133 | bulan | 24 | 2 |
| 134 | pinulongan | 24 | 2 |
| 141 | sakit | 23 | 2 |
| 144 | buhi | 22 | 2 |
| 147 | mano | 22 | 2 |
| 150 | pananglitan | 22 | 2 |
| 151 | tamsi | 22 | 2 |
| 152 | tiil | 22 | 2 |
| 153 | aga | 21 | 2 |
| 154 | agi | 21 | 2 |
| 155 | angay | 21 | 2 |
| 157 | bangin | 21 | 2 |
| 158 | kahuman | 21 | 2 |
| 159 | kalibutan | 21 | 2 |
| 162 | maraot | 21 | 2 |
| 163 | pamilya | 21 | 2 |
| 164 | upod | 21 | 2 |
| 166 | dapit | 20 | 2 |
| 167 | hala | 20 | 2 |
| 168 | himo | 20 | 2 |
| 169 | kabataan | 20 | 2 |
| 170 | kamot | 20 | 2 |
| 171 | nagsiring | 20 | 2 |
| 172 | ngahaw | 20 | 2 |
| 173 | oras | 20 | 2 |
| 174 | bahin | 19 | 2 |
| 176 | hangin | 19 | 2 |
| 179 | padi | 19 | 2 |
| 180 | ungod | 19 | 2 |
| 181 | bantay | 18 | 2 |
| 184 | gawas | 18 | 2 |
| 186 | kalugaringon | 18 | 2 |
| 187 | labi | 18 | 2 |
| 188 | pag-abot | 18 | 2 |
| 189 | pira | 18 | 2 |
| 191 | hasta | 17 | 2 |
| 192 | ilarom | 17 | 2 |
| 193 | mahal | 17 | 2 |
| 194 | naghimo | 17 | 2 |
| 195 | namatay | 17 | 2 |
| 196 | natural | 17 | 2 |
| 197 | patron | 17 | 2 |
| 198 | problema | 17 | 2 |
| 199 | amay | 16 | 2 |
| 200 | balod | 16 | 2 |
| 202 | dalan | 16 | 2 |
| 203 | inabot | 16 | 2 |
| 204 | iroy | 16 | 2 |
| 205 | kawayan | 16 | 2 |
| 206 | kundi | 16 | 2 |
| 208 | mahihimo | 16 | 2 |
| 209 | mananap | 16 | 2 |
| 211 | mas | 16 | 2 |
| 217 | baboy | 15 | 2 |
| 218 | bubuhaton | 15 | 2 |
| 219 | butnga | 15 | 2 |

_(+652 more in the JSON.)_

## SEED words not found in the corpus (34)
_Either genuinely rare, a phrase fragment, or a spelling that differs from the corpus._

bagahe, buoton, dominggo, eroplano, gin-iimbita, hulam, ig-upod, igbabad, isnak, kahera, klaro?, kostums, lakso, lasona, limpyu, lutuon, maalsom, makaradlok, mamasyada, mapira?, matidong, pakwan, pedicab, relo, saribo, sibuyas, sinsilyo, sorbetes, sukli, suoy, syaket, tindera, tinidor, turista

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

**Bible for Children — children's register** (first 12):
- Sino an nagtuha sa ato?
- An Biblia, pulong han Ginoo, nagsusumat san tinikangan san katawhan.
- Sadto pa, an Ginoo gin tuha an pinaka-una nga lalaki ug iya gin ngaranan nga Adan.
- Gin tuha san Ginoo si Adan tikang han tapotapo sa tuna.
- Han paghatag kinabuhi han Ginoo kan Adan, nabuhi siya.
- Nakita niya an iya kalugaringo sulod sin maupay nga harden nga gintatawag Eden.
- Antis pa pagtuhaa han Ginoo si Adan, naghimo siya hin kalibutan nga puno sin mag upay nga mga butang.
- Sa kamatooran, gin buhat san Ginoo an ngatanan – ngatanan.
- Tikang pa gud san tinikangan, antis pa buhaton san Ginoo an ngatanan, wara gud bisan nano kundi an Ginoo.
- Wara lamrag ngan kasisidman.
- Wara bawbaw ngan ilarom.
- Wara kahapon ngan buwas.
