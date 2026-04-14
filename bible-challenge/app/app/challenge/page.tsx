"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getGuestChallengeState } from "@/lib/guest/session";

interface TodayData {
  plan_day_id?: string | null;
  day_index?: number | null;
  reference: string;
  start_day_index?: number | null;
}

interface ChallengeStats {
  currentDay: number;
  completedCount: number;
  durationDays: number;
  progressPercent: number;
}

interface CalendarDay {
  dayIndex: number;
  read: boolean;
}

export default function ChallengePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<TodayData | null>(null);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const response = await fetch("/api/challenge/today");
        const body = await response.json().catch(() => ({}));

        const todayFromApi = response.ok ? ((body?.data ?? null) as TodayData | null) : null;

        if (session?.user) {
          const { data: activeChallenge, error: activeChallengeError } = await supabase
            .from("user_challenges")
            .select("plan_id,start_day_index")
            .eq("user_id", session.user.id)
            .eq("active", true)
            .maybeSingle();

          if (activeChallengeError) {
            setError(activeChallengeError.message);
            return;
          }

          if (!activeChallenge || !activeChallenge.plan_id) {
            setError("Aucun challenge actif.");
            setToday(todayFromApi);
            return;
          }

          const startDayIndex =
            typeof activeChallenge.start_day_index === "number" ? activeChallenge.start_day_index : 1;

          const { data: plan } = await supabase
            .from("reading_plans")
            .select("duration_days")
            .eq("id", activeChallenge.plan_id)
            .maybeSingle();

          const durationDays =
            plan && typeof plan === "object" && "duration_days" in plan && typeof plan.duration_days === "number"
              ? plan.duration_days
              : 730;

          const { data: checkinsData, error: checkinsError } = await supabase
            .from("checkins")
            .select("plan_days!inner(day_index,plan_id)")
            .eq("user_id", session.user.id)
            .eq("plan_days.plan_id", activeChallenge.plan_id);

          if (checkinsError) {
            setError(checkinsError.message);
            return;
          }

          const readDays = new Set<number>();
          for (const row of (checkinsData ?? []) as Array<Record<string, unknown>>) {
            const planDay = row.plan_days;
            if (!planDay || typeof planDay !== "object") continue;

            const dayIndex = (planDay as Record<string, unknown>).day_index;
            if (typeof dayIndex === "number" && Number.isFinite(dayIndex) && dayIndex > 0) {
              readDays.add(dayIndex);
            }
          }

          const completedCount = readDays.size;
          const fallbackCurrentDay = startDayIndex + completedCount;
          const currentDay =
            todayFromApi && typeof todayFromApi.day_index === "number" && todayFromApi.day_index > 0
              ? todayFromApi.day_index
              : fallbackCurrentDay;

          const progressPercent = Math.max(
            0,
            Math.min(100, Math.round((completedCount / Math.max(durationDays, 1)) * 100)),
          );

          const calendarDays: CalendarDay[] = [];
          const fromDay = Math.max(startDayIndex, currentDay - 29);
          for (let day = fromDay; day <= currentDay; day += 1) {
            calendarDays.push({
              dayIndex: day,
              read: readDays.has(day),
            });
          }

          setToday(todayFromApi ?? { reference: "Lecture indisponible", day_index: currentDay, start_day_index: startDayIndex });
          setStats({
            currentDay,
            completedCount,
            durationDays,
            progressPercent,
          });
          setCalendar(calendarDays);
          return;
        }

        const guest = getGuestChallengeState();
        if (!guest) {
          setError(body?.error ?? "Connecte-toi pour accéder au challenge.");
          return;
        }

        setGuestMode(true);

        const currentDay = guest.currentDayIndex;
        const durationDays = 730;
        const completedCount = Math.max(currentDay - guest.startDayIndex, 0);
        const progressPercent = Math.max(
          0,
          Math.min(100, Math.round((completedCount / durationDays) * 100)),
        );

        const calendarDays: CalendarDay[] = [];
        const fromDay = Math.max(guest.startDayIndex, currentDay - 29);
        for (let day = fromDay; day <= currentDay; day += 1) {
          calendarDays.push({
            dayIndex: day,
            read: day < currentDay,
          });
        }

        setToday({
          plan_day_id: null,
          day_index: currentDay,
          reference: "Mode invité",
          start_day_index: guest.startDayIndex,
        });
        setStats({
          currentDay,
          completedCount,
          durationDays,
          progressPercent,
        });
        setCalendar(calendarDays);
        return;
      } catch {
        setError("Erreur réseau. Réessaie.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h1 className="text-xl font-semibold text-gray-900">Mon challenge</h1>

          {loading ? <p className="mt-2 text-sm text-gray-600">Chargement...</p> : null}

          {!loading && error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

          {!loading && !error && today && stats ? (
            <>
              <p className="mt-3 text-sm text-gray-700">Jour actuel: {stats.currentDay}</p>
              <p className="mt-1 text-sm text-gray-700">Référence: {today.reference}</p>

              <p className="mt-3 text-sm text-gray-700">
                Progression: {stats.completedCount}/{stats.durationDays} jours ({stats.progressPercent}%)
              </p>
              {guestMode ? <p className="mt-1 text-xs text-gray-500">Session invité</p> : null}

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>

              <div className="mt-4 rounded-lg border border-gray-200 p-3">
                <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">30 derniers jours</p>
                <div className="grid grid-cols-6 gap-2">
                  {calendar.map((item) => (
                    <div
                      key={item.dayIndex}
                      className={`rounded-md border px-2 py-1 text-center text-xs ${
                        item.read
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                      title={`Jour ${item.dayIndex}`}
                    >
                      {item.read ? "✓" : "✗"} J{item.dayIndex}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </section>

        <Link
          href="/app/reading"
          className="block rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Continuer la lecture
        </Link>
      </div>
    </main>
  );
}
