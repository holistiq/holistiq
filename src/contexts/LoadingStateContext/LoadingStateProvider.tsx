/**
 * Provider component for the loading state context
 */
import React, { useState, useCallback, useMemo } from "react";
import { LoadingStatus, LoadingState } from "@/hooks/useLoadingState";
import {
  LoadingStateContext,
  LoadingStateRegistry,
} from "./LoadingStateContextDef";

/**
 * Provider component for the loading state context
 */
export function LoadingStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // State for the loading state registry
  const [registry, setRegistry] = useState<LoadingStateRegistry>({});

  // Register a new loading state
  const register = useCallback((id: string, state: LoadingState) => {
    setRegistry((prev) => ({
      ...prev,
      [id]: state,
    }));
  }, []);

  // Unregister a loading state
  const unregister = useCallback((id: string) => {
    setRegistry((prev) => {
      const newRegistry = { ...prev };
      delete newRegistry[id];
      return newRegistry;
    });
  }, []);

  // Check if any loading state is active
  const isAnyLoading = useCallback(() => {
    return Object.values(registry).some(
      (state) => state.status === LoadingStatus.LOADING,
    );
  }, [registry]);

  // Check if a specific loading state is active
  const isLoading = useCallback(
    (id: string) => {
      return registry[id]?.status === LoadingStatus.LOADING;
    },
    [registry],
  );

  // Get a specific loading state
  const getState = useCallback(
    (id: string) => {
      return registry[id];
    },
    [registry],
  );

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
  const value = useMemo(
    () => ({
      registry,
      register,
      unregister,
      isAnyLoading,
      isLoading,
      getState,
      getAllStates,
      getActiveStates,
      resetAll,
    }),
    [
      registry,
      register,
      unregister,
      isAnyLoading,
      isLoading,
      getState,
      getAllStates,
      getActiveStates,
      resetAll,
    ],
  );

  return (
    <LoadingStateContext.Provider value={value}>
      {children}
    </LoadingStateContext.Provider>
  );
}
