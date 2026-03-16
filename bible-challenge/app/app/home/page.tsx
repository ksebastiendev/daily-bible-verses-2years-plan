"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getGuestChallengeState } from "@/lib/guest/session";

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

export default function AppHomePage() {
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
            setToday(null);
            return;
          }

          setGuestMode(true);
          setToday({
            plan_day_id: "guest",
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
          setError(body?.error ?? "Impossible de charger le challenge.");
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

  if (error || !today) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-gray-900">Bienvenue</h1>
          <p className="mt-2 text-sm text-gray-600">
            {error ?? "Aucun challenge actif pour le moment."}
          </p>
          <Link
            href="/app/onboarding"
            className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Démarrer mon challenge
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">Jour actuel</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Jour {today.day_index}</h1>
          <p className="mt-1 text-sm text-gray-700">{today.reference}</p>
          <p className="mt-3 text-sm text-gray-600">{progressLabel}</p>
          {guestMode ? <p className="mt-1 text-xs text-gray-500">Session invite</p> : null}
        </section>

        <Link
          href="/app/reading"
          className="rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Continuer la lecture
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
      </div>
    </main>
  );
}
