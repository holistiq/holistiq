import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Utility to parse hash fragment into an object
type AuthTokens = Record<string, string>;
function parseHashFragment(hash: string): AuthTokens {
  return hash
    .replace(/^#/, "")
    .split("&")
    .map((kv) => kv.split("="))
    .reduce((acc, [k, v]) => {
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {} as AuthTokens);
}

export default function MagicLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const { hash } = window.location;
    if (!hash) {
      navigate("/login");
      return;
    }
    const tokens = parseHashFragment(hash);
    if (tokens.access_token && tokens.refresh_token) {
      // Set the session in Supabase
      supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      }).then(({ error }) => {
        if (error) {
          navigate("/login", { state: { error: error.message } });
        } else {
          navigate("/dashboard");
        }
      });
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg font-semibold">Processing magic link...</div>
    </div>
  );
}
