import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Clock } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from '@/components/ui/use-toast';
import { createWashoutPeriod } from '@/services/washoutPeriodService';
import { getSupplements } from '@/services/supplementService';
import { Supplement } from '@/types/supplement';
import { WashoutPeriodEducation } from '@/components/supplements/WashoutPeriodEducation';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

export default function LogWashoutPeriod() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();

  // Form state
  const [supplementId, setSupplementId] = useState<string>('');
  const [supplementName, setSupplementName] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [expectedDuration, setExpectedDuration] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Validation state
  const [supplementError, setSupplementError] = useState<string>('');
  const [durationError, setDurationError] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingSupplements, setIsLoadingSupplements] = useState<boolean>(false);
  const [supplements, setSupplements] = useState<Supplement[]>([]);

  // Load supplements on component mount
  useEffect(() => {
    if (user?.id) {
      loadSupplements(user.id);
    }
  }, [user]);

  // Load supplements from the API
  const loadSupplements = async (userId: string) => {
    setIsLoadingSupplements(true);
    try {
      const result = await getSupplements(userId);
      if (result.success) {
        setSupplements(result.supplements);
      } else {
        console.error('Error loading supplements:', result.error);
        toast({
          title: 'Error loading supplements',
          description: result.error || 'Please try again later',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Unexpected error loading supplements:', error);
    } finally {
      setIsLoadingSupplements(false);
    }
  };

  // Handle supplement selection
  const handleSupplementChange = (value: string) => {
    setSupplementId(value);
    setSupplementError('');

    // Find the supplement name
    const supplement = supplements.find(s => s.id === value);
    if (supplement) {
      setSupplementName(supplement.name);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    let isValid = true;

    if (!supplementId && !supplementName) {
      setSupplementError('Please select or enter a supplement name');
      isValid = false;
    }

    if (!expectedDuration) {
      setDurationError('Please enter an expected duration');
      isValid = false;
    } else if (isNaN(Number(expectedDuration)) || Number(expectedDuration) <= 0) {
      setDurationError('Please enter a valid positive number');
      isValid = false;
    }

    if (!isValid) return;

    setIsSubmitting(true);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const result = await createWashoutPeriod(user.id, {
        supplement_id: supplementId || null,
        supplement_name: supplementName || 'Unknown Supplement',
        start_date: startDate?.toISOString() || new Date().toISOString(),
        expected_duration_days: Number(expectedDuration),
        reason: reason || null,
        notes: notes || null,
      });

      if (result.success) {
        toast({
          title: 'Washout period started',
          description: 'Your washout period has been successfully logged',
        });
        navigate('/supplements');
      } else {
        toast({
          title: 'Error starting washout period',
          description: result.error || 'Please try again later',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting washout period:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8 md:py-12 max-w-screen-xl">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl md:text-3xl">Start Washout Period</CardTitle>
          <CardDescription className="text-base">
            Track when you stop taking a supplement to establish a baseline
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Washout Period Education */}
            <WashoutPeriodEducation variant="compact" />

            <div className="flex justify-end">
              <Link to="/washout-period-guide" className="text-sm text-primary flex items-center gap-1 hover:underline">
                <Clock className="h-3 w-3" />
                Learn more about washout periods
              </Link>
            </div>

            {/* Supplement Selection */}
            <div className="space-y-2">
              <Label htmlFor="supplement" className="text-base font-medium">
                Supplement
              </Label>
              <Select value={supplementId} onValueChange={handleSupplementChange}>
                <SelectTrigger id="supplement" className={supplementError ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a supplement" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingSupplements ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : supplements.length > 0 ? (
                    supplements.map((supplement) => (
                      <SelectItem key={supplement.id} value={supplement.id}>
                        {supplement.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-muted-foreground">
                      No supplements found
                    </div>
                  )}
                </SelectContent>
              </Select>

              {/* Manual Supplement Name Entry */}
              <div className="pt-2">
                <Label htmlFor="supplementName" className="text-sm text-muted-foreground">
                  Or enter supplement name manually
                </Label>
                <Input
                  id="supplementName"
                  value={supplementName}
                  onChange={(e) => {
                    setSupplementName(e.target.value);
                    setSupplementError('');
                    // Clear the selection if manually entering a name
                    if (e.target.value) setSupplementId('');
                  }}
                  placeholder="e.g., Omega-3, Vitamin D, etc."
                  className={`mt-1 ${supplementError ? "border-red-500" : ""}`}
                />
                {supplementError && <p className="text-sm text-red-500 mt-1">{supplementError}</p>}
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-base font-medium">
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Expected Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="duration" className="text-base font-medium">
                  Expected Duration (days)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="max-w-xs">
                        How long you plan to stop taking this supplement. Common washout periods range from 7-30 days depending on the supplement.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="duration"
                type="number"
                min="1"
                value={expectedDuration}
                onChange={(e) => {
                  setExpectedDuration(e.target.value);
                  setDurationError('');
                }}
                placeholder="e.g., 14"
                className={durationError ? "border-red-500" : ""}
              />
              {durationError && <p className="text-sm text-red-500">{durationError}</p>}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-base font-medium">
                Reason (Optional)
              </Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Testing effectiveness, Cycling off, etc."
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-medium">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details about this washout period"
                rows={3}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/supplements")}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 w-full sm:w-auto order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>Start Washout Period</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
