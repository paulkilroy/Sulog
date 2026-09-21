# Scan issues — right-edge clipping

Google's scan has many right-hand (odd) pages shifted right; ink touches the right
edge on the pages below. Measured at 50 DPI: `edge-ink` = dark pixels in the rightmost
1% band (one clipped character ≈ 10 px; 40–120 ≈ several line-end characters lost).
The six worst offenders are just the library covers — real content damage is
**typically the last 1–2 characters of some lines**, worst on tables (last column
header/values, e.g. v1 seq 59 pronoun chart) and the v3–4 Glossary.

During OCR cleanup: reconstruct truncated ENGLISH from context freely; truncated
WARAY only with dictionary confirmation — else flag for native review (or patch from
John Wolff's / Daniel Kaufman's physical copies: exact page list below).

| vol | PDF seq | book page/header | edge-ink |
|---|---|---|---|
| v1 | 45 | 1-6 Lesson1 | 23 |
| v1 | 49 | 1-10 Lesson1 | 28 |
| v1 | 51 | 1 12 Lesson1 | 20 |
| v1 | 53 | 1-14 Lesson1 | 46 |
| v1 | 55 | 116 Lesson1 | 13 |
| v1 | 57 | 118 Lesson1 | 31 |
| v1 | 59 | 1-20 Lesson1 | 17 |
| v1 | 61 | 122 Lesson1 | 5 |
| v1 | 63 | 124 Lesson 1 | 3 |
| v1 | 71 | 2-2 Lesson | 26 |
| v1 | 73 | 2-4 Lesson2 | 7 |
| v1 | 75 | 2-6 Lesson2 | 7 |
| v1 | 77 | 2-8 Lesson | 46 |
| v1 | 85 | 2-16 Lesson2 | 0 |
| v1 | 91 | 2-22 Lesson2 | 5 |
| v1 | 93 | 2-22 Lesson 2 | 22 |
| v1 | 95 | 2-24 Lesson2 | 7 |
| v1 | 101 | 2-22 Lesson2 | 3 |
| v1 | 109 | 2-36 Lesson2 | 8 |
| v1 | 171 | 3 Lesson3 | 12 |
| v1 | 173 | 3=60 Lesson3 | 17 |
| v1 | 227 | 5-8 Lesson5 | 11 |
| v1 | 253 | 5-34 Lesson5 | 22 |
| v1 | 267 | 5-48 Lesson5 | 25 |
| v1 | 269 | 5-50 Lesson5 | 23 |
| v1 | 271 | 5-52 Lesson5 | 26 |
| v1 | 281 | — | 4 |
| v1 | 377 | 7-20 Lesson7 | 32 |
| v1 | 500 | 9-52 Lesson9 | 65 |
| v2 | 3 | PROPERTYOF | 27 |
| v2 | 4 | — | 20 |
| v2 | 47 | 10-30 Lesson10 | 18 |
| v2 | 193 | 13-18 Lesson13 | 6 |
| v2 | 211 | Ginbulíganmu | 32 |
| v2 | 213 | 13-38 Lesson13 | 7 |
| v2 | 227 | 13-52 Lesson13 | 0 |
| v2 | 229 | 13-54 Lesson 13 | 11 |
| v2 | 235 | — | 12 |
| v2 | 243 | 14-6 Lesson14 | 8 |
| v2 | 283 | — | 16 |
| v2 | 285 | — | 61 |
| v2 | 287 | — | 27 |
| v2 | 377 | 16-36 Lesson16 | 13 |
| v2 | 397 | — | 15 |
| v2 | 411 | 17-10 Lesson17 | 14 |
| v2 | 415 | 17-14 Lesson17 | 6 |
| v2 | 427 | 17-26 Lesson17 | 5 |
| v2 | 437 | 17-36 Lesson17 | 6 |
| v2 | 487 | 18-34 Lesson18 | 15 |
| v2 | 491 | 18-38 Lesson18 | 24 |
| v2 | 542 | UNIVERSITY OFMICHIGAN | 13 |
| v3-4 | 27 | 19-4 Lesson19 | 16 |
| v3-4 | 49 | 19-26 Lesson19 | 20 |
| v3-4 | 71 | — | 15 |
| v3-4 | 81 | 20-10 Lesson20 | 17 |
| v3-4 | 123 | 20-52 Lesson20 | 12 |
| v3-4 | 127 | 20-56 Lesson20 | 8 |
| v3-4 | 167 | 21-32- Lesson21 | 13 |
| v3-4 | 169 | 21-32- Lesson 21 | 13 |
| v3-4 | 173 | 21-36 Lesson21 | 14 |
| v3-4 | 203 | 22-4 Lesson22 | 4 |
| v3-4 | 207 | Lesson22 | 0 |
| v3-4 | 211 | 22-12 Lesson22 | 3 |
| v3-4 | 361 | — | 15 |
| v3-4 | 371 | 24-6 Lesson24 | 9 |
| v3-4 | 373 | 24-6 Lesson24 | 16 |
| v3-4 | 397 | 24-28 Lesson24 | 36 |
| v3-4 | 399 | 24-30 Lesson24 | 3 |
| v3-4 | 401 | 24-32 Lesson24 | 6 |
| v3-4 | 409 | 24-36 Lesson24 | 15 |
| v3-4 | 433 | 25-10 Lesson25 | 14 |
| v3-4 | 459 | 25-36 Lesson25 | 63 |
| v3-4 | 461 | 25-38 Lesson25 | 19 |
| v3-4 | 465 | 25-42 Lesson25 | 23 |
| v3-4 | 479 | 25-56 Lesson25 | 37 |
| v3-4 | 487 | — | 30 |
| v3-4 | 489 | 26-2 Lesson26 | 15 |
| v3-4 | 505 | 26-18 Lesson26 | 72 |
| v3-4 | 511 | 25-24 Lesson26 | 16 |
| v3-4 | 551 | 26-64 Lesson26 | 0 |
| v3-4 | 561 | — | 24 |
| v3-4 | 621 | 27-56 Lesson27 | 0 |
| v3-4 | 643 | 28-12 Lesson28 | 20 |
| v3-4 | 675 | 28-44 Lesson28 | 52 |
| v3-4 | 677 | 28-46 Lesson28 | 15 |
| v3-4 | 687 | — | 34 |
| v3-4 | 719 | 29-30 Lesson29 | 63 |
| v3-4 | 735 | 29-44 Lesson29 | 5 |
| v3-4 | 743 | 39-52 Lesson29 | 65 |
| v3-4 | 747 | — | 40 |
| v3-4 | 751 | — | 9 |
| v3-4 | 753 | 30-2 Lesson30 | 97 |
| v3-4 | 755 | 30-4 Lesson30 | 113 |
| v3-4 | 761 | 3a. Nagyakan hiyahinmahinay. | 49 |
| v3-4 | 771 | — | 80 |
| v3-4 | 775 | G-2 IntroductiontoGlossary | 0 |
| v3-4 | 785 | G-8 Glossary | 117 |
| v3-4 | 789 | G-12 Glossary | 0 |
| v3-4 | 795 | G-18 Glossary | 25 |
| v3-4 | 801 | G-22 Glossary | 65 |
| v3-4 | 803 | G-22 Glossary | 75 |
| v3-4 | 805 | G-22 Glossary | 102 |
| v3-4 | 817 | G-34 Glossary | 33 |
| v3-4 | 823 | G-40 Glossary | 5 |
| v3-4 | 839 | G-56 Glossary | 29 |
| v3-4 | 875 | — | 6 |
