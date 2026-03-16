"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getGuestChallengeState } from "@/lib/guest/session";

interface Verse {
  verse: number;
  text: string;
}

interface TodayData {
  day_index: number;
  reference: string;
  verses?: Verse[];
  verses_done?: number;
  total_verses?: number;
}

export default function AppReadingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<TodayData | null>(null);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          const guest = getGuestChallengeState();

          if (!guest) {
            setError("Aucun challenge invite actif.");
            return;
          }

          setGuestMode(true);
          setToday({
            day_index: guest.currentDayIndex,
            reference: "Mode invite",
            verses_done: 0,
            total_verses: 0,
          });
          return;
        }

        const response = await fetch("/api/challenge/today");
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(body?.error ?? "Impossible de charger la lecture.");
          return;
        }

        setToday(body?.data ?? null);
      } catch {
        setError("Erreur réseau. Réessaie.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const done = today?.verses_done ?? 0;
  const total = today?.total_verses ?? 0;
  const progress = useMemo(() => {
    if (!total) return 0;
    return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  }, [done, total]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Jour {today?.day_index ?? "-"}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-gray-900">Lecture immersive</h1>
          <p className="mt-1 text-sm text-gray-700">{today?.reference ?? "Référence indisponible"}</p>
          {guestMode ? <p className="mt-1 text-xs text-gray-500">Session invite</p> : null}

          {loading ? <p className="mt-3 text-sm text-gray-600">Chargement...</p> : null}
          {!loading && error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-4">
            <p className="text-sm text-gray-500">Zone des versets (placeholder)</p>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>Progression</span>
            <span>
              {done} / {total || "-"}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-slate-900" style={{ width: `${progress}%` }} />
          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Continuer
          </button>
        </section>
      </div>
    </main>
  );
}
