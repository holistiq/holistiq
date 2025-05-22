import { useContext } from 'react';
import { TestResultsContext } from '@/contexts/TestResultsContext';

/**
 * Hook to access test results data from the TestResultsContext
 * @returns Test results data and related functions
 */
export function useTestResults() {
  const context = useContext(TestResultsContext);

  if (!context) {
    throw new Error('useTestResults must be used within a TestResultsProvider');
  }

  return {
    baselineResult: context.baselineResult,
    testHistory: context.testHistory,
    latestResult: context.latestResult,
    userBaseline: context.userBaseline,
    isLoadingTests: context.isLoadingTests,
    isLoadingLocal: context.isLoadingLocal,
    isLoadingSupabase: context.isLoadingSupabase,
    isCalculatingBaseline: context.isCalculatingBaseline,
    isDataStale: context.isDataStale,
    refreshTestResults: context.refreshTestResults,
    calculateUserBaseline: context.calculateUserBaseline
  };
}
