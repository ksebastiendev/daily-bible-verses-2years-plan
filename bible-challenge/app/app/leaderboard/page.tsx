"use client";

import { useEffect, useState } from "react";

type Period = "monthly" | "global";

interface Leader {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  streak: number;
}

interface LeaderboardData {
  period: Period;
  generated_at: string;
  leaders: Leader[];
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LeaderboardData | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/leaderboard?period=${period}`);
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(body?.error?.message ?? body?.error ?? "Impossible de charger le classement.");
          setData(null);
          return;
        }

        setData(body?.data ?? null);
      } catch {
        setError("Erreur réseau. Réessaie.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [period]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h1 className="text-xl font-semibold text-gray-900">Classement</h1>
          <p className="mt-1 text-sm text-gray-600">Top lecteurs avec profil complete.</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPeriod("monthly")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                period === "monthly" ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setPeriod("global")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                period === "global" ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              Global
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          {loading ? <p className="text-sm text-gray-600">Chargement...</p> : null}
          {!loading && error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!loading && !error && data && data.leaders.length === 0 ? (
            <p className="text-sm text-gray-600">Aucun resultat disponible.</p>
          ) : null}

          {!loading && !error && data && data.leaders.length > 0 ? (
            <div className="space-y-3">
              {data.leaders.map((leader) => (
                <div key={leader.user_id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      #{leader.rank} {leader.username}
                    </p>
                    <p className="text-xs text-gray-500">Streak: {leader.streak}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{leader.score} pts</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
