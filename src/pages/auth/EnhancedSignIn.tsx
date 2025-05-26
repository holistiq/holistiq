import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { clearLogoutIntent, shouldShowSignedOutWarning } from "@/utils/auth";
import { Activity, Brain, Pill, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function EnhancedSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const location = useLocation();
  const { signInWithGoogle } = useSupabaseAuth();

  // Animation effect when component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for message in location state
  useEffect(() => {
    if (location.state?.message) {
      // Only show the message if it's not after a manual logout
      if (shouldShowSignedOutWarning()) {
        setMessage(location.state.message);
      } else {
        // Clear the logout intent since we've handled it
        clearLogoutIntent();
      }
    }
  }, [location.state]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hidden title for accessibility */}
      <h1 className="sr-only">Sign In to Holistiq</h1>

      {/* Minimal navigation bar */}
      <nav className="w-full px-4 sm:px-6 py-4 flex items-center justify-between bg-background/50 backdrop-blur-sm border-b border-border/10 z-50">
        <Link
          to="/"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 relative group"
        >
          <span>Home</span>
          <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 relative group"
          >
            <span>How It Works</span>
            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
          </Link>
          <Link
            to="/faq"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 relative group"
          >
            <span>FAQ</span>
            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
          </Link>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left side - Illustration area (hidden on mobile) */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/10 to-primary/30 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute top-0 left-0 w-full h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25px 25px, rgba(var(--foreground), 0.1) 2%, transparent 0%)",
                backgroundSize: "50px 50px",
              }}
            ></div>
          </div>

          {/* Content container with z-index to ensure proper layering */}
          <div className="absolute inset-0 flex flex-col justify-between z-10 p-8">
            {/* Empty top section for balanced spacing */}
            <div className="h-8"></div>

            {/* Middle section with animated elements */}
            <div className="flex-1 relative">
              {/* Brain illustration with animation */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary/80 animate-pulse-slow">
                <Brain size={180} strokeWidth={1} />
              </div>

              {/* Floating pill elements */}
              <div className="absolute top-1/4 right-1/4 text-primary/60 animate-float-slow">
                <Pill size={40} strokeWidth={1} />
              </div>
              <div className="absolute bottom-1/3 left-1/3 text-primary/40 animate-float-medium">
                <Pill size={32} strokeWidth={1} className="rotate-45" />
              </div>
              <div className="absolute top-1/3 left-1/5 text-primary/50 animate-float-fast">
                <Pill size={24} strokeWidth={1} className="-rotate-12" />
              </div>

              {/* Activity graph */}
              <div className="absolute bottom-1/4 right-1/3 text-primary/70 animate-float-medium">
                <Activity size={48} strokeWidth={1} />
              </div>

              {/* Sparkles */}
              <div className="absolute top-1/5 right-1/5 text-primary/60 animate-spin-slow">
                <Sparkles size={28} strokeWidth={1} />
              </div>
              <div className="absolute bottom-1/5 left-1/4 text-primary/50 animate-spin-slow">
                <Sparkles size={20} strokeWidth={1} />
              </div>
            </div>

            {/* Bottom section with enhanced text content */}
            <div className="mt-auto">
              <div className="bg-background/20 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-lg animate-slide-up">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full p-2 mt-1">
                    <Activity size={24} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-2 text-foreground">
                      Track Your Cognitive Performance
                    </h2>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      Discover if your supplements are actually working with
                      data-driven insights and standardized cognitive
                      assessments.
                    </p>
                    <div className="flex items-center mt-4 text-sm text-foreground/80">
                      <Sparkles size={16} className="mr-2 text-primary" />
                      <span>Evidence-based supplement tracking</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Sign in form */}
        <div
          className={`flex-1 flex items-center justify-center p-6 transition-opacity duration-500 ease-in-out ${mounted ? "opacity-100" : "opacity-0"} bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden`}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute top-0 left-0 w-full h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25px 25px, rgba(var(--primary), 0.15) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(var(--primary), 0.15) 2%, transparent 0%)",
                backgroundSize: "100px 100px",
              }}
            ></div>
          </div>

          <div className="w-full max-w-md relative z-10">
            <Card className="border border-border/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm bg-card/95 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <CardHeader className="space-y-3 pb-6">
                <div className="flex items-center justify-center mb-3 text-primary">
                  <Brain size={36} className="mr-2" />
                  <span className="text-2xl font-bold">Holistiq</span>
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                  Welcome to Holistiq
                </CardTitle>
                <CardDescription className="text-center px-2">
                  Track your cognitive performance and discover what works for
                  you
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 px-6">
                {message && (
                  <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md animate-fade-in border border-red-100">
                    {message}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-medium">
                    Sign in or create your account
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    New users will be automatically registered when signing in
                    with Google for the first time.
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                  <div className="flex gap-3 items-start">
                    <div className="mt-0.5 text-primary">
                      <Sparkles size={18} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Holistiq helps you track the effectiveness of supplements
                      on your cognitive performance through standardized tests
                      and data analysis.
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-5 pt-2 px-6 pb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm text-muted-foreground"
                  >
                    Remember me on this device
                  </Label>
                </div>

                <Button
                  type="button"
                  variant="default"
                  className="w-full flex items-center justify-center gap-2 py-6 bg-white text-black hover:bg-gray-50 border border-gray-200 transition-all duration-300 hover:shadow-md relative overflow-hidden group"
                  disabled={isLoading}
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      console.log(
                        "Starting Google sign-in with remember me:",
                        rememberMe,
                      );

                      await signInWithGoogle(rememberMe);

                      // The page will be redirected by Supabase OAuth flow
                      // If we reach here, it means there was no immediate redirect
                      console.log("Waiting for redirect...");
                    } catch (error) {
                      console.error("Unexpected error:", error);
                      setIsLoading(false);
                      setMessage(
                        "Failed to sign in with Google: " +
                          (error as Error).message,
                      );
                    }
                  }}
                >
                  {/* Subtle hover effect */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>

                  <div className="flex items-center justify-center relative z-10">
                    <div className="bg-white p-1 rounded-full mr-3 shadow-sm">
                      <svg width="20" height="20" viewBox="0 0 48 48">
                        <g>
                          <path
                            fill="#4285F4"
                            d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.2-5.5 7-10.3 7-6.1 0-11-4.9-11-11s4.9-11 11-11c2.6 0 5 .9 6.8 2.4l6.4-6.4C36.2 7.1 30.4 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.5-.3-3.5z"
                          />
                          <path
                            fill="#34A853"
                            d="M6.3 14.1l6.6 4.8C15.1 16.2 19.2 13 24 13c2.6 0 5 .9 6.8 2.4l6.4-6.4C36.2 7.1 30.4 5 24 5c-7.3 0-13.7 3.3-17.7 8.1z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M24 45c6.4 0 12.2-2.1 16.5-5.7l-7.6-6.2C30.9 35.1 27.6 36 24 36c-4.7 0-8.7-2.8-10.3-7H6.3C10.3 41.7 16.7 45 24 45z"
                          />
                          <path
                            fill="#EA4335"
                            d="M43.6 20.5h-1.9V20H24v8h11.3c-1.1 2.8-3.1 5.2-5.9 6.8l7.6 6.2C41.2 39.1 44 32.9 44 25c0-1.3-.1-2.5-.4-3.5z"
                          />
                        </g>
                      </svg>
                    </div>
                    <span className="font-medium">
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        "Continue with Google"
                      )}
                    </span>
                  </div>
                </Button>

                <div className="text-xs text-center text-muted-foreground pt-2">
                  By continuing, you agree to our{" "}
                  <Link
                    to="/terms"
                    className="text-primary underline-offset-4 hover:underline transition-colors"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-primary underline-offset-4 hover:underline transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
