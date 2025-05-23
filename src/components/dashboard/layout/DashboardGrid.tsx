import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  /** Grid children */
  children: React.ReactNode;
  /** Optional className for styling */
  className?: string;
  /** Grid columns configuration */
  columns?: {
    /** Default column count (mobile) */
    default: number;
    /** Small screens column count */
    sm?: number;
    /** Medium screens column count */
    md?: number;
    /** Large screens column count */
    lg?: number;
    /** Extra large screens column count */
    xl?: number;
  };
  /** Gap size between grid items */
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * A responsive grid layout component for the dashboard.
 * Provides consistent spacing and alignment for dashboard cards and components.
 */
export function DashboardGrid({
  children,
  className,
  columns = { default: 1, sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md'
}: DashboardGridProps) {
  // Define gap classes
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-3 md:gap-4',
    md: 'gap-4 sm:gap-6 md:gap-8',
    lg: 'gap-6 sm:gap-8 md:gap-10 lg:gap-12',
    xl: 'gap-8 sm:gap-10 md:gap-12 lg:gap-16'
  };

  // Build grid template columns classes
  const gridColsClasses = [
    `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(
      'grid',
      gridColsClasses,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

interface DashboardGridItemProps {
  /** Grid item children */
  children: React.ReactNode;
  /** Optional className for styling */
  className?: string;
  /** Column span configuration */
  colSpan?: {
    /** Default column span (mobile) */
    default: number;
    /** Small screens column span */
    sm?: number;
    /** Medium screens column span */
    md?: number;
    /** Large screens column span */
    lg?: number;
    /** Extra large screens column span */
    xl?: number;
  };
  /** Row span configuration */
  rowSpan?: {
    /** Default row span (mobile) */
    default: number;
    /** Small screens row span */
    sm?: number;
    /** Medium screens row span */
    md?: number;
    /** Large screens row span */
    lg?: number;
    /** Extra large screens row span */
    xl?: number;
  };
}

/**
 * A grid item component for the dashboard grid.
 * Allows for responsive column and row spanning.
 */
export function DashboardGridItem({
  children,
  className,
  colSpan = { default: 1 },
  rowSpan = { default: 1 }
}: DashboardGridItemProps) {
  // Build column span classes
  const colSpanClasses = [
    `col-span-${colSpan.default}`,
    colSpan.sm && `sm:col-span-${colSpan.sm}`,
    colSpan.md && `md:col-span-${colSpan.md}`,
    colSpan.lg && `lg:col-span-${colSpan.lg}`,
    colSpan.xl && `xl:col-span-${colSpan.xl}`
  ].filter(Boolean).join(' ');

  // Build row span classes
  const rowSpanClasses = [
    `row-span-${rowSpan.default}`,
    rowSpan.sm && `sm:row-span-${rowSpan.sm}`,
    rowSpan.md && `md:row-span-${rowSpan.md}`,
    rowSpan.lg && `lg:row-span-${rowSpan.lg}`,
    rowSpan.xl && `xl:row-span-${rowSpan.xl}`
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(
      colSpanClasses,
      rowSpanClasses,
      className
    )}>
      {children}
    </div>
  );
}
