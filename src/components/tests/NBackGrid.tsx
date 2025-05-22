import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NBackGridProps {
  readonly highlightedPosition?: number | null;
  readonly onClick?: () => void;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly showFeedback?: boolean;
  readonly feedbackType?: 'correct' | 'incorrect' | null;
}

export function NBackGrid({
  highlightedPosition = null,
  onClick,
  size = 'md',
  showFeedback = false,
  feedbackType = null
}: Readonly<NBackGridProps>) {
  const gridSize = 3; // 3x3 grid
  const cells = Array.from({ length: gridSize * gridSize }, (_, i) => i);

  // Size configuration
  const cellSizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  };

  // Calculate grid width based on size
  let gridWidth = 300; // Default to large size
  if (size === 'sm') {
    gridWidth = 180;
  } else if (size === 'md') {
    gridWidth = 240;
  }

  // Feedback animation styles
  const feedbackStyles = {
    correct: {
      border: 'border-green-500',
      shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]',
      bg: 'bg-green-500/20'
    },
    incorrect: {
      border: 'border-red-500',
      shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]',
      bg: 'bg-red-500/20'
    }
  };

  // Create rows for the grid (3x3)
  const rows = [
    cells.slice(0, 3),
    cells.slice(3, 6),
    cells.slice(6, 9)
  ];

  return (
    <div className="relative">
      <div
        className="mx-auto"
        style={{ width: gridWidth }}
      >
        {/* Wrap table in a button for accessibility */}
        <button
          className="w-full p-0 bg-transparent border-0 cursor-pointer"
          onClick={onClick}
          aria-label="Respond to N-Back test"
          disabled={!onClick}
        >
          <table
            className={cn("w-full border-separate border-spacing-1 md:border-spacing-2")}
            aria-label="N-Back test grid"
          >
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${row[0]}-${rowIndex}`}>
                  {row.map((position) => (
                    <motion.td
                      key={position}
                      aria-selected={position === highlightedPosition}
                      className={cn(
                        "aspect-square border rounded-md transition-all duration-200 relative p-0",
                        cellSizeClasses[size],
                        position === highlightedPosition
                          ? "bg-primary border-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                          : "bg-background border-border hover:border-border/80",
                        showFeedback && feedbackType && "z-10"
                      )}
                      animate={{
                        scale: position === highlightedPosition ? 1.05 : 1,
                        backgroundColor: position === highlightedPosition
                          ? 'rgb(139, 92, 246)' // primary color
                          : 'rgb(255, 255, 255)' // Use RGB instead of CSS variable
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </button>
      </div>

      {/* Feedback overlay */}
      {showFeedback && feedbackType && (
        <AnimatePresence>
          <motion.div
            className={cn(
              "absolute inset-0 rounded-md pointer-events-none",
              feedbackStyles[feedbackType].border,
              feedbackStyles[feedbackType].shadow,
              feedbackStyles[feedbackType].bg
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
      )}
    </div>
  );
}
