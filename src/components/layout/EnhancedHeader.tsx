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
  Trophy,
  HelpCircle,
  LogIn,
  Info
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Enhanced Header component that combines the header and navigation into a single, cohesive component
 * Eliminates redundancy and provides a cleaner user experience
 */
export function EnhancedHeader() {
  const { user, signOut } = useSupabaseAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Navigation items for authenticated users
  const mainNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Tests', href: '/tests', icon: <Brain className="h-4 w-4" /> },
    { label: 'Supplements', href: '/supplements', icon: <Pill className="h-4 w-4" /> },
    { label: 'Factors', href: '/confounding-factors', icon: <Activity className="h-4 w-4" /> },
    { label: 'Achievements', href: '/achievements', icon: <Trophy className="h-4 w-4" /> },
  ];

  // Navigation items for unauthenticated users
  const publicNavItems = [
    { label: 'How It Works', href: '/how-it-works', icon: <Info className="h-4 w-4" /> },
    { label: 'FAQ', href: '/faq', icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center gap-2">
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-nootrack-400 to-nootrack-600 dark:from-nootrack-300 dark:to-nootrack-500">
            Holistiq
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-4">
          {/* Main Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {user 
              ? mainNavItems.map((item) => (
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
                ))
              : publicNavItems.map((item) => (
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
                ))
            }
          </div>

          {/* User Menu or Auth Buttons */}
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="User profile">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full cursor-pointer">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="w-full cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/signin" className="hidden sm:block">
                  <Button variant="outline" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/signin" className="hidden sm:block">
                  <Button size="sm">Get Started</Button>
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
                      {/* Authenticated User Mobile Menu */}
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
                      <SheetClose asChild>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted text-left w-full"
                        >
                          <LogIn className="h-4 w-4 rotate-180" />
                          Sign Out
                        </button>
                      </SheetClose>
                    </>
                  ) : (
                    <>
                      {/* Public Routes for Mobile */}
                      {publicNavItems.map((item) => (
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
      </div>
    </header>
  );
}
