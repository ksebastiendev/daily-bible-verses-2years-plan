"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getGuestChallengeState } from "@/lib/guest/session";

export default function AppEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const resolveEntry = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        const guest = getGuestChallengeState();
        router.replace(guest ? "/app/home" : "/app/onboarding");
        return;
      }

      try {
        const response = await fetch("/api/challenge/today");
        const body = await response.json().catch(() => ({}));

        if (response.ok && body?.data) {
          router.replace("/app/home");
          return;
        }
      } catch {
        // Fallback below
      }

      router.replace("/app/onboarding");
    };

    resolveEntry();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <p className="text-sm text-gray-600">Chargement...</p>
    </main>
  );
}
