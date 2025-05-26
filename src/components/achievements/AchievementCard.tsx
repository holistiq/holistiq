/**
 * Achievement Card Component
 *
 * Displays an achievement with its progress
 */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AchievementWithProgress,
  AchievementStatus,
} from "@/types/achievement";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Star,
  Zap,
  Brain,
  Activity,
  Calendar,
  CalendarCheck,
  CalendarRange,
  Repeat,
  Pill,
  List,
  User,
  Rocket,
  CalendarClock,
  Lightbulb,
  Target,
  Lock,
  ClipboardList,
  RefreshCw,
  BarChart2,
  CheckCircle,
  Map,
  Heart,
  Layers,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AchievementCardProps {
  readonly achievement: AchievementWithProgress;
  readonly onClick?: (achievement: AchievementWithProgress) => void;
}

export function AchievementCard({
  achievement,
  onClick,
}: Readonly<AchievementCardProps>) {
  // State to defer animations until after initial render
  const [animationsEnabled, setAnimationsEnabled] = useState(false);

  // Enable animations after initial render
  useEffect(() => {
    // Small delay to ensure component is fully rendered
    const timer = setTimeout(() => {
      setAnimationsEnabled(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const {
    title,
    description,
    icon,
    difficulty,
    points,
    status,
    currentCount,
    requiredCount,
    percentComplete,
    completedAt,
    secret,
  } = achievement;

  // Get icon component based on achievement icon name
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      trophy: <Trophy className="h-6 w-6" />,
      star: <Star className="h-6 w-6" />,
      zap: <Zap className="h-6 w-6" />,
      brain: <Brain className="h-6 w-6" />,
      activity: <Activity className="h-6 w-6" />,
      calendar: <Calendar className="h-6 w-6" />,
      "calendar-check": <CalendarCheck className="h-6 w-6" />,
      "calendar-range": <CalendarRange className="h-6 w-6" />,
      "calendar-clock": <CalendarClock className="h-6 w-6" />,
      repeat: <Repeat className="h-6 w-6" />,
      pill: <Pill className="h-6 w-6" />,
      list: <List className="h-6 w-6" />,
      user: <User className="h-6 w-6" />,
      rocket: <Rocket className="h-6 w-6" />,
      lightbulb: <Lightbulb className="h-6 w-6" />,
      target: <Target className="h-6 w-6" />,
      "clipboard-list": <ClipboardList className="h-6 w-6" />,
      "refresh-cw": <RefreshCw className="h-6 w-6" />,
      "bar-chart-2": <BarChart2 className="h-6 w-6" />,
      "check-circle": <CheckCircle className="h-6 w-6" />,
      map: <Map className="h-6 w-6" />,
      heart: <Heart className="h-6 w-6" />,
      layers: <Layers className="h-6 w-6" />,
      clock: <Clock className="h-6 w-6" />,
      // Legacy mappings for backward compatibility
      flask: <Lightbulb className="h-6 w-6" />,
      beaker: <Target className="h-6 w-6" />,
    };

    return iconMap[iconName] || <Trophy className="h-6 w-6" />;
  };

  // Get difficulty color
  const getDifficultyColor = () => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500 text-green-50";
      case "medium":
        return "bg-blue-500 text-blue-50";
      case "hard":
        return "bg-purple-500 text-purple-50";
      case "expert":
        return "bg-amber-500 text-amber-50";
      default:
        return "bg-primary text-primary-foreground";
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case AchievementStatus.COMPLETED:
        return "text-green-500";
      case AchievementStatus.IN_PROGRESS:
        return "text-amber-500";
      case AchievementStatus.LOCKED:
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case AchievementStatus.COMPLETED:
        return "Completed";
      case AchievementStatus.IN_PROGRESS:
        return "In Progress";
      case AchievementStatus.LOCKED:
        return "Locked";
      default:
        return "Locked";
    }
  };

  // Handle card click
  const handleClick = () => {
    if (onClick) {
      onClick(achievement);
    }
  };

  // Determine if the achievement is locked and secret
  const isLockedSecret = status === AchievementStatus.LOCKED && secret;

  return (
    <motion.div
      className={cn(
        "border rounded-lg overflow-hidden cursor-pointer transition-all",
        status === AchievementStatus.COMPLETED ? "bg-card" : "bg-card/50",
        onClick ? "hover:shadow-md" : "",
      )}
      initial={{ scale: 1 }}
      whileHover={animationsEnabled && onClick ? { scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Achievement icon */}
          <div
            className={cn(
              "p-3 rounded-full flex-shrink-0",
              status === AchievementStatus.COMPLETED
                ? "bg-primary/20"
                : "bg-muted",
            )}
          >
            {isLockedSecret ? (
              <Lock className="h-6 w-6 text-muted-foreground" />
            ) : (
              <div className={getStatusColor()}>{getIconComponent(icon)}</div>
            )}
          </div>

          <div className="flex-1">
            {/* Header */}
            <div className="flex justify-between items-start mb-1">
              <div>
                <h3 className="font-semibold">
                  {isLockedSecret ? "Secret Achievement" : title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {isLockedSecret
                    ? "Keep exploring to unlock this achievement"
                    : description}
                </p>
              </div>

              {/* Points */}
              <div className="bg-primary/10 px-2 py-1 rounded text-xs font-medium text-primary">
                {points} pts
              </div>
            </div>

            {/* Progress section */}
            <div className="mt-3">
              {status !== AchievementStatus.LOCKED && (
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className={getStatusColor()}>{getStatusText()}</span>
                  <span className="text-muted-foreground">
                    {currentCount}/{requiredCount}
                  </span>
                </div>
              )}

              <Progress
                value={percentComplete}
                className={cn(
                  "h-1.5",
                  status === AchievementStatus.COMPLETED ? "" : "opacity-70",
                )}
              />
            </div>

            {/* Footer with badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Difficulty badge */}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-normal",
                  status === AchievementStatus.COMPLETED
                    ? getDifficultyColor()
                    : "",
                )}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Badge>

              {/* Completion date badge */}
              {completedAt && (
                <Badge variant="outline" className="text-xs font-normal">
                  Completed {format(new Date(completedAt), "MMM d, yyyy")}
                </Badge>
              )}

              {/* Secret badge */}
              {secret && status !== AchievementStatus.LOCKED && (
                <Badge
                  variant="outline"
                  className="text-xs font-normal bg-amber-500/10 text-amber-600 border-amber-200"
                >
                  Secret
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
