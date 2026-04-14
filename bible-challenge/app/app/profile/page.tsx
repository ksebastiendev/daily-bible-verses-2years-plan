"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getOrCreateGuestDeviceId } from "@/lib/guest/session";

interface ProfileState {
  email: string;
  id: string;
  isGuest: boolean;
  emailVerified: boolean;
  username: string;
  phone: string;
  location: string;
  points: number;
  streak: number;
  isEligibleForLeaderboard: boolean;
  isEligibleForRewards: boolean;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [form, setForm] = useState({ username: "", phone: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
          emailVerified: false,
          username: "",
          phone: "",
          location: "",
          points: 0,
          streak: 0,
          isEligibleForLeaderboard: false,
          isEligibleForRewards: false,
        });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/profile");
        const body = await response.json().catch(() => ({}));

        if (!response.ok || !body?.data) {
          setProfile({
            email: session.user.email ?? "email indisponible",
            id: session.user.id,
            isGuest: false,
            emailVerified: false,
            username: "",
            phone: "",
            location: "",
            points: 0,
            streak: 0,
            isEligibleForLeaderboard: false,
            isEligibleForRewards: false,
          });
          setLoading(false);
          return;
        }

        setProfile({
          email: body.data.email ?? session.user.email ?? "email indisponible",
          id: body.data.id ?? session.user.id,
          isGuest: false,
          emailVerified: Boolean(body.data.emailVerified),
          username: body.data.username ?? "",
          phone: body.data.phone ?? "",
          location: body.data.location ?? "",
          points: body.data.points ?? 0,
          streak: body.data.streak ?? 0,
          isEligibleForLeaderboard: Boolean(body.data.isEligibleForLeaderboard),
          isEligibleForRewards: Boolean(body.data.isEligibleForRewards),
        });
        setForm({
          username: body.data.username ?? "",
          phone: body.data.phone ?? "",
          location: body.data.location ?? "",
        });
      } catch {
        setProfile({
          email: session.user.email ?? "email indisponible",
          id: session.user.id,
          isGuest: false,
          emailVerified: false,
          username: "",
          phone: "",
          location: "",
          points: 0,
          streak: 0,
          isEligibleForLeaderboard: false,
          isEligibleForRewards: false,
        });
      }

      setLoading(false);
    };

    run();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const saveProfile = async () => {
    if (!profile || profile.isGuest || saving) return;

    setSaving(true);
    setNotice(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          phone: form.phone,
          location: form.location,
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok || !body?.data) {
        setNotice(body?.error?.message ?? body?.error ?? "Impossible d'enregistrer le profil.");
        return;
      }

      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          username: body.data.username ?? "",
          phone: body.data.phone ?? "",
          location: body.data.location ?? "",
          points: body.data.points ?? prev.points,
          streak: body.data.streak ?? prev.streak,
          isEligibleForLeaderboard: Boolean(body.data.isEligibleForLeaderboard),
          isEligibleForRewards: Boolean(body.data.isEligibleForRewards),
        };
      });
      setForm({
        username: body.data.username ?? "",
        phone: body.data.phone ?? "",
        location: body.data.location ?? "",
      });
      setNotice("Profil mis a jour.");
    } catch {
      setNotice("Erreur reseau. Reessaie.");
    } finally {
      setSaving(false);
    }
  };

  const resendVerificationLink = async () => {
    if (!profile || profile.isGuest || sendingVerification || !profile.email.includes("@")) return;

    setSendingVerification(true);
    setNotice(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: profile.email,
      });

      if (error) {
        setNotice(error.message);
        return;
      }

      setNotice("Lien de verification envoye. Verifie ta boite mail.");
    } catch {
      setNotice("Erreur reseau. Reessaie.");
    } finally {
      setSendingVerification(false);
    }
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

          {!profile?.isGuest ? (
            <div className="mt-4 space-y-3">
              {!profile?.emailVerified ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                  <p className="font-medium">Verifie ton email pour debloquer le classement.</p>
                  <button
                    type="button"
                    onClick={resendVerificationLink}
                    disabled={sendingVerification}
                    className="mt-2 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {sendingVerification ? "Envoi..." : "Renvoyer le lien"}
                  </button>
                </div>
              ) : null}

              <label className="block">
                <span className="text-xs font-medium text-gray-700">Username (optionnel)</span>
                <input
                  value={form.username}
                  onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="ex: johndoe"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-700">Phone (optionnel)</span>
                <span className="mt-1 block text-[11px] text-gray-500">
                  Requis pour recevoir les recompenses Mobile Money.
                </span>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="ex: 22990000001"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-700">Localisation (optionnel)</span>
                <input
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  placeholder="ex: Cotonou"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </label>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-700">
                <p className="font-medium text-gray-800 mb-2">Acces classement &amp; recompenses</p>
                <ul className="space-y-1.5">
                  <li className={`flex items-center gap-2 ${profile?.emailVerified ? "text-green-700" : "text-amber-700"}`}>
                    <span>{profile?.emailVerified ? "✓" : "○"}</span>
                    <span>Email verifie{!profile?.emailVerified ? " — envoie le lien ci-dessus" : ""}</span>
                  </li>
                  <li className={`flex items-center gap-2 ${profile?.phone ? "text-green-700" : "text-amber-700"}`}>
                    <span>{profile?.phone ? "✓" : "○"}</span>
                    <span>Telephone Mobile Money{!profile?.phone ? " — ajoute ton numero ci-dessus" : ""}</span>
                  </li>
                  <li className={`flex items-center gap-2 ${profile?.location ? "text-green-700" : "text-amber-700"}`}>
                    <span>{profile?.location ? "✓" : "○"}</span>
                    <span>Localisation{!profile?.location ? " — indique ta ville ci-dessus" : ""}</span>
                  </li>
                </ul>
              </div>

              {notice ? <p className="text-xs text-gray-600">{notice}</p> : null}

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Statistiques</h2>
          <p className="mt-2 text-sm text-gray-600">Streak: {profile?.streak ?? 0}</p>
          <p className="mt-1 text-sm text-gray-600">Jours terminés: -</p>
          <p className="mt-1 text-sm text-gray-600">Points: {profile?.points ?? 0}</p>
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
