/**
 * Achievement Notification Component
 *
 * Displays a notification when a user earns an achievement
 */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Achievement } from "@/types/achievement";
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

interface AchievementNotificationProps {
  readonly achievement: Achievement;
  readonly onClose?: () => void;
  readonly autoClose?: boolean;
  readonly autoCloseDelay?: number;
}

export function AchievementNotification({
  achievement,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}: Readonly<AchievementNotificationProps>) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto close after delay
  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, isVisible]);

  // Handle animation complete
  const handleAnimationComplete = () => {
    if (!isVisible && onClose) {
      onClose();
    }
  };

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
    switch (achievement.difficulty) {
      case "easy":
        return "bg-green-500";
      case "medium":
        return "bg-blue-500";
      case "hard":
        return "bg-purple-500";
      case "expert":
        return "bg-amber-500";
      default:
        return "bg-primary";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={handleAnimationComplete}
        >
          <div className="bg-card border rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-stretch">
              {/* Left color bar based on difficulty */}
              <div className={cn("w-2", getDifficultyColor())} />

              <div className="flex-1 p-4">
                <div className="flex items-start gap-3">
                  {/* Achievement icon */}
                  <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                    {getIconComponent(achievement.icon)}
                  </div>

                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {achievement.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {achievement.description}
                        </p>
                      </div>

                      {/* Points */}
                      <div className="bg-primary/10 px-2 py-1 rounded text-xs font-medium text-primary">
                        +{achievement.points} pts
                      </div>
                    </div>

                    {/* Achievement unlocked message */}
                    <div className="mt-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        Achievement Unlocked!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar for auto-close */}
            {autoClose && (
              <motion.div
                className="h-1 bg-primary"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: autoCloseDelay / 1000, ease: "linear" }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
