"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
      } else {
        setEmail(data.session.user?.email || null);
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue
          </h1>
          
          {email && (
            <div className="mb-6">
              <p className="text-gray-600">Connecté en tant que :</p>
              <p className="text-gray-900 font-medium mt-1">{email}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white font-medium py-2.5 px-6 rounded-md hover:bg-red-700 transition-colors"
          >
            Déconnexion
          </button>

          <div className="mt-4 grid gap-2 sm:max-w-xs">
            <Link
              href="/app/home"
              className="rounded-md bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Aller au dashboard
            </Link>
            <Link
              href="/app/challenge"
              className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-gray-800"
            >
              Voir le challenge
            </Link>
            <Link
              href="/app/reading"
              className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-gray-800"
            >
              Continuer la lecture
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
