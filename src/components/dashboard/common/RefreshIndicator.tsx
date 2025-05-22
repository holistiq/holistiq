import React from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface RefreshIndicatorProps {
  /** Whether the refresh operation is in progress */
  isRefreshing: boolean;
  /** Optional className for styling */
  className?: string;
  /** Position of the indicator */
  position?: 'top-right' | 'top-left' | 'top-center' | 'floating';
  /** Size of the indicator */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the text label */
  showLabel?: boolean;
  /** Optional ID for the component */
  id?: string;
}

/**
 * A non-disruptive refresh indicator that shows a spinning icon without causing layout shifts
 */
export function RefreshIndicator({
  isRefreshing,
  className = "",
  position = 'top-right',
  size = 'medium',
  showLabel = false,
  id
}: RefreshIndicatorProps) {
  // If not refreshing, don't render anything
  if (!isRefreshing) {
    return null;
  }

  // Determine size classes
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6'
  }[size];

  // Determine position classes
  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'top-center': 'top-2 left-1/2 transform -translate-x-1/2',
    'floating': 'fixed bottom-4 right-4 shadow-lg rounded-full p-3 bg-background border z-50'
  }[position];

  return (
    <div
      className={cn(
        "transition-opacity duration-300 ease-in-out",
        position !== 'floating' ? 'absolute' : '',
        positionClasses,
        className
      )}
      id={id}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <RefreshCw
          className={cn(
            sizeClasses,
            "text-primary animate-spin"
          )}
          aria-hidden="true"
        />
        {showLabel && (
          <span className="text-sm font-medium text-muted-foreground">
            Refreshing...
          </span>
        )}
        <span className="sr-only">Refreshing data, please wait</span>
      </div>
    </div>
  );
}
