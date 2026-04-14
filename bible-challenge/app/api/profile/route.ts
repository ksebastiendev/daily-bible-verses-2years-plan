import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isVerifiedChallenger } from "@/lib/challenger/eligibility";

interface ProfilePayload {
  id: string;
  email: string | null;
  username: string;
  phone: string;
  location: string | null;
  emailVerified: boolean;
  points: number;
  streak: number;
  isEligibleForLeaderboard: boolean;
  isEligibleForRewards: boolean;
}

interface ProfileRow {
  id?: string;
  username?: string | null;
  phone?: string | null;
  location?: string | null;
  email_verified?: boolean | null;
  points?: number | null;
  streak?: number | null;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toPayload(args: { sessionUserId: string; email: string | null; row: ProfileRow | null }): ProfilePayload {
  const username = normalizeText(args.row?.username ?? "");
  const phone = normalizeText(args.row?.phone ?? "");
  const eligible = isVerifiedChallenger({
    email_verified: args.row?.email_verified,
    phone,
    location: args.row?.location ?? "",
  });
  const location = typeof args.row?.location === "string" && args.row.location.trim()
    ? args.row.location.trim()
    : null;
  const emailVerified = args.row?.email_verified === true;

  return {
    id: args.sessionUserId,
    email: args.email,
    username,
    phone,
    location,
    emailVerified,
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
      .select("id,username,phone,location,email_verified,points,streak")
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

    if (!payload || ((payload.username === undefined) && (payload.phone === undefined) && (payload.location === undefined) && (payload.emailVerified === undefined))) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    const hasInvalidUsername = payload.username !== undefined && typeof payload.username !== "string";
    const hasInvalidPhone = payload.phone !== undefined && typeof payload.phone !== "string";
    const hasInvalidLocation = payload.location !== undefined && typeof payload.location !== "string";
    const hasInvalidEmailVerified = payload.emailVerified !== undefined && typeof payload.emailVerified !== "boolean";

    if (hasInvalidUsername || hasInvalidPhone || hasInvalidLocation || hasInvalidEmailVerified) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    const username = payload.username !== undefined ? normalizeText(payload.username) : undefined;
    const phone = payload.phone !== undefined ? normalizeText(payload.phone) : undefined;
    const location = payload.location !== undefined ? normalizeText(payload.location) : undefined;
    const emailVerified = payload.emailVerified !== undefined ? payload.emailVerified === true : undefined;

    if ((username ?? "").length > 60 || (phone ?? "").length > 30 || (location ?? "").length > 100) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      id: session.user.id,
      updated_at: new Date().toISOString(),
    };

    if (username !== undefined) updateData.username = username;
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;
    if (emailVerified !== undefined) {
      updateData.email_verified = emailVerified;
      if (emailVerified) {
        updateData.verification_completed_at = new Date().toISOString();
      }
    }

    const { error: upsertError } = await supabase.from("profiles").upsert(updateData, { onConflict: "id" });

    if (upsertError) {
      return Response.json({ error: upsertError }, { status: 500 });
    }

    const { data: updated, error: readError } = await supabase
      .from("profiles")
      .select("id,username,phone,location,email_verified,points,streak")
      .eq("id", session.user.id)
      .maybeSingle();

    if (readError) {
      return Response.json({ error: readError }, { status: 500 });
    }

    const updatedRow = (updated as ProfileRow | null) ?? null;
    const isEligible = isVerifiedChallenger({
      email_verified: updatedRow?.email_verified,
      phone: updatedRow?.phone ?? "",
      location: updatedRow?.location ?? "",
    });

    // Best-effort: keep denormalized eligibility columns in sync.
    await supabase
      .from("profiles")
      .update({ leaderboard_eligible: isEligible, reward_eligible: isEligible })
      .eq("id", session.user.id);

    return Response.json(
      {
        data: toPayload({
          sessionUserId: session.user.id,
          email: session.user.email ?? null,
          row: updatedRow,
        }),
      },
      { status: 200 },
    );
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
