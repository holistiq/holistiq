import { ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { ImpactSignificance, ConfidenceLevel, getImpactSignificance, getConfidenceLevel } from '@/types/correlation';

/**
 * Renders an impact indicator icon based on the impact value
 * @param impact - The impact value to visualize
 * @param isInverted - Whether higher values are worse (like for reaction time)
 * @returns A React element representing the impact
 */
export const renderImpactIndicator = (
  impact: number | null,
  isInverted: boolean = false
): ReactNode => {
  if (impact === null) return null;
  
  const significance = getImpactSignificance(impact, isInverted);
  
  switch (significance) {
    case ImpactSignificance.VERY_POSITIVE:
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case ImpactSignificance.POSITIVE:
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    case ImpactSignificance.NEUTRAL:
      return <Info className="h-5 w-5 text-gray-400" />;
    case ImpactSignificance.NEGATIVE:
      return <XCircle className="h-5 w-5 text-red-400" />;
    case ImpactSignificance.VERY_NEGATIVE:
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-400" />;
  }
};

/**
 * Renders a visual confidence level indicator
 * @param confidence - The confidence value (0-1)
 * @returns A React element representing the confidence level
 */
export const renderConfidenceLevel = (confidence: number | null): ReactNode => {
  const level = getConfidenceLevel(confidence);
  
  switch (level) {
    case ConfidenceLevel.VERY_HIGH:
      return <div className="flex items-center gap-1 text-green-500">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>;
    case ConfidenceLevel.HIGH:
      return <div className="flex items-center gap-1 text-green-400">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
      </div>;
    case ConfidenceLevel.MODERATE:
      return <div className="flex items-center gap-1 text-yellow-500">
        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
      </div>;
    case ConfidenceLevel.LOW:
      return <div className="flex items-center gap-1 text-orange-400">
        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
      </div>;
    case ConfidenceLevel.VERY_LOW:
    default:
      return <div className="flex items-center gap-1 text-red-400">
        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
      </div>;
  }
};
