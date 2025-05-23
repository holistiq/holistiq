import { useState, useRef, useCallback, useEffect } from 'react';
import { createLogger } from '@/lib/logger';

// Create a logger for the useRefreshState hook
const logger = createLogger({ namespace: 'useRefreshState' });

interface RefreshState {
  /** Whether a refresh operation is in progress */
  isRefreshing: boolean;
  /** Timestamp of the last refresh operation */
  lastRefreshTime: number;
  /** Progress of the current refresh operation (0-100) */
  progress: number;
}

interface UseRefreshStateOptions {
  /** Minimum time between refresh operations in milliseconds */
  minRefreshInterval?: number;
  /** Timeout for auto-resetting the refresh state in milliseconds */
  autoResetTimeout?: number;
  /** Whether to show debug logs */
  debug?: boolean;
}

/**
 * Hook for managing refresh state with debouncing and progress tracking
 */
export function useRefreshState(options: UseRefreshStateOptions = {}) {
  const {
    minRefreshInterval = 2000,
    autoResetTimeout = 8000,
    debug = false
  } = options;

  // Use a single state object to prevent multiple re-renders
  const [state, setState] = useState<RefreshState>({
    isRefreshing: false,
    lastRefreshTime: 0,
    progress: 0
  });

  // Use a ref to track if a refresh is in progress to prevent race conditions
  const refreshRef = useRef({
    isRefreshing: false,
    timeoutId: null as number | null,
    startTime: 0
  });

  // Debug logging helper - use our centralized logger
  const log = useCallback((message: string, data?: unknown) => {
    if (debug) {
      logger.debug(message, data);
    }
  }, [debug]);

  // Complete the refresh operation
  const completeRefresh = useCallback(() => {
    if (!refreshRef.current.isRefreshing) return;

    // Clear any existing timeout
    if (refreshRef.current.timeoutId) {
      window.clearTimeout(refreshRef.current.timeoutId);
      refreshRef.current.timeoutId = null;
    }

    // Update the ref immediately
    refreshRef.current.isRefreshing = false;

    // Calculate the elapsed time
    const elapsed = Date.now() - refreshRef.current.startTime;
    log(`Refresh completed in ${elapsed}ms`);

    // Update the state with a small delay to allow for a smooth transition
    // Only update if the state actually needs to change to prevent unnecessary re-renders
    setState(prev => {
      if (!prev.isRefreshing && prev.progress === 100) return prev;
      return {
        ...prev,
        isRefreshing: false,
        progress: 100
      };
    });
  }, [log]);

  // Update the progress of the current refresh operation
  const updateProgress = useCallback((progress: number) => {
    if (!refreshRef.current.isRefreshing) return;

    // Normalize the progress value
    const normalizedProgress = Math.min(Math.max(0, progress), 100);

    // Only update state if the progress has actually changed
    setState(prev => {
      if (prev.progress === normalizedProgress) return prev;
      return {
        ...prev,
        progress: normalizedProgress
      };
    });

    log(`Progress updated: ${normalizedProgress}%`);
  }, [log]);

  // Start a refresh operation
  const startRefresh = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - state.lastRefreshTime;

    // Prevent rapid successive refreshes
    if (refreshRef.current.isRefreshing) {
      log('Refresh already in progress, ignoring request');
      return false;
    }

    // Enforce minimum interval between refreshes
    if (timeSinceLastRefresh < minRefreshInterval) {
      log(`Ignoring refresh request - last refresh was ${timeSinceLastRefresh}ms ago`);
      return false;
    }

    // Update the ref immediately to prevent race conditions
    refreshRef.current.isRefreshing = true;
    refreshRef.current.startTime = now;

    // Update the state (this will cause a re-render)
    setState({
      isRefreshing: true,
      lastRefreshTime: now,
      progress: 0
    });

    // We're removing the auto-reset timeout to prevent automatic completion
    // This will require explicit calls to completeRefresh from the component
    // that started the refresh operation
    if (refreshRef.current.timeoutId) {
      window.clearTimeout(refreshRef.current.timeoutId);
      refreshRef.current.timeoutId = null;
    }

    log('Refresh started');
    return true;
  }, [state.lastRefreshTime, minRefreshInterval, log]);

  // Clean up on unmount
  useEffect(() => {
    // Capture the ref object inside the effect to avoid issues with it changing
    const refreshRefValue = refreshRef;

    return () => {
      // Use the captured ref value in the cleanup function
      const timeoutId = refreshRefValue.current.timeoutId;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return {
    isRefreshing: state.isRefreshing,
    progress: state.progress,
    lastRefreshTime: state.lastRefreshTime,
    startRefresh,
    updateProgress,
    completeRefresh
  };
}
