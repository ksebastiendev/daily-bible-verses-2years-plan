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
        rpcData: { id: 1, reference: "Ps1-3" },
      }) as never,
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { id: 1, reference: "Ps1-3" } });
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
