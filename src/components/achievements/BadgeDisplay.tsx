/**
 * Badge Display Component
 *
 * Displays a user's achievement badges
 */
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserBadgeWithDetails } from '@/types/achievement';
import {
  Trophy, Star, Zap, Brain, Activity, Calendar,
  CalendarCheck, CalendarRange, Repeat, Pill,
  List, User, Rocket, CalendarClock, Lightbulb, Target,
  ClipboardList, RefreshCw, BarChart2, CheckCircle,
  Map, Heart, Layers, Clock
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BadgeDisplayProps {
  readonly badges: UserBadgeWithDetails[];
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
  readonly showTooltips?: boolean;
}

export function BadgeDisplay({
  badges,
  size = 'md',
  className,
  showTooltips = true
}: Readonly<BadgeDisplayProps>) {
  // State to defer animations until after initial render
  // Use a ref instead of state to avoid re-renders
  const animationsEnabledRef = React.useRef(false);

  // Enable animations after initial render
  useEffect(() => {
    // Small delay to ensure component is fully rendered
    const timer = setTimeout(() => {
      animationsEnabledRef.current = true;
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Get icon component based on achievement icon name
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'trophy': <Trophy />,
      'star': <Star />,
      'zap': <Zap />,
      'brain': <Brain />,
      'activity': <Activity />,
      'calendar': <Calendar />,
      'calendar-check': <CalendarCheck />,
      'calendar-range': <CalendarRange />,
      'calendar-clock': <CalendarClock />,
      'repeat': <Repeat />,
      'pill': <Pill />,
      'list': <List />,
      'user': <User />,
      'rocket': <Rocket />,
      'lightbulb': <Lightbulb />,
      'target': <Target />,
      'clipboard-list': <ClipboardList />,
      'refresh-cw': <RefreshCw />,
      'bar-chart-2': <BarChart2 />,
      'check-circle': <CheckCircle />,
      'map': <Map />,
      'heart': <Heart />,
      'layers': <Layers />,
      'clock': <Clock />,
      // Legacy mappings for backward compatibility
      'flask': <Lightbulb />,
      'beaker': <Target />
    };

    return iconMap[iconName] || <Trophy />;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500 text-green-50';
      case 'medium':
        return 'bg-blue-500 text-blue-50';
      case 'hard':
        return 'bg-purple-500 text-purple-50';
      case 'expert':
        return 'bg-amber-500 text-amber-50';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          badge: 'w-8 h-8',
          icon: 'h-4 w-4'
        };
      case 'lg':
        return {
          badge: 'w-14 h-14',
          icon: 'h-7 w-7'
        };
      case 'md':
      default:
        return {
          badge: 'w-12 h-12',
          icon: 'h-6 w-6'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Render badge
  const renderBadge = (badge: UserBadgeWithDetails) => {
    const { achievement } = badge;
    const badgeElement = (
      <motion.div
        className={cn(
          "rounded-full flex items-center justify-center",
          getDifficultyColor(achievement.difficulty),
          sizeClasses.badge
        )}
        initial={{ scale: 1 }}
        whileHover={animationsEnabledRef.current ? { scale: 1.1 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <div className={sizeClasses.icon}>
          {getIconComponent(achievement.icon)}
        </div>
      </motion.div>
    );

    if (showTooltips) {
      return (
        <TooltipProvider key={badge.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              {badgeElement}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-center">
                <p className="font-semibold">{achievement.title}</p>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <div key={badge.id}>{badgeElement}</div>;
  };

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex gap-2", className)}>
      {badges.map(renderBadge)}
    </div>
  );
}
