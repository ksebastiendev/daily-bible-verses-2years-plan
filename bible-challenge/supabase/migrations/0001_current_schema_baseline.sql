-- 0001_current_schema_baseline.sql
-- Purpose: repository-owned baseline aligned with documented current DB state.
-- Source docs:
-- - docs/database-current-state.md
-- - docs/cahierdecharge.md
-- - docs/copilot-project-context.md

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text,
  phone text,
  device_id text UNIQUE,
  points integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reading_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_days integer NOT NULL DEFAULT 730,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS reading_plans_one_active_idx
ON public.reading_plans ((is_active))
WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.plan_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  day_index integer NOT NULL,
  reference text NOT NULL,
  morning_reference text,
  evening_reference text,
  main_verse text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, day_index)
);

CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  plan_id uuid NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  start_day_index integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

CREATE INDEX IF NOT EXISTS user_challenges_active_idx
ON public.user_challenges(user_id, plan_id)
WHERE active = true;

CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  plan_day_id uuid NOT NULL REFERENCES public.plan_days(id) ON DELETE CASCADE,
  reflection text,
  completed_at timestamptz,
  points_earned integer NOT NULL DEFAULT 0,
  verses_done integer NOT NULL DEFAULT 0,
  total_verses integer,
  current_step integer NOT NULL DEFAULT 0,
  total_steps integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_day_id)
);

CREATE TABLE IF NOT EXISTS public.daily_verse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  reference text NOT NULL,
  text text NOT NULL,
  message text,
  is_manual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

COMMIT;
