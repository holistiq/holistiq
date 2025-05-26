/**
 * Factor Timeline Component
 *
 * Displays confounding factors on a timeline
 */
import { format } from "date-fns";
import {
  Moon,
  Activity,
  Coffee,
  Dumbbell,
  Smile,
  Thermometer,
  Volume2,
  Droplets,
  Wine,
} from "lucide-react";
import { ConfoundingFactor } from "@/types/confoundingFactor";

/**
 * Props for the FactorTimeline component
 */
export interface FactorTimelineProps {
  readonly factorType: string;
  readonly factorName: string;
  readonly factors: ConfoundingFactor[];
  readonly dateRange: {
    from?: Date;
    to?: Date;
  };
}

/**
 * Component for rendering a confounding factor timeline
 * Shows periods when a factor was recorded as a visual timeline
 */
export function FactorTimeline({
  factorType,
  factorName,
  factors,
  dateRange,
}: Readonly<FactorTimelineProps>): JSX.Element | null {
  // Filter factors by type
  const filteredFactors = factors.filter((factor) => {
    switch (factorType) {
      case "sleep":
        return factor.sleep_duration !== null || factor.sleep_quality !== null;
      case "stress":
        return factor.stress_level !== null;
      case "exercise":
        return (
          factor.exercise_duration !== null ||
          factor.exercise_intensity !== null
        );
      case "caffeine":
        return factor.caffeine_intake !== null;
      case "alcohol":
        return factor.alcohol_intake !== null;
      case "mood":
        return factor.mood !== null;
      case "energy":
        return factor.energy_level !== null;
      default:
        return false;
    }
  });

  if (filteredFactors.length === 0) return null;

  // Get icon based on factor type
  const getFactorIcon = () => {
    switch (factorType) {
      case "sleep":
        return <Moon className="h-5 w-5 text-blue-500" />;
      case "stress":
        return <Activity className="h-5 w-5 text-red-500" />;
      case "exercise":
        return <Dumbbell className="h-5 w-5 text-green-500" />;
      case "caffeine":
        return <Coffee className="h-5 w-5 text-amber-700" />;
      case "alcohol":
        return <Wine className="h-5 w-5 text-purple-500" />;
      case "mood":
        return <Smile className="h-5 w-5 text-yellow-500" />;
      case "energy":
        return <Activity className="h-5 w-5 text-orange-500" />;
      case "noise":
        return <Volume2 className="h-5 w-5 text-gray-500" />;
      case "temperature":
        return <Thermometer className="h-5 w-5 text-red-400" />;
      case "hydration":
        return <Droplets className="h-5 w-5 text-blue-400" />;
      default:
        return <Activity className="h-5 w-5 text-primary" />;
    }
  };

  // Get factor value for display
  const getFactorValue = (factor: ConfoundingFactor) => {
    switch (factorType) {
      case "sleep":
        if (factor.sleep_duration) {
          return `${(factor.sleep_duration / 60).toFixed(1)} hours`;
        } else if (factor.sleep_quality) {
          return `Quality: ${factor.sleep_quality}/10`;
        }
        return "Recorded";
      case "stress":
        return factor.stress_level
          ? `Level: ${factor.stress_level}/10`
          : "Recorded";
      case "exercise":
        if (factor.exercise_duration) {
          return `${factor.exercise_duration} min`;
        } else if (factor.exercise_intensity) {
          return `Intensity: ${factor.exercise_intensity}/10`;
        }
        return "Recorded";
      case "caffeine":
        return factor.caffeine_intake
          ? `${factor.caffeine_intake} mg`
          : "Recorded";
      case "alcohol":
        return factor.alcohol_intake
          ? `${factor.alcohol_intake} drinks`
          : "Recorded";
      case "mood":
        return factor.mood ? `Level: ${factor.mood}/10` : "Recorded";
      case "energy":
        return factor.energy_level
          ? `Level: ${factor.energy_level}/10`
          : "Recorded";
      default:
        return "Recorded";
    }
  };

  // Calculate timeline range
  const rangeStart = dateRange.from
    ? dateRange.from.getTime()
    : Math.min(
        ...filteredFactors.map((f) => new Date(f.recorded_at).getTime()),
      );

  const rangeEnd = dateRange.to
    ? dateRange.to.getTime()
    : Math.max(
        ...filteredFactors.map((f) => new Date(f.recorded_at).getTime()),
      );

  const totalRange = rangeEnd - rangeStart;

  // If range is invalid, don't render
  if (totalRange <= 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {getFactorIcon()}
        <span className="font-medium">{factorName}</span>
      </div>
      <div className="relative h-8 bg-secondary/30 rounded-md overflow-hidden">
        {filteredFactors.map((factor, index) => {
          const factorTime = new Date(factor.recorded_at).getTime();

          // Skip if outside range
          if (factorTime < rangeStart || factorTime > rangeEnd) return null;

          // Calculate position
          const position = ((factorTime - rangeStart) / totalRange) * 100;

          return (
            <div
              key={`${factor.id}-${index}`}
              className="absolute top-0 h-full w-2 bg-primary rounded-full"
              style={{
                left: `${Math.max(0, position)}%`,
                transform: "translateX(-50%)",
              }}
              title={`${factorName}: ${format(new Date(factor.recorded_at), "MMM d, yyyy")} - ${getFactorValue(factor)}`}
            />
          );
        })}
      </div>
    </div>
  );
}
