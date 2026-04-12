import { createSupabaseServerClient } from "@/lib/supabase/server";

interface NotificationBody {
  type: string;
  userId?: string;
  sentAt?: string;
  idempotencyKey?: string;
  meta?: Record<string, unknown>;
}

function normalizeType(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeIdempotencyKey(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isSafeMeta(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    const payload = body as NotificationBody;
    const type = normalizeType(payload?.type);
    const idempotencyKey = normalizeIdempotencyKey(payload?.idempotencyKey);

    if (!type || type.length > 60) {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    const userId =
      typeof payload?.userId === "string" && payload.userId.trim().length > 0
        ? payload.userId.trim()
        : session.user.id;

    const sentAt = payload?.sentAt && !Number.isNaN(new Date(payload.sentAt).getTime())
      ? new Date(payload.sentAt).toISOString()
      : new Date().toISOString();

    const meta: Record<string, unknown> = isSafeMeta(payload?.meta) ? { ...payload.meta } : {};
    if (idempotencyKey) {
      meta.idempotency_key = idempotencyKey;
    }

    if (idempotencyKey) {
      const { data: existing, error: existingError } = await supabase
        .from("notification_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("type", type)
        .contains("meta", { idempotency_key: idempotencyKey })
        .limit(1)
        .maybeSingle();

      if (existingError) {
        return Response.json({ error: existingError }, { status: 500 });
      }

      if (existing?.id) {
        return Response.json(
          {
            data: {
              id: String(existing.id),
              deduplicated: true,
            },
          },
          { status: 200 },
        );
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from("notification_logs")
      .insert({
        user_id: userId,
        type,
        sent_at: sentAt,
        meta,
      })
      .select("id")
      .limit(1)
      .maybeSingle();

    if (insertError) {
      return Response.json({ error: insertError }, { status: 500 });
    }

    return Response.json(
      {
        data: {
          id: inserted?.id ? String(inserted.id) : null,
          deduplicated: false,
        },
      },
      { status: 200 },
    );
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
