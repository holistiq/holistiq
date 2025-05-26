import React, { Profiler, ProfilerOnRenderCallback, ReactNode } from "react";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ namespace: "RenderProfiler" });

interface RenderProfilerProps {
  id: string;
  children: ReactNode;
  logThreshold?: number; // Only log renders that take longer than this (ms)
}

/**
 * A component that wraps children and logs render performance
 * Use this to identify components that are rendering too frequently or taking too long
 */
export function RenderProfiler({
  id,
  children,
  logThreshold = 1,
}: RenderProfilerProps) {
  const onRender: ProfilerOnRenderCallback = (
    profilerId,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions,
  ) => {
    // Only log renders that take longer than the threshold
    if (actualDuration > logThreshold) {
      logger.debug(
        `[${profilerId}] rendered in ${actualDuration.toFixed(2)}ms (phase: ${phase})`,
      );
    }
  };

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
