import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);

interface DailyVerseRow {
  date: string;
  reference: string;
  text: string;
  message: string | null;
}

function createSupabaseMock(options: {
  todayData?: DailyVerseRow | null;
  todayError?: unknown;
  latestData?: DailyVerseRow | null;
  latestError?: unknown;
}) {
  const byDateQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: options.todayData ?? null,
      error: options.todayError ?? null,
    }),
  };

  const latestQuery = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: options.latestData ?? null,
      error: options.latestError ?? null,
    }),
  };

  const from = vi
    .fn()
    .mockReturnValueOnce(byDateQuery)
    .mockReturnValueOnce(latestQuery);

  return {
    from,
    byDateQuery,
    latestQuery,
  };
}

describe("GET /api/daily-verse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns today's verse when available", async () => {
    const supabaseMock = createSupabaseMock({
      todayData: {
        date: "2026-03-16",
        reference: "Jn 3:16",
        text: "Car Dieu a tant aime le monde...",
        message: "Courage pour aujourd'hui",
      },
    });

    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        date: "2026-03-16",
        reference: "Jn 3:16",
        text: "Car Dieu a tant aime le monde...",
        message: "Courage pour aujourd'hui",
        source: "database",
      },
    });
  });

  it("returns latest verse when today's verse is missing", async () => {
    const supabaseMock = createSupabaseMock({
      todayData: null,
      latestData: {
        date: "2026-03-15",
        reference: "Ps 23:1",
        text: "L'Eternel est mon berger",
        message: null,
      },
    });

    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.reference).toBe("Ps 23:1");
    expect(body.data.source).toBe("database");
  });

  it("returns fallback payload when table has no rows", async () => {
    const supabaseMock = createSupabaseMock({
      todayData: null,
      latestData: null,
    });

    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.source).toBe("fallback");
    expect(typeof body.data.reference).toBe("string");
    expect(typeof body.data.text).toBe("string");
  });

  it("returns 500 when db query fails", async () => {
    const supabaseMock = createSupabaseMock({
      todayError: { message: "db error" },
    });

    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: { message: "db error" } });
  });
});
