-- Dialect forms: the CATALOG of grade-relevant regional/colloquial forms — GLOBAL CONFIG,
-- judgment-table class (content rebuilds never touch it; bootstrap seeds it only when empty).
-- The app renders the Language-door checkboxes from this table, so adding/verifying/dropping
-- a form is a row edit that reaches every device on its next refresh — no deploy.
-- `verified` = native-speaker (Ella) confirmed the form is real Daram usage; `active` = shown
-- in settings (drop a bogus form by flipping active, keeping the history).
-- Run in the SQL editor AFTER rls.sql (needs is_admin()). Idempotent.
create table if not exists dialect_forms (
  k        text primary key,               -- the regional form ('di')
  rel      text not null default 'for',    -- 'short for' | 'for' | 'fused' | 'clipped' (prose rendering)
  canon    text not null,                  -- the standard form it maps to ('diri')
  gloss    text not null,                  -- plain-English meaning ('not')
  presets  text[] not null default '{}',   -- region presets that bulk-check it ('daram')
  verified boolean not null default false, -- native-confirmed
  active   boolean not null default true,  -- offered in settings
  ord      int not null default 100
);
alter table dialect_forms enable row level security;
drop policy if exists dialect_forms_read   on dialect_forms;
drop policy if exists dialect_forms_insert on dialect_forms;
drop policy if exists dialect_forms_update on dialect_forms;
create policy dialect_forms_read   on dialect_forms for select using (true);
create policy dialect_forms_insert on dialect_forms for insert with check (is_admin());
create policy dialect_forms_update on dialect_forms for update using (is_admin()) with check (is_admin());

-- seed (bootstrap only — live edits win; on conflict do nothing)
insert into dialect_forms (k, rel, canon, gloss, presets, ord) values
  ('di',    'short for', 'diri',    'not',                    '{daram}', 10),
  ('wara',  'for',       'waray',   'none / did not',         '{daram}', 20),
  ('sin',   'for',       'hin',     'a/some, object marker',  '{daram}', 30),
  ('san',   'for',       'han',     'of/the, object marker',  '{daram}', 40),
  ('sa',    'for',       'ha',      'to/at/in',               '{daram}', 50),
  ('gihap', 'short for', 'gihapon', 'also/still',             '{daram}', 60),
  ('mayda', 'fused',     'may ada', 'there is / has',         '{daram}', 70),
  ('siya',  'for',       'hiya',    'he/she',                 '{daram}', 80),
  ('sino',  'for',       'hin-o',   'who',                    '{daram}', 90),
  ('digto', 'for',       'didto',   'there, far',             '{daram}', 100),
  ('kon',   'for',       'kun',     'if/when',                '{daram}', 110),
  ('ak',    'clipped',   'akon',    'my',                     '{daram}', 120)
  on conflict (k) do nothing;

-- Per-user app settings that should follow the user across devices (dialect selection).
-- Owner-only via RLS; `updated` (ms epoch) lets the client keep newest-wins on merge.
create table if not exists user_settings (
  user_id       uuid primary key,
  dialect_forms text[] not null default '{}',   -- the checked forms
  updated       bigint not null default 0
);
alter table user_settings enable row level security;
drop policy if exists user_settings_own on user_settings;
create policy user_settings_own on user_settings for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
