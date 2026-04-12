import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);

function createSupabaseMock(options: {
  session?: unknown;
  profiles?: unknown[];
  profilesError?: unknown;
  checkins?: unknown[];
  checkinsError?: unknown;
}) {
  const sessionValue =
    Object.prototype.hasOwnProperty.call(options, "session")
      ? options.session
      : {
          user: { id: "ops-1", email: "ops@example.com" },
        };

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
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: sessionValue,
        },
        error: null,
      }),
    },
    from,
  };
}

describe("GET /api/rewards/winners", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthorized when session is missing", async () => {
    const supabaseMock = createSupabaseMock({ session: null });
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET(new Request("http://localhost/api/rewards/winners?month=2026-03"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns monthly winners with identity-complete profiles only", async () => {
    const supabaseMock = createSupabaseMock({
      profiles: [
        { id: "u1", username: "anna", phone: "22990000001", streak: 6 },
        { id: "u2", username: "", phone: "22990000002", streak: 9 },
        { id: "u3", username: "paul", phone: "22990000003", streak: 4 },
      ],
      checkins: [
        { user_id: "u1", points_earned: 5, completed_at: "2026-03-01T08:00:00.000Z" },
        { user_id: "u1", points_earned: 3, completed_at: "2026-03-02T08:00:00.000Z" },
        { user_id: "u2", points_earned: 999, completed_at: "2026-03-02T08:00:00.000Z" },
        { user_id: "u3", points_earned: 4, completed_at: "2026-03-02T08:00:00.000Z" },
      ],
    });
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET(new Request("http://localhost/api/rewards/winners?month=2026-03&limit=3"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.month).toBe("2026-03");
    expect(body.data.winners).toEqual([
      {
        rank: 1,
        user_id: "u1",
        username: "anna",
        phone: "22990000001",
        score: 8,
        streak: 6,
        reward_eligible: true,
      },
      {
        rank: 2,
        user_id: "u3",
        username: "paul",
        phone: "22990000003",
        score: 4,
        streak: 4,
        reward_eligible: true,
      },
    ]);
  });

  it("supports csv export", async () => {
    const supabaseMock = createSupabaseMock({
      profiles: [{ id: "u1", username: "anna", phone: "22990000001", streak: 6 }],
      checkins: [{ user_id: "u1", points_earned: 5, completed_at: "2026-03-01T08:00:00.000Z" }],
    });
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET(new Request("http://localhost/api/rewards/winners?month=2026-03&format=csv"));
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(text).toContain("month,rank,user_id,username,phone,score,streak,reward_eligible");
    expect(text).toContain("2026-03,1,u1");
  });
});
