
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulating account creation
    // In a real implementation, this would call an API endpoint
    setTimeout(() => {
      // For demo purposes, just store an auth token directly
      localStorage.setItem("authToken", "demo-token");
      
      // Redirect to the onboarding page after signup
      navigate("/onboarding");
      
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your email to create your NooTrack account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={async () => {
              await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: window.location.origin + "/dashboard",
                },
              });
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" className="mr-2" style={{ display: 'inline' }}>
              <g>
                <path fill="#4285F4" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.2-5.5 7-10.3 7-6.1 0-11-4.9-11-11s4.9-11 11-11c2.6 0 5 .9 6.8 2.4l6.4-6.4C36.2 7.1 30.4 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.5-.3-3.5z"/>
                <path fill="#34A853" d="M6.3 14.1l6.6 4.8C15.1 16.2 19.2 13 24 13c2.6 0 5 .9 6.8 2.4l6.4-6.4C36.2 7.1 30.4 5 24 5c-7.3 0-13.7 3.3-17.7 8.1z"/>
                <path fill="#FBBC05" d="M24 45c6.4 0 12.2-2.1 16.5-5.7l-7.6-6.2C30.9 35.1 27.6 36 24 36c-4.7 0-8.7-2.8-10.3-7H6.3C10.3 41.7 16.7 45 24 45z"/>
                <path fill="#EA4335" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.1 2.8-3.1 5.2-5.9 6.8l7.6 6.2C41.2 39.1 44 32.9 44 25c0-1.3-.1-2.5-.4-3.5z"/>
              </g>
            </svg>
            Continue with Google
          </Button>
        </CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => {
                  setTermsAccepted(checked as boolean);
                }}
                required
              />
              <label
                htmlFor="terms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{" "}
                <Link to="/terms" className="text-primary underline-offset-4 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !termsAccepted}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
