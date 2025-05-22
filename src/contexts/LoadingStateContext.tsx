/**
 * Context for managing loading states across the application
 */
import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { LoadingStatus, LoadingState } from '@/hooks/useLoadingState';

/**
 * Type for the loading state registry
 */
interface LoadingStateRegistry {
  [key: string]: LoadingState;
}

/**
 * Type for the loading state context
 */
interface LoadingStateContextType {
  // Registry of all loading states
  registry: LoadingStateRegistry;
  
  // Register a new loading state
  register: (id: string, state: LoadingState) => void;
  
  // Unregister a loading state
  unregister: (id: string) => void;
  
  // Check if any loading state is active
  isAnyLoading: () => boolean;
  
  // Check if a specific loading state is active
  isLoading: (id: string) => boolean;
  
  // Get a specific loading state
  getState: (id: string) => LoadingState | undefined;
  
  // Get all loading states
  getAllStates: () => LoadingStateRegistry;
  
  // Get all active loading states
  getActiveStates: () => LoadingStateRegistry;
  
  // Reset all loading states
  resetAll: () => void;
}

// Create the context
const LoadingStateContext = createContext<LoadingStateContextType | undefined>(undefined);

/**
 * Provider component for the loading state context
 */
export function LoadingStateProvider({ children }: { children: React.ReactNode }) {
  // State for the loading state registry
  const [registry, setRegistry] = useState<LoadingStateRegistry>({});
  
  // Register a new loading state
  const register = useCallback((id: string, state: LoadingState) => {
    setRegistry(prev => ({
      ...prev,
      [id]: state
    }));
  }, []);
  
  // Unregister a loading state
  const unregister = useCallback((id: string) => {
    setRegistry(prev => {
      const newRegistry = { ...prev };
      delete newRegistry[id];
      return newRegistry;
    });
  }, []);
  
  // Check if any loading state is active
  const isAnyLoading = useCallback(() => {
    return Object.values(registry).some(state => 
      state.status === LoadingStatus.LOADING
    );
  }, [registry]);
  
  // Check if a specific loading state is active
  const isLoading = useCallback((id: string) => {
    return registry[id]?.status === LoadingStatus.LOADING;
  }, [registry]);
  
  // Get a specific loading state
  const getState = useCallback((id: string) => {
    return registry[id];
  }, [registry]);
  
  // Get all loading states
  const getAllStates = useCallback(() => {
    return registry;
  }, [registry]);
  
  // Get all active loading states
  const getActiveStates = useCallback(() => {
    return Object.entries(registry).reduce((acc, [id, state]) => {
      if (state.status === LoadingStatus.LOADING) {
        acc[id] = state;
      }
      return acc;
    }, {} as LoadingStateRegistry);
  }, [registry]);
  
  // Reset all loading states
  const resetAll = useCallback(() => {
    setRegistry({});
  }, []);
  
  // Create the context value
  const value = useMemo(() => ({
    registry,
    register,
    unregister,
    isAnyLoading,
    isLoading,
    getState,
    getAllStates,
    getActiveStates,
    resetAll
  }), [
    registry,
    register,
    unregister,
    isAnyLoading,
    isLoading,
    getState,
    getAllStates,
    getActiveStates,
    resetAll
  ]);
  
  return (
    <LoadingStateContext.Provider value={value}>
      {children}
    </LoadingStateContext.Provider>
  );
}

/**
 * Hook for using the loading state context
 */
export function useLoadingStateContext() {
  const context = useContext(LoadingStateContext);
  
  if (context === undefined) {
    throw new Error('useLoadingStateContext must be used within a LoadingStateProvider');
  }
  
  return context;
}

/**
 * Hook for registering a loading state with the context
 */
export function useRegisterLoadingState(id: string, state: LoadingState) {
  const { register, unregister } = useLoadingStateContext();
  
  React.useEffect(() => {
    register(id, state);
    
    return () => {
      unregister(id);
    };
  }, [id, state, register, unregister]);
}

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
