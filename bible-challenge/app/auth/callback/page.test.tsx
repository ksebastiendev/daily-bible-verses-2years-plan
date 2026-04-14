// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockExchangeCodeForSession = vi.fn();
const mockVerifyOtp = vi.fn();
const mockGetSession = vi.fn();
const mockMaybySingle = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      getSession: () => mockGetSession(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => ({
              maybeSingle: mockMaybySingle,
            }),
          }),
        }),
      }),
    }),
  },
}));

import AuthCallbackPage from "./page";

const SESSION_WITH_CONFIRMED_EMAIL = {
  session: {
    user: { id: "u1", email: "user@example.com", email_confirmed_at: "2026-04-14T10:00:00Z" },
  },
};

const SESSION_WITHOUT_CONFIRMED_EMAIL = {
  session: {
    user: { id: "u1", email: "user@example.com", email_confirmed_at: null },
  },
};

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no challenge active.
    mockMaybySingle.mockResolvedValue({ data: null, error: null });
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it("exchanges code, syncs emailVerified=true, and routes to onboarding when no active challenge", async () => {
    Object.defineProperty(window, "location", {
      value: { search: "?code=abc123" },
      writable: true,
    });

    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({ data: SESSION_WITH_CONFIRMED_EMAIL, error: null });

    await act(async () => {
      render(<AuthCallbackPage />);
    });

    await waitFor(() => {
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("abc123");
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ emailVerified: true }),
        }),
      );
      expect(mockReplace).toHaveBeenCalledWith("/app/onboarding");
    });
  });

  it("routes to /app/home when active challenge exists", async () => {
    Object.defineProperty(window, "location", {
      value: { search: "?code=abc123" },
      writable: true,
    });

    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({ data: SESSION_WITH_CONFIRMED_EMAIL, error: null });
    mockMaybySingle.mockResolvedValue({ data: { id: "challenge-1" }, error: null });

    await act(async () => {
      render(<AuthCallbackPage />);
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/app/home");
    });
  });

  it("does NOT call fetch profile sync when email_confirmed_at is null", async () => {
    Object.defineProperty(window, "location", {
      value: { search: "?code=def456" },
      writable: true,
    });

    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({ data: SESSION_WITHOUT_CONFIRMED_EMAIL, error: null });

    await act(async () => {
      render(<AuthCallbackPage />);
    });

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/app/onboarding");
    });
  });

  it("shows error UI when code exchange fails", async () => {
    Object.defineProperty(window, "location", {
      value: { search: "?code=badcode" },
      writable: true,
    });

    mockExchangeCodeForSession.mockResolvedValue({ error: { message: "invalid code" } });

    const { getByText } = await act(async () =>
      render(<AuthCallbackPage />),
    );

    await waitFor(() => {
      expect(getByText(/erreur de connexion/i)).toBeTruthy();
    });
  });

  it("redirects to /login when no session after code exchange", async () => {
    Object.defineProperty(window, "location", {
      value: { search: "?code=abc" },
      writable: true,
    });

    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    await act(async () => {
      render(<AuthCallbackPage />);
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });
});
