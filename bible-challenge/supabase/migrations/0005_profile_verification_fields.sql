-- 0005_profile_verification_fields.sql
-- Purpose: Add verification and eligibility columns to profiles.
--
-- Design:
--   - email_verified        : mirrors Supabase auth email confirmation state (manually set by app logic later).
--   - location              : nullable text, required for verified challenger eligibility.
--   - leaderboard_eligible  : explicit flag, set to true only after full verification.
--   - reward_eligible       : explicit flag, separate from leaderboard (may diverge in future).
--   - verification_completed_at : timestamp when user completed the full verification flow.
--
-- All columns are additive and safe:
--   - NULL or false defaults mean no existing row is affected.
--   - No existing constraint is altered.
--   - Eligibility computation in app/api/profile/route.ts continues to use
--     username+phone for now; these columns become the authoritative source
--     once the verification flow is implemented.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location                  text,
  ADD COLUMN IF NOT EXISTS email_verified            boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS leaderboard_eligible      boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reward_eligible           boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_completed_at timestamptz;

COMMIT;
