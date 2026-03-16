"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { startGuestChallenge } from "@/lib/guest/session";

type Mode = "start" | "resume";

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("start");
  const [dayIndex, setDayIndex] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const startDayIndex = mode === "start" ? 1 : dayIndex;

    if (!Number.isInteger(startDayIndex) || startDayIndex < 1 || startDayIndex > 730) {
      setError("Le jour doit être entre 1 et 730.");
      setLoading(false);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        const guest = startGuestChallenge(startDayIndex);
        if (!guest) {
          setError("Impossible d'initialiser le mode invité.");
          setLoading(false);
          return;
        }

        router.push("/app/home");
        return;
      }

      const response = await fetch("/api/challenge/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startDayIndex }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body?.error ?? "Impossible de démarrer le challenge.");
        setLoading(false);
        return;
      }

      router.push("/app/home");
    } catch {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-xl font-semibold text-gray-900">Bienvenue dans Bible Challenge</h1>
        <p className="mt-1 text-sm text-gray-600">Choisis comment démarrer ton parcours.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <button
            type="button"
            onClick={() => setMode("start")}
            className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium ${
              mode === "start"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-gray-300 bg-white text-gray-800"
            }`}
          >
            Commencer depuis le début
          </button>

          <button
            type="button"
            onClick={() => setMode("resume")}
            className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium ${
              mode === "resume"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-gray-300 bg-white text-gray-800"
            }`}
          >
            Reprendre à un jour précis
          </button>

          <div>
            <label htmlFor="dayIndex" className="mb-1 block text-sm font-medium text-gray-700">
              Jour (1 à 730)
            </label>
            <input
              id="dayIndex"
              type="number"
              min={1}
              max={730}
              value={dayIndex}
              disabled={mode === "start" || loading}
              onChange={(event) => setDayIndex(Number(event.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Chargement..." : "Continuer"}
          </button>
        </form>
      </div>
    </main>
  );
}
