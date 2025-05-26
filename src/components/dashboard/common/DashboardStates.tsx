/**
 * Dashboard state components for loading and empty states
 */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

/**
 * Props for the DashboardLoadingState component
 */
interface DashboardLoadingStateProps {
  readonly title?: string;
  readonly description?: string;
}

/**
 * Component for rendering a dashboard loading state
 */
export function DashboardLoadingState({
  title = "Cognitive Performance Dashboard",
  description = "Loading your performance data...",
}: Readonly<DashboardLoadingStateProps>): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Props for the DashboardEmptyState component
 */
interface DashboardEmptyStateProps {
  readonly title?: string;
  readonly description?: string;
  readonly message?: string;
  readonly actionText?: string;
  readonly actionLink?: string;
}

/**
 * Component for rendering a dashboard empty state
 */
export function DashboardEmptyState({
  title = "Cognitive Performance Dashboard",
  description = "Track how supplements affect your cognitive performance",
  message = "No test results available to display performance trends.",
  actionText,
  actionLink,
}: Readonly<DashboardEmptyStateProps>): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">{message}</p>
          <p>
            Take cognitive tests to start tracking your performance over time.
          </p>

          {actionText && actionLink && (
            <div className="mt-6">
              <Link to={actionLink}>
                <Button variant="outline">{actionText}</Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
