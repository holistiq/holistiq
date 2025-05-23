import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardCardProps {
  /** Card title */
  title: string;
  /** Optional card description */
  description?: string;
  /** Optional icon to display next to the title */
  icon?: React.ReactNode;
  /** Main content of the card */
  children: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Optional action button text */
  actionText?: string;
  /** Optional action button link */
  actionLink?: string;
  /** Optional action button click handler */
  onAction?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Optional className for styling */
  className?: string;
  /** Optional height class */
  heightClass?: string;
  /** Optional fixed height for the entire card */
  fixedHeight?: string;
  /** Optional card variant */
  variant?: 'default' | 'primary' | 'secondary' | 'outline';
}

/**
 * A standardized card component for the dashboard with consistent styling and behavior.
 * Supports loading states, actions, and various content layouts.
 */
export function DashboardCard({
  title,
  description,
  icon,
  children,
  footer,
  actionText,
  actionLink,
  onAction,
  isLoading = false,
  className,
  heightClass = 'min-h-[200px]',
  fixedHeight,
  variant = 'default'
}: DashboardCardProps) {
  // Determine card variant classes
  const variantClasses = {
    default: '',
    primary: 'border-primary/20 bg-primary/5',
    secondary: 'border-secondary/20 bg-secondary/5',
    outline: 'border-2'
  };

  // Render action button if provided
  const renderAction = () => {
    if (!actionText) return null;

    if (actionLink) {
      return (
        <Link to={actionLink}>
          <Button variant="ghost" size="sm" className="gap-1">
            {actionText}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      );
    }

    if (onAction) {
      return (
        <Button variant="ghost" size="sm" onClick={onAction} className="gap-1">
          {actionText}
          <ChevronRight className="h-4 w-4" />
        </Button>
      );
    }

    return null;
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col",
      fixedHeight,
      variantClasses[variant],
      className
    )}>
      <CardHeader className="p-4 sm:p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="text-primary">{icon}</div>}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          {renderAction()}
        </div>
      </CardHeader>

      <CardContent className={cn(
        "p-4 sm:p-6 pt-0 sm:pt-0 flex-grow overflow-auto",
        heightClass
      )}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ) : (
          children
        )}
      </CardContent>

      {footer && (
        <CardFooter className="p-4 sm:p-6 border-t bg-muted/10 flex-shrink-0">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
