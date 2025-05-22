/**
 * Moving Average Info Popover Component
 *
 * Provides educational information about moving averages in an accessible popover
 */
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

interface MAInfoPopoverProps {
  children: React.ReactNode;
}

export function MAInfoPopover({ children }: Readonly<MAInfoPopoverProps>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-5" side="top">
        <div className="space-y-5">
          <div>
            <h4 className="font-medium text-base mb-2">Understanding Moving Averages</h4>
            <p className="text-sm text-muted-foreground">
              Moving Average (MA) lines smooth out short-term fluctuations to show the underlying trend in your cognitive performance.
            </p>
          </div>

          {/* What MA Lines Show - Section */}
          <div className="space-y-3 pt-3 border-t">
            <h5 className="text-sm font-medium">What MA Lines Show</h5>

            <div className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-md">
              <div className="bg-blue-500 h-3 w-3 rounded-full mt-1 flex-shrink-0"></div>
              <div>
                <p className="text-xs font-medium">Average Performance</p>
                <p className="text-xs text-muted-foreground">Your average performance over the last 3 test sessions, updated with each new test.</p>
              </div>
            </div>
          </div>

          {/* How to Interpret MA Lines - Section */}
          <div className="space-y-3 pt-3 border-t">
            <h5 className="text-sm font-medium">How to Interpret MA Lines</h5>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-md">
                <div className="bg-green-500 h-3 w-3 rounded-full mt-1 flex-shrink-0"></div>
                <div>
                  <p className="text-xs font-medium">Rising MA Line (Score & Accuracy)</p>
                  <p className="text-xs text-muted-foreground">Your performance is improving over time.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-md">
                <div className="bg-red-500 h-3 w-3 rounded-full mt-1 flex-shrink-0"></div>
                <div>
                  <p className="text-xs font-medium">Falling MA Line (Score & Accuracy)</p>
                  <p className="text-xs text-muted-foreground">Your performance is declining over time.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-md">
                <div className="bg-purple-500 h-3 w-3 rounded-full mt-1 flex-shrink-0"></div>
                <div>
                  <p className="text-xs font-medium">Reaction Time is Different</p>
                  <p className="text-xs text-muted-foreground">A falling MA line is good (faster reactions), while a rising line indicates slower reactions.</p>
                </div>
              </div>
            </div>
          </div>

          {/* How to Use MA Lines - Section */}
          <div className="space-y-2 pt-3 border-t">
            <h5 className="text-sm font-medium">How to Use MA Lines</h5>
            <ul className="text-xs space-y-2 list-disc pl-5">
              <li>Focus on MA trends rather than day-to-day fluctuations</li>
              <li>Compare your latest result to the MA line to see if you're improving</li>
              <li>Look for sustained changes in MA direction when evaluating supplements or lifestyle changes</li>
              <li>Hover directly over MA lines to see trend analysis</li>
            </ul>
          </div>

          {/* Technical Note - Section */}
          <div className="pt-3 border-t text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 p-2 rounded-md">
            <p className="font-medium mb-1">Technical Note:</p>
            <p>MA lines use a 3-point moving average calculation, which averages each point with the two previous points.</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
