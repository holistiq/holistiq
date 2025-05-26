import React from "react";
import { Brain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the LoadingState component
 * @interface LoadingStateProps
 */
interface LoadingStateProps {
  /** Message to display below the loading indicator */
  readonly message?: string;
  /** Optional className for styling */
  readonly className?: string;
  /** Size variant for the loading indicator */
  readonly size?: "small" | "medium" | "large";
  /** Whether to use fullscreen layout */
  readonly fullscreen?: boolean;
  /** Icon to use (brain or spinner) */
  readonly icon?: "brain" | "spinner";
  /** Optional ID for the component */
  readonly id?: string;
  /** Optional test ID for testing */
  readonly testId?: string;
}

/**
 * Loading state component that displays a loading indicator and message
 * Used to indicate loading states throughout the application
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingState message="Loading your data..." />
 *
 * // With custom size and fullscreen
 * <LoadingState
 *   message="Processing your request..."
 *   size="large"
 *   fullscreen={true}
 * />
 *
 * // With spinner icon instead of brain
 * <LoadingState
 *   message="Please wait..."
 *   icon="spinner"
 * />
 * ```
 */
export const LoadingState = React.memo(function LoadingState({
  message = "Loading your dashboard...",
  className = "",
  size = "medium",
  fullscreen = true,
  icon = "brain",
  id,
  testId,
}: Readonly<LoadingStateProps>): JSX.Element {
  // Determine icon size based on the size prop
  const iconSizeClass = {
    small: "h-8 w-8",
    medium: "h-12 w-12",
    large: "h-16 w-16",
  }[size];

  // Determine text size based on the size prop
  const textSizeClass = {
    small: "text-base",
    medium: "text-lg",
    large: "text-xl",
  }[size];

  // Determine container class based on fullscreen prop
  const containerClass = fullscreen ? "min-h-screen" : "min-h-[200px]";

  // Render the appropriate icon
  const LoadingIcon =
    icon === "brain" ? (
      <Brain
        className={cn(iconSizeClass, "text-primary animate-pulse")}
        aria-hidden="true"
      />
    ) : (
      <Loader2
        className={cn(iconSizeClass, "text-primary animate-spin")}
        aria-hidden="true"
      />
    );

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        containerClass,
        className,
      )}
      id={id}
      data-testid={testId}
    >
      <div
        className="flex flex-col items-center gap-3 p-4 text-center"
        aria-live="polite"
        aria-busy="true"
      >
        {LoadingIcon}
        <div className={cn("font-semibold", textSizeClass)}>{message}</div>
        {/* Hidden text for screen readers */}
        <span className="sr-only">Loading content. Please wait.</span>
      </div>
    </div>
  );
});
