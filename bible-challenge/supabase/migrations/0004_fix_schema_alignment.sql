-- 0004_fix_schema_alignment.sql
-- Align baseline schema with seed SQL expectations.

BEGIN;

-- reading_plans columns used by seed
ALTER TABLE public.reading_plans
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS month integer,
  ADD COLUMN IF NOT EXISTS timezone text;

-- Seed inserts omit title; keep compatibility while preserving non-null constraint.
ALTER TABLE public.reading_plans
  ALTER COLUMN title SET DEFAULT 'Bible Challenge - 2 ans';

-- Seed uses ON CONFLICT (year, month).
CREATE UNIQUE INDEX IF NOT EXISTS reading_plans_year_month_idx
ON public.reading_plans (year, month)
WHERE year IS NOT NULL AND month IS NOT NULL;

-- plan_days columns used by seed and by passage seeding script
ALTER TABLE public.plan_days
  ADD COLUMN IF NOT EXISTS passage_text text,
  ADD COLUMN IF NOT EXISTS morning_text text,
  ADD COLUMN IF NOT EXISTS evening_text text;

COMMIT;
