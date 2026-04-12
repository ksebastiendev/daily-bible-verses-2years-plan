import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);

function createSupabaseMock(options: {
  session?: unknown;
  existing?: unknown;
  existingError?: unknown;
  inserted?: unknown;
  insertError?: unknown;
}) {
  const existingQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: options.existing ?? null,
      error: options.existingError ?? null,
    }),
  };

  const insertChain = {
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: options.inserted ?? { id: "log-1" },
      error: options.insertError ?? null,
    }),
  };

  const from = vi.fn((table: string) => {
    if (table !== "notification_logs") throw new Error(`Unexpected table: ${table}`);

    return {
      select: existingQuery.select,
      eq: existingQuery.eq,
      contains: existingQuery.contains,
      limit: existingQuery.limit,
      maybeSingle: existingQuery.maybeSingle,
      insert: vi.fn().mockReturnValue(insertChain),
    };
  });

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session:
            Object.prototype.hasOwnProperty.call(options, "session")
              ? options.session
              : { user: { id: "user-1", email: "u@example.com" } },
        },
        error: null,
      }),
    },
    from,
  };
}

describe("POST /api/notifications/log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthorized without session", async () => {
    const supabaseMock = createSupabaseMock({ session: null });
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await POST(
      new Request("http://localhost/api/notifications/log", {
        method: "POST",
        body: JSON.stringify({ type: "reminder" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("deduplicates when idempotency key already exists", async () => {
    const supabaseMock = createSupabaseMock({ existing: { id: "already-1" } });
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await POST(
      new Request("http://localhost/api/notifications/log", {
        method: "POST",
        body: JSON.stringify({ type: "reminder", idempotencyKey: "key-1" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ id: "already-1", deduplicated: true });
  });

  it("inserts when no duplicate exists", async () => {
    const supabaseMock = createSupabaseMock({ inserted: { id: "new-1" } });
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await POST(
      new Request("http://localhost/api/notifications/log", {
        method: "POST",
        body: JSON.stringify({ type: "encouragement", meta: { channel: "push" } }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ id: "new-1", deduplicated: false });
  });
});
