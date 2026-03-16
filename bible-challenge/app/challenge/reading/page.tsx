"use client";

import { useEffect, useState } from "react";

const VERSES_PER_STEP = 3;

interface Verse {
  verse: number;
  text: string;
}

interface TodayData {
  plan_day_id: string;
  day_index: number;
  reference: string;
  verses: Verse[];
  verses_done: number;
  total_verses: number;
}

export default function ReadingPage() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const res = await fetch("/api/challenge/today");

        if (!res.ok) {
          if (res.status === 401) {
            setError("Tu dois être connecté pour lire.");
          } else {
            setError("Impossible de charger la lecture du jour.");
          }
          return;
        }

        const json = await res.json();
        const today: TodayData = json.data;

        if (!today) {
          setError("Aucune lecture disponible pour aujourd'hui.");
          return;
        }

        setData(today);

        // Resume from last saved position if the server knows some verses are done
        if (today.verses_done > 0 && today.verses_done < today.total_verses) {
          const resumeStep = Math.floor(today.verses_done / VERSES_PER_STEP);
          setStep(resumeStep);
        }
      } catch {
        setError("Une erreur est survenue. Réessaie plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchToday();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 mb-4" />
          <p className="text-stone-500 text-sm">Chargement de la lecture…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="max-w-sm w-full bg-white rounded-xl border border-stone-200 p-6 text-center shadow-sm">
          <p className="text-stone-500 text-sm mb-1">Lecture indisponible</p>
          <p className="text-stone-800 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.verses || data.verses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="max-w-sm w-full bg-white rounded-xl border border-stone-200 p-6 text-center shadow-sm">
          <p className="text-stone-500 text-sm mb-1">Jour {data?.day_index}</p>
          <p className="text-stone-800 font-medium">
            Le texte de ce passage n&apos;est pas encore disponible.
          </p>
        </div>
      </div>
    );
  }

  const totalSteps = Math.ceil(data.verses.length / VERSES_PER_STEP);
  const currentVerses = data.verses.slice(
    step * VERSES_PER_STEP,
    (step + 1) * VERSES_PER_STEP,
  );
  const versesShown = Math.min((step + 1) * VERSES_PER_STEP, data.verses.length);
  const isLastStep = step >= totalSteps - 1;
  const progressPercent = Math.round((versesShown / data.verses.length) * 100);

  const handleContinue = () => {
    if (!isLastStep) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-100 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-baseline justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            Jour {data.day_index}
          </span>
          <span className="text-sm font-medium text-stone-700 truncate text-right">
            {data.reference}
          </span>
        </div>
      </header>

      {/* Reading container */}
      <main className="max-w-xl mx-auto px-5 pt-8 pb-32">
        {/* Verse block */}
        <div className="space-y-6">
          {currentVerses.map((v) => (
            <div key={v.verse} className="flex gap-3">
              <span className="mt-1 text-xs font-semibold text-stone-300 w-6 shrink-0 text-right select-none">
                {v.verse}
              </span>
              <p className="text-stone-800 text-lg leading-8 font-serif">
                {v.text}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-4 pt-3 pb-safe-bottom">
        <div className="max-w-xl mx-auto space-y-3">
          {/* Progress text */}
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>
              Étape {step + 1} / {totalSteps}
            </span>
            <span>
              {versesShown} / {data.verses.length} versets
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-stone-700 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* CTA button */}
          {isLastStep ? (
            <div className="py-3 text-center text-sm font-medium text-stone-500">
              ✓ Lecture terminée
            </div>
          ) : (
            <button
              onClick={handleContinue}
              className="w-full rounded-xl bg-stone-800 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-700 active:scale-95"
            >
              Continuer la lecture →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
