// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

// Mock next/navigation before importing the component.
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Mock supabase client.
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => ({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      }),
    }),
  },
}));

// Import after mocks are set up.
import LoginPage from "./page";

describe("LoginPage — login form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders login form by default", () => {
    const { container } = render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/mot de passe/i)).toBeTruthy();
    expect(container.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it("shows error when email is empty on login submit", async () => {
    const { container } = render(<LoginPage />);
    const submit = container.querySelector('button[type="submit"]') as HTMLElement;
    await act(async () => {
      fireEvent.click(submit);
    });
    expect(screen.getByText(/entre ton email/i)).toBeTruthy();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("calls signInWithPassword with correct args and routes to onboarding when no challenge", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const { container } = render(<LoginPage />);
    const submit = container.querySelector('button[type="submit"]') as HTMLElement;

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "password123" } });
      fireEvent.click(submit);
    });

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(mockReplace).toHaveBeenCalledWith("/app/onboarding");
    });
  });

  it("routes to /app/home when active challenge exists", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { id: "challenge-1" }, error: null });

    const { container } = render(<LoginPage />);
    const submit = container.querySelector('button[type="submit"]') as HTMLElement;

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "password123" } });
      fireEvent.click(submit);
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/app/home");
    });
  });

  it("shows inline error on wrong credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });

    const { container } = render(<LoginPage />);
    const submit = container.querySelector('button[type="submit"]') as HTMLElement;

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "bad@example.com" } });
      fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "wrongpass" } });
      fireEvent.click(submit);
    });

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeTruthy();
    });
  });
});

describe("LoginPage — signup form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  afterEach(() => {
    cleanup();
  });

  function switchToSignup() {
    // Target the tab button specifically (type="button"), not the submit button.
    const tabButtons = screen.getAllByRole("button", { name: /créer un compte/i });
    fireEvent.click(tabButtons[0]);
  }

  it("shows error when username is empty", async () => {
    render(<LoginPage />);
    switchToSignup();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /créer mon compte/i }));
    });

    expect(screen.getByText(/choisis un nom d'utilisateur/i)).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows error when password is too short", async () => {
    render(<LoginPage />);
    switchToSignup();

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/johndoe/i), { target: { value: "alice" } });
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "alice@example.com" } });
      fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "short" } });
      fireEvent.click(screen.getByRole("button", { name: /créer mon compte/i }));
    });

    expect(screen.getByText(/trop court/i)).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("calls signUp with email+password and PUTs username when session is immediate", async () => {
    mockSignUp.mockResolvedValue({
      data: { session: { user: { id: "new-user" } } },
      error: null,
    });

    render(<LoginPage />);
    switchToSignup();

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/johndoe/i), { target: { value: "alice" } });
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "alice@example.com" } });
      fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "securepassword" } });
      fireEvent.click(screen.getByRole("button", { name: /créer mon compte/i }));
    });

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "alice@example.com",
        password: "securepassword",
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ username: "alice" }),
        }),
      );
    });
  });

  it("shows confirmation message when no session (email confirmation required)", async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<LoginPage />);
    switchToSignup();

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/johndoe/i), { target: { value: "bob" } });
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "bob@example.com" } });
      fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "securepassword" } });
      fireEvent.click(screen.getByRole("button", { name: /créer mon compte/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/vérifie ta boîte mail/i)).toBeTruthy();
    });
  });
});
