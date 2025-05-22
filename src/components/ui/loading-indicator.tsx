/**
 * Component for displaying loading state with various visual options
 */
import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LoadingStatus } from '@/hooks/useLoadingState';

/**
 * Props for the LoadingIndicator component
 */
interface LoadingIndicatorProps {
  /** Current loading status */
  status: LoadingStatus;
  /** Message to display */
  message?: string;
  /** Progress value (0-100) */
  progress?: number;
  /** Error object if status is ERROR */
  error?: Error | null;
  /** Optional className for styling */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the progress bar */
  showProgress?: boolean;
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Whether to show the message */
  showMessage?: boolean;
  /** Whether to show the error details */
  showErrorDetails?: boolean;
  /** Whether to use inline styling */
  inline?: boolean;
  /** Optional ID for the component */
  id?: string;
  /** Optional test ID for testing */
  testId?: string;
  /** Optional callback for retry */
  onRetry?: () => void;
  /** Optional callback for dismiss */
  onDismiss?: () => void;
}

/**
 * Component for displaying loading state with various visual options
 */
export function LoadingIndicator({
  status,
  message,
  progress = 0,
  error = null,
  className = "",
  size = 'md',
  showProgress = true,
  showIcon = true,
  showMessage = true,
  showErrorDetails = false,
  inline = false,
  id,
  testId,
  onRetry,
  onDismiss
}: Readonly<LoadingIndicatorProps>): JSX.Element {
  // Determine icon based on status
  const getIcon = () => {
    switch (status) {
      case LoadingStatus.ERROR:
        return <AlertCircle className={iconSizeClass} />;
      case LoadingStatus.SUCCESS:
        return <CheckCircle2 className={iconSizeClass} />;
      case LoadingStatus.TIMEOUT:
        return <Clock className={iconSizeClass} />;
      default:
        return <Loader2 className={cn(iconSizeClass, "animate-spin")} />;
    }
  };
  
  // Determine icon color based on status
  const getIconColorClass = () => {
    switch (status) {
      case LoadingStatus.ERROR:
        return "text-destructive";
      case LoadingStatus.SUCCESS:
        return "text-success";
      case LoadingStatus.TIMEOUT:
        return "text-warning";
      default:
        return "text-primary";
    }
  };
  
  // Determine progress bar color based on status
  const getProgressColorClass = () => {
    switch (status) {
      case LoadingStatus.ERROR:
        return "bg-destructive";
      case LoadingStatus.SUCCESS:
        return "bg-success";
      case LoadingStatus.TIMEOUT:
        return "bg-warning";
      default:
        return "bg-primary";
    }
  };
  
  // Determine size classes
  const iconSizeClass = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }[size];
  
  const textSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];
  
  const progressHeightClass = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }[size];
  
  // Determine container class based on inline prop
  const containerClass = inline
    ? "inline-flex items-center gap-2"
    : "flex flex-col gap-2 w-full";
  
  // Render the component
  return (
    <div
      className={cn(
        containerClass,
        className
      )}
      id={id}
      data-testid={testId}
      role="status"
      aria-live="polite"
    >
      {/* Icon and message */}
      <div className={cn(
        inline ? "flex items-center gap-2" : "flex items-center gap-2 w-full"
      )}>
        {showIcon && (
          <div className={getIconColorClass()}>
            {getIcon()}
          </div>
        )}
        
        {showMessage && message && (
          <div className={cn(
            textSizeClass,
            "font-medium",
            inline ? "" : "flex-grow"
          )}>
            {message}
          </div>
        )}
        
        {/* Action buttons for error/timeout states */}
        {(status === LoadingStatus.ERROR || status === LoadingStatus.TIMEOUT) && (
          <div className="flex items-center gap-2 ml-auto">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Retry"
              >
                Retry
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs text-muted-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Dismiss"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      {showProgress && !inline && (
        <Progress
          value={progress}
          className={cn(progressHeightClass, "w-full")}
          indicatorClassName={getProgressColorClass()}
        />
      )}
      
      {/* Error details */}
      {showErrorDetails && status === LoadingStatus.ERROR && error && (
        <div className="text-xs text-destructive mt-1 break-words">
          {error.message}
        </div>
      )}
    </div>
  );
}

/**
 * Component for displaying multiple loading states
 */
interface MultiLoadingIndicatorProps {
  /** Array of loading states to display */
  states: Array<{
    id: string;
    status: LoadingStatus;
    message?: string;
    progress?: number;
  }>;
  /** Optional className for styling */
  className?: string;
  /** Whether to show only active states */
  showOnlyActive?: boolean;
  /** Optional ID for the component */
  id?: string;
}

/**
 * Component for displaying multiple loading states
 */
export function MultiLoadingIndicator({
  states,
  className = "",
  showOnlyActive = true,
  id
}: Readonly<MultiLoadingIndicatorProps>): JSX.Element | null {
  // Filter states if showOnlyActive is true
  const displayStates = showOnlyActive
    ? states.filter(state => state.status === LoadingStatus.LOADING)
    : states;
  
  // Don't render if no states to display
  if (displayStates.length === 0) {
    return null;
  }
  
  return (
    <div
      className={cn(
        "space-y-2",
        className
      )}
      id={id}
    >
      {displayStates.map(state => (
        <LoadingIndicator
          key={state.id}
          status={state.status}
          message={state.message}
          progress={state.progress}
          size="sm"
          showErrorDetails={false}
          inline={false}
        />
      ))}
    </div>
  );
}
