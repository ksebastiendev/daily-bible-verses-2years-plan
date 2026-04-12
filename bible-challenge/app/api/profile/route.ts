import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ProfilePayload {
  id: string;
  email: string | null;
  username: string;
  phone: string;
  points: number;
  streak: number;
  isEligibleForLeaderboard: boolean;
  isEligibleForRewards: boolean;
}

interface ProfileRow {
  id?: string;
  username?: string | null;
  phone?: string | null;
  points?: number | null;
  streak?: number | null;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function computeEligibility(username: string, phone: string) {
  return username.length > 0 && phone.length > 0;
}

function toPayload(args: { sessionUserId: string; email: string | null; row: ProfileRow | null }): ProfilePayload {
  const username = normalizeText(args.row?.username ?? "");
  const phone = normalizeText(args.row?.phone ?? "");
  const eligible = computeEligibility(username, phone);

  return {
    id: args.sessionUserId,
    email: args.email,
    username,
    phone,
    points: typeof args.row?.points === "number" ? args.row.points : 0,
    streak: typeof args.row?.streak === "number" ? args.row.streak : 0,
    isEligibleForLeaderboard: eligible,
    isEligibleForRewards: eligible,
  };
}

async function getAuthenticatedSessionUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { supabase, session: null as null };
  }

  return { supabase, session };
}

export async function GET() {
  try {
    const { supabase, session } = await getAuthenticatedSessionUser();

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,phone,points,streak")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(
      {
        data: toPayload({
          sessionUserId: session.user.id,
          email: session.user.email ?? null,
          row: (data as ProfileRow | null) ?? null,
        }),
      },
      { status: 200 },
    );
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, session } = await getAuthenticatedSessionUser();

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : null;

    if (!payload || ((payload.username === undefined) && (payload.phone === undefined))) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    const hasInvalidUsername = payload.username !== undefined && typeof payload.username !== "string";
    const hasInvalidPhone = payload.phone !== undefined && typeof payload.phone !== "string";

    if (hasInvalidUsername || hasInvalidPhone) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    const username = payload.username !== undefined ? normalizeText(payload.username) : undefined;
    const phone = payload.phone !== undefined ? normalizeText(payload.phone) : undefined;

    if ((username ?? "").length > 60 || (phone ?? "").length > 30) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      id: session.user.id,
      updated_at: new Date().toISOString(),
    };

    if (username !== undefined) updateData.username = username;
    if (phone !== undefined) updateData.phone = phone;

    const { error: upsertError } = await supabase.from("profiles").upsert(updateData, { onConflict: "id" });

    if (upsertError) {
      return Response.json({ error: upsertError }, { status: 500 });
    }

    const { data: updated, error: readError } = await supabase
      .from("profiles")
      .select("id,username,phone,points,streak")
      .eq("id", session.user.id)
      .maybeSingle();

    if (readError) {
      return Response.json({ error: readError }, { status: 500 });
    }

    return Response.json(
      {
        data: toPayload({
          sessionUserId: session.user.id,
          email: session.user.email ?? null,
          row: (updated as ProfileRow | null) ?? null,
        }),
      },
      { status: 200 },
    );
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
