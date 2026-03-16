import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchVersesByReference } from "@/lib/bible/adapter";

interface TodayVerse {
  verse: number;
  text: string;
}

interface TodayPayload {
  plan_id: string | null;
  plan_day_id: string | null;
  day_index: number | null;
  reference: string;
  last_completed_day: number | null;
  start_day_index: number | null;
  status: string | null;
  verses: TodayVerse[];
  verses_done: number;
  total_verses: number | null;
}

function normalizeTodayPayload(value: unknown): TodayPayload | null {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;

  const versesRaw = Array.isArray(row.verses) ? row.verses : [];
  const verses = versesRaw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const verse = (item as Record<string, unknown>).verse;
      const text = (item as Record<string, unknown>).text;

      return {
        verse: typeof verse === "number" ? verse : 0,
        text: typeof text === "string" ? text : "",
      };
    })
    .filter((item) => item.verse > 0 && item.text.length > 0);

  return {
    plan_id: typeof row.plan_id === "string" ? row.plan_id : null,
    plan_day_id: typeof row.plan_day_id === "string" ? row.plan_day_id : null,
    day_index: typeof row.day_index === "number" ? row.day_index : null,
    reference: typeof row.reference === "string" ? row.reference : "",
    last_completed_day: typeof row.last_completed_day === "number" ? row.last_completed_day : null,
    start_day_index: typeof row.start_day_index === "number" ? row.start_day_index : null,
    status: typeof row.status === "string" ? row.status : null,
    verses,
    verses_done: typeof row.verses_done === "number" ? row.verses_done : 0,
    total_verses: typeof row.total_verses === "number" ? row.total_verses : null,
  };
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("get_challenge_today");

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    const normalized = normalizeTodayPayload(data);

    if (
      normalized &&
      normalized.reference &&
      normalized.verses.length === 0
    ) {
      const externalVerses = await fetchVersesByReference(normalized.reference);
      if (externalVerses && externalVerses.length > 0) {
        normalized.verses = externalVerses;
        if (normalized.total_verses === null) {
          normalized.total_verses = externalVerses.length;
        }
      }
    }

    return Response.json({ data: normalized }, { status: 200 });
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
