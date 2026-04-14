import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);

function createSupabaseMock(options: {
  session: unknown;
  sessionError?: unknown;
  rpcData?: unknown;
  rpcError?: unknown;
  planDayPassageText?: string | null;
  planDayError?: unknown;
}) {
  const fromBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { passage_text: options.planDayPassageText ?? null },
      error: options.planDayError ?? null,
    }),
  };

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: options.session },
        error: options.sessionError ?? null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({
      data: options.rpcData ?? null,
      error: options.rpcError ?? null,
    }),
    from: vi.fn().mockReturnValue(fromBuilder),
  };
}

describe("GET /api/challenge/today", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session", async () => {
    mockedCreateSupabaseServerClient.mockResolvedValue(
      createSupabaseMock({ session: null }) as never,
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 200 with data when rpc succeeds", async () => {
    mockedCreateSupabaseServerClient.mockResolvedValue(
      createSupabaseMock({
        session: { user: { id: "user-1" } },
        rpcData: { day_index: 1, reference: "Ps1-3", plan_day_id: "day-1" },
        planDayPassageText: "[Psaumes 1:1] Heureux l'homme\n[Psaumes 1:2] Qui trouve son plaisir",
      }) as never,
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        plan_id: null,
        plan_day_id: "day-1",
        day_index: 1,
        reference: "Ps1-3",
        last_completed_day: null,
        start_day_index: null,
        status: null,
        verses: [
          { verse: 1, text: "Heureux l'homme" },
          { verse: 2, text: "Qui trouve son plaisir" },
        ],
        verses_done: 0,
        total_verses: 2,
      },
    });
  });

  it("returns 500 with error when rpc fails", async () => {
    const rpcError = { message: "rpc failed" };

    mockedCreateSupabaseServerClient.mockResolvedValue(
      createSupabaseMock({
        session: { user: { id: "user-1" } },
        rpcError,
      }) as never,
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: rpcError });
  });

  it("returns 500 on unexpected exception", async () => {
    mockedCreateSupabaseServerClient.mockRejectedValue(new Error("boom"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error" });
  });
});
