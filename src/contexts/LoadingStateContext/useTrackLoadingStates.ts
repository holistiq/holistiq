/**
 * Hook for tracking multiple loading states
 */
import { useMemo } from 'react';
import { LoadingStatus, LoadingState } from '@/hooks/useLoadingState';
import { useLoadingStateContext } from './useLoadingStateContext';

/**
 * Hook for tracking multiple loading states
 */
export function useTrackLoadingStates(ids: string[]) {
  const { getState } = useLoadingStateContext();
  
  // Get the states for all the provided IDs
  const states = useMemo(() => {
    return ids.map(id => getState(id)).filter(Boolean) as LoadingState[];
  }, [ids, getState]);
  
  // Check if any of the states are loading
  const isAnyLoading = useMemo(() => {
    return states.some(state => state.status === LoadingStatus.LOADING);
  }, [states]);
  
  // Check if all of the states are loading
  const isAllLoading = useMemo(() => {
    return states.length > 0 && states.every(state => state.status === LoadingStatus.LOADING);
  }, [states]);
  
  // Check if any of the states have errors
  const hasErrors = useMemo(() => {
    return states.some(state => state.status === LoadingStatus.ERROR);
  }, [states]);
  
  // Get all errors
  const errors = useMemo(() => {
    return states
      .filter(state => state.status === LoadingStatus.ERROR && state.error)
      .map(state => state.error) as Error[];
  }, [states]);
  
  // Calculate overall progress
  const progress = useMemo(() => {
    if (states.length === 0) return 0;
    return states.reduce((acc, state) => acc + state.progress, 0) / states.length;
  }, [states]);
  
  return {
    states,
    isAnyLoading,
    isAllLoading,
    hasErrors,
    errors,
    progress
  };
}
