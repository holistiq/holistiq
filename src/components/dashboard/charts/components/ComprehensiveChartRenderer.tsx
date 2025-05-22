import React from 'react';
import {
  LineChart,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MAToggle } from './MAToggle';
import { TimeRangeSelector } from './TimeRangeSelector';
import { InteractiveLegend } from './InteractiveLegend';
// Annotation components preserved for future implementation
// import { ChartAnnotations } from './AnnotationMarker';
import { ComprehensiveChartTooltipContent } from './ChartTooltipHandlers';
import { TimeRangeOption } from '../PerformanceChart';
import { MetricKey } from '../utils/chartUtils';
import { createReferenceLineData } from '../utils/chartHelpers';
import { debugError } from '@/utils/debugUtils';

interface ComprehensiveChartRendererProps {
  processedData: any;
  chartId: string;
  chartTitle: string;
  chartDescription: string;
  chartConfig: any;
  height: number | string;
  className: string;
  hideTitle: boolean;
  showMAControls: boolean;
  effectiveShowMA: boolean;
  handleMAToggle: (show: boolean) => void;
  showTimeRangeSelector: boolean;
  effectiveTimeRange: TimeRangeOption;
  handleTimeRangeChange: (range: TimeRangeOption) => void;
  showInteractiveLegend: boolean;
  metrics: string[];
  baselineValues: any;
  showBaselineReference: boolean;
  highlightedMetric: string | null;
  setHighlightedMetric: (metric: string | null) => void;
  trendData: any;
  maTrendData: any;
  dataStats: any;
  // Annotation props temporarily disabled but preserved for future implementation
  // showAnnotations: boolean;
  // annotations: any[];
}

