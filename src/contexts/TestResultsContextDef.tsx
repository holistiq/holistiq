import { createContext } from "react";
import { TestResult } from "@/lib/testResultUtils";
import { UserBaseline, BaselineCalculationOptions } from "@/types/baseline";
import { LoadingState, LoadingProgress } from "@/types/loading";

interface TestResultsContextType {
  baselineResult: TestResult | null;
  testHistory: TestResult[];
  latestResult: TestResult | null;
  userBaseline: UserBaseline | null;

  // New granular loading states
  loadingState: LoadingState;
  loadingProgress: LoadingProgress;

  // Legacy loading states (kept for backward compatibility)
  isLoadingTests: boolean;
  isLoadingLocal: boolean;
  isLoadingSupabase: boolean;
  isCalculatingBaseline: boolean;
  isDataStale: boolean;

  refreshTestResults: (forceRefresh?: boolean) => void;
  calculateUserBaseline: (
    options?: BaselineCalculationOptions,
  ) => Promise<UserBaseline | null>;
}

// Create the context with undefined as default value
export const TestResultsContext = createContext<
  TestResultsContextType | undefined
>(undefined);
