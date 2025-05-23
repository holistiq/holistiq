import { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import {
  LayoutDashboard,
  Brain,
  Pill,
  Activity,
  User,
  Menu,
  X,
  Trophy
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";

export function MainNavigation() {
  const { user } = useSupabaseAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const mainNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Tests', href: '/tests', icon: <Brain className="h-4 w-4" /> },
    { label: 'Supplements', href: '/supplements', icon: <Pill className="h-4 w-4" /> },
    { label: 'Factors', href: '/confounding-factors', icon: <Activity className="h-4 w-4" /> },
    { label: 'Achievements', href: '/achievements', icon: <Trophy className="h-4 w-4" /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="flex items-center gap-4">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        {user && mainNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
              isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      {/* Auth Buttons or User Menu */}
      <div className="flex items-center gap-2">
        {user ? (
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="User profile">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        ) : (
          <>
            <Link to="/how-it-works">
              <Button variant="outline" className="mr-2">How It Works</Button>
            </Link>
            <Link to="/signin">
              <Button>Sign In</Button>
            </Link>
          </>
        )}
        <ModeToggle />
      </div>

      {/* Mobile Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[250px] sm:w-[300px]">
          <div className="flex flex-col gap-6 py-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Menu</h2>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
            <div className="flex flex-col gap-4">
              {user ? (
                <>
                  {mainNavItems.map((item) => (
                    <SheetClose key={item.href} asChild>
                      <Link
                        to={item.href}
                        className={`flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <div className="h-px bg-border my-2" />
                  <SheetClose asChild>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </SheetClose>
                </>
              ) : (
                <>
                  {/* Public routes for unauthenticated users */}
                  <SheetClose asChild>
                    <Link
                      to="/how-it-works"
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted"
                      onClick={() => setIsOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      How It Works
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/faq"
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted"
                      onClick={() => setIsOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <path d="M12 17h.01" />
                      </svg>
                      FAQ
                    </Link>
                  </SheetClose>
                  <div className="h-px bg-border my-2" />
                  <SheetClose asChild>
                    <Link
                      to="/signin"
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Link>
                  </SheetClose>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
