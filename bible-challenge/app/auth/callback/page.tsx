"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EmailOtpType } from "@supabase/supabase-js";

export default function AuthCallbackPage() {
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const tokenHash = params.get("token_hash");
        const type = params.get("type") as EmailOtpType | null;

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(true);
            return;
          }
        } else if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });

          if (verifyError) {
            setError(true);
            return;
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(true);
          return;
        }

        if (!data.session?.user) {
          router.replace("/login");
          return;
        }

        if (data.session.user.email_confirmed_at) {
          // Best-effort sync to profiles table; should not block user navigation.
          await fetch("/api/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ emailVerified: true }),
          });
        }

        const { data: challenge, error: challengeError } = await supabase
          .from("user_challenges")
          .select("id")
          .eq("user_id", data.session.user.id)
          .eq("active", true)
          .limit(1)
          .maybeSingle();

        if (challengeError) {
          setError(true);
          return;
        }

        if (!challenge?.id) {
          router.replace("/app/onboarding");
          return;
        }

        router.replace("/app/home");
      } catch (err) {
        console.error("Error during auth callback:", err);
        setError(true);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">Erreur de connexion</p>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-700">Connexion en cours...</p>
      </div>
    </div>
  );
}
