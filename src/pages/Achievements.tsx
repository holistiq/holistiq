/**
 * Achievements Page
 *
 * Displays all user achievements and progress
 */
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AchievementCard } from "@/components/achievements/AchievementCard";
import { AchievementNotification } from "@/components/achievements/AchievementNotification";
import { BadgeManagement } from "@/components/achievements/BadgeManagement";
import { getUserAchievements, invalidateAchievementsCache } from "@/services/achievementService";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { AuthenticationRequired } from "@/components/auth/AuthenticationRequired";
import { useUserBadges } from "@/hooks/useUserBadges";
import {
  AchievementCategory,
  AchievementDifficulty,
  AchievementStatus,
  AchievementWithProgress
} from "@/types/achievement";
import { Trophy, Search, Filter, Medal, Award, RefreshCw } from "lucide-react";

export default function Achievements() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { loading: badgesLoading } = useUserBadges();
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementWithProgress | null>(null);

  // Coordinated loading state
  const isLoading = authLoading || loading || badgesLoading;

  // Use state to track cache status
  const [isFromCache, setIsFromCache] = useState(false);

  // Use refs for tracking fetch status, previous user ID, and cache status
  const isFetchingRef = useRef(false);
  const prevUserIdRef = useRef<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const cacheExpiryTimeRef = useRef<number>(0);

  // Cache TTL in milliseconds (30 minutes)
  const CACHE_TTL = 30 * 60 * 1000;

  // Enable debug logging in development
  const enableDebugLogging = process.env.NODE_ENV === 'development';

  // Simplified data fetching
  useEffect(() => {
    async function fetchAchievements() {
      if (!user || isFetchingRef.current) return;

      const userId = user.id;
      const userChanged = userId !== prevUserIdRef.current;

      // Skip fetch if user hasn't changed and we have data
      if (!userChanged && achievements.length > 0) {
        if (enableDebugLogging) {
          console.log('[Achievements Component] Using existing data - skipping fetch');
        }
        setIsFromCache(true);
        return;
      }

      // Update the previous user ID
      prevUserIdRef.current = userId;

      // Set fetching flag
      isFetchingRef.current = true;
      setLoading(true);
      setIsFromCache(false);

      try {
        if (enableDebugLogging) {
          console.log(`[Achievements Component] Fetching achievements for user ${userId}`);
        }

        // Use the cached service which handles caching internally
        const response = await getUserAchievements(userId);

        if (response.success && response.achievements) {
          setAchievements(response.achievements);
          setIsFromCache(false);
        }
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }

    // Only fetch when user is available
    if (user) {
      fetchAchievements();
    }
  }, [user?.id]);



  // Filter achievements
  const filteredAchievements = achievements.filter(achievement => {
    // Search filter
    const matchesSearch = searchQuery === "" ||
      achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = selectedCategory === "all" ||
      achievement.category === selectedCategory;

    // Difficulty filter
    const matchesDifficulty = selectedDifficulty === "all" ||
      achievement.difficulty === selectedDifficulty;

    // Status filter
    const matchesStatus = selectedStatus === "all" ||
      achievement.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
  });

  // Group achievements by category
  const groupedAchievements = filteredAchievements.reduce<Record<string, AchievementWithProgress[]>>(
    (groups, achievement) => {
      const category = achievement.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(achievement);
      return groups;
    },
    {}
  );

  // Calculate achievement stats
  const totalAchievements = achievements.length;
  const completedAchievements = achievements.filter(a => a.status === AchievementStatus.COMPLETED).length;
  const inProgressAchievements = achievements.filter(a => a.status === AchievementStatus.IN_PROGRESS).length;
  const totalPoints = achievements.reduce((sum, a) => sum + (a.status === AchievementStatus.COMPLETED ? a.points : 0), 0);
  const completionPercentage = totalAchievements > 0
    ? Math.round((completedAchievements / totalAchievements) * 100)
    : 0;

  // Handle achievement click
  const handleAchievementClick = (achievement: AchievementWithProgress) => {
    setSelectedAchievement(achievement);
  };

  // Force refresh achievements data
  const refreshAchievements = async () => {
    if (!user || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);
    setIsFromCache(false);

    try {
      if (enableDebugLogging) {
        console.log('[Achievements Component] Manually refreshing achievements data');
      }

      // Invalidate the cache first
      const userId = user.id;
      invalidateAchievementsCache(userId);

      // Also clear localStorage cache
      const cacheKey = `achievements_${userId}_all`;
      localStorage.removeItem(`holistiq_cache_${cacheKey}`);

      // Reset cache expiry time
      cacheExpiryTimeRef.current = 0;

      // Fetch fresh data
      const response = await getUserAchievements(userId);
      if (response.success && response.achievements) {
        setAchievements(response.achievements);

        // Update cache expiry time
        const now = Date.now();
        lastFetchTimeRef.current = now;
        cacheExpiryTimeRef.current = now + CACHE_TTL;

        // Store in localStorage as a backup
        try {
          localStorage.setItem(`holistiq_cache_${cacheKey}`, JSON.stringify({
            value: response,
            created: now,
            expiry: now + CACHE_TTL
          }));
        } catch (e) {
          console.error('Error caching achievements in localStorage:', e);
        }

        if (enableDebugLogging) {
          console.log(`[Achievements Component] Refresh complete, fetched ${response.achievements.length} achievements`);
        }
      }
    } catch (error) {
      console.error('Error refreshing achievements:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Lightweight loading skeleton for fast initial render
  const renderLoadingSkeleton = () => (
    <div className="container max-w-4xl py-10">
      {/* Simple loading indicator */}
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    </div>
  );

  // Render content
  const renderContent = () => (
    <div className="container max-w-4xl py-10">
      {/* Badge Management */}
      <BadgeManagement achievements={achievements} />

      {/* Achievement Stats */}
      <Card className="my-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle>Your Achievements</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isFromCache && (
                <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span>Cached</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAchievements}
                disabled={isFetchingRef.current}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${isFetchingRef.current ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
          <CardDescription>
            Track your progress and unlock new achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Completed */}
            <div className="bg-muted/30 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <Medal className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <p className="text-2xl font-bold">{completedAchievements}</p>
              <p className="text-xs text-muted-foreground">
                of {totalAchievements} achievements
              </p>
            </div>

            {/* In Progress */}
            <div className="bg-muted/30 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">In Progress</span>
              </div>
              <p className="text-2xl font-bold">{inProgressAchievements}</p>
              <p className="text-xs text-muted-foreground">
                achievements started
              </p>
            </div>

            {/* Completion */}
            <div className="bg-muted/30 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Completion</span>
              </div>
              <p className="text-2xl font-bold">{completionPercentage}%</p>
              <p className="text-xs text-muted-foreground">
                of all achievements
              </p>
            </div>

            {/* Total Points */}
            <div className="bg-muted/30 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Total Points</span>
              </div>
              <p className="text-2xl font-bold">{totalPoints}</p>
              <p className="text-xs text-muted-foreground">
                achievement points
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Achievement Collection</CardTitle>
              <CardDescription>
                {filteredAchievements.length} achievements found
              </CardDescription>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search achievements..."
                className="pl-8 w-full sm:w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>

            {/* Category filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-8 text-xs w-[130px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value={AchievementCategory.TESTING}>Testing</SelectItem>
                <SelectItem value={AchievementCategory.SUPPLEMENTS}>Supplements</SelectItem>
                <SelectItem value={AchievementCategory.ENGAGEMENT}>Engagement</SelectItem>
              </SelectContent>
            </Select>

            {/* Difficulty filter */}
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="h-8 text-xs w-[130px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value={AchievementDifficulty.EASY}>Easy</SelectItem>
                <SelectItem value={AchievementDifficulty.MEDIUM}>Medium</SelectItem>
                <SelectItem value={AchievementDifficulty.HARD}>Hard</SelectItem>
                <SelectItem value={AchievementDifficulty.EXPERT}>Expert</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-8 text-xs w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={AchievementStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={AchievementStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={AchievementStatus.LOCKED}>Locked</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset filters */}
            {(selectedCategory !== "all" || selectedDifficulty !== "all" || selectedStatus !== "all" || searchQuery !== "") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedDifficulty("all");
                  setSelectedStatus("all");
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {filteredAchievements.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-medium mb-1">No achievements found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="by-category">By Category</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {filteredAchievements.map(achievement => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    onClick={handleAchievementClick}
                  />
                ))}
              </TabsContent>

              <TabsContent value="by-category">
                {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-lg font-medium mb-3 capitalize">
                      {category.replace('_', ' ')}
                    </h3>
                    <div className="space-y-4">
                      {categoryAchievements.map(achievement => (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                          onClick={handleAchievementClick}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Achievement notification for demo purposes */}
      {selectedAchievement && (
        <AchievementNotification
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  );

  // Simple loading state like other pages
  if (isLoading) {
    return (
      <AuthenticationRequired>
        {renderLoadingSkeleton()}
      </AuthenticationRequired>
    );
  }

  // Render content when loaded
  return (
    <AuthenticationRequired>
      {renderContent()}
    </AuthenticationRequired>
  );
}
