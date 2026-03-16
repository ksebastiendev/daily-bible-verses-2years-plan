-- 0002_rpc_get_challenge_today.sql
-- Adds get_challenge_today() if missing.
-- Keeps repository as source of SQL truth without overwriting an existing production function.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_challenge_today'
  ) THEN
    EXECUTE $sql$
      CREATE FUNCTION public.get_challenge_today()
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $fn$
      DECLARE
        v_user_id uuid := auth.uid();
        v_plan_id uuid;
        v_start_day integer;
        v_target_day integer;
        v_row jsonb;
      BEGIN
        IF v_user_id IS NULL THEN
          RETURN NULL;
        END IF;

        SELECT rp.id
          INTO v_plan_id
        FROM public.reading_plans rp
        WHERE rp.is_active = true
        ORDER BY rp.created_at DESC
        LIMIT 1;

        IF v_plan_id IS NULL THEN
          RETURN NULL;
        END IF;

        SELECT uc.start_day_index
          INTO v_start_day
        FROM public.user_challenges uc
        WHERE uc.user_id = v_user_id
          AND uc.plan_id = v_plan_id
          AND uc.active = true
        LIMIT 1;

        IF v_start_day IS NULL THEN
          RETURN NULL;
        END IF;

        SELECT COALESCE(MAX(pd.day_index), v_start_day - 1) + 1
          INTO v_target_day
        FROM public.checkins c
        JOIN public.plan_days pd ON pd.id = c.plan_day_id
        WHERE c.user_id = v_user_id
          AND pd.plan_id = v_plan_id;

        SELECT jsonb_build_object(
          'plan_id', pd.plan_id,
          'plan_day_id', pd.id,
          'day_index', pd.day_index,
          'reference', pd.reference,
          'last_completed_day', GREATEST(v_target_day - 1, 0),
          'start_day_index', v_start_day,
          'status', CASE WHEN pd.day_index >= v_start_day THEN 'active' ELSE 'locked' END
        )
          INTO v_row
        FROM public.plan_days pd
        WHERE pd.plan_id = v_plan_id
          AND pd.day_index = v_target_day
        LIMIT 1;

        RETURN v_row;
      END;
      $fn$;
    $sql$;
  END IF;
END;
$$;
