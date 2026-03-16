import { createSupabaseServerClient } from "@/lib/supabase/server";

interface DailyVersePayload {
  date: string;
  reference: string;
  text: string;
  message: string | null;
  source: "database" | "fallback";
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const today = todayIsoDate();

    const { data: todayRow, error: todayError } = await supabase
      .from("daily_verse")
      .select("date,reference,text,message")
      .eq("date", today)
      .maybeSingle();

    if (todayError) {
      return Response.json({ error: todayError }, { status: 500 });
    }

    if (todayRow) {
      const payload: DailyVersePayload = {
        date: String(todayRow.date),
        reference: String(todayRow.reference),
        text: String(todayRow.text),
        message: todayRow.message ? String(todayRow.message) : null,
        source: "database",
      };

      return Response.json({ data: payload }, { status: 200 });
    }

    const { data: latestRow, error: latestError } = await supabase
      .from("daily_verse")
      .select("date,reference,text,message")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      return Response.json({ error: latestError }, { status: 500 });
    }

    if (latestRow) {
      const payload: DailyVersePayload = {
        date: String(latestRow.date),
        reference: String(latestRow.reference),
        text: String(latestRow.text),
        message: latestRow.message ? String(latestRow.message) : null,
        source: "database",
      };

      return Response.json({ data: payload }, { status: 200 });
    }

    const fallback: DailyVersePayload = {
      date: today,
      reference: "Verset du jour",
      text: "Le verset du jour sera bientot disponible.",
      message: null,
      source: "fallback",
    };

    return Response.json({ data: fallback }, { status: 200 });
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
