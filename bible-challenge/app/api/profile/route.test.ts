import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "./route";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);

function createSupabaseProfileMock(options: {
  session?: unknown;
  profileData?: unknown;
  profileError?: unknown;
  upsertError?: unknown;
}) {
  const sessionValue =
    Object.prototype.hasOwnProperty.call(options, "session")
      ? options.session
      : {
          user: {
            id: "user-1",
            email: "john@example.com",
          },
        };

  const profileQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: options.profileData ?? null,
      error: options.profileError ?? null,
    }),
  };

  const upsert = vi.fn().mockResolvedValue({ error: options.upsertError ?? null });
  const update = vi.fn().mockReturnThis();
  const updateEq = vi.fn().mockResolvedValue({ error: null });

  const from = vi.fn((table: string) => {
    if (table !== "profiles") throw new Error(`Unexpected table: ${table}`);
    return {
      select: profileQuery.select,
      eq: profileQuery.eq,
      maybeSingle: profileQuery.maybeSingle,
      upsert,
      update: vi.fn().mockReturnValue({ eq: updateEq }),
    };
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
    upsert,
    profileQuery,
  };
}

describe("/api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns profile and eligibility", async () => {
    const supabaseMock = createSupabaseProfileMock({
      profileData: {
        id: "user-1",
        username: "anna",
        phone: "22990000001",
        location: "Cotonou",
        email_verified: true,
        points: 15,
        streak: 3,
      },
    });

    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.username).toBe("anna");
    expect(body.data.phone).toBe("22990000001");
    expect(body.data.isEligibleForLeaderboard).toBe(true);
    expect(body.data.isEligibleForRewards).toBe(true);
    expect(body.data.emailVerified).toBe(true);
    expect(body.data.location).toBe("Cotonou");
  });

  it("GET returns emailVerified and location when set on profile row", async () => {
    const supabaseMock = createSupabaseProfileMock({
      profileData: {
        id: "user-1",
        username: "anna",
        phone: "22990000001",
        points: 15,
        streak: 3,
        location: "Cotonou",
        email_verified: true,
      },
    });

    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.emailVerified).toBe(true);
    expect(body.data.location).toBe("Cotonou");
  });

  it("GET returns unauthorized when session is missing", async () => {
    const supabaseMock = createSupabaseProfileMock({ session: null });
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("PUT updates optional username and phone", async () => {
    const supabaseMock = createSupabaseProfileMock({
      profileData: {
        id: "user-1",
        username: "paul",
        phone: "22990000009",
        location: "Bohicon",
        email_verified: true,
        points: 20,
        streak: 6,
      },
    });
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const request = new Request("http://localhost/api/profile", {
      method: "PUT",
      body: JSON.stringify({ username: " paul ", phone: " 22990000009 " }),
    });

    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(supabaseMock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1", username: "paul", phone: "22990000009" }),
      { onConflict: "id" },
    );
    expect(body.data.isEligibleForLeaderboard).toBe(true);
  });

  it("PUT updates location", async () => {
    const supabaseMock = createSupabaseProfileMock({
      profileData: {
        id: "user-1",
        username: "paul",
        phone: "22990000009",
        location: "Cotonou",
        points: 20,
        streak: 6,
      },
    });
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const request = new Request("http://localhost/api/profile", {
      method: "PUT",
      body: JSON.stringify({ location: " Cotonou " }),
    });

    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(supabaseMock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1", location: "Cotonou" }),
      { onConflict: "id" },
    );
    expect(body.data.location).toBe("Cotonou");
  });

  it("PUT updates emailVerified flag", async () => {
    const supabaseMock = createSupabaseProfileMock({
      profileData: {
        id: "user-1",
        username: "paul",
        phone: "22990000009",
        email_verified: true,
        points: 20,
        streak: 6,
      },
    });
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const request = new Request("http://localhost/api/profile", {
      method: "PUT",
      body: JSON.stringify({ emailVerified: true }),
    });

    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(supabaseMock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1", email_verified: true }),
      { onConflict: "id" },
    );
    expect(body.data.emailVerified).toBe(true);
  });

  it("PUT rejects invalid body", async () => {
    const supabaseMock = createSupabaseProfileMock({});
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const request = new Request("http://localhost/api/profile", {
      method: "PUT",
      body: JSON.stringify({ username: 42 }),
    });

    const response = await PUT(request);

    expect(response.status).toBe(400);
  });

  it("PUT rejects invalid emailVerified type", async () => {
    const supabaseMock = createSupabaseProfileMock({});
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const request = new Request("http://localhost/api/profile", {
      method: "PUT",
      body: JSON.stringify({ emailVerified: "yes" }),
    });

    const response = await PUT(request);

    expect(response.status).toBe(400);
  });

  it("PUT rejects location above max length", async () => {
    const supabaseMock = createSupabaseProfileMock({});
    mockedCreateSupabaseServerClient.mockResolvedValue(supabaseMock as never);

    const request = new Request("http://localhost/api/profile", {
      method: "PUT",
      body: JSON.stringify({ location: "x".repeat(101) }),
    });

    const response = await PUT(request);

    expect(response.status).toBe(400);
  });
});
