
import { Outlet, useLocation } from "react-router-dom";
import { EnhancedHeader } from "./EnhancedHeader";
import { Footer } from "./Footer";
import { Breadcrumbs } from "./Breadcrumbs";
import { TestResultsProvider } from "@/contexts/TestResultsContext";
import { DebugToggle } from "@/dev/debug";

export function Layout() {
  const location = useLocation();

  // Pages that should not show breadcrumbs
  const excludeBreadcrumbs = [
    // Home and public information pages
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

    // Dashboard is excluded as it's the root of the application
    '/dashboard',
  ];

  return (
    <TestResultsProvider>
      <div className="flex min-h-screen flex-col">
        <EnhancedHeader />
        <main className="flex-1">
          {!excludeBreadcrumbs.some(path => location.pathname === path ||
            (path.endsWith('*') && location.pathname.startsWith(path.slice(0, -1)))) && (
            <div className="container px-4 md:px-6 py-4">
              <Breadcrumbs />
            </div>
          )}
          <Outlet />
        </main>
        <Footer />
        <DebugToggle />
      </div>
    </TestResultsProvider>
  );
}
