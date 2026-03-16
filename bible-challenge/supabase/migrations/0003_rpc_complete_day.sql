-- 0003_rpc_complete_day.sql
-- Adds complete_day(...) if missing.
-- Keeps repository as source of SQL truth without overwriting an existing production function.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'complete_day'
  ) THEN
    EXECUTE $sql$
      CREATE FUNCTION public.complete_day(
        p_plan_day_id uuid,
        p_reflection text DEFAULT NULL
      )
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $fn$
      DECLARE
        v_user_id uuid := auth.uid();
        v_day_index integer;
        v_total_points integer;
        v_points_earned integer := 5;
      BEGIN
        IF v_user_id IS NULL THEN
          RAISE EXCEPTION 'Unauthorized';
        END IF;

        SELECT pd.day_index
          INTO v_day_index
        FROM public.plan_days pd
        WHERE pd.id = p_plan_day_id;

        IF v_day_index IS NULL THEN
          RAISE EXCEPTION 'Invalid day';
        END IF;

        INSERT INTO public.checkins (
          user_id,
          plan_day_id,
          reflection,
          completed_at,
          points_earned
        )
        VALUES (
          v_user_id,
          p_plan_day_id,
          p_reflection,
          now(),
          v_points_earned
        )
        ON CONFLICT (user_id, plan_day_id)
        DO UPDATE SET
          reflection = COALESCE(EXCLUDED.reflection, public.checkins.reflection),
          completed_at = COALESCE(public.checkins.completed_at, EXCLUDED.completed_at),
          points_earned = public.checkins.points_earned;

        SELECT COALESCE(SUM(c.points_earned), 0)
          INTO v_total_points
        FROM public.checkins c
        WHERE c.user_id = v_user_id;

        RETURN jsonb_build_object(
          'day_index', v_day_index,
          'points_earned', v_points_earned,
          'total_points', v_total_points
        );
      END;
      $fn$;
    $sql$;
  END IF;
END;
$$;
