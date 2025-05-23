import { useState, useEffect, useRef } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TestPreferences } from "@/components/tests/TestPreferences";
import { PrefetchControl } from "@/components/prefetch/PrefetchControl";
import { CacheSyncControl } from "@/components/cache/CacheSyncControl";
import { toast } from "@/components/ui/use-toast";
import {
  Loader2, Home, ChevronRight, User, Settings, Activity,
  Camera, Check, AlertCircle, Trophy, Calendar, Clock, Upload,
  Mail, Moon, Image, LogOut, Brain, Database, Layers
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function EnhancedProfile() {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State variables
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [userStats, setUserStats] = useState({
    testsTaken: 0,
    supplementsLogged: 0,
    lastActive: "",
    daysActive: 0,
    completionRate: 0
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Set initial tab based on URL parameter
  const initialTab = searchParams.get('tab') || 'personal';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Fetch user profile data
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // Set user profile data
        if (data) {
          setDisplayName(data.display_name || "");
          setAvatarUrl(data.avatar_url || "");

          // Parse settings if available
          if (data.settings) {
            setEmailNotifications(data.settings.email_notifications ?? true);
            setDarkMode(data.settings.dark_mode ?? false);
          }
        }

        // Fetch user statistics
        const [testsResult, supplementsResult] = await Promise.all([
          supabase.from('test_results').select('*', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('supplements').select('*', { count: 'exact' }).eq('user_id', user.id)
        ]);

        // Calculate days active (placeholder calculation)
        const daysActive = Math.floor(Math.random() * 30) + 1;
        const completionRate = Math.floor(Math.random() * 60) + 40;

        setUserStats({
          testsTaken: testsResult.count || 0,
          supplementsLogged: supplementsResult.count || 0,
          lastActive: new Date().toLocaleDateString(),
          daysActive,
          completionRate
        });

      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Update URL when tab changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', activeTab);
    navigate({ search: newSearchParams.toString() }, { replace: true });
  }, [activeTab, navigate, searchParams]);

  // Reset success message after delay
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
          settings: {
            email_notifications: emailNotifications,
            dark_mode: darkMode
          }
        })
        .eq('id', user.id);

      if (error) throw error;

      setSaveSuccess(true);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real implementation, you would upload the file to storage
      // For now, we'll just create a local URL
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    }
  };

  if (isLoading && !user) {
    return (
      <div className="container py-12 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 sm:py-8 md:py-10 max-w-6xl px-4 sm:px-6 md:px-8 relative pb-20 sm:pb-6 md:pb-10">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-muted-foreground mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-2">
        <Home size={14} className="text-muted-foreground/70 flex-shrink-0" />
        <ChevronRight size={14} className="mx-1 text-muted-foreground/50 flex-shrink-0" />
        <span className="flex-shrink-0">Account</span>
        <ChevronRight size={14} className="mx-1 text-muted-foreground/50 flex-shrink-0" />
        <span className="font-medium text-foreground flex-shrink-0">Profile</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        {/* Left column - User info */}
        <div className="w-full lg:w-2/5 xl:w-1/3 space-y-6 mb-6 lg:mb-0">
          {/* Profile Card */}
          <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="bg-gradient-to-r from-primary/20 to-primary/10 h-36 relative">
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                <div className="relative group">
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={avatarUrl} alt={displayName || user?.email || "User"} />
                    <AvatarFallback className="text-xl sm:text-2xl bg-primary/20">
                      {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-40 transition-all duration-200 flex items-center justify-center cursor-pointer"
                    onClick={handleAvatarClick}
                    aria-label="Upload profile picture"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleAvatarClick();
                      }
                    }}
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    aria-label="Upload profile picture"
                  />
                </div>
              </div>
            </div>
            <CardContent className="pt-20 pb-6 px-6">
              <div className="text-center mb-8">
                <h3 className="font-bold text-2xl mb-1">{displayName || "User"}</h3>
                <p className="text-sm text-muted-foreground/80 tracking-wide">{user?.email}</p>
                {userStats.daysActive > 0 && (
                  <Badge variant="outline" className="mt-3 bg-primary/15 hover:bg-primary/20 py-1.5 px-3 transition-colors duration-200">
                    <Trophy className="h-3.5 w-3.5 mr-1.5 text-primary" />
                    <span className="font-medium">Active for {userStats.daysActive} days</span>
                  </Badge>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-lg border border-border/30">
                  <h4 className="font-medium text-base flex items-center mb-5">
                    <Activity size={18} className="mr-2.5 text-primary" />
                    Account Activity
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:gap-5 text-sm">
                    <div className="bg-background/80 p-3 sm:p-4 rounded-md border border-border/20 transition-all duration-200 hover:border-border/50 hover:shadow-sm hover:-translate-y-0.5">
                      <p className="text-muted-foreground mb-1 sm:mb-2 text-[13px] sm:text-[14px] font-medium tracking-wide">Tests Taken</p>
                      <p className="font-semibold text-lg sm:text-xl">{userStats.testsTaken}</p>
                    </div>
                    <div className="bg-background/80 p-3 sm:p-4 rounded-md border border-border/20 transition-all duration-200 hover:border-border/50 hover:shadow-sm hover:-translate-y-0.5">
                      <p className="text-muted-foreground mb-1 sm:mb-2 text-[13px] sm:text-[14px] font-medium tracking-wide">Supplements</p>
                      <p className="font-semibold text-lg sm:text-xl">{userStats.supplementsLogged}</p>
                    </div>

                    <div className="col-span-2 mt-1">
                      <Separator className="my-4 bg-border/40" />
                    </div>

                    <div className="col-span-2 bg-background/80 p-3 sm:p-4 rounded-md border border-border/20 transition-all duration-200 hover:border-border/50 hover:shadow-sm">
                      <div className="flex justify-between mb-1.5 sm:mb-2">
                        <p className="text-muted-foreground text-[13px] sm:text-[14px] font-medium tracking-wide">Profile Completion</p>
                        <p className="text-[13px] sm:text-[14px] font-semibold">{userStats.completionRate}%</p>
                      </div>
                      <div className="relative">
                        <Progress
                          value={userStats.completionRate}
                          className="h-2 sm:h-2.5 rounded-full animate-pulse-slow"
                          style={{
                            background: 'linear-gradient(to right, #e2e8f0, #e2e8f0)',
                            '--tw-gradient-from': userStats.completionRate < 30 ? '#e2e8f0' :
                                                userStats.completionRate < 70 ? '#c4b5fd' : '#8b5cf6'
                          }}
                          aria-label={`Profile completion: ${userStats.completionRate}%`}
                        />
                        <style jsx>{`
                          @keyframes pulse-slow {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.85; }
                          }
                          .animate-pulse-slow {
                            animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                          }
                        `}</style>
                      </div>
                      <div className="h-1 sm:h-0"></div> {/* Extra space on mobile */}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 px-6 pt-2 pb-6 border-t border-border/20 mt-2">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full border-border/30 hover:bg-muted/30 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:ring-offset-1"
              >
                <LogOut size={16} className="mr-2 opacity-70" />
                Sign Out
              </Button>
              <DeleteAccountButton className="w-full" />
            </CardFooter>
          </Card>
        </div>

        {/* Right column - Settings */}
        <div className="w-full lg:w-3/5 xl:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8 bg-muted/40 p-1.5 rounded-lg">
              <TabsTrigger
                value="personal"
                className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-300 px-5 py-2.5 data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                <User size={16} className="mr-2.5" />
                Personal Info
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-300 px-5 py-2.5 data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                <Settings size={16} className="mr-2.5" />
                Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-0 transition-all duration-300 animate-in fade-in-50 slide-in-from-left-5 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-left-5">
              <Card className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-4 pt-6 px-8">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User size={20} className="text-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-sm mt-1.5">Update your personal details and profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6 px-8">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-medium tracking-wide">Email Address</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-muted/30 pl-10 h-11 rounded-md"
                        aria-label="Email address (cannot be changed)"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Mail size={18} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center">
                      <AlertCircle size={12} className="mr-1.5" />
                      Email cannot be changed. Contact support for assistance.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="displayName" className="text-sm font-medium tracking-wide">Display Name</Label>
                    <div className="relative">
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                        className="pl-10 transition-all duration-200 border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 h-11 rounded-md"
                        aria-label="Display name"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <User size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="avatarUrl" className="text-sm font-medium tracking-wide">Profile Picture URL</Label>
                    <div className="relative">
                      <Input
                        id="avatarUrl"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="pl-10 transition-all duration-200 border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 h-11 rounded-md"
                        aria-label="Profile picture URL"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Image size={18} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-sm text-muted-foreground">
                        Enter a URL or upload an image directly
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs border-primary/30 hover:bg-primary/5 transition-colors duration-200"
                        onClick={handleAvatarClick}
                      >
                        <Upload size={14} className="mr-1.5" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-border/20 py-5 px-8">
                  <div className={cn(
                    "transition-all duration-300 flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md",
                    saveSuccess ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}>
                    <Check size={18} className="text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400 font-medium">Changes saved successfully</span>
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="relative overflow-hidden group bg-primary hover:bg-primary/90 text-white px-6 h-10 rounded-md transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
                  >
                    <span className={cn(
                      "inline-flex items-center transition-all duration-300 transform",
                      isSaving ? "opacity-0 scale-95" : "opacity-100 scale-100"
                    )}>
                      <Check size={16} className="mr-2" />
                      Save Changes
                    </span>
                    <span className={cn(
                      "absolute inset-0 flex items-center justify-center transition-all duration-300 transform",
                      isSaving ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    )}>
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </span>
                    <span className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="mt-0 transition-all duration-300 animate-in fade-in-50 slide-in-from-right-5 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-right-5">
              <Card className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-4 pt-6 px-8">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Settings size={20} className="text-primary" />
                    Preferences
                  </CardTitle>
                  <CardDescription className="text-sm mt-1.5">Customize your application settings and experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 px-8">
                  <div className="flex items-center justify-between p-5 rounded-lg bg-muted/30 border border-border/30 transition-all duration-200 hover:border-border/50 hover:shadow-sm">
                    <div className="space-y-2">
                      <Label htmlFor="emailNotifications" className="text-base font-medium flex items-center">
                        <Mail size={18} className="mr-2.5 text-primary" />
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                        Receive email updates about your account activity, test results, and important announcements
                      </p>
                    </div>
                    <div className="ml-4">
                      <Switch
                        id="emailNotifications"
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                        className="data-[state=checked]:bg-primary scale-125"
                        aria-label="Toggle email notifications"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-lg bg-muted/30 border border-border/30 transition-all duration-200 hover:border-border/50 hover:shadow-sm">
                    <div className="space-y-2">
                      <Label htmlFor="darkMode" className="text-base font-medium flex items-center">
                        <Moon size={18} className="mr-2.5 text-primary" />
                        Dark Mode
                      </Label>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                        Switch to a darker color theme that's easier on your eyes in low-light environments
                      </p>
                    </div>
                    <div className="ml-4">
                      <Switch
                        id="darkMode"
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                        className="data-[state=checked]:bg-primary scale-125"
                        aria-label="Toggle dark mode"
                      />
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={18} className="text-primary" />
                      <h3 className="text-base font-medium">Test Preferences</h3>
                    </div>
                    <TestPreferences />
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Database size={18} className="text-primary" />
                      <h3 className="text-base font-medium">Performance Optimization</h3>
                    </div>
                    <PrefetchControl />
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers size={18} className="text-primary" />
                      <h3 className="text-base font-medium">Multi-Tab Synchronization</h3>
                    </div>
                    <CacheSyncControl />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-border/20 py-5 px-8">
                  <div className={cn(
                    "transition-all duration-300 flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md",
                    saveSuccess ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}>
                    <Check size={18} className="text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400 font-medium">Preferences saved successfully</span>
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="relative overflow-hidden group bg-primary hover:bg-primary/90 text-white px-6 h-10 rounded-md transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
                  >
                    <span className={cn(
                      "inline-flex items-center transition-all duration-300 transform",
                      isSaving ? "opacity-0 scale-95" : "opacity-100 scale-100"
                    )}>
                      <Check size={16} className="mr-2" />
                      Save Preferences
                    </span>
                    <span className={cn(
                      "absolute inset-0 flex items-center justify-center transition-all duration-300 transform",
                      isSaving ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    )}>
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </span>
                    <span className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border/30 p-4 flex justify-center sm:hidden z-50">
        <Button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="relative overflow-hidden group bg-primary hover:bg-primary/90 text-white px-6 py-6 h-12 w-full max-w-md rounded-md transition-all duration-300 shadow-lg"
        >
          <span className={cn(
            "inline-flex items-center justify-center transition-all duration-300 transform",
            isSaving ? "opacity-0 scale-95" : "opacity-100 scale-100"
          )}>
            <Check size={18} className="mr-2" />
            Save All Changes
          </span>
          <span className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-300 transform",
            isSaving ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}>
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        </Button>
      </div>
    </div>
  );
}
