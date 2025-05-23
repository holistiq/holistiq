/**
 * Supplement Cycle Tracker Component
 *
 * Tracks and displays the progress of a supplement evaluation cycle
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pill, CheckCircle, BarChart2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Supplement, SupplementCycleStatus } from '@/types/supplement';
import { processAchievementTrigger } from '@/services/achievementService';
import { AchievementTrigger } from '@/types/achievement';
import { updateSupplementCycleStatus } from '@/services/supplementService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SupplementCycleTrackerProps {
  readonly supplement: Supplement;
  readonly hasBeforeTests: boolean;
  readonly hasAfterTests: boolean;
  readonly hasDetailedNotes: boolean;
  readonly onCycleCompleted?: () => void;
  readonly className?: string;
  readonly compact?: boolean;
}

export function SupplementCycleTracker({
  supplement,
  hasBeforeTests,
  hasAfterTests,
  hasDetailedNotes,
  onCycleCompleted,
  className,
  compact = false
}: Readonly<SupplementCycleTrackerProps>) {
  const { user } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate completion percentage
  const completionPercentage =
    (hasBeforeTests ? 33 : 0) +
    (hasAfterTests ? 33 : 0) +
    (hasDetailedNotes ? 34 : 0);

  // Get cycle status
  const cycleStatus = supplement.cycle_status || SupplementCycleStatus.NOT_STARTED;

  // Handle completing the evaluation
  const handleCompleteEvaluation = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Update supplement cycle status
      const updateResult = await updateSupplementCycleStatus(
        user.id,
        supplement.id,
        SupplementCycleStatus.COMPLETED
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }

      // Process achievement for supplement logging
      await processAchievementTrigger({
        trigger: AchievementTrigger.SUPPLEMENT_LOGGED,
        userId: user.id
      });

      toast({
        title: "Evaluation Completed",
        description: "You've successfully completed the evaluation cycle for this supplement."
      });

      if (onCycleCompleted) {
        onCycleCompleted();
      }
    } catch (error) {
      console.error('Error completing evaluation:', error);
      toast({
        title: "Error",
        description: "Failed to complete the evaluation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle starting the evaluation
  const handleStartEvaluation = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Update supplement cycle status
      const updateResult = await updateSupplementCycleStatus(
        user.id,
        supplement.id,
        SupplementCycleStatus.IN_PROGRESS
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }

      toast({
        title: "Evaluation Started",
        description: "You've started the evaluation cycle for this supplement."
      });

      if (onCycleCompleted) {
        onCycleCompleted();
      }
    } catch (error) {
      console.error('Error starting evaluation:', error);
      toast({
        title: "Error",
        description: "Failed to start the evaluation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render status badge
  const renderStatusBadge = () => {
    switch (cycleStatus) {
      case SupplementCycleStatus.NOT_STARTED:
        return <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> Not Started
        </Badge>;
      case SupplementCycleStatus.IN_PROGRESS:
        return <Badge variant="secondary" className="gap-1">
          <BarChart2 className="h-3 w-3" /> In Progress
        </Badge>;
      case SupplementCycleStatus.COMPLETED:
        return <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" /> Completed
        </Badge>;
      default:
        return null;
    }
  };

  // Render action button based on cycle status
  const renderActionButton = () => {
    if (cycleStatus === SupplementCycleStatus.NOT_STARTED) {
      return (
        <Button
          onClick={handleStartEvaluation}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Start Evaluation"
          )}
        </Button>
      );
    }

    if (cycleStatus === SupplementCycleStatus.IN_PROGRESS) {
      return (
        <Button
          onClick={handleCompleteEvaluation}
          disabled={!hasBeforeTests || !hasAfterTests || !hasDetailedNotes || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Complete Evaluation"
          )}
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        className="w-full"
        disabled
      >
        Evaluation Completed
      </Button>
    );
  };

  // Render compact version
  if (compact) {
    return (
      <div className={cn("flex items-center justify-between p-3 bg-secondary/10 rounded-lg", className)}>
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-sm">Evaluation Status</p>
            <div className="mt-1">{renderStatusBadge()}</div>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-24">
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">{completionPercentage}% complete</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Render full component
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Supplement Evaluation
            </CardTitle>
            <CardDescription>
              Track your progress in evaluating this supplement's effectiveness
            </CardDescription>
          </div>
          {renderStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Evaluation Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} />
        </div>

        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-2">
            {hasBeforeTests ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            <span className="text-sm">Baseline tests completed</span>
          </div>
          <div className="flex items-center gap-2">
            {hasDetailedNotes ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            <span className="text-sm">Detailed notes added</span>
          </div>
          <div className="flex items-center gap-2">
            {hasAfterTests ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            <span className="text-sm">Follow-up tests completed</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {renderActionButton()}
      </CardFooter>
    </Card>
  );
}
