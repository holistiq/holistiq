import { Brain, Clock, Zap } from "lucide-react";
import { SupplementCorrelation, getImpactDescription } from '@/types/correlation';
import { renderImpactIndicator, renderConfidenceLevel } from '@/utils/correlationUtils';

interface CorrelationCardProps {
  readonly correlation: SupplementCorrelation;
  readonly supplementName?: string;
}

/**
 * Formats an impact value with a plus sign for positive values and percentage
 * @param impact The impact value to format
 * @returns Formatted impact string or 'N/A' if null
 */
function formatImpactValue(impact: number | null): string {
  if (impact === null) return 'N/A';

  const sign = impact > 0 ? '+' : '';
  return `${sign}${impact.toFixed(1)}%`;
}

/**
 * A card component that displays correlation analysis results for a supplement
 */
export function CorrelationCard({ correlation, supplementName }: Readonly<CorrelationCardProps>): JSX.Element {
  return (
    <div className="bg-primary/5 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-2">
        {supplementName || 'Supplement'} Analysis Results
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Brain className="h-4 w-4 text-primary" />
              Score Impact
            </h4>
            {renderImpactIndicator(correlation.score_impact)}
          </div>
          <p className="text-2xl font-bold">
            {formatImpactValue(correlation.score_impact)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getImpactDescription(correlation.score_impact, 'score')}
          </p>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4 text-primary" />
              Reaction Time Impact
            </h4>
            {renderImpactIndicator(correlation.reaction_time_impact, true)}
          </div>
          <p className="text-2xl font-bold">
            {formatImpactValue(correlation.reaction_time_impact)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getImpactDescription(correlation.reaction_time_impact, 'reaction_time', true)}
          </p>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Zap className="h-4 w-4 text-primary" />
              Accuracy Impact
            </h4>
            {renderImpactIndicator(correlation.accuracy_impact)}
          </div>
          <p className="text-2xl font-bold">
            {formatImpactValue(correlation.accuracy_impact)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getImpactDescription(correlation.accuracy_impact, 'accuracy')}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">Confidence Level:</span>
          {renderConfidenceLevel(correlation.confidence_level)}
        </div>
        <div className="text-sm text-muted-foreground">
          Based on {correlation.sample_size} test results
        </div>
      </div>
    </div>
  );
}
