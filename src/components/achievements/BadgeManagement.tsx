/**
 * Badge Management Component
 *
 * Allows users to manage their achievement badges
 */
import React, { memo, useCallback } from 'react';
import { AchievementWithProgress } from '@/types/achievement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { BadgeDisplay } from './BadgeDisplay';
import { BadgeSelector } from './BadgeSelector';
import { useUserBadges } from '@/hooks/useUserBadges';

interface BadgeManagementProps {
  readonly achievements: AchievementWithProgress[];
}

// Use React.memo to prevent unnecessary re-renders
export const BadgeManagement = memo(function BadgeManagement({
  achievements
}: Readonly<BadgeManagementProps>) {
  const { badges, refreshBadges } = useUserBadges();

  // Memoize the onBadgesChanged callback to prevent unnecessary re-renders
  const handleBadgesChanged = useCallback(() => {
    refreshBadges();
  }, [refreshBadges]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Achievement Badges
            </CardTitle>
            <CardDescription>
              Display your proudest achievements
            </CardDescription>
          </div>

          <BadgeSelector
            achievements={achievements}
            selectedBadges={badges}
            onBadgesChanged={handleBadgesChanged}
          />
        </div>
      </CardHeader>

      <CardContent>
        {badges.length === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-md">
            <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No badges selected yet. Click "Manage Badges" to select achievements to display.
            </p>
          </div>
        ) : (
          <BadgeDisplay badges={badges} size="lg" className="justify-center" />
        )}
      </CardContent>
    </Card>
  );
});
