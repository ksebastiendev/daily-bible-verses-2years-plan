import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchVersesByReference } from "@/lib/bible/adapter";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/bible/adapter", () => ({
  fetchVersesByReference: vi.fn().mockResolvedValue(null),
}));

const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);
const mockedFetchVersesByReference = vi.mocked(fetchVersesByReference);

function createSupabaseMock(options: {
  session: unknown;
  sessionError?: unknown;
  rpcData?: unknown;
  rpcError?: unknown;
}) {
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
  };
}

describe("GET /api/challenge/today", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchVersesByReference.mockResolvedValue(null);
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
        rpcData: { day_index: 1, reference: "Ps1-3" },
      }) as never,
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        plan_id: null,
        plan_day_id: null,
        day_index: 1,
        reference: "Ps1-3",
        last_completed_day: null,
        start_day_index: null,
        status: null,
        verses: [],
        verses_done: 0,
        total_verses: null,
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
