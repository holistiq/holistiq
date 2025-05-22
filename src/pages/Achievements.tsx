/**
 * Achievements Page
 *
 * Displays all user achievements and progress
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { AchievementNotification } from "@/components/achievements/AchievementNotification";
import { BadgeManagement } from "@/components/achievements/BadgeManagement";
import { getUserAchievements } from "@/services/achievementService";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { AuthenticationRequired } from "@/components/auth/AuthenticationRequired";
import { useUserBadges } from "@/hooks/useUserBadges";
import {
  AchievementCategory,
  AchievementDifficulty,
  AchievementStatus,
  AchievementWithProgress
} from "@/types/achievement";
import { Trophy, Search, Filter, Medal, Award } from "lucide-react";

export default function Achievements() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { loading: badgesLoading } = useUserBadges();
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementWithProgress | null>(null);

  // Coordinated loading state
  const isLoading = authLoading || loading || badgesLoading;

  // Fetch user achievements
  useEffect(() => {
    async function fetchAchievements() {
      if (!user) return;

      setLoading(true);
      try {
        const response = await getUserAchievements(user.id);
        if (response.success && response.achievements) {
          setAchievements(response.achievements);
        }
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    }

    // Always fetch when user changes
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  // Handle content visibility with a slight delay to ensure smooth transition
  useEffect(() => {
    let timeoutId: number;

    if (!isLoading && achievements.length > 0) {
      // Delay showing content to ensure a smooth transition
      timeoutId = window.setTimeout(() => {
        setContentVisible(true);
      }, 300); // Increased delay to ensure data is ready
    } else {
      setContentVisible(false);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isLoading, achievements.length]);

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

  // Render loading skeleton with fixed heights to prevent layout shifts
  const renderLoadingSkeleton = () => (
    <div className="container max-w-4xl py-10">
      {/* Badge Management Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-full mt-1" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4 min-h-[56px]">
            {['badge1', 'badge2', 'badge3', 'badge4'].map((id) => (
              <Skeleton key={id} className="h-14 w-14 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Stats Skeleton */}
      <Card className="my-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-full mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['completed', 'inProgress', 'completion', 'points'].map((id) => (
              <Skeleton key={id} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement List Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-40 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-9 w-[200px]" />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-[130px]" />
            <Skeleton className="h-8 w-[130px]" />
            <Skeleton className="h-8 w-[130px]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['achievement1', 'achievement2', 'achievement3', 'achievement4', 'achievement5'].map((id) => (
              <Skeleton key={id} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render content with fade-in transition
  const renderContent = () => (
    <div
      className="container max-w-4xl py-10"
      style={{
        opacity: contentVisible ? 1 : 0,
        transition: 'opacity 300ms ease-in-out',
      }}
    >
      {/* Badge Management */}
      <BadgeManagement achievements={achievements} />

      {/* Achievement Stats */}
      <Card className="my-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <CardTitle>Your Achievements</CardTitle>
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
                <SelectItem value={AchievementCategory.TEST_COMPLETION}>Test Completion</SelectItem>
                <SelectItem value={AchievementCategory.TEST_CONSISTENCY}>Test Consistency</SelectItem>
                <SelectItem value={AchievementCategory.SUPPLEMENT_TRACKING}>Supplement Tracking</SelectItem>
                <SelectItem value={AchievementCategory.SUPPLEMENT_EVALUATION}>Supplement Evaluation</SelectItem>
                <SelectItem value={AchievementCategory.DATA_QUALITY}>Data Quality</SelectItem>
                <SelectItem value={AchievementCategory.ACCOUNT}>Account</SelectItem>
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

  // Wrap everything in AuthenticationRequired and handle loading state
  return (
    <AuthenticationRequired>
      <div className="relative">
        {/* Always render the skeleton when loading or no achievements */}
        {(isLoading || achievements.length === 0) && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              zIndex: 10,
              opacity: 1,
              transition: 'opacity 300ms ease-in-out',
            }}
          >
            {renderLoadingSkeleton()}
          </div>
        )}

        {/* Only render the content when it's visible and we have achievements */}
        {contentVisible && achievements.length > 0 && (
          <div
            style={{
              opacity: 1,
              transition: 'opacity 300ms ease-in-out',
            }}
          >
            {renderContent()}
          </div>
        )}
      </div>
    </AuthenticationRequired>
  );
}
