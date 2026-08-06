-- Server-driven ONE-TIME local-data reset (support tool).
-- Set profiles.reset_local_before = now() for a user whose DEVICE state is untrusted
-- (e.g. the 2026-08-06 cross-account contamination: the cloud was purged but the copied
-- rows still lived in the device's localStorage and would re-push). On the user's next
-- signed-in sync, the app compares this timestamp to a per-device marker; if newer, it
-- WIPES local progress and takes the cloud as truth before any push can run.
alter table profiles add column if not exists reset_local_before timestamptz;