export function ComprehensiveChartRenderer({
  processedData,
  chartId,
  chartTitle,
  chartDescription,
  chartConfig,
  height,
  className,
  hideTitle,
  showMAControls,
  effectiveShowMA,
  handleMAToggle,
  showTimeRangeSelector,
  effectiveTimeRange,
  handleTimeRangeChange,
  showInteractiveLegend,
  metrics,
  baselineValues,
  showBaselineReference,
  highlightedMetric,
  setHighlightedMetric,
  trendData,
  maTrendData,
  dataStats
  // Annotation props temporarily disabled but preserved for future implementation
  // showAnnotations,
  // annotations
}: Readonly<ComprehensiveChartRendererProps>) {
  return (
    <div className={cn("flex flex-col", className)} style={{ height: '100%' }}>
      <div className="flex items-center justify-between mb-2">
        {!hideTitle && (
          <div className="text-lg font-medium" id={`${chartId}-title`}>
            {chartTitle}
          </div>
        )}

        <div className="flex items-center space-x-4">
          {showMAControls && (
            <MAToggle
              showMovingAverage={effectiveShowMA}
              onToggle={handleMAToggle}
            />
          )}

          {showTimeRangeSelector && (
            <TimeRangeSelector
              selectedRange={effectiveTimeRange}
              onChange={handleTimeRangeChange}
              className="ml-auto"
            />
          )}
        </div>
      </div>

      <div className="chart-container" style={{
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        minHeight: '400px',
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        <span className="sr-only" id={`${chartId}-desc`}>{chartDescription}</span>

        {/* Note about spread out data points */}
        {processedData.finalChartData.some(point => 'originalDate' in point && point.originalDate !== point.date) && (
          <div className="text-xs text-muted-foreground mb-2">
            <span>* Dates marked with an asterisk have been adjusted for better visualization. Hover for actual times.</span>
          </div>
        )}

        <div style={{ width: '100%', height: '100%', minHeight: '350px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <LineChart
              data={processedData.finalChartData}
              margin={{ top: 60, right: 90, left: 80, bottom: 40 }} // Increased bottom margin to prevent truncation
              style={{ visibility: 'visible', overflow: 'visible' }}
              aria-labelledby={`${chartId}-desc`}
              // No legend configuration here - we'll use the Legend component
              layout="horizontal"
            >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />

            {/* X Axis (Time) */}
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(timestamp) => {
                try {
                  // Find the corresponding data point to check if it has an original date
                  const dataPoint = processedData.finalChartData.find(point => point.date === timestamp);

                  // If this is a spread out data point, add an indicator
                  const hasOriginalDate = dataPoint && 'originalDate' in dataPoint && dataPoint.originalDate !== dataPoint.date;

                  // Format the date for display
                  const formattedDate = format(new Date(timestamp), 'MMM d');

                  // Add an asterisk to indicate this is a spread out data point
                  return hasOriginalDate ? `${formattedDate}*` : formattedDate;
                } catch (error) {
                  debugError("Error formatting X-axis timestamp:", error, timestamp);
                  return 'Invalid';
                }
              }}
              padding={{ left: 20, right: 20 }}
              label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
              minTickGap={5}
              height={50}
              ticks={processedData.finalChartData.length <= 5
                ? processedData.finalChartData.map(point => point.date)
                : undefined}
              interval={processedData.finalChartData.length <= 5 ? 0 : 'preserveStartEnd'}
            />

            {/* Y Axis for Score */}
            <YAxis
              yAxisId="score"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              label={{
                value: 'Score',
                angle: -90,
                position: 'insideLeft',
                offset: 20,
                style: {
                  textAnchor: 'middle',
                  fill: chartConfig.score.color,
                  fontWeight: 'bold'
                }
              }}
              orientation="left"
              stroke={chartConfig.score.color}
              width={60}
            />

            {/* Y Axis for Accuracy */}
            <YAxis
              yAxisId="accuracy"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
              label={{
                value: 'Accuracy',
                angle: -90,
                position: 'insideRight',
                offset: 15,
                style: {
                  textAnchor: 'middle',
                  fill: chartConfig.accuracy.color,
                  fontWeight: 'bold'
                }
              }}
              orientation="right"
              stroke={chartConfig.accuracy.color}
              width={60}
            />

            {/* Y Axis for Reaction Time */}
            <YAxis
              yAxisId="reactionTime"
              domain={[
                Math.max(0, Math.floor(dataStats.reactionTime.min * 0.9)),
                Math.ceil(dataStats.reactionTime.max * 1.1)
              ]}
              tickFormatter={(value) => `${Math.round(value)}`}
              label={{
                value: 'Reaction Time (ms)',
                angle: -90,
                position: 'insideLeft',
                offset: 15,
                style: {
                  textAnchor: 'middle',
                  fill: chartConfig.reactionTime.color,
                  fontWeight: 'bold'
                }
              }}
              orientation="left"
              stroke={chartConfig.reactionTime.color}
              width={60}
            />

            {/* Enhanced Tooltips */}
            <Tooltip
              content={(props) => ComprehensiveChartTooltipContent(props, maTrendData)}
            />

            {/* Override the default legend with an empty one */}
            <Legend content={() => null} />

            {/* Interactive legend if enabled */}
            {showInteractiveLegend && (
              <Legend
                content={
                  <InteractiveLegend
                    chartConfig={chartConfig}
                    metrics={metrics as MetricKey[]}
                    baselineValues={baselineValues}
                    onHighlight={setHighlightedMetric}
                    highlightedMetric={highlightedMetric}
                    trendData={trendData}
                  />
                }
                verticalAlign="bottom"
                height={60}
              />
            )}

            {/* Baseline Reference Lines */}
            {!!(baselineValues && showBaselineReference && baselineValues.score) && (
              <Line
                key="baseline-score-line"
                yAxisId="score"
                name={`Baseline Score: ${baselineValues.score}`}
                data={createReferenceLineData(processedData.finalChartData, baselineValues.score)}
                dataKey="value"
                stroke={chartConfig.score.color}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            )}

            {!!(baselineValues && showBaselineReference && baselineValues.reactionTime) && (
              <Line
                key="baseline-reaction-time-line"
                yAxisId="reactionTime"
                name={`Baseline Reaction Time: ${baselineValues.reactionTime}ms`}
                data={createReferenceLineData(processedData.finalChartData, baselineValues.reactionTime)}
                dataKey="value"
                stroke={chartConfig.reactionTime.color}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            )}

            {!!(baselineValues && showBaselineReference && baselineValues.accuracy) && (
              <Line
                key="baseline-accuracy-line"
                yAxisId="accuracy"
                name={`Baseline Accuracy: ${baselineValues.accuracy}%`}
                data={createReferenceLineData(processedData.finalChartData, baselineValues.accuracy)}
                dataKey="value"
                stroke={chartConfig.accuracy.color}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            )}

            {/* Metric Lines */}
            {metrics.includes('reactionTime') && (
              <>
                <Line
                  key="reaction-time-line"
                  yAxisId="reactionTime"
                  type="linear"
                  dataKey="reactionTime"
                  stroke={chartConfig.reactionTime.color}
                  strokeWidth={highlightedMetric === 'reactionTime' ? 4 : 3}
                  dot={{
                    r: 8,
                    strokeWidth: 2,
                    stroke: chartConfig.reactionTime.color,
                    fill: "white"
                  }}
                  activeDot={{
                    r: 10,
                    strokeWidth: 3,
                    stroke: chartConfig.reactionTime.color,
                    fill: "white"
                  }}
                  onMouseEnter={() => setHighlightedMetric('reactionTime')}
                  onMouseLeave={() => setHighlightedMetric(null)}
                  name="Reaction Time"
                />

                {effectiveShowMA && (
                  <Line
                    key="reaction-time-ma-line"
                    yAxisId="reactionTime"
                    type="monotone"
                    dataKey="reactionTimeMA"
                    stroke={chartConfig.reactionTime.color}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartConfig.reactionTime.color,
                      fill: "white"
                    }}
                    activeDot={{
                      r: 8,
                      strokeWidth: 2,
                      stroke: chartConfig.reactionTime.color,
                      fill: "white"
                    }}
                    name="Reaction Time MA"
                    onMouseEnter={() => setHighlightedMetric('reactionTimeMA')}
                    onMouseLeave={() => setHighlightedMetric(null)}
                  />
                )}
              </>
            )}

            {metrics.includes('score') && (
              <>
                <Line
                  key="score-line"
                  yAxisId="score"
                  type="linear"
                  dataKey="score"
                  stroke={chartConfig.score.color}
                  strokeWidth={highlightedMetric === 'score' ? 4 : 3}
                  dot={{
                    r: 8,
                    strokeWidth: 2,
                    stroke: chartConfig.score.color,
                    fill: "white"
                  }}
                  activeDot={{
                    r: 10,
                    strokeWidth: 3,
                    stroke: chartConfig.score.color,
                    fill: "white"
                  }}
                  onMouseEnter={() => setHighlightedMetric('score')}
                  onMouseLeave={() => setHighlightedMetric(null)}
                  name="Score"
                />

                {effectiveShowMA && (
                  <Line
                    key="score-ma-line"
                    yAxisId="score"
                    type="monotone"
                    dataKey="scoreMA"
                    stroke={chartConfig.score.color}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartConfig.score.color,
                      fill: "white"
                    }}
                    activeDot={{
                      r: 8,
                      strokeWidth: 2,
                      stroke: chartConfig.score.color,
                      fill: "white"
                    }}
                    name="Score MA"
                    onMouseEnter={() => setHighlightedMetric('scoreMA')}
                    onMouseLeave={() => setHighlightedMetric(null)}
                  />
                )}
              </>
            )}

            {metrics.includes('accuracy') && (
              <>
                <Line
                  key="accuracy-line"
                  yAxisId="accuracy"
                  type="linear"
                  dataKey="accuracy"
                  stroke={chartConfig.accuracy.color}
                  strokeWidth={highlightedMetric === 'accuracy' ? 4 : 3}
                  dot={{
                    r: 8,
                    strokeWidth: 2,
                    stroke: chartConfig.accuracy.color,
                    fill: "white"
                  }}
                  activeDot={{
                    r: 10,
                    strokeWidth: 3,
                    stroke: chartConfig.accuracy.color,
                    fill: "white"
                  }}
                  onMouseEnter={() => setHighlightedMetric('accuracy')}
                  onMouseLeave={() => setHighlightedMetric(null)}
                  name="Accuracy"
                />

                {effectiveShowMA && (
                  <Line
                    key="accuracy-ma-line"
                    yAxisId="accuracy"
                    type="monotone"
                    dataKey="accuracyMA"
                    stroke={chartConfig.accuracy.color}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartConfig.accuracy.color,
                      fill: "white"
                    }}
                    activeDot={{
                      r: 8,
                      strokeWidth: 2,
                      stroke: chartConfig.accuracy.color,
                      fill: "white"
                    }}
                    name="Accuracy MA"
                    onMouseEnter={() => setHighlightedMetric('accuracyMA')}
                    onMouseLeave={() => setHighlightedMetric(null)}
                  />
                )}
              </>
            )}

            {/*
              Annotation Markers - temporarily disabled but preserved for future implementation
              {showAnnotations && annotations.length > 0 && (
                <ChartAnnotations
                  annotations={annotations}
                  xScale={(value) => {
                    // This is a simplified version - in a real implementation,
                    // you would need to access the actual scale function from Recharts
                    const chartData = processedData.finalChartData;
                    if (chartData.length < 2) return 0;

                    const minDate = chartData[0].date;
                    const maxDate = chartData[chartData.length - 1].date;
                    const range = maxDate - minDate;

                    // Approximate the x position based on the date value
                    const chartWidth = 800; // Approximate chart width
                    const leftMargin = 60;
                    const rightMargin = 90;
                    const availableWidth = chartWidth - leftMargin - rightMargin;

                    const position = ((value - minDate) / range) * availableWidth + leftMargin;
                    return position;
                  }}
                  yScale={() => 0} // Not used for our implementation
                  chartHeight={400}
                />
              )}
            */}
          </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
