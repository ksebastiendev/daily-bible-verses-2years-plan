import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isVerifiedChallenger } from "@/lib/challenger/eligibility";

interface Winner {
  rank: number;
  user_id: string;
  username: string;
  phone: string;
  score: number;
  streak: number;
  reward_eligible: boolean;
}

interface WinnersPayload {
  month: string;
  generated_at: string;
  winners: Winner[];
}

function toSafeScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? "3", 10);
  if (Number.isNaN(parsed)) return 3;
  return Math.max(1, Math.min(50, parsed));
}

function resolveMonth(monthParam: string | null) {
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const start = new Date(`${monthParam}-01T00:00:00.000Z`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      return {
        month: monthParam,
        start,
        end,
      };
    }
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const monthIndex = now.getUTCMonth();
  const month = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));

  return { month, start, end };
}

function toCsv(payload: WinnersPayload) {
  const lines = [
    "month,rank,user_id,username,phone,score,streak,reward_eligible",
    ...payload.winners.map(
      (winner) =>
        `${payload.month},${winner.rank},${winner.user_id},\"${winner.username.replaceAll('"', '""')}\",\"${winner.phone.replaceAll('"', '""')}\",${winner.score},${winner.streak},${winner.reward_eligible}`,
    ),
  ];

  return lines.join("\n");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"));
    const format = searchParams.get("format") === "csv" ? "csv" : "json";
    const monthInfo = resolveMonth(searchParams.get("month"));

    const supabase = await createSupabaseServerClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,username,phone,email_verified,location,streak");

    if (profilesError) {
      return Response.json({ error: profilesError }, { status: 500 });
    }

    const profileById = new Map<string, Record<string, unknown>>();
    for (const row of profiles ?? []) {
      if (!row || typeof row !== "object") continue;
      const profile = row as Record<string, unknown>;
      const id = typeof profile.id === "string" ? profile.id : null;
      if (!id || !isVerifiedChallenger(profile)) continue;
      profileById.set(id, profile);
    }

    const { data: checkins, error: checkinsError } = await supabase
      .from("checkins")
      .select("user_id,points_earned,completed_at")
      .gte("completed_at", monthInfo.start.toISOString())
      .lt("completed_at", monthInfo.end.toISOString());

    if (checkinsError) {
      return Response.json({ error: checkinsError }, { status: 500 });
    }

    const monthlyScores = new Map<string, number>();

    for (const row of checkins ?? []) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const userId = typeof item.user_id === "string" ? item.user_id : null;
      if (!userId || !profileById.has(userId)) continue;

      const points = toSafeScore(item.points_earned);
      monthlyScores.set(userId, (monthlyScores.get(userId) ?? 0) + points);
    }

    const winners = Array.from(monthlyScores.entries())
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId, score], index) => {
        const profile = profileById.get(userId)!;
        return {
          rank: index + 1,
          user_id: userId,
          username: String(profile.username),
          phone: String(profile.phone),
          score,
          streak: toSafeScore(profile.streak),
          reward_eligible: true,
        };
      });

    const payload: WinnersPayload = {
      month: monthInfo.month,
      generated_at: new Date().toISOString(),
      winners,
    };

    if (format === "csv") {
      return new Response(toCsv(payload), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `inline; filename=reward-winners-${monthInfo.month}.csv`,
        },
      });
    }

    return Response.json({ data: payload }, { status: 200 });
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
