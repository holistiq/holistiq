/**
 * Hook for controlling data prefetching
 */
import { useState, useEffect, useCallback } from "react";
import {
  prefetchService,
  PrefetchConfig,
  DEFAULT_PREFETCH_CONFIG,
} from "@/services/prefetchService";
import { useSupabaseAuth } from "./useSupabaseAuth";

// Define PrefetchMetrics interface based on the one in prefetchService
interface PrefetchMetrics {
  startTime: number;
  endTime: number | null;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  itemMetrics: Record<
    string,
    {
      startTime: number;
      endTime: number | null;
      success: boolean;
      error?: string;
    }
  >;
}

interface UsePrefetchOptions {
  // Whether to enable prefetching
  enabled?: boolean;

  // Custom prefetch configuration
  config?: Partial<PrefetchConfig>;
}

interface UsePrefetchResult {
  // Whether prefetching is in progress
  isPrefetching: boolean;

  // Prefetching metrics
  metrics: PrefetchMetrics;

  // Current prefetch configuration
  config: PrefetchConfig;

  // Function to manually trigger prefetching
  prefetch: () => Promise<void>;

  // Function to update prefetch configuration
  updateConfig: (config: Partial<PrefetchConfig>) => void;
}

/**
 * Hook for controlling data prefetching
 * @param options Prefetch options
 * @returns Prefetch control functions and state
 */
export function usePrefetch(
  options: UsePrefetchOptions = {},
): UsePrefetchResult {
  const { user } = useSupabaseAuth();
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [metrics, setMetrics] = useState<PrefetchMetrics>({
    startTime: 0,
    endTime: null,
    totalItems: 0,
    successfulItems: 0,
    failedItems: 0,
    itemMetrics: {},
  });
  const [config, setConfig] = useState<PrefetchConfig>({
    ...DEFAULT_PREFETCH_CONFIG,
    ...options.config,
    enabled: options.enabled ?? DEFAULT_PREFETCH_CONFIG.enabled,
  });

  // Update prefetch service configuration when config changes
  useEffect(() => {
    prefetchService.configure(config);

    // In development mode, log configuration changes
    if (process.env.NODE_ENV !== "production" && config.logLevel !== "none") {
      console.log("Prefetch configuration updated:", config);
    }
  }, [config]);

  // Function to manually trigger prefetching
  const prefetch = useCallback(async () => {
    if (!user) return;

    setIsPrefetching(true);
    try {
      await prefetchService.prefetch(user.id);
      // Update metrics after prefetching
      setMetrics(prefetchService.getMetrics());
    } catch (error) {
      console.error("Error during manual prefetch:", error);
    } finally {
      setIsPrefetching(false);
    }
  }, [user]);

  // Function to update prefetch configuration
  const updateConfig = useCallback((newConfig: Partial<PrefetchConfig>) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...newConfig,
    }));
  }, []);

  // Update prefetching status and metrics periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsPrefetching(prefetchService.isPrefetchingInProgress());
      setMetrics(prefetchService.getMetrics());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return {
    isPrefetching,
    metrics,
    config,
    prefetch,
    updateConfig,
  };
}
