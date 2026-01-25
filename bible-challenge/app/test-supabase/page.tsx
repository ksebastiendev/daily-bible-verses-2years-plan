"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>("Checking...");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setStatus("Error checking session");
          return;
        }

        if (data.session) {
          const email = data.session.user?.email || "unknown user";
          setStatus(`Logged in: ${email}`);
        } else {
          setStatus("Not logged in");
        }
      } catch (err) {
        setStatus("Error checking session");
      }
    };

    checkSession();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Supabase Test</h1>
      <p>{status}</p>
    </div>
  );
}
