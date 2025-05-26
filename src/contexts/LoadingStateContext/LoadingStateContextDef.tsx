/**
 * Context definition for managing loading states across the application
 */
import { createContext } from "react";
import { LoadingState } from "@/hooks/useLoadingState";

/**
 * Type for the loading state registry
 */
export interface LoadingStateRegistry {
  [key: string]: LoadingState;
}

/**
 * Type for the loading state context
 */
export interface LoadingStateContextType {
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
export const LoadingStateContext = createContext<
  LoadingStateContextType | undefined
>(undefined);
