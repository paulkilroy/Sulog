-- The DURABLE record of native/human dictionary confirmations — the judgment-table class
-- (like ella_answers and progress): the content rebuild NEVER touches it; reload replays it
-- into the freshly built dictionary (tools/replay-confirmations.mjs). One row per word,
-- latest judgment wins. Run in the SQL editor AFTER rls.sql (needs is_admin()). Idempotent.
create table if not exists native_confirmations (
  waray         text primary key,
  meaning       text not null,
  pronunciation text,
  by_whom       text not null default 'ella',
  at            timestamptz not null default now()
);
alter table native_confirmations enable row level security;
drop policy if exists native_conf_read   on native_confirmations;
drop policy if exists native_conf_insert on native_confirmations;
drop policy if exists native_conf_update on native_confirmations;
create policy native_conf_read   on native_confirmations for select using (true);
create policy native_conf_insert on native_confirmations for insert with check (is_admin());
create policy native_conf_update on native_confirmations for update using (is_admin()) with check (is_admin());

-- provenance on the dictionary itself: WHO confirmed each row ('tramp' | 'book' | 'ella')
alter table dictionary add column if not exists confirmed_by text;
