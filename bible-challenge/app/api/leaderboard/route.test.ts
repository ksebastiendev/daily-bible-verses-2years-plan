import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);

function createSupabaseMock(options: {
  profiles?: unknown[];
  profilesError?: unknown;
  checkins?: unknown[];
  checkinsError?: unknown;
}) {
  const checkinsQuery = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockResolvedValue({
      data: options.checkins ?? [],
      error: options.checkinsError ?? null,
    }),
  };

  const profilesQuery = {
    select: vi.fn().mockResolvedValue({
      data: options.profiles ?? [],
      error: options.profilesError ?? null,
    }),
  };

  const from = vi.fn((table: string) => {
    if (table === "profiles") return profilesQuery;
    if (table === "checkins") return checkinsQuery;
    throw new Error(`Unexpected table ${table}`);
  });

  return {
    from,
    profilesQuery,
    checkinsQuery,
  };
}

describe("GET /api/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns global leaderboard with eligible profiles only", async () => {
    const supabaseMock = createSupabaseMock({
      profiles: [
        { id: "u1", username: "anna", phone: "22990000001", email_verified: true, location: "Cotonou", points: 80, streak: 5 },
        { id: "u2", username: "bob", phone: "22990000002", email_verified: false, location: "Porto-Novo", points: 99, streak: 8 },
        { id: "u3", username: "paul", phone: "22990000003", email_verified: true, location: "Bohicon", points: 120, streak: 10 },
      ],
    });

    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET(new Request("http://localhost/api/leaderboard?period=global"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.period).toBe("global");
    expect(body.data.leaders).toEqual([
      { rank: 1, user_id: "u3", username: "paul", score: 120, streak: 10 },
      { rank: 2, user_id: "u1", username: "anna", score: 80, streak: 5 },
    ]);
  });

  it("returns monthly leaderboard", async () => {
    const supabaseMock = createSupabaseMock({
      profiles: [
        { id: "u1", username: "anna", phone: "22990000001", email_verified: true, location: "Cotonou", points: 80, streak: 5 },
        { id: "u3", username: "paul", phone: "22990000003", email_verified: true, location: "Bohicon", points: 120, streak: 10 },
      ],
      checkins: [
        { user_id: "u1", points_earned: 5, completed_at: "2026-03-01T08:00:00.000Z" },
        { user_id: "u1", points_earned: 3, completed_at: "2026-03-02T08:00:00.000Z" },
        { user_id: "u3", points_earned: 4, completed_at: "2026-03-02T08:00:00.000Z" },
      ],
    });

    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET(new Request("http://localhost/api/leaderboard?period=monthly&month=2026-03"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.period).toBe("monthly");
    expect(body.data.leaders).toEqual([
      { rank: 1, user_id: "u1", username: "anna", score: 8, streak: 5 },
      { rank: 2, user_id: "u3", username: "paul", score: 4, streak: 10 },
    ]);
  });

  it("returns 500 when profiles query fails", async () => {
    const supabaseMock = createSupabaseMock({
      profilesError: { message: "profiles failed" },
    });

    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET(new Request("http://localhost/api/leaderboard?period=global"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: { message: "profiles failed" } });
  });
});
