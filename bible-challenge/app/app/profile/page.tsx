"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getOrCreateGuestDeviceId } from "@/lib/guest/session";

interface ProfileState {
  email: string;
  id: string;
  isGuest: boolean;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileState | null>(null);

  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        const guestId = getOrCreateGuestDeviceId();
        if (!guestId) {
          setLoading(false);
          return;
        }

        setProfile({
          email: "Invite",
          id: guestId,
          isGuest: true,
        });
        setLoading(false);
        return;
      }

      setProfile({
        email: session.user.email ?? "email indisponible",
        id: session.user.id,
        isGuest: false,
      });
      setLoading(false);
    };

    run();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h1 className="text-xl font-semibold text-gray-900">Profil</h1>
          <p className="mt-3 text-sm text-gray-700">{profile?.email}</p>
          <p className="mt-1 break-all text-xs text-gray-500">ID: {profile?.id ?? "-"}</p>
          {profile?.isGuest ? (
            <p className="mt-2 text-xs text-gray-500">Connecte-toi plus tard pour le classement et les recompenses.</p>
          ) : null}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Statistiques</h2>
          <p className="mt-2 text-sm text-gray-600">Streak: -</p>
          <p className="mt-1 text-sm text-gray-600">Jours terminés: -</p>
          <p className="mt-1 text-sm text-gray-600">Points: -</p>
        </section>

        {profile?.isGuest ? (
          <Link
            href="/login"
            className="block w-full rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Se connecter (optionnel)
          </Link>
        ) : (
          <button
            onClick={logout}
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Se deconnecter
          </button>
        )}
      </div>
    </main>
  );
}
