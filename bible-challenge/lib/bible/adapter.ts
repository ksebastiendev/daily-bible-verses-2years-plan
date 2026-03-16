interface AdapterVerse {
  verse: number;
  text: string;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 2;

type CacheRecord = {
  expiresAt: number;
  verses: AdapterVerse[];
};

const passageCache = new Map<string, CacheRecord>();

function getApiBaseUrl() {
  return process.env.BIBLE_AVAILABLE_API_BASE_URL ?? null;
}

function getPassagePath() {
  return process.env.BIBLE_AVAILABLE_API_PASSAGE_PATH ?? "/passage";
}

function toVerse(item: unknown): AdapterVerse | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;

  const verse =
    typeof row.verse === "number"
      ? row.verse
      : typeof row.verse_number === "number"
        ? row.verse_number
        : null;

  const text =
    typeof row.text === "string"
      ? row.text
      : typeof row.content === "string"
        ? row.content
        : null;

  if (!verse || !text || text.trim().length === 0) return null;
  return { verse, text: text.trim() };
}

export function extractVersesFromApiPayload(payload: unknown): AdapterVerse[] {
  if (!payload) return [];

  const root = payload as Record<string, unknown>;

  const direct = Array.isArray(root.verses) ? root.verses : null;
  const nested =
    root.data && typeof root.data === "object" && Array.isArray((root.data as Record<string, unknown>).verses)
      ? ((root.data as Record<string, unknown>).verses as unknown[])
      : null;

  const list = direct ?? nested;
  if (!list) return [];

  return list
    .map((item) => toVerse(item))
    .filter((item): item is AdapterVerse => Boolean(item));
}

function getCached(reference: string) {
  const key = reference.toLowerCase().trim();
  const cached = passageCache.get(key);

  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    passageCache.delete(key);
    return null;
  }

  return cached.verses;
}

function setCache(reference: string, verses: AdapterVerse[]) {
  const key = reference.toLowerCase().trim();
  passageCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    verses,
  });
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchVersesByReference(reference: string) {
  const trimmedReference = reference.trim();
  if (!trimmedReference) return null;

  const cached = getCached(trimmedReference);
  if (cached && cached.length > 0) return cached;

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return null;

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const path = getPassagePath().startsWith("/") ? getPassagePath() : `/${getPassagePath()}`;
  const url = `${normalizedBase}${path}?reference=${encodeURIComponent(trimmedReference)}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);

      if (!response.ok) {
        if (response.status >= 500 && attempt < MAX_ATTEMPTS) {
          continue;
        }
        return null;
      }

      const payload = await response.json();
      const verses = extractVersesFromApiPayload(payload);

      if (verses.length > 0) {
        setCache(trimmedReference, verses);
        return verses;
      }

      return null;
    } catch {
      if (attempt >= MAX_ATTEMPTS) {
        return null;
      }
    }
  }

  return null;
}
