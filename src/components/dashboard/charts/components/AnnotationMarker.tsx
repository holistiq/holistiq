/**
 * Annotation Marker Component
 * 
 * Displays annotation markers on the chart
 */
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { Flag } from 'lucide-react';
import { Annotation } from './ChartAnnotation';

interface AnnotationMarkerProps {
  x: number;
  y: number;
  annotation: Annotation;
}

export function AnnotationMarker({ x, y, annotation }: Readonly<AnnotationMarkerProps>) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <g transform={`translate(${x}, ${y})`} className="cursor-pointer">
            <circle
              r={6}
              fill={annotation.color}
              stroke="white"
              strokeWidth={1.5}
            />
            <Flag className="h-3 w-3 text-white" x={-1.5} y={-1.5} />
          </g>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-3 max-w-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium">{annotation.label}</p>
              <span className="text-xs text-muted-foreground">
                {format(new Date(annotation.date), 'MMM d, yyyy')}
              </span>
            </div>
            {annotation.description && (
              <p className="text-sm text-muted-foreground">{annotation.description}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ChartAnnotationsProps {
  annotations: Annotation[];
  xScale: (value: number) => number;
  yScale: (value: number) => number;
  chartHeight: number;
}

export function ChartAnnotations({ 
  annotations, 
  xScale, 
  yScale, 
  chartHeight 
}: Readonly<ChartAnnotationsProps>) {
  return (
    <g className="annotation-markers">
      {annotations.map(annotation => {
        const x = xScale(annotation.date);
        // Position at the top of the chart
        const y = 20;
        
        return (
          <React.Fragment key={annotation.id}>
            {/* Vertical line */}
            <line
              x1={x}
              y1={y}
              x2={x}
              y2={chartHeight - 30}
              stroke={annotation.color}
              strokeWidth={1}
              strokeDasharray="3,3"
              opacity={0.7}
            />
            
            {/* Marker */}
            <AnnotationMarker
              x={x}
              y={y}
              annotation={annotation}
            />
          </React.Fragment>
        );
      })}
    </g>
  );
}
