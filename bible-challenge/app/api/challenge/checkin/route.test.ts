import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);

function createSupabaseMock(options: {
  session: unknown;
  sessionError?: unknown;
  rpcData?: unknown;
  rpcError?: { message?: string } | null;
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

describe("POST /api/challenge/checkin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session", async () => {
    mockedCreateSupabaseServerClient.mockResolvedValue(
      createSupabaseMock({ session: null }) as never,
    );

    const request = new Request("http://localhost/api/challenge/checkin", {
      method: "POST",
      body: JSON.stringify({ planDayId: "day-1" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid json body", async () => {
    mockedCreateSupabaseServerClient.mockResolvedValue(
      createSupabaseMock({ session: { user: { id: "user-1" } } }) as never,
    );

    const request = {
      json: vi.fn().mockRejectedValue(new Error("invalid json")),
    } as unknown as Request;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid JSON body" });
  });

  it("returns 400 for invalid planDayId", async () => {
    mockedCreateSupabaseServerClient.mockResolvedValue(
      createSupabaseMock({ session: { user: { id: "user-1" } } }) as never,
    );

    const request = new Request("http://localhost/api/challenge/checkin", {
      method: "POST",
      body: JSON.stringify({ planDayId: "   " }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid planDayId" });
  });

  it("returns 400 for invalid reflection", async () => {
    mockedCreateSupabaseServerClient.mockResolvedValue(
      createSupabaseMock({ session: { user: { id: "user-1" } } }) as never,
    );

    const request = new Request("http://localhost/api/challenge/checkin", {
      method: "POST",
      body: JSON.stringify({ planDayId: "day-1", reflection: 123 }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid reflection" });
  });

  it("returns 200 with data when rpc succeeds", async () => {
    const supabaseMock = createSupabaseMock({
      session: { user: { id: "user-1" } },
      rpcData: { completed: true },
    });

    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const request = new Request("http://localhost/api/challenge/checkin", {
      method: "POST",
      body: JSON.stringify({ planDayId: "day-1", reflection: "Great day" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { completed: true } });
    expect(supabaseMock.rpc).toHaveBeenCalledWith("complete_day", {
      p_plan_day_id: "day-1",
      p_reflection: "Great day",
    });
  });

  it("returns 400 when rpc error contains Invalid day", async () => {
    const rpcError = { message: "Invalid day for this plan" };

    mockedCreateSupabaseServerClient.mockResolvedValue(
      createSupabaseMock({
        session: { user: { id: "user-1" } },
        rpcError,
      }) as never,
    );

    const request = new Request("http://localhost/api/challenge/checkin", {
      method: "POST",
      body: JSON.stringify({ planDayId: "day-1" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: rpcError });
  });

  it("returns 500 for other rpc errors", async () => {
    const rpcError = { message: "DB timeout" };

    mockedCreateSupabaseServerClient.mockResolvedValue(
      createSupabaseMock({
        session: { user: { id: "user-1" } },
        rpcError,
      }) as never,
    );

    const request = new Request("http://localhost/api/challenge/checkin", {
      method: "POST",
      body: JSON.stringify({ planDayId: "day-1" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: rpcError });
  });

  it("returns 500 on unexpected exception", async () => {
    mockedCreateSupabaseServerClient.mockRejectedValue(new Error("boom"));

    const request = new Request("http://localhost/api/challenge/checkin", {
      method: "POST",
      body: JSON.stringify({ planDayId: "day-1" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error" });
  });
});
