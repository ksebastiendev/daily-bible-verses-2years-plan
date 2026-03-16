"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface TodayData {
  plan_day_id: string;
  day_index: number;
  reference: string;
}

export default function ChallengePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<TodayData | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
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

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h1 className="text-xl font-semibold text-gray-900">Mon challenge</h1>

          {loading ? <p className="mt-2 text-sm text-gray-600">Chargement...</p> : null}

          {!loading && error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

          {!loading && !error && today ? (
            <>
              <p className="mt-3 text-sm text-gray-700">Jour actuel: {today.day_index}</p>
              <p className="mt-1 text-sm text-gray-700">Référence: {today.reference}</p>
            </>
          ) : null}

          <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-3">
            <p className="text-sm text-gray-500">Calendrier / progression (placeholder)</p>
          </div>
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
