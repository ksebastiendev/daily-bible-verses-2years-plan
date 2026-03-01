import { createSupabaseServerClient } from "@/lib/supabase/server";

interface CheckinBody {
  planDayId: string;
  reflection?: string;
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
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { planDayId, reflection } = body as Partial<CheckinBody>;

    if (typeof planDayId !== "string" || !planDayId.trim()) {
      return Response.json({ error: "Invalid planDayId" }, { status: 400 });
    }

    if (reflection !== undefined && typeof reflection !== "string") {
      return Response.json({ error: "Invalid reflection" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("complete_day", {
      p_plan_day_id: planDayId.trim(),
      p_reflection: reflection ?? null,
    });

    if (error) {
      if (typeof error.message === "string" && error.message.includes("Invalid day")) {
        return Response.json({ error }, { status: 400 });
      }

      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ data }, { status: 200 });
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
