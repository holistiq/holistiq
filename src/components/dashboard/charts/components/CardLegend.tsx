/**
 * Card Legend Component
 *
 * A visually distinct card-based legend component that groups related metrics together
 */
import React from "react";
import { ChartConfig } from "../utils/chartUtils";

interface CardLegendProps {
  readonly chartConfig: ChartConfig;
  readonly showMovingAverage: boolean;
  readonly baselineValues?: Record<string, number | null> | null;
  readonly mode?: "single" | "comprehensive";
  readonly dataKey?: "score" | "reactionTime" | "accuracy";
}

export function CardLegend({
  chartConfig,
  showMovingAverage,
  baselineValues,
  mode = "comprehensive",
  dataKey = "score",
}: Readonly<CardLegendProps>) {
  // Create metric groups
  const scoreItems = [
    {
      type: "regular",
      label: "Score",
      color: chartConfig.score.color,
      isDashed: false,
    },
    ...(showMovingAverage
      ? [
          {
            type: "ma",
            label: "Score MA",
            color: chartConfig.score.color,
            isDashed: true,
          },
        ]
      : []),
    ...(baselineValues?.score
      ? [
          {
            type: "baseline",
            label: `Baseline Score: ${baselineValues.score}`,
            color: chartConfig.score.color,
            isDashed: true,
          },
        ]
      : []),
  ];

  const reactionTimeItems = [
    {
      type: "regular",
      label: "Reaction Time",
      color: chartConfig.reactionTime.color,
      isDashed: false,
    },
    ...(showMovingAverage
      ? [
          {
            type: "ma",
            label: "Reaction Time MA",
            color: chartConfig.reactionTime.color,
            isDashed: true,
          },
        ]
      : []),
    ...(baselineValues?.reactionTime
      ? [
          {
            type: "baseline",
            label: `Baseline Reaction Time: ${baselineValues.reactionTime}ms`,
            color: chartConfig.reactionTime.color,
            isDashed: true,
          },
        ]
      : []),
  ];

  const accuracyItems = [
    {
      type: "regular",
      label: "Accuracy",
      color: chartConfig.accuracy.color,
      isDashed: false,
    },
    ...(showMovingAverage
      ? [
          {
            type: "ma",
            label: "Accuracy MA",
            color: chartConfig.accuracy.color,
            isDashed: true,
          },
        ]
      : []),
    ...(baselineValues?.accuracy
      ? [
          {
            type: "baseline",
            label: `Baseline Accuracy: ${baselineValues.accuracy}%`,
            color: chartConfig.accuracy.color,
            isDashed: true,
          },
        ]
      : []),
  ];

  // Render a legend item
  const renderLegendItem = (item: {
    label: string;
    color: string;
    isDashed: boolean;
    type: string;
  }) => {
    // Determine the appropriate line and dot style based on the item type
    let lineStyle;
    let dotStyle;

    if (item.type === "baseline") {
      // Baseline: dashed line, no dot
      lineStyle = (
        <div className="flex items-center">
          <div
            className="w-12 border-t-2 border-dashed h-0 flex-shrink-0"
            style={{ borderColor: item.color }}
          />
        </div>
      );
      dotStyle = null;
    } else if (item.type === "ma") {
      // Moving Average: dotted line, small dot
      lineStyle = (
        <div className="flex items-center">
          <div
            className="w-12 border-t-2 border-dotted h-0 flex-shrink-0"
            style={{ borderColor: item.color }}
          />
        </div>
      );
      dotStyle = (
        <div
          className="w-3 h-3 rounded-full border-2 flex-shrink-0 bg-white"
          style={{ borderColor: item.color }}
        />
      );
    } else {
      // Regular metric: solid line, large dot
      lineStyle = (
        <div className="flex items-center">
          <div
            className="w-12 h-1.5 flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
        </div>
      );
      dotStyle = (
        <div
          className="w-4 h-4 rounded-full border-2 flex-shrink-0 bg-white"
          style={{ borderColor: item.color }}
        />
      );
    }

    return (
      <div key={item.label} className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1">
          {dotStyle}
          {lineStyle}
        </div>
        <span className="text-xs font-medium ml-1">{item.label}</span>
      </div>
    );
  };

  // Render a metric card
  const renderMetricCard = (
    title: string,
    items: Array<{
      label: string;
      color: string;
      isDashed: boolean;
      type: string;
    }>,
    color: string,
  ) => (
    <div
      className="border-2 rounded-lg shadow-lg overflow-hidden flex-1 min-w-[220px] max-w-[300px] bg-white"
      style={{ borderColor: color }}
    >
      <div
        className="py-2.5 px-4 text-white font-semibold text-center text-sm flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <div className="w-4 h-4 rounded-full bg-white mr-2 flex-shrink-0 opacity-80"></div>
        {title}
      </div>
      <div className="p-4">{items.map(renderLegendItem)}</div>
    </div>
  );

  // Determine which cards to render based on mode
  const renderCards = () => {
    if (mode === "single") {
      // In single mode, only render the card for the selected metric
      switch (dataKey) {
        case "score":
          return renderMetricCard("Score", scoreItems, chartConfig.score.color);
        case "reactionTime":
          return renderMetricCard(
            "Reaction Time",
            reactionTimeItems,
            chartConfig.reactionTime.color,
          );
        case "accuracy":
          return renderMetricCard(
            "Accuracy",
            accuracyItems,
            chartConfig.accuracy.color,
          );
        default:
          return null;
      }
    } else {
      // In comprehensive mode, render all cards
      return (
        <>
          {renderMetricCard("Score", scoreItems, chartConfig.score.color)}
          {renderMetricCard(
            "Reaction Time",
            reactionTimeItems,
            chartConfig.reactionTime.color,
          )}
          {renderMetricCard(
            "Accuracy",
            accuracyItems,
            chartConfig.accuracy.color,
          )}
        </>
      );
    }
  };

  return (
    <div className="relative mt-8 pt-4 performance-chart-legend">
      {" "}
      {/* Added class for responsive styling */}
      {/* Visual connector line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-200 top-0"></div>
      {/* Legend cards container */}
      <div
        className={`flex flex-wrap ${mode === "single" ? "justify-center" : "gap-8 justify-center"} mt-4 mb-6 px-4`}
      >
        {renderCards()}
      </div>
    </div>
  );
}
