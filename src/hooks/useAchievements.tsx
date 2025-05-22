/**
 * Achievement Hook
 *
 * Provides functionality for tracking and displaying achievements
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Achievement,
  AchievementTrigger,
  AchievementTriggerData,
  AchievementWithProgress
} from '@/types/achievement';
import { getUserAchievements, processAchievementTrigger } from '@/services/achievementService';
import { useSupabaseAuth } from './useSupabaseAuth';
import { useToast } from '@/components/ui/use-toast';
import { AchievementNotification } from '@/components/achievements/AchievementNotification';

export function useAchievements() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // Fetch user achievements
  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Try to get achievements, but handle database table not existing gracefully
      try {
        const response = await getUserAchievements(user.id);
        if (response.success && response.achievements) {
          setAchievements(response.achievements);
        }
      } catch (error) {
        // Check if this is a "relation does not exist" error
        if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
          console.warn('Achievements tables not set up yet. Using empty achievements list.');
          // Return empty achievements list to prevent breaking the app
          setAchievements([]);
        } else {
          // Re-throw other errors
          throw error;
        }
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      // Set empty achievements to prevent UI from breaking
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Trigger an achievement
  const triggerAchievement = useCallback(async (
    trigger: AchievementTrigger,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      const triggerData: AchievementTriggerData = {
        trigger,
        userId: user.id,
        metadata
      };

      try {
        const response = await processAchievementTrigger(triggerData);

        if (response.success && response.newAchievements && response.newAchievements.length > 0) {
          // Show achievement notifications
          response.newAchievements.forEach(achievement => {
            // Add to new achievements state
            setNewAchievements(prev => [...prev, achievement]);

            // Show toast notification
            toast({
              title: "Achievement Unlocked!",
              description: achievement.title,
              action: (
                <AchievementNotification
                  achievement={achievement}
                  autoClose={false}
                />
              )
            });
          });

          // Refresh achievements
          fetchAchievements();
        }
      } catch (error) {
        // Check if this is a "relation does not exist" error
        if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
          console.warn('Achievements tables not set up yet. Skipping achievement trigger.');
          // Silently ignore the error to prevent breaking the app
        } else {
          // Re-throw other errors
          throw error;
        }
      }
    } catch (error) {
      console.error('Error triggering achievement:', error);
    }
  }, [user, fetchAchievements, toast]);

  // Initial fetch
  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    achievements,
    loading,
    newAchievements,
    triggerAchievement,
    refreshAchievements: fetchAchievements
  };
}
