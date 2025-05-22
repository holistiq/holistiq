import React from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistance } from 'date-fns';
import {
  Pill,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ActiveWashoutPeriod, WashoutPeriodStatus } from '@/types/washoutPeriod';
import { completeWashoutPeriod, cancelWashoutPeriod } from '@/services/washoutPeriodService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from '@/components/ui/use-toast';

interface WashoutPeriodsSectionProps {
  washoutPeriods: ActiveWashoutPeriod[];
  isLoading?: boolean;
  onUpdate?: () => void;
}

export function WashoutPeriodsSection({
  washoutPeriods,
  isLoading = false,
  onUpdate
}: WashoutPeriodsSectionProps) {
  const { user } = useSupabaseAuth();

  // Handle completing a washout period
  const handleComplete = async (washoutPeriodId: string) => {
    if (!user?.id) return;

    try {
      const result = await completeWashoutPeriod(user.id, washoutPeriodId);

      if (result.success) {
        toast({
          title: 'Washout period completed',
          description: 'Your washout period has been marked as completed',
        });
        if (onUpdate) onUpdate();
      } else {
        toast({
          title: 'Error completing washout period',
          description: result.error || 'Please try again later',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error completing washout period:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  // Handle cancelling a washout period
  const handleCancel = async (washoutPeriodId: string) => {
    if (!user?.id) return;

    try {
      const result = await cancelWashoutPeriod(user.id, washoutPeriodId);

      if (result.success) {
        toast({
          title: 'Washout period cancelled',
          description: 'Your washout period has been cancelled',
        });
        if (onUpdate) onUpdate();
      } else {
        toast({
          title: 'Error cancelling washout period',
          description: result.error || 'Please try again later',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error cancelling washout period:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  // Render the content based on loading state and data
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (washoutPeriods.length === 0) {
      return (
        <div className="text-center py-6">
          <div className="flex justify-center mb-2">
            <Clock className="h-10 w-10 text-muted-foreground opacity-20" />
          </div>
          <p className="text-muted-foreground mb-4">No active washout periods</p>
          <Link to="/log-washout-period">
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-3 w-3" />
              Start Washout Period
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {washoutPeriods.map((period) => (
          <div key={period.id} className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/10">
                  <Pill className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{period.supplement_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Started {format(new Date(period.start_date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              <Badge variant={period.days_elapsed > (period.expected_duration_days || 0) ? "destructive" : "secondary"}>
                Day {period.days_elapsed} of {period.expected_duration_days || '?'}
              </Badge>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{period.progress_percentage}%</span>
              </div>
              <Progress value={period.progress_percentage} className="h-2" />
            </div>

            {period.reason && (
              <div className="text-sm mb-3">
                <span className="text-muted-foreground">Reason: </span>
                {period.reason}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => handleCancel(period.id)}
              >
                <XCircle className="h-3 w-3" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-1"
                onClick={() => handleComplete(period.id)}
              >
                <CheckCircle className="h-3 w-3" />
                Complete
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Active Washout Periods
          </CardTitle>
          <div className="flex gap-2">
            <Link to="/washout-period-guide">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <BookOpen className="h-3 w-3" />
                Guide
              </Button>
            </Link>
            <Link to="/washout-periods">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View All
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
            <Link to="/log-washout-period">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
