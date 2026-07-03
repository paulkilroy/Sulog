# TODO (Ella) — standardize the 7 Bible-for-Children stories to standard Waray

**What:** These 7 short Bible stories were machine-translated and come out in a **dialectal /
colloquial Waray** (a Samar–Leyte-border register that borrows Cebuano-ish forms). They're
currently **pulled out of the app's Read tab** because we don't want learners reading them as
standard Waray. If you correct them to standard Waray, we can put them back in.

**Source file:** `docs/sources/bfc-waray-stories.txt` (each story starts with a
`===STORY: …===` line). Just rewrite the Waray into standard Waray; keep the meaning.

## The stories (≈60–80 short lines each)
1. When God Made Everything
2. The Start of Man's Sadness
3. Noah and the Great Flood
4. The Birth of Jesus
5. The Miracles of Jesus
6. The First Easter
7. Heaven — God's Beautiful Home

## The recurring dialectal forms we already spotted (please confirm/fix)
These are the patterns that show up most — Ella, correct to whatever's right; these are our guesses:

| in the text | standard Waray? | meaning |
|---|---|---|
| `san` | `han` | of / the (genitive) |
| `sa` | `ha` | in / at / to |
| `wara` | `waray` | none / nothing |
| `sira` | `hira` | they / them |
| `sino` | `hin-o` | who |
| `digto` | `didto` | there |
| `kon` | `kun` | if / when |
| `gihap` | `gihapon` | also / still |
| `storya` | `istorya` | story |
| `aron` | `basi` / `agud`? | so that |
| `kumila` | `kumilala` (root `kilala`) | to get to know |
| `sayo` | `usa`? / "early"? | one? / early? |
| `sini` | ? | ? |
| `nala` | `na la` | already / just (two words) |

## Questions for Ella
- Are `aron`, `sayo`, `sini` legitimate Waray (just dialect), or should they be replaced?
- Anything else that reads "off" / not how you'd say it?

## Workflow
1. Ella edits the Waray (in this file or a copy — whatever's easiest).
2. Paul re-saves it to `bfc-waray-stories.txt`.
3. We un-comment the BFC line in `tools/build-stories.mjs`, rebuild, and the corrected
   stories rejoin the Read tab.

_(The Bloom Library stories — the 20 already in the app — are clean DepEd-authored Waray and
need no correction. This is only the Bible-for-Children set.)_
