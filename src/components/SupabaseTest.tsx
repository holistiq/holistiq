import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SupabaseTest() {
  const [status, setStatus] = useState<string>("Not tested");
  
  const testConnection = async () => {
    try {
      setStatus("Testing...");
      
      // Test Supabase connection with a public endpoint
      const { data, error } = await supabase
        .from('users')
        .select('count()', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.error("Supabase query error:", error);
        setStatus(`Error: ${error.message}`);
        return;
      }
      
      console.log("Supabase query result:", data);
      setStatus("Connection successful!");
      
    } catch (error) {
      console.error("Unexpected error:", error);
      setStatus(`Unexpected error: ${(error as Error).message}`);
    }
  };
  
  const testAuth = async () => {
    try {
      setStatus("Testing auth...");
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth error:", error);
        setStatus(`Auth error: ${error.message}`);
        return;
      }
      
      if (data.session) {
        console.log("Session found:", data.session);
        setStatus(`Authenticated as: ${data.session.user.email}`);
      } else {
        console.log("No session found");
        setStatus("Not authenticated (expected before login)");
      }
      
    } catch (error) {
      console.error("Unexpected error:", error);
      setStatus(`Unexpected error: ${(error as Error).message}`);
    }
  };
  
  return (
    <div className="p-4 border rounded-md mb-4">
      <h3 className="font-medium mb-2">Supabase Connection Test</h3>
      <div className="mb-2">Status: <span className="font-mono">{status}</span></div>
      <div className="flex gap-2">
        <Button onClick={testConnection} variant="outline" size="sm">
          Test Connection
        </Button>
        <Button onClick={testAuth} variant="outline" size="sm">
          Test Auth
        </Button>
      </div>
    </div>
  );
}
