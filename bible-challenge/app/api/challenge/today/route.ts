import { createSupabaseServerClient } from "@/lib/supabase/server";

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

function parseVersesFromPassageText(passageText: string): TodayVerse[] {
  return passageText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\[[^\]]+\s+(\d+):(\d+)\]\s*(.+)$/);
      if (!match) return null;

      const verse = Number.parseInt(match[2] ?? "", 10);
      const text = (match[3] ?? "").trim();

      if (!Number.isFinite(verse) || verse <= 0 || !text) {
        return null;
      }

      return { verse, text };
    })
    .filter((item): item is TodayVerse => item !== null);
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

    if (normalized && normalized.plan_day_id && normalized.verses.length === 0) {
      const { data: planDay, error: planDayError } = await supabase
        .from("plan_days")
        .select("passage_text")
        .eq("id", normalized.plan_day_id)
        .maybeSingle();

      if (planDayError) {
        return Response.json({ error: planDayError }, { status: 500 });
      }

      const passageText =
        planDay && typeof planDay === "object" && "passage_text" in planDay
          ? (planDay.passage_text as string | null)
          : null;

      if (typeof passageText === "string" && passageText.trim()) {
        const parsedVerses = parseVersesFromPassageText(passageText);
        if (parsedVerses.length > 0) {
          normalized.verses = parsedVerses;
          if (normalized.total_verses === null) {
            normalized.total_verses = parsedVerses.length;
          }
        }
      }
    }

    return Response.json({ data: normalized }, { status: 200 });
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
