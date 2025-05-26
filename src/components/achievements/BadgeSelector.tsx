/**
 * Badge Selector Component
 *
 * Allows users to select which achievements to display as badges
 */
import React, { useState } from "react";
import {
  AchievementWithProgress,
  AchievementStatus,
  UserBadgeWithDetails,
  MAX_DISPLAYED_BADGES,
} from "@/types/achievement";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BadgeDisplay } from "./BadgeDisplay";
import { useUserBadges } from "@/hooks/useUserBadges";
import { Trophy, Plus, X, Loader2 } from "lucide-react";

interface BadgeSelectorProps {
  readonly achievements: AchievementWithProgress[];
  readonly selectedBadges: UserBadgeWithDetails[];
  readonly onBadgesChanged: () => void;
}

export function BadgeSelector({
  achievements,
  selectedBadges,
  onBadgesChanged,
}: Readonly<BadgeSelectorProps>) {
  const { addBadge, removeBadge } = useUserBadges();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter achievements to only show completed ones
  const completedAchievements = achievements.filter(
    (achievement) => achievement.status === AchievementStatus.COMPLETED,
  );

  // Check if an achievement is already selected as a badge
  const isAchievementSelected = (achievementId: string) => {
    return selectedBadges.some(
      (badge) => badge.achievementId === achievementId,
    );
  };

  // Handle adding a badge
  const handleAddBadge = async (achievementId: string) => {
    setLoading(true);
    try {
      const success = await addBadge(achievementId);
      if (success) {
        onBadgesChanged();
      }
    } catch (error) {
      console.error("Error adding badge:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle removing a badge
  const handleRemoveBadge = async (badgeId: string) => {
    setLoading(true);
    try {
      const success = await removeBadge(badgeId);
      if (success) {
        onBadgesChanged();
      }
    } catch (error) {
      console.error("Error removing badge:", error);
    } finally {
      setLoading(false);
    }
  };

  // Render button content based on loading state and selection status
  const renderButtonContent = (isLoading: boolean, achievementId: string) => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (isAchievementSelected(achievementId)) {
      return "Selected";
    }

    return (
      <>
        <Plus className="h-4 w-4" />
        Select
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Trophy className="h-4 w-4" />
          Manage Badges
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Your Achievement Badges</DialogTitle>
          <DialogDescription>
            Select up to {MAX_DISPLAYED_BADGES} achievements to display as
            badges on your profile
          </DialogDescription>
        </DialogHeader>

        {/* Currently selected badges */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Your Selected Badges</h3>

          {selectedBadges.length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-md">
              <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No badges selected yet. Choose from your completed achievements
                below.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 p-4 border rounded-md">
              {selectedBadges.map((badge) => (
                <div key={badge.id} className="relative">
                  <BadgeDisplay
                    badges={[badge]}
                    size="lg"
                    showTooltips={false}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-5 w-5 absolute -top-2 -right-2 rounded-full"
                    onClick={() => handleRemoveBadge(badge.id)}
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available achievements */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Available Achievements</h3>

          {completedAchievements.length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-md">
              <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                You haven't completed any achievements yet.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {completedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center justify-between border rounded-md p-3"
                  >
                    <div className="flex items-center gap-3">
                      <BadgeDisplay
                        badges={[
                          {
                            id: "preview",
                            userId: "",
                            achievementId: achievement.id,
                            displayOrder: 1,
                            createdAt: new Date().toISOString(),
                            achievement,
                          },
                        ]}
                        showTooltips={false}
                      />
                      <div>
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant={
                        isAchievementSelected(achievement.id)
                          ? "secondary"
                          : "outline"
                      }
                      size="sm"
                      className="gap-1"
                      onClick={() => handleAddBadge(achievement.id)}
                      disabled={
                        loading ||
                        isAchievementSelected(achievement.id) ||
                        selectedBadges.length >= MAX_DISPLAYED_BADGES
                      }
                    >
                      {renderButtonContent(loading, achievement.id)}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
