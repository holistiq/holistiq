import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { LoadingState, LoadingProgress } from '@/contexts/TestResultsContext';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface LoadingStateIndicatorProps {
  /** Current loading state */
  loadingState: LoadingState;
  /** Loading progress information */
  loadingProgress: LoadingProgress;
  /** Optional className for styling */
  className?: string;
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Whether to auto-hide when complete */
  autoHide?: boolean;
  /** Delay before auto-hiding (ms) */
  autoHideDelay?: number;
  /** Optional ID for the component */
  id?: string;
}

/**
 * Component that displays the current loading state with progress information
 * Provides visual feedback during extended loading operations
 */
export const LoadingStateIndicator = React.memo(function LoadingStateIndicator({
  loadingState,
  loadingProgress,
  className = "",
  showDetails = true,
  autoHide = true,
  autoHideDelay = 2000,
  id
}: Readonly<LoadingStateIndicatorProps>): JSX.Element | null {
  const [visible, setVisible] = useState(true);

  // Auto-hide logic
  useEffect(() => {
    // Show the component when loading state changes from idle
    if (loadingState !== 'idle') {
      setVisible(true);
    }

    // Handle auto-hide when complete
    if (loadingState === 'complete' && autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [loadingState, autoHide, autoHideDelay]);

  // Don't render if idle or hidden
  if (loadingState === 'idle' || !visible) {
    return null;
  }

  // Determine icon based on state
  const getIcon = () => {
    switch (loadingState) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      default:
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }
  };

  // Determine color based on state
  const getProgressColor = () => {
    switch (loadingState) {
      case 'error':
        return 'bg-destructive';
      case 'complete':
        return 'bg-success';
      default:
        return 'bg-primary';
    }
  };

  // Format elapsed time
  const formatElapsedTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Render error state
  if (loadingState === 'error') {
    return (
      <Alert variant="destructive" className={cn("my-2", className)} id={id}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading data</AlertTitle>
        <AlertDescription>
          {loadingProgress.message}
          {loadingProgress.error && (
            <div className="text-xs mt-1 opacity-80">{loadingProgress.error}</div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Render normal loading state
  return (
    <div
      className={cn(
        "rounded-md border p-3 shadow-sm bg-card text-card-foreground transition-opacity",
        loadingState === 'complete' && "opacity-80",
        className
      )}
      id={id}
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mb-2">
        {getIcon()}
        <span className="font-medium">{loadingProgress.message}</span>
        {showDetails && (
          <span className="text-xs text-muted-foreground ml-auto">
            {formatElapsedTime(loadingProgress.elapsedTime)}
          </span>
        )}
      </div>

      <Progress
        value={loadingProgress.progress}
        className="h-2"
        indicatorClassName={getProgressColor()}
      />

      {showDetails && loadingState !== 'complete' && (
        <div className="text-xs text-muted-foreground mt-1">
          {loadingState === 'fetching_local' && "Loading from local storage..."}
          {loadingState === 'fetching_remote' && "Loading from server..."}
          {loadingState === 'processing' && "Processing data..."}
          {loadingState === 'refreshing' && "Refreshing data..."}
        </div>
      )}
    </div>
  );
});
