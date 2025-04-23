import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSupabaseAuth() {
  const [user, setUser] = useState<null | any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);
  return { user, loading };
}
