/**
 * Hook for registering a loading state with the context
 */
import { useEffect } from "react";
import { LoadingState } from "@/hooks/useLoadingState";
import { useLoadingStateContext } from "./useLoadingStateContext";

/**
 * Hook for registering a loading state with the context
 */
export function useRegisterLoadingState(id: string, state: LoadingState) {
  const { register, unregister } = useLoadingStateContext();

  useEffect(() => {
    register(id, state);

    return () => {
      unregister(id);
    };
  }, [id, state, register, unregister]);
}
