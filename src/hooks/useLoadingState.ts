/**
 * Hook for managing granular loading states with a state machine approach
 */
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Loading state enum representing different states in the loading process
 */
export enum LoadingStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  PARTIAL = 'partial'
}

/**
 * Type for loading state data
 */
export interface LoadingState<T = unknown> {
  status: LoadingStatus;
  data: T | null;
  error: Error | null;
  timestamp: number;
  message: string;
  progress: number;
  source?: string;
}

/**
 * Type for loading state options
 */
export interface LoadingStateOptions<T = unknown> {
  timeout?: number;
  resetOnSuccess?: boolean;
  initialMessage?: string;
  onTimeout?: () => void;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
  id?: string;
}

/**
 * Type for loading state result
 */
export interface LoadingStateResult<T = unknown> {
  // Current state
  status: LoadingStatus;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isTimeout: boolean;
  isPartial: boolean;

  // Data and error
  data: T | null;
  error: Error | null;

  // Metadata
  timestamp: number;
  message: string;
  progress: number;
  elapsedTime: number;
  source?: string;

  // Actions
  execute: <R = T>(
    promise: Promise<R>,
    options?: {
      message?: string;
      source?: string;
      transform?: (data: R) => T;
    }
  ) => Promise<R>;
  reset: () => void;
  setProgress: (progress: number, message?: string) => void;
  setPartialData: (data: Partial<T>) => void;
  setError: (error: Error, message?: string) => void;
  setSuccess: (data: T, message?: string) => void;
  setMessage: (message: string) => void;
}

/**
 * Default initial state
 */
function createInitialState<T>(message: string = 'Idle'): LoadingState<T> {
  return {
    status: LoadingStatus.IDLE,
    data: null,
    error: null,
    timestamp: Date.now(),
    message,
    progress: 0
  };
}

/**
 * Hook for managing loading states with a state machine approach
 *
 * @param options Options for the loading state
 * @returns Loading state result
 *
 * @example
 * ```tsx
 * const {
 *   status,
 *   isLoading,
 *   data,
 *   error,
 *   message,
 *   execute,
 *   reset
 * } = useLoadingState<User[]>();
 *
 * useEffect(() => {
 *   execute(fetchUsers(), { message: 'Fetching users...' });
 * }, [execute]);
 *
 * if (isLoading) return <LoadingIndicator message={message} />;
 * if (isError) return <ErrorDisplay error={error} />;
 *
 * return <UserList users={data || []} />;
 * ```
 */
export function useLoadingState<T = unknown>(
  options: LoadingStateOptions<T> = {}
): LoadingStateResult<T> {
  const {
    timeout = 30000, // 30 seconds default timeout
    resetOnSuccess = false,
    initialMessage = 'Idle',
    onTimeout,
    onError,
    onSuccess
  } = options;

  // State for the loading state
  const [state, setState] = useState<LoadingState<T>>(createInitialState(initialMessage));

  // Refs for tracking timeouts and cleanup
  const timeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset the state
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState(createInitialState(initialMessage));
  }, [initialMessage]);

  // Set progress
  const setProgress = useCallback((progress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(Math.max(0, progress), 100),
      ...(message ? { message } : {})
    }));
  }, []);

  // Set message
  const setMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      message
    }));
  }, []);

  // Set partial data
  const setPartialData = useCallback((partialData: Partial<T>) => {
    setState(prev => ({
      ...prev,
      status: LoadingStatus.PARTIAL,
      data: { ...((prev.data as Record<string, unknown>) ?? {}), ...partialData } as T,
      timestamp: Date.now()
    }));
  }, []);

  // Set error
  const setError = useCallback((error: Error, message?: string) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState(prev => ({
      ...prev,
      status: LoadingStatus.ERROR,
      error,
      message: message || `Error: ${error.message}`,
      timestamp: Date.now()
    }));

    if (onError) {
      onError(error);
    }
  }, [onError]);

  // Set success
  const setSuccess = useCallback((data: T, message?: string) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState(prev => ({
      ...prev,
      status: LoadingStatus.SUCCESS,
      data,
      error: null,
      message: message || 'Success',
      progress: 100,
      timestamp: Date.now()
    }));

    if (onSuccess) {
      onSuccess(data);
    }

    if (resetOnSuccess) {
      // Reset after a short delay to allow UI to show success state
      setTimeout(() => {
        if (isMountedRef.current) {
          reset();
        }
      }, 1000);
    }
  }, [onSuccess, reset, resetOnSuccess]);

  // Execute a promise with loading state tracking
  const execute = useCallback(async <R = T>(
    promise: Promise<R>,
    options: {
      message?: string;
      source?: string;
      transform?: (data: R) => T;
    } = {}
  ): Promise<R> => {
    const { message = 'Loading...', source, transform } = options;

    // Clear any existing timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set loading state
    setState({
      status: LoadingStatus.LOADING,
      data: state.data, // Preserve existing data for partial loading
      error: null,
      timestamp: Date.now(),
      message,
      progress: 0,
      source
    });

    // Set timeout
    if (timeout > 0) {
      timeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            status: LoadingStatus.TIMEOUT,
            message: `Operation timed out after ${timeout / 1000} seconds`,
            timestamp: Date.now()
          }));

          if (onTimeout) {
            onTimeout();
          }
        }
      }, timeout);
    }

    try {
      // Execute the promise
      const result = await promise;

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        const data = transform ? transform(result) : (result as unknown as T);

        setSuccess(data, message.replace('Loading', 'Loaded'));
      }

      return result;
    } catch (error) {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setError(error instanceof Error ? error : new Error(String(error)));
      }

      throw error;
    }
  }, [state.data, timeout, onTimeout, setSuccess, setError]);

  // Calculate elapsed time
  const elapsedTime = state.timestamp ? Date.now() - state.timestamp : 0;

  // Return the loading state result
  return {
    // Current state
    status: state.status,
    isIdle: state.status === LoadingStatus.IDLE,
    isLoading: state.status === LoadingStatus.LOADING,
    isSuccess: state.status === LoadingStatus.SUCCESS,
    isError: state.status === LoadingStatus.ERROR,
    isTimeout: state.status === LoadingStatus.TIMEOUT,
    isPartial: state.status === LoadingStatus.PARTIAL,

    // Data and error
    data: state.data,
    error: state.error,

    // Metadata
    timestamp: state.timestamp,
    message: state.message,
    progress: state.progress,
    elapsedTime,
    source: state.source,

    // Actions
    execute,
    reset,
    setProgress,
    setPartialData,
    setError,
    setSuccess,
    setMessage
  };
}
