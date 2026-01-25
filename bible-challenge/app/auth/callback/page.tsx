"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthCallbackPage() {
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(true);
          return;
        }

        if (data.session) {
          router.push("/home");
        } else {
          router.push("/login");
        }
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
