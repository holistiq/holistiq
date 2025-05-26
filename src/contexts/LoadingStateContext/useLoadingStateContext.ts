/**
 * Hook for using the loading state context
 */
import { useContext } from "react";
import { LoadingStateContext } from "./LoadingStateContextDef";

/**
 * Hook for using the loading state context
 */
export function useLoadingStateContext() {
  const context = useContext(LoadingStateContext);

  if (context === undefined) {
    throw new Error(
      "useLoadingStateContext must be used within a LoadingStateProvider",
    );
  }

  return context;
}
