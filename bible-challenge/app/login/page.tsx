"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sentEmail, setSentEmail] = useState("");

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Entre ton email");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage("Lien envoyé. Vérifie ta boîte mail.");
        setSentEmail(email.trim());
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!sentEmail) return;
    
    setEmail(sentEmail);
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: sentEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage("Lien renvoyé. Vérifie ta boîte mail.");
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Connexion
          </h1>
          <p className="text-gray-600 mb-6">
            Entre ton email. On t&apos;envoie un lien pour te connecter.
          </p>

          <form onSubmit={handleSendLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>
          </form>

          {sentEmail && (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || !sentEmail}
              className="w-full mt-3 bg-gray-100 text-gray-700 font-medium py-2.5 px-4 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Renvoyer le lien
            </button>
          )}

          <p className="text-sm text-gray-500 mt-4 text-center">
            Pense à vérifier tes spams.
          </p>

          {message && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
