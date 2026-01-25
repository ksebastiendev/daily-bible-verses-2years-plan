import { supabase } from "@/lib/supabase/client";

export interface AuthResult {
  session: any;
  user: any;
}

/**
 * Check if user is authenticated and return session + user data
 * Call this from client components to verify authentication
 */
export async function requireAuth(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return {
      session: null,
      user: null,
    };
  }

  return {
    session: data.session,
    user: data.session.user,
  };
}
