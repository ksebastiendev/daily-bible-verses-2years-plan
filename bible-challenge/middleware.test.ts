import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "./middleware";
import { createServerClient } from "@supabase/ssr";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

const mockedCreateServerClient = vi.mocked(createServerClient);

describe("middleware /app protection", () => {
  it("allows /app/reading without authentication", async () => {
    const request = new NextRequest("http://localhost/app/reading");
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects /app/profile to /login when no session", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    mockedCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const request = new NextRequest("http://localhost/app/profile");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("location")).toContain("next=%2Fapp%2Fprofile");
  });
});
