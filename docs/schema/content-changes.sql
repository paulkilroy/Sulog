-- Traceability — the chain of custody for every content change that enters the dictionary.
-- We already store the PEOPLE and the CURRENT state elsewhere, so this table is deliberately LEAN
-- and link-only — it adds the two things nothing else has: an append-only HISTORY, and the
-- before/after delta linked to the flag that caused it. The chain reads by joining:
--   feedback(id)            → who SUGGESTED it (author_id / author_role / comment)
--   content_changes.reviewed_by / approved_by → who vetted & who approved it in
--   native_confirmations    → the current confirmed value (replayed on every rebuild)
--
-- Judgment-class: the content rebuild NEVER touches it. Immutable: INSERT only (no update/delete
-- policy), so history can't be rewritten. Run AFTER classroom-rls.sql (needs is_admin/has_role).
create table if not exists content_changes (
  id           bigserial primary key,
  target_type  text not null default 'dictionary',   -- 'dictionary' (a headword's definition)
  target_ref   text not null,                         -- the Waray headword
  before_val   jsonb,                                 -- prior { meaning, pronunciation, confirmed_by }
  after_val    jsonb,                                 -- new  { meaning, pronunciation, confirmed_by }
  feedback_id  bigint,          -- the flag this change resolved → suggested_by/comment live in feedback
  reviewed_by  uuid,            -- who vetted the correction
  approved_by  uuid not null,   -- the admin who applied it into the dictionary
  approved_at  timestamptz not null default now()
);
create index if not exists content_changes_ref on content_changes (target_ref, id desc);

alter table content_changes enable row level security;
drop policy if exists cc_read   on content_changes;
drop policy if exists cc_insert on content_changes;
create policy cc_read   on content_changes for select using (is_admin() or has_role('reviewer') or has_role('instructor'));
create policy cc_insert on content_changes for insert to authenticated with check (approved_by = auth.uid());
-- no update/delete policies → append-only and tamper-evident
