const GUEST_DEVICE_ID_KEY = "bc_guest_device_id";
const GUEST_CHALLENGE_KEY = "bc_guest_challenge";

export interface GuestChallengeState {
  deviceId: string;
  startDayIndex: number;
  currentDayIndex: number;
  startedAt: string;
  updatedAt: string;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateGuestDeviceId() {
  if (!isBrowser()) return null;

  const existing = window.localStorage.getItem(GUEST_DEVICE_ID_KEY);
  if (existing) return existing;

  const created = createId();
  window.localStorage.setItem(GUEST_DEVICE_ID_KEY, created);
  return created;
}

export function getGuestChallengeState(): GuestChallengeState | null {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(GUEST_CHALLENGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as GuestChallengeState;
    if (
      !parsed ||
      typeof parsed.deviceId !== "string" ||
      typeof parsed.startDayIndex !== "number" ||
      typeof parsed.currentDayIndex !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function startGuestChallenge(startDayIndex: number) {
  if (!isBrowser()) return null;

  const deviceId = getOrCreateGuestDeviceId();
  if (!deviceId) return null;

  const now = new Date().toISOString();

  const state: GuestChallengeState = {
    deviceId,
    startDayIndex,
    currentDayIndex: startDayIndex,
    startedAt: now,
    updatedAt: now,
  };

  window.localStorage.setItem(GUEST_CHALLENGE_KEY, JSON.stringify(state));
  return state;
}
