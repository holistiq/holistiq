/**
 * Component for handling partial loading states
 */
import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { LoadingStatus } from '@/hooks/useLoadingState';
import { LoadingIndicator } from './loading-indicator';
import { Skeleton } from './skeleton';
import { createLogger } from '@/lib/logger';

// Create a logger for the PartialLoadingContainer component
const logger = createLogger({ namespace: 'PartialLoadingContainer' });

/**
 * Props for the PartialLoadingContainer component
 */
interface PartialLoadingContainerProps {
  /** Current loading status */
  status: LoadingStatus;
  /** Whether data is available (even partially) */
  hasData: boolean;
  /** Message to display during loading */
  loadingMessage?: string;
  /** Message to display when no data is available */
  emptyMessage?: string;
  /** Message to display on error */
  errorMessage?: string;
  /** Error object if status is ERROR */
  error?: Error | null;
  /** Progress value (0-100) */
  progress?: number;
  /** Optional className for styling */
  className?: string;
  /** Optional className for the loading indicator */
  loadingClassName?: string;
  /** Optional className for the empty state */
  emptyClassName?: string;
  /** Optional className for the error state */
  errorClassName?: string;
  /** Height for the skeleton/loading state */
  height?: string | number;
  /** Whether to show the loading indicator when data is available */
  showLoadingWithData?: boolean;
  /** Whether to show the error details */
  showErrorDetails?: boolean;
  /** Optional ID for the component */
  id?: string;
  /** Optional test ID for testing */
  testId?: string;
  /** Optional callback for retry */
  onRetry?: () => void;
  /** Optional callback for dismiss */
  onDismiss?: () => void;
  /** Children to render */
  children: React.ReactNode;
}

/**
 * Component for handling partial loading states
 *
 * This component handles different loading states and displays appropriate UI:
 * - Shows a loading indicator when loading and no data is available
 * - Shows children with an optional loading indicator when loading and data is available
 * - Shows an empty state when no data is available and not loading
 * - Shows an error state when an error occurs
 *
 * @example
 * ```tsx
 * const { status, data, error, execute } = useLoadingState<User[]>();
 *
 * useEffect(() => {
 *   execute(fetchUsers());
 * }, [execute]);
 *
 * return (
 *   <PartialLoadingContainer
 *     status={status}
 *     hasData={Boolean(data?.length)}
 *     error={error}
 *     loadingMessage="Loading users..."
 *     emptyMessage="No users found"
 *     errorMessage="Failed to load users"
 *     onRetry={() => execute(fetchUsers())}
 *   >
 *     <UserList users={data || []} />
 *   </PartialLoadingContainer>
 * );
 * ```
 */
export const PartialLoadingContainer = memo(function PartialLoadingContainer({
  status,
  hasData,
  loadingMessage = 'Loading...',
  emptyMessage = 'No data available',
  errorMessage = 'An error occurred',
  error = null,
  progress = 0,
  className = "",
  loadingClassName = "",
  emptyClassName = "",
  errorClassName = "",
  height = 200,
  showLoadingWithData = true,
  showErrorDetails = true,
  id,
  testId,
  onRetry,
  onDismiss,
  children
}: Readonly<PartialLoadingContainerProps>): JSX.Element {
  // Convert height to string with px if it's a number
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  // Loading state with no data
  if (status === LoadingStatus.LOADING && !hasData) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center",
          loadingClassName
        )}
        style={{ minHeight: heightStyle }}
        id={id}
        data-testid={testId}
      >
        <Skeleton className="w-full h-full rounded-md" />
        <div className="absolute">
          <LoadingIndicator
            status={status}
            message={loadingMessage}
            progress={progress}
            showProgress={true}
            showErrorDetails={false}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (status === LoadingStatus.ERROR) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-4 border border-destructive/20 bg-destructive/5 rounded-md",
          errorClassName
        )}
        style={{ minHeight: heightStyle }}
        id={id}
        data-testid={testId}
      >
        <LoadingIndicator
          status={status}
          message={errorMessage}
          error={error}
          showProgress={false}
          showErrorDetails={showErrorDetails}
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      </div>
    );
  }

  // Timeout state
  if (status === LoadingStatus.TIMEOUT) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-4 border border-warning/20 bg-warning/5 rounded-md",
          errorClassName
        )}
        style={{ minHeight: heightStyle }}
        id={id}
        data-testid={testId}
      >
        <LoadingIndicator
          status={status}
          message="Operation timed out"
          showProgress={false}
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      </div>
    );
  }

  // Empty state (no data and not loading)
  if (!hasData && status !== LoadingStatus.LOADING) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-4 border border-muted bg-muted/10 rounded-md",
          emptyClassName
        )}
        style={{ minHeight: heightStyle }}
        id={id}
        data-testid={testId}
      >
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Data is available, render children
  return (
    <div className={className} id={id} data-testid={testId}>
      {children}

      {/* Show loading indicator on top of content if loading and showLoadingWithData is true */}
      {status === LoadingStatus.LOADING && showLoadingWithData && (
        <div className="mt-2">
          <LoadingIndicator
            status={status}
            message={loadingMessage}
            progress={progress}
            size="sm"
            showProgress={true}
            inline={true}
          />
        </div>
      )}
    </div>
  );
});
