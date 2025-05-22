import { useState, useRef, useCallback, useEffect } from 'react';

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

  // Debug logging helper
  const log = useCallback((message: string, data?: any) => {
    if (debug && process.env.NODE_ENV === 'development') {
      if (data) {
        console.log(`[useRefreshState] ${message}`, data);
      } else {
        console.log(`[useRefreshState] ${message}`);
      }
    }
  }, [debug]);

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
    setState(prev => ({
      ...prev,
      isRefreshing: true,
      lastRefreshTime: now,
      progress: 0
    }));

    // Set up auto-reset timeout
    if (refreshRef.current.timeoutId) {
      window.clearTimeout(refreshRef.current.timeoutId);
    }

    refreshRef.current.timeoutId = window.setTimeout(() => {
      if (refreshRef.current.isRefreshing) {
        log('Auto-reset timeout triggered');
        completeRefresh();
      }
    }, autoResetTimeout);

    log('Refresh started');
    return true;
  }, [state.lastRefreshTime, minRefreshInterval, autoResetTimeout, log]);

  // Update the progress of the current refresh operation
  const updateProgress = useCallback((progress: number) => {
    if (!refreshRef.current.isRefreshing) return;

    setState(prev => ({
      ...prev,
      progress: Math.min(Math.max(0, progress), 100)
    }));

    log(`Progress updated: ${progress}%`);
  }, [log]);

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
    setState(prev => ({
      ...prev,
      isRefreshing: false,
      progress: 100
    }));
  }, [log]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (refreshRef.current.timeoutId) {
        window.clearTimeout(refreshRef.current.timeoutId);
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
