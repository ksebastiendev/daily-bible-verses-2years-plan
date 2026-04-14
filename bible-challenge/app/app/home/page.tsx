"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Verse {
  verse: number;
  text: string;
}

interface TodayData {
  plan_day_id: string;
  day_index: number;
  reference: string;
  verses?: Verse[];
  verses_done?: number;
  total_verses?: number;
}

interface DailyVerseData {
  date: string;
  reference: string;
  text: string;
  message: string | null;
  source: "database" | "fallback";
}

interface HomeStats {
  streakDays: number;
  completedDays: number;
  durationDays: number;
  progressPercent: number;
}

export default function AppHomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<TodayData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dailyVerse, setDailyVerse] = useState<DailyVerseData | null>(null);
  const [stats, setStats] = useState<HomeStats | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setIsAuthenticated(true);
        }

        const response = await fetch("/api/challenge/today");
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (session?.user) {
            setError(body?.error ?? "Impossible de charger le challenge.");
          }
          return;
        }

        setToday(body?.data ?? null);

        if (session?.user) {
          const { data: activeChallenge } = await supabase
            .from("user_challenges")
            .select("plan_id")
            .eq("user_id", session.user.id)
            .eq("active", true)
            .maybeSingle();

          if (!activeChallenge?.plan_id) {
            return;
          }

          const { data: plan } = await supabase
            .from("reading_plans")
            .select("duration_days")
            .eq("id", activeChallenge.plan_id)
            .maybeSingle();

          const durationDays =
            plan && typeof plan === "object" && "duration_days" in plan && typeof plan.duration_days === "number"
              ? plan.duration_days
              : 730;

          const { data: checkinsData } = await supabase
            .from("checkins")
            .select("completed_at,created_at,plan_days!inner(day_index,plan_id)")
            .eq("user_id", session.user.id)
            .eq("plan_days.plan_id", activeChallenge.plan_id)
            .order("completed_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

          const readDays = new Set<number>();
          const completedDates = new Set<string>();

          for (const row of (checkinsData ?? []) as Array<Record<string, unknown>>) {
            const planDay = row.plan_days;
            if (planDay && typeof planDay === "object") {
              const dayIndex = (planDay as Record<string, unknown>).day_index;
              if (typeof dayIndex === "number" && Number.isFinite(dayIndex) && dayIndex > 0) {
                readDays.add(dayIndex);
              }
            }

            const completedAt =
              typeof row.completed_at === "string"
                ? row.completed_at
                : typeof row.created_at === "string"
                  ? row.created_at
                  : null;
            if (completedAt) {
              completedDates.add(completedAt.slice(0, 10));
            }
          }

          const completedDays = readDays.size;
          const progressPercent = Math.max(0, Math.min(100, Math.round((completedDays / Math.max(durationDays, 1)) * 100)));

          let streakDays = 0;
          const dateCursor = new Date();

          while (true) {
            const isoDate = dateCursor.toISOString().slice(0, 10);
            if (!completedDates.has(isoDate)) {
              break;
            }
            streakDays += 1;
            dateCursor.setDate(dateCursor.getDate() - 1);
          }

          setStats({
            streakDays,
            completedDays,
            durationDays,
            progressPercent,
          });
        }
      } catch {
        setError("Erreur réseau. Réessaie.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    const runDailyVerse = async () => {
      try {
        const response = await fetch("/api/daily-verse");
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          return;
        }

        setDailyVerse(body?.data ?? null);
      } catch {
        // Keep home usable even if daily verse is unavailable.
      }
    };

    runDailyVerse();
  }, []);

  const progressLabel = useMemo(() => {
    const done = today?.verses_done ?? 0;
    const total = today?.total_verses ?? 0;

    if (!total) {
      return "Progression indisponible";
    }

    return `${done} / ${total} versets`;
  }, [today?.total_verses, today?.verses_done]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 pb-28">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">Accueil</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Bible Challenge</h1>
          <p className="mt-2 text-sm text-gray-700">
            Lis chaque jour, avance a ton rythme, et garde le cap sur 2 ans de lecture.
          </p>

          {isAuthenticated && today ? (
            <>
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Jour actuel</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Jour {today.day_index ?? "-"}</p>
                <p className="mt-1 text-sm text-gray-700">{today.reference}</p>
                <p className="mt-2 text-sm text-gray-600">{progressLabel}</p>
              </div>

              {stats ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Streak</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">{stats.streakDays} jours</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Progression</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">{stats.progressPercent}%</p>
                    <p className="text-xs text-gray-500">{stats.completedDays}/{stats.durationDays}</p>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        </section>

        {dailyVerse ? (
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">Verset du jour</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">{dailyVerse.reference}</p>
            <p className="mt-2 text-sm leading-6 text-gray-700">{dailyVerse.text}</p>
            {dailyVerse.message ? <p className="mt-2 text-xs text-gray-500">{dailyVerse.message}</p> : null}
          </section>
        ) : null}

        <Link
          href="/app/reading"
          className="rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Commencer la lecture
        </Link>

        <Link
          href="/app/challenge"
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-800"
        >
          Voir le challenge
        </Link>

        <Link
          href="/app/profile"
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-800"
        >
          Profil
        </Link>

        <Link
          href="/app/leaderboard"
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-800"
        >
          Classement
        </Link>
      </div>

      {!isAuthenticated ? (
        <div className="fixed inset-x-4 bottom-4 z-10 mx-auto max-w-md rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <p className="text-sm text-slate-700">Participe au challenge pour gagner des prix.</p>
          <Link
            href="/login?next=/app/challenge"
            className="mt-2 inline-block text-sm font-semibold text-slate-900 underline underline-offset-4"
          >
            Se connecter
          </Link>
        </div>
      ) : null}
    </main>
  );
}
