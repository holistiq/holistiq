import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { AuthenticationRequired } from "./AuthenticationRequired";
import { useToast } from "@/components/ui/use-toast";

interface ProtectedRouteProps {
  children: ReactNode;
}

// List of routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/login',
  '/signup',
  '/how-it-works',
  '/faq',
  '/about-us',
  '/contact',
  '/terms',
  '/privacy',
  '/disclaimer',
  '/auth/callback',
  '/shared', // Public shared test results
  // Add NotFound page to public routes
  '*',
];

/**
 * ProtectedRoute component
 *
 * Wraps routes that require authentication.
 * If the user is not authenticated, they will be redirected to the sign-in page
 * with a message explaining why they were redirected.
 */
export function ProtectedRoute({ children }: Readonly<ProtectedRouteProps>) {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if the current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    if (route === '*') {
      // Special case for wildcard route
      return !PUBLIC_ROUTES.some(r => r !== '*' && location.pathname.startsWith(r));
    }
    return location.pathname === route || location.pathname.startsWith(`${route}/`);
  });

  // Effect to handle authentication check
  useEffect(() => {
    // Skip check for public routes
    if (isPublicRoute) {
      return;
    }

    // If not loading and user is not authenticated, show toast and redirect
    if (!loading && !user) {
      toast({
        title: "Authentication Required",
        description: "You need to be signed in to access this page.",
        variant: "destructive",
      });
    }
  }, [user, loading, navigate, isPublicRoute, toast]);

  // If it's a public route, render children directly
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, wrap with AuthenticationRequired
  return (
    <AuthenticationRequired
      message="You need to be signed in to access this page. Please sign in to continue."
    >
      {children}
    </AuthenticationRequired>
  );
}
