
import { Bell, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { useEffect, useState } from "react";

export function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // This would be replaced with actual auth logic in a real app
  useEffect(() => {
    // Check for auth status (simplified for MVP)
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-nootrack-400 to-nootrack-600 dark:from-nootrack-300 dark:to-nootrack-500">
            NooTrack
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
              </Button>
              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
