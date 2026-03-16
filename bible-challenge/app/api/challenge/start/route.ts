import { createSupabaseServerClient } from "@/lib/supabase/server";

interface StartChallengeBody {
  planId?: string;
  startDayIndex: number;
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    const { planId, startDayIndex } = body as Partial<StartChallengeBody>;

    if (!Number.isInteger(startDayIndex) || startDayIndex < 1 || startDayIndex > 730) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    if (planId !== undefined && (typeof planId !== "string" || !planId.trim())) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    let resolvedPlanId: string | number;

    if (planId) {
      resolvedPlanId = planId.trim();
    } else {
      const { data: activePlan, error: activePlanError } = await supabase
        .from("reading_plans")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (activePlanError) {
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
      }

      if (!activePlan?.id) {
        return Response.json({ error: "Active plan not found" }, { status: 404 });
      }

      resolvedPlanId = activePlan.id;
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("user_challenges")
      .update({
        start_day_index: startDayIndex,
        active: true,
      })
      .eq("user_id", session.user.id)
      .eq("plan_id", resolvedPlanId)
      .select("id")
      .limit(1);

    if (updateError) {
      return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }

    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertError } = await supabase.from("user_challenges").insert({
        user_id: session.user.id,
        plan_id: resolvedPlanId,
        start_day_index: startDayIndex,
        active: true,
        started_at: new Date().toISOString(),
      });

      if (insertError) {
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
      }
    }

    return Response.json(
      {
        success: true,
        planId: String(resolvedPlanId),
        startDayIndex,
      },
      { status: 200 },
    );
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
