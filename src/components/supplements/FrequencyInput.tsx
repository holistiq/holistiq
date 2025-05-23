import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";
import { frequencyOptions, timeOfDayOptions, daysOfWeek } from './frequencyConstants';

interface FrequencyInputProps {
  readonly frequency: string;
  readonly setFrequency: (value: string) => void;
  readonly timeOfDay: string;
  readonly setTimeOfDay: (value: string) => void;
  readonly withFood: boolean;
  readonly setWithFood: (value: boolean) => void;
  readonly scheduleDays: string[];
  readonly setScheduleDays: (value: string[]) => void;
  readonly customSchedule: string;
  readonly setCustomSchedule: (value: string) => void;
  readonly specificTime: string;
  readonly setSpecificTime: (value: string) => void;
  readonly scheduleDaysError?: string;
  readonly frequencyError?: string;
  readonly className?: string;
}

export function FrequencyInput({
  frequency,
  setFrequency,
  timeOfDay,
  setTimeOfDay,
  withFood,
  setWithFood,
  scheduleDays,
  setScheduleDays,
  customSchedule,
  setCustomSchedule,
  specificTime,
  setSpecificTime,
  scheduleDaysError,
  frequencyError,
  className
}: FrequencyInputProps) {
  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Frequency */}
        <div className="space-y-2">
          <Label className="font-medium">Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className={frequencyError ? "border-red-500" : ""}>
              <SelectValue placeholder="How often?" />
            </SelectTrigger>
            <SelectContent>
              {frequencyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {frequencyError && <p className="text-sm text-red-500 mt-1">{frequencyError}</p>}
        </div>

        {/* Custom Schedule (conditionally shown) */}
        {frequency === "custom" && (
          <div className={`space-y-3 border rounded-md p-4 bg-secondary/10 ${scheduleDaysError ? "border-red-500" : ""}`}>
            <div className="flex justify-between items-center">
              <Label className="font-medium">Custom Schedule</Label>
              {scheduleDaysError && <span className="text-sm text-red-500">{scheduleDaysError}</span>}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 mt-2">
              {daysOfWeek.map((day) => (
                <div key={day.value} className="flex items-center space-x-2 bg-background/80 p-1.5 rounded-md">
                  <Checkbox
                    id={day.value}
                    checked={scheduleDays.includes(day.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setScheduleDays([...scheduleDays, day.value]);
                      } else {
                        setScheduleDays(scheduleDays.filter(d => d !== day.value));
                      }
                    }}
                  />
                  <Label htmlFor={day.value} className="text-sm cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Describe your custom schedule (e.g., 'Every other day', 'First week of month')"
              value={customSchedule}
              onChange={(e) => setCustomSchedule(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              Please select at least one day of the week for your custom schedule.
            </p>
          </div>
        )}

        {/* Time of Day and Specific Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-medium">Time of Day</Label>
            <Select value={timeOfDay} onValueChange={setTimeOfDay}>
              <SelectTrigger>
                <SelectValue placeholder="When to take?" />
              </SelectTrigger>
              <SelectContent>
                {timeOfDayOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specific Time Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="specific-time" className="font-medium">Specific Time</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Set a specific time for more precise tracking</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="specific-time"
              type="time"
              value={specificTime}
              onChange={(e) => setSpecificTime(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Optional - for precise tracking and reminders
            </p>
          </div>
        </div>

        {/* With Food Toggle */}
        <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-md">
          <div className="space-y-0.5">
            <Label className="font-medium">Take with Food</Label>
            <p className="text-xs text-muted-foreground">
              Indicates whether this supplement should be taken with a meal
            </p>
          </div>
          <Switch
            checked={withFood}
            onCheckedChange={setWithFood}
          />
        </div>
      </div>
    </div>
  );
}
