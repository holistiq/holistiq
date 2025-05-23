/**
 * Component for controlling and monitoring data prefetching
 */
import React, { useState } from 'react';
import { usePrefetch } from '@/hooks/usePrefetch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Database, Settings } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Interface for prefetch item metrics
interface PrefetchItemMetric {
  startTime: number;
  endTime: number | null;
  success: boolean;
  error?: string;
}

interface PrefetchControlProps {
  // Whether to show detailed metrics
  readonly showMetrics?: boolean;

  // Whether to show configuration options
  readonly showConfig?: boolean;
}

/**
 * Component for controlling and monitoring data prefetching
 */
export function PrefetchControl({
  showMetrics = true,
  showConfig = true
}: PrefetchControlProps) {
  const {
    isPrefetching,
    metrics,
    config,
    prefetch,
    updateConfig
  } = usePrefetch();

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Calculate success rate
  const successRate = metrics.totalItems > 0
    ? Math.round((metrics.successfulItems / metrics.totalItems) * 100)
    : 0;

  // Calculate total prefetch time
  const totalTime = metrics.endTime != null && metrics.startTime != null
    ? (metrics.endTime - metrics.startTime).toFixed(0)
    : '0';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Data Prefetching</span>
          {isPrefetching && (
            <Badge variant="outline" className="ml-2 bg-blue-50">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Prefetching...
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Automatically load frequently used data in the background
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="prefetch-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => updateConfig({ enabled: checked })}
            />
            <Label htmlFor="prefetch-enabled">Enable prefetching</Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => prefetch()}
            disabled={isPrefetching || !config.enabled}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Prefetch Now
          </Button>
        </div>

        {showMetrics && metrics.totalItems > 0 && (
          <>
            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-xl font-semibold">{successRate}%</span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Total Time</span>
                <span className="text-xl font-semibold">{totalTime}ms</span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Items Prefetched</span>
                <span className="text-xl font-semibold">{metrics.successfulItems}/{metrics.totalItems}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Failed Items</span>
                <span className="text-xl font-semibold">{metrics.failedItems}</span>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="details">
                <AccordionTrigger>Detailed Metrics</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {Object.entries(metrics.itemMetrics ?? {}).map(([key, metric]: [string, PrefetchItemMetric]) => (
                      <div key={key} className="flex justify-between items-center p-2 rounded bg-muted/50">
                        <div>
                          <span className="font-medium">{key}</span>
                          <span className={`ml-2 text-xs ${metric.success ? 'text-green-600' : 'text-red-600'}`}>
                            {metric.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <span className="text-sm">{metric.endTime != null ? (metric.endTime - metric.startTime).toFixed(0) : '0'}ms</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}

        {showConfig && (
          <>
            <Separator className="my-4" />

            <Collapsible
              open={isConfigOpen}
              onOpenChange={setIsConfigOpen}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex w-full justify-between p-0">
                  <span className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuration Options
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isConfigOpen ? 'Hide' : 'Show'}
                  </span>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-4 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Data Types to Prefetch</h4>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prefetch-user-profile">User Profile</Label>
                      <Switch
                        id="prefetch-user-profile"
                        checked={config.prefetchUserProfile}
                        onCheckedChange={(checked) => updateConfig({ prefetchUserProfile: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="prefetch-test-results">Test Results</Label>
                      <Switch
                        id="prefetch-test-results"
                        checked={config.prefetchTestResults}
                        onCheckedChange={(checked) => updateConfig({ prefetchTestResults: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="prefetch-supplements">Supplements</Label>
                      <Switch
                        id="prefetch-supplements"
                        checked={config.prefetchSupplements}
                        onCheckedChange={(checked) => updateConfig({ prefetchSupplements: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="prefetch-confounding-factors">Confounding Factors</Label>
                      <Switch
                        id="prefetch-confounding-factors"
                        checked={config.prefetchConfoundingFactors}
                        onCheckedChange={(checked) => updateConfig({ prefetchConfoundingFactors: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="prefetch-washout-periods">Washout Periods</Label>
                      <Switch
                        id="prefetch-washout-periods"
                        checked={config.prefetchWashoutPeriods}
                        onCheckedChange={(checked) => updateConfig({ prefetchWashoutPeriods: checked })}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Logging Options</h4>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="log-level">Console Log Level</Label>
                      <Select
                        value={config.logLevel}
                        onValueChange={(value) => updateConfig({ logLevel: value as 'none' | 'error' | 'warn' | 'info' | 'debug' })}
                      >
                        <SelectTrigger className="w-[180px]" id="log-level">
                          <SelectValue placeholder="Select log level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (Production)</SelectItem>
                          <SelectItem value="error">Errors Only</SelectItem>
                          <SelectItem value="warn">Warnings & Errors</SelectItem>
                          <SelectItem value="info">Info & Above</SelectItem>
                          <SelectItem value="debug">Debug (Verbose)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        <Database className="h-3 w-3 mr-1" />
        Prefetching improves app performance by loading data before you need it
      </CardFooter>
    </Card>
  );
}
