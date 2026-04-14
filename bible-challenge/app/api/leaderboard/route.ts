import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isVerifiedChallenger } from "@/lib/challenger/eligibility";

interface Leader {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  streak: number;
}

interface LeaderboardResponse {
  period: "monthly" | "global";
  generated_at: string;
  leaders: Leader[];
}

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? "10", 10);
  if (Number.isNaN(parsed)) return 10;
  return Math.max(1, Math.min(100, parsed));
}

function monthRange(month: string | null) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      return { start, end };
    }
  }

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

function toSafeScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") === "global" ? "global" : "monthly";
    const limit = parseLimit(searchParams.get("limit"));
    const { start, end } = monthRange(searchParams.get("month"));

    const supabase = await createSupabaseServerClient();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,username,phone,email_verified,location,points,streak");

    if (profilesError) {
      return Response.json({ error: profilesError }, { status: 500 });
    }

    const eligibleProfiles = (profiles ?? []).filter(
      (item: unknown) => item && typeof item === "object" && isVerifiedChallenger(item as Record<string, unknown>),
    ) as Array<Record<string, unknown>>;

    if (eligibleProfiles.length === 0) {
      const payload: LeaderboardResponse = {
        period,
        generated_at: new Date().toISOString(),
        leaders: [],
      };
      return Response.json({ data: payload }, { status: 200 });
    }

    if (period === "global") {
      const leaders = eligibleProfiles
        .map((item) => ({
          user_id: String(item.id),
          username: String(item.username),
          score: toSafeScore(item.points),
          streak: toSafeScore(item.streak),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item, index) => ({
          rank: index + 1,
          ...item,
        }));

      const payload: LeaderboardResponse = {
        period,
        generated_at: new Date().toISOString(),
        leaders,
      };

      return Response.json({ data: payload }, { status: 200 });
    }

    const { data: checkins, error: checkinsError } = await supabase
      .from("checkins")
      .select("user_id,points_earned,completed_at")
      .gte("completed_at", start.toISOString())
      .lt("completed_at", end.toISOString());

    if (checkinsError) {
      return Response.json({ error: checkinsError }, { status: 500 });
    }

    const monthlyMap = new Map<string, number>();

    for (const row of checkins ?? []) {
      const item = row as Record<string, unknown>;
      const userId = typeof item.user_id === "string" ? item.user_id : null;
      if (!userId) continue;

      const points = toSafeScore(item.points_earned);
      monthlyMap.set(userId, (monthlyMap.get(userId) ?? 0) + points);
    }

    const profileById = new Map<string, Record<string, unknown>>();
    for (const profile of eligibleProfiles) {
      profileById.set(String(profile.id), profile);
    }

    const leaders = Array.from(monthlyMap.entries())
      .filter(([userId]) => profileById.has(userId))
      .map(([userId, score]) => {
        const profile = profileById.get(userId)!;
        return {
          user_id: userId,
          username: String(profile.username),
          score,
          streak: toSafeScore(profile.streak),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    const payload: LeaderboardResponse = {
      period,
      generated_at: new Date().toISOString(),
      leaders,
    };

    return Response.json({ data: payload }, { status: 200 });
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
