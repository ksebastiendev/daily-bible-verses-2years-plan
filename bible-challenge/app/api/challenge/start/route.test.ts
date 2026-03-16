import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);

function createSupabaseStartMock(options: {
  session?: unknown;
  activePlan?: { id: string | number } | null;
  activePlanError?: unknown;
  updatedRows?: Array<{ id: string | number }> | null;
  updateError?: unknown;
}) {
  const readingPlansQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: options.activePlan ?? null,
      error: options.activePlanError ?? null,
    }),
  };

  const userChallengesUpdateChain = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({
      data: options.updatedRows ?? [{ id: "existing" }],
      error: options.updateError ?? null,
    }),
  };

  const userChallengesQuery = {
    update: vi.fn().mockReturnValue(userChallengesUpdateChain),
    insert: vi.fn().mockResolvedValue({ error: null }),
  };

  const from = vi.fn((table: string) => {
    if (table === "reading_plans") {
      return readingPlansQuery;
    }

    if (table === "user_challenges") {
      return userChallengesQuery;
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: options.session ?? { user: { id: "user-1" } } },
        error: null,
      }),
    },
    from,
    readingPlansQuery,
    userChallengesQuery,
  };
}

describe("POST /api/challenge/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when no active plan is found", async () => {
    const supabaseMock = createSupabaseStartMock({ activePlan: null });
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const request = new Request("http://localhost/api/challenge/start", {
      method: "POST",
      body: JSON.stringify({ startDayIndex: 12 }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Active plan not found" });
    expect(supabaseMock.readingPlansQuery.eq).toHaveBeenCalledWith("is_active", true);
  });

  it("conflict update payload excludes started_at", async () => {
    const supabaseMock = createSupabaseStartMock({
      updatedRows: [{ id: "existing-row" }],
    });
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const request = new Request("http://localhost/api/challenge/start", {
      method: "POST",
      body: JSON.stringify({ planId: "plan-1", startDayIndex: 7 }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, planId: "plan-1", startDayIndex: 7 });
    expect(supabaseMock.userChallengesQuery.update).toHaveBeenCalledWith({
      start_day_index: 7,
      active: true,
    });
    expect(supabaseMock.userChallengesQuery.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ started_at: expect.anything() }),
    );
  });
});
