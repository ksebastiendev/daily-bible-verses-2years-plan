"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getGuestChallengeState } from "@/lib/guest/session";
import {
  DEFAULT_BLOCK_SIZE,
  getInitialStep,
  getProgress,
  getStepVerses,
} from "@/lib/reading/progression";

interface Verse {
  verse: number;
  text: string;
}

interface TodayData {
  plan_day_id?: string | null;
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
  const [step, setStep] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState<string | null>(null);

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
            verses: [],
          });
          return;
        }

        setIsAuthenticated(true);

        const response = await fetch("/api/challenge/today");
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(body?.error ?? "Impossible de charger la lecture.");
          return;
        }

        const data = (body?.data ?? null) as TodayData | null;
        setToday(data);

        if (data?.verses?.length) {
          const initialStep = getInitialStep(data.verses_done ?? 0, data.verses.length, DEFAULT_BLOCK_SIZE);
          setStep(initialStep);
        }
      } catch {
        setError("Erreur réseau. Réessaie.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const verses = useMemo(() => today?.verses ?? [], [today?.verses]);
  const hasVerses = verses.length > 0;

  const currentVerses = useMemo(
    () => getStepVerses(verses, step, DEFAULT_BLOCK_SIZE),
    [verses, step],
  );

  const progressState = useMemo(
    () => getProgress(verses.length, step, DEFAULT_BLOCK_SIZE),
    [verses.length, step],
  );

  const done = progressState.versesShown;
  const total = verses.length || today?.total_verses || 0;

  const onContinue = async () => {
    if (!hasVerses) return;

    if (!progressState.isLastStep) {
      setStep((prev) => prev + 1);
      return;
    }

    if (!isAuthenticated || !today?.plan_day_id) {
      setCheckinMessage("Lecture terminée en mode invité.");
      return;
    }

    if (syncing) return;

    setSyncing(true);
    setCheckinMessage(null);

    try {
      const response = await fetch("/api/challenge/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planDayId: today.plan_day_id,
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setCheckinMessage(body?.error?.message ?? body?.error ?? "Check-in non synchronisé.");
        return;
      }

      setCheckinMessage("Lecture terminée et progression synchronisée.");
    } catch {
      setCheckinMessage("Lecture terminée, synchronisation impossible pour le moment.");
    } finally {
      setSyncing(false);
    }
  };

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

          {!hasVerses ? (
            <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-4">
              <p className="text-sm text-gray-500">Le texte des versets n&apos;est pas encore disponible pour ce passage.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {currentVerses.map((item) => (
                <div key={item.verse} className="flex gap-3">
                  <span className="w-6 shrink-0 pt-1 text-right text-xs font-semibold text-gray-400">
                    {item.verse}
                  </span>
                  <p className="text-base leading-7 text-gray-800">{item.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Etape {progressState.totalSteps === 0 ? 0 : step + 1} / {progressState.totalSteps}
            </span>
            <span>
              {done} / {total || "-"}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-slate-900"
              style={{ width: `${progressState.progressPercent}%` }}
            />
          </div>

          {checkinMessage ? <p className="mt-3 text-xs text-gray-600">{checkinMessage}</p> : null}

          <button
            type="button"
            onClick={onContinue}
            disabled={syncing || !hasVerses}
            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            {progressState.isLastStep ? (syncing ? "Synchronisation..." : "Terminer la lecture") : "Continuer"}
          </button>
        </section>
      </div>
    </main>
  );
}
