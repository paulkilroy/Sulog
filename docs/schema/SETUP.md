# Standing up Sulog on Supabase

The relational model + the full CH2 content are ready to load. This is the one-time
provisioning (~5–10 min, all in the Supabase dashboard). Files live in `docs/schema/`.

## 1. Create the project
1. <https://supabase.com> → sign in **with GitHub** → **New project**.
2. Name it `sulog`, pick a region near you (or near Daram), set + save a DB password.
3. Wait ~1 min to provision.

## 2. Load the schema, content, and access rules
Open **SQL Editor → New query**, and run these **in order** (paste each file, Run, then the next):

1. **`schema.sql`** — the tables (dictionary, expressions, stories, courses→phases→units→lessons→lesson_blocks, block_items, progress, review_questions).
2. **`seed.sql`** — the real content: 650 dictionary entries (506 words + 144 phrases; 132 flagged `confirmed=false` for Ella), 149 expressions, 11 stories, all 11 CH2 units (127 blocks / 693 items). *(Regenerate anytime with `node tools/gen-seed.mjs`.)*
3. **`rls.sql`** — Row-Level Security: content is world-readable (even signed-out); only **paulkilroy@gmail.com** can edit; each learner's `progress` is private to them.

All three have been validated loading into Postgres (via `docs/schema/validate.mjs`), so they run without edits.

## 3. Turn on Google sign-in
**Authentication → Providers → Google → Enable.** Supabase shows a **redirect URL** — copy it into a Google Cloud OAuth client (APIs & Services → Credentials → OAuth client ID → Web), then paste that client's **ID + secret** back into Supabase. Admin rights key off the Google account's email (`paulkilroy@gmail.com`), already baked into `is_admin()`.

## 4. Grab your keys
**Settings → API**, copy:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 5. Wire the keys in two places
- **Local:** `.env.local` (see `.env.example`) — paste both.
- **Vercel** (when we move the app there): Project → Settings → Environment Variables → add both for Production → redeploy.

---

**What this gives you:** a live database holding the whole Waray dictionary + CH2 course, world-readable, with you as the only editor and each user's progress private. **The 132 `confirmed=false` rows are Ella's review queue** — she signs in with Google (as a non-admin she can read; grant her edit by adding her email to `is_admin()` if/when you want her editing directly).

**Not done here (next code step):** pointing the *app* at Supabase — a small `supabase-js` client that reads courses/blocks from the DB instead of the bundled JS files, and writes `progress`. That's an app change, separate from this provisioning.
