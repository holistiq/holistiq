/**
 * Metric Definitions Panel Component
 * 
 * Provides detailed explanations of chart metrics in a collapsible panel
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function MetricDefinitionsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full mt-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <HelpCircle className="h-4 w-4 mr-2" />
          <span>Understanding your metrics</span>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="sr-only">Toggle metric definitions</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent className="mt-2">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-base mb-2">Score</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Your overall cognitive performance score from each test session.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Interpretation:</strong> Higher values indicate better overall cognitive performance.</p>
                  <p><strong>Baseline:</strong> Your reference point from initial testing.</p>
                  <p><strong>Moving Average (MA):</strong> Smooths out daily variations to show your true trend.</p>
                  <p><strong>What to look for:</strong> Consistent scores above your baseline indicate cognitive improvement.</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-base mb-2">Reaction Time</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  How quickly you respond to stimuli, measured in milliseconds (ms).
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Interpretation:</strong> Lower values are better - faster reactions indicate better processing speed.</p>
                  <p><strong>Baseline:</strong> Your initial response speed from baseline testing.</p>
                  <p><strong>Moving Average (MA):</strong> Shows your true reaction time trend by reducing the impact of outliers.</p>
                  <p><strong>What to look for:</strong> Reaction times consistently below your baseline indicate improved processing speed.</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-base mb-2">Accuracy</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The percentage of correct responses in each test.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Interpretation:</strong> Higher values indicate better precision and fewer errors.</p>
                  <p><strong>Baseline:</strong> Your initial accuracy percentage from baseline testing.</p>
                  <p><strong>Moving Average (MA):</strong> Reveals your true accuracy trend by smoothing out daily fluctuations.</p>
                  <p><strong>What to look for:</strong> Accuracy percentages consistently above your baseline indicate improved cognitive precision.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-base mb-2">How to Use This Chart</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-xs space-y-1">
                  <p><strong>Compare to Baseline:</strong> See how your current performance compares to your starting point.</p>
                  <p><strong>Look for Trends:</strong> Focus on the Moving Average (MA) lines to identify genuine improvements or declines.</p>
                  <p><strong>Check Consistency:</strong> Consistent performance above baseline is more meaningful than occasional peaks.</p>
                </div>
                <div className="text-xs space-y-1">
                  <p><strong>Balance Speed & Accuracy:</strong> Watch for trade-offs between reaction time and accuracy.</p>
                  <p><strong>Track Interventions:</strong> Use annotations to mark when you started supplements or lifestyle changes.</p>
                  <p><strong>Adjust Time Range:</strong> Change the time period to focus on recent changes or long-term trends.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
