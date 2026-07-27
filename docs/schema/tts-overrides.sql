-- Per-word TTS pronunciation overrides: the spoken form fed to the speech engine INSTEAD of the raw
-- Waray, for the handful of words a close-cousin or English voice mangles. Example: "mga" — a Malay
-- (ms-MY) or English voice doesn't know the Tagalog mga=mangá convention and spells "m-g-a", so we
-- feed "manga" instead. MOST words need NO override — raw Waray on a Filipino/Malay voice is best;
-- this table is only the exceptions.
--
-- Global config, admin-editable live (same pattern as dialect_forms — no deploy to change), and
-- committed to the build so a from-empty rebuild reproduces the seed. Read by everyone; admins write.
-- Run AFTER rls.sql (needs is_admin()).
create table if not exists tts_overrides (
  waray   text primary key,
  spoken  text not null,          -- what to actually hand the speech engine
  note    text,                   -- why (for the review tool)
  at      timestamptz not null default now()
);
alter table tts_overrides enable row level security;
drop policy if exists tts_read  on tts_overrides;
drop policy if exists tts_admin on tts_overrides;
create policy tts_read  on tts_overrides for select using (true);
create policy tts_admin on tts_overrides for all using (is_admin()) with check (is_admin());

-- known offenders (extend via the pronunciation review tool)
insert into tts_overrides (waray, spoken, note) values
  ('mga', 'manga', 'Tagalog plural marker mangá — close-cousin/English voices spell m-g-a'),
  ('hi',  'hee',   'personal-name marker — some voices read the English "hi" (high)')
on conflict (waray) do nothing;
