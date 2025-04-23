import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="container py-12 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <div><strong>Email:</strong> {user.email}</div>
              {/* Add more user info here if desired */}
              <Button variant="outline" onClick={handleLogout} className="mt-4">Log Out</Button>
            </div>
          ) : (
            <div className="text-muted-foreground">No user info available.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
